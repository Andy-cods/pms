/**
 * BC Agency PMS - Excel to PostgreSQL Migration Script
 * Migrates data from Excel files (46 sheets, 135 columns) to Prisma/PostgreSQL
 *
 * Usage: npx ts-node scripts/migration/excel-migration.ts <excel-file-path> [options]
 *
 * Options:
 *   --dry-run       Validate only, don't import data
 *   --skip-validate Skip validation and import directly (not recommended)
 *   --verbose       Show detailed progress
 *   --report-only   Generate validation report without importing
 */

import * as ExcelJS from 'exceljs';
import * as path from 'path';
import * as fs from 'fs';
import { PrismaClient, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import {
  SheetMappings,
  mapRowToEntity,
  normalizeString,
  SheetMapping,
} from './column-mapping';

import {
  validateSheet,
  checkDuplicates,
  checkReferentialIntegrity,
  generateValidationReport,
  formatValidationReport,
  SheetValidationReport,
  ReferentialIntegrityResult,
  DuplicateCheckResult,
} from './validators';

// ============================================
// CONFIGURATION
// ============================================

interface MigrationConfig {
  dryRun: boolean;
  skipValidate: boolean;
  verbose: boolean;
  reportOnly: boolean;
  batchSize: number;
  defaultPassword: string;
}

const DEFAULT_CONFIG: MigrationConfig = {
  dryRun: false,
  skipValidate: false,
  verbose: false,
  reportOnly: false,
  batchSize: 100,
  defaultPassword: 'changeme123',
};

// ============================================
// LOGGER
// ============================================

class Logger {
  private verbose: boolean;
  private startTime: Date;
  private errors: string[] = [];

  constructor(verbose: boolean) {
    this.verbose = verbose;
    this.startTime = new Date();
  }

  info(message: string): void {
    console.log(`[INFO] ${message}`);
  }

  success(message: string): void {
    console.log(`[SUCCESS] ${message}`);
  }

  warn(message: string): void {
    console.log(`[WARN] ${message}`);
  }

  error(message: string, rowNumber?: number): void {
    const msg = rowNumber ? `Row ${rowNumber}: ${message}` : message;
    console.error(`[ERROR] ${msg}`);
    this.errors.push(msg);
  }

  debug(message: string): void {
    if (this.verbose) {
      console.log(`[DEBUG] ${message}`);
    }
  }

  progress(current: number, total: number, entity: string): void {
    const percent = Math.round((current / total) * 100);
    process.stdout.write(`\r[PROGRESS] ${entity}: ${current}/${total} (${percent}%)`);
    if (current === total) {
      console.log(''); // New line after completion
    }
  }

  summary(): void {
    const duration = (new Date().getTime() - this.startTime.getTime()) / 1000;
    console.log('');
    console.log('='.repeat(60));
    console.log(`Migration completed in ${duration.toFixed(2)} seconds`);
    if (this.errors.length > 0) {
      console.log(`Total errors: ${this.errors.length}`);
    }
    console.log('='.repeat(60));
  }

  getErrors(): string[] {
    return this.errors;
  }
}

// ============================================
// EXCEL READER
// ============================================

interface SheetData {
  sheetName: string;
  headers: string[];
  rows: Record<string, unknown>[];
}

async function readExcelFile(filePath: string, logger: Logger): Promise<SheetData[]> {
  logger.info(`Reading Excel file: ${filePath}`);

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const sheetsData: SheetData[] = [];

  workbook.eachSheet((worksheet) => {
    const sheetName = worksheet.name;
    logger.debug(`Processing sheet: ${sheetName}`);

    const headers: string[] = [];
    const rows: Record<string, unknown>[] = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        // Header row
        row.eachCell((cell) => {
          headers.push(normalizeString(cell.value) || '');
        });
      } else {
        // Data row
        const rowData: Record<string, unknown> = {};
        row.eachCell((cell, colNumber) => {
          const header = headers[colNumber - 1];
          if (header) {
            rowData[header] = cell.value;
          }
        });

        // Only add non-empty rows
        if (Object.values(rowData).some(v => v !== null && v !== undefined && v !== '')) {
          rows.push(rowData);
        }
      }
    });

    if (rows.length > 0) {
      sheetsData.push({ sheetName, headers, rows });
      logger.debug(`  Found ${rows.length} rows in sheet "${sheetName}"`);
    }
  });

  logger.info(`Loaded ${sheetsData.length} sheets with data`);
  return sheetsData;
}

function matchSheetToMapping(sheetName: string): SheetMapping | undefined {
  const normalizedName = sheetName.toLowerCase().trim();

  for (const mapping of SheetMappings) {
    for (const name of mapping.sheetNames) {
      if (name.toLowerCase().trim() === normalizedName) {
        return mapping;
      }
    }
  }

  return undefined;
}

// ============================================
// ENTITY IMPORTERS
// ============================================

class MigrationContext {
  // Maps for resolving foreign keys
  userEmailToId: Map<string, string> = new Map();
  clientNameToId: Map<string, string> = new Map();
  projectCodeToId: Map<string, string> = new Map();

  // Reference data for validation
  referenceData: Map<string, Set<string>> = new Map();

  addUser(email: string, id: string): void {
    this.userEmailToId.set(email.toLowerCase(), id);
    this.addReferenceValue('User.email', email.toLowerCase());
  }

  addClient(companyName: string, id: string): void {
    this.clientNameToId.set(companyName.toLowerCase(), id);
    this.addReferenceValue('Client.companyName', companyName.toLowerCase());
  }

  addProject(code: string, id: string): void {
    this.projectCodeToId.set(code.toLowerCase(), id);
    this.addReferenceValue('Project.code', code.toLowerCase());
  }

  private addReferenceValue(key: string, value: string): void {
    if (!this.referenceData.has(key)) {
      this.referenceData.set(key, new Set());
    }
    this.referenceData.get(key)!.add(value);
  }

  getUserId(email: string): string | undefined {
    return this.userEmailToId.get(email.toLowerCase());
  }

  getClientId(companyName: string): string | undefined {
    return this.clientNameToId.get(companyName.toLowerCase());
  }

  getProjectId(code: string): string | undefined {
    return this.projectCodeToId.get(code.toLowerCase());
  }
}

async function importUsers(
  prisma: PrismaClient,
  rows: Record<string, unknown>[],
  context: MigrationContext,
  config: MigrationConfig,
  logger: Logger
): Promise<number> {
  logger.info('Importing Users...');
  let imported = 0;

  const hashedDefaultPassword = await bcrypt.hash(config.defaultPassword, 10);

  for (let i = 0; i < rows.length; i++) {
    const rowNumber = i + 2;
    try {
      const mapped = mapRowToEntity(rows[i], SheetMappings.find(m => m.entity === 'User')!.columnMappings);

      if (!mapped.email || !mapped.name || !mapped.role) {
        logger.error(`Missing required fields`, rowNumber);
        continue;
      }

      const password = mapped.password
        ? await bcrypt.hash(String(mapped.password), 10)
        : hashedDefaultPassword;

      if (!config.dryRun) {
        const user = await prisma.user.upsert({
          where: { email: String(mapped.email) },
          update: {
            name: String(mapped.name),
            role: mapped.role as any,
            avatar: mapped.avatar as string | null,
            isActive: mapped.isActive as boolean ?? true,
          },
          create: {
            email: String(mapped.email),
            name: String(mapped.name),
            password,
            role: mapped.role as any,
            avatar: mapped.avatar as string | null,
            isActive: mapped.isActive as boolean ?? true,
          },
        });

        context.addUser(user.email, user.id);
      } else {
        // Dry run - just add to context for validation
        context.addUser(String(mapped.email), `dry-run-user-${i}`);
      }

      imported++;
      logger.progress(imported, rows.length, 'Users');
    } catch (error) {
      logger.error(`Failed to import user: ${error}`, rowNumber);
    }
  }

  logger.success(`Imported ${imported}/${rows.length} users`);
  return imported;
}

async function importClients(
  prisma: PrismaClient,
  rows: Record<string, unknown>[],
  context: MigrationContext,
  config: MigrationConfig,
  logger: Logger
): Promise<number> {
  logger.info('Importing Clients...');
  let imported = 0;

  for (let i = 0; i < rows.length; i++) {
    const rowNumber = i + 2;
    try {
      const mapped = mapRowToEntity(rows[i], SheetMappings.find(m => m.entity === 'Client')!.columnMappings);

      if (!mapped.companyName || !mapped.accessCode) {
        logger.error(`Missing required fields`, rowNumber);
        continue;
      }

      if (!config.dryRun) {
        const client = await prisma.client.upsert({
          where: { accessCode: String(mapped.accessCode) },
          update: {
            companyName: String(mapped.companyName),
            contactName: mapped.contactName as string | null,
            contactEmail: mapped.contactEmail as string | null,
            contactPhone: mapped.contactPhone as string | null,
            isActive: mapped.isActive as boolean ?? true,
          },
          create: {
            companyName: String(mapped.companyName),
            contactName: mapped.contactName as string | null,
            contactEmail: mapped.contactEmail as string | null,
            contactPhone: mapped.contactPhone as string | null,
            accessCode: String(mapped.accessCode),
            isActive: mapped.isActive as boolean ?? true,
          },
        });

        context.addClient(client.companyName, client.id);
      } else {
        context.addClient(String(mapped.companyName), `dry-run-client-${i}`);
      }

      imported++;
      logger.progress(imported, rows.length, 'Clients');
    } catch (error) {
      logger.error(`Failed to import client: ${error}`, rowNumber);
    }
  }

  logger.success(`Imported ${imported}/${rows.length} clients`);
  return imported;
}

async function importProjects(
  prisma: PrismaClient,
  rows: Record<string, unknown>[],
  context: MigrationContext,
  config: MigrationConfig,
  logger: Logger
): Promise<number> {
  logger.info('Importing Projects...');
  let imported = 0;

  for (let i = 0; i < rows.length; i++) {
    const rowNumber = i + 2;
    try {
      const mapped = mapRowToEntity(rows[i], SheetMappings.find(m => m.entity === 'Project')!.columnMappings);

      if (!mapped.code || !mapped.name) {
        logger.error(`Missing required fields (code, name)`, rowNumber);
        continue;
      }

      // Resolve client reference
      let clientId: string | null = null;
      if (mapped._clientName) {
        clientId = context.getClientId(String(mapped._clientName)) || null;
        if (!clientId && !config.dryRun) {
          logger.warn(`Client "${mapped._clientName}" not found, setting clientId to null`);
        }
      }

      if (!config.dryRun) {
        const project = await prisma.project.upsert({
          where: { code: String(mapped.code) },
          update: {
            name: String(mapped.name),
            description: mapped.description as string | null,
            productType: mapped.productType as string | null,
            status: (mapped.status as any) || 'STABLE',
            stage: (mapped.stage as any) || 'INTAKE',
            stageProgress: (mapped.stageProgress as number) || 0,
            startDate: mapped.startDate as Date | null,
            endDate: mapped.endDate as Date | null,
            timelineProgress: (mapped.timelineProgress as number) || 0,
            clientId,
            driveLink: mapped.driveLink as string | null,
            planLink: mapped.planLink as string | null,
            trackingLink: mapped.trackingLink as string | null,
          },
          create: {
            code: String(mapped.code),
            name: String(mapped.name),
            description: mapped.description as string | null,
            productType: mapped.productType as string | null,
            status: (mapped.status as any) || 'STABLE',
            stage: (mapped.stage as any) || 'INTAKE',
            stageProgress: (mapped.stageProgress as number) || 0,
            startDate: mapped.startDate as Date | null,
            endDate: mapped.endDate as Date | null,
            timelineProgress: (mapped.timelineProgress as number) || 0,
            clientId,
            driveLink: mapped.driveLink as string | null,
            planLink: mapped.planLink as string | null,
            trackingLink: mapped.trackingLink as string | null,
          },
        });

        context.addProject(project.code, project.id);
      } else {
        context.addProject(String(mapped.code), `dry-run-project-${i}`);
      }

      imported++;
      logger.progress(imported, rows.length, 'Projects');
    } catch (error) {
      logger.error(`Failed to import project: ${error}`, rowNumber);
    }
  }

  logger.success(`Imported ${imported}/${rows.length} projects`);
  return imported;
}

async function importProjectBudgets(
  prisma: PrismaClient,
  rows: Record<string, unknown>[],
  context: MigrationContext,
  config: MigrationConfig,
  logger: Logger
): Promise<number> {
  logger.info('Importing Project Budgets...');
  let imported = 0;

  for (let i = 0; i < rows.length; i++) {
    const rowNumber = i + 2;
    try {
      const mapped = mapRowToEntity(rows[i], SheetMappings.find(m => m.entity === 'ProjectBudget')!.columnMappings);

      if (!mapped._projectCode || !mapped.totalBudget) {
        logger.error(`Missing required fields (_projectCode, totalBudget)`, rowNumber);
        continue;
      }

      const projectId = context.getProjectId(String(mapped._projectCode));
      if (!projectId) {
        logger.error(`Project "${mapped._projectCode}" not found`, rowNumber);
        continue;
      }

      if (!config.dryRun) {
        await prisma.projectBudget.upsert({
          where: { projectId },
          update: {
            totalBudget: new Prisma.Decimal(String(mapped.totalBudget)),
            monthlyBudget: mapped.monthlyBudget ? new Prisma.Decimal(String(mapped.monthlyBudget)) : null,
            spentAmount: mapped.spentAmount ? new Prisma.Decimal(String(mapped.spentAmount)) : new Prisma.Decimal('0'),
            fixedAdFee: mapped.fixedAdFee ? new Prisma.Decimal(String(mapped.fixedAdFee)) : null,
            adServiceFee: mapped.adServiceFee ? new Prisma.Decimal(String(mapped.adServiceFee)) : null,
            contentFee: mapped.contentFee ? new Prisma.Decimal(String(mapped.contentFee)) : null,
            designFee: mapped.designFee ? new Prisma.Decimal(String(mapped.designFee)) : null,
            mediaFee: mapped.mediaFee ? new Prisma.Decimal(String(mapped.mediaFee)) : null,
            otherFee: mapped.otherFee ? new Prisma.Decimal(String(mapped.otherFee)) : null,
            budgetPacing: mapped.budgetPacing as number | null,
          },
          create: {
            projectId,
            totalBudget: new Prisma.Decimal(String(mapped.totalBudget)),
            monthlyBudget: mapped.monthlyBudget ? new Prisma.Decimal(String(mapped.monthlyBudget)) : null,
            spentAmount: mapped.spentAmount ? new Prisma.Decimal(String(mapped.spentAmount)) : new Prisma.Decimal('0'),
            fixedAdFee: mapped.fixedAdFee ? new Prisma.Decimal(String(mapped.fixedAdFee)) : null,
            adServiceFee: mapped.adServiceFee ? new Prisma.Decimal(String(mapped.adServiceFee)) : null,
            contentFee: mapped.contentFee ? new Prisma.Decimal(String(mapped.contentFee)) : null,
            designFee: mapped.designFee ? new Prisma.Decimal(String(mapped.designFee)) : null,
            mediaFee: mapped.mediaFee ? new Prisma.Decimal(String(mapped.mediaFee)) : null,
            otherFee: mapped.otherFee ? new Prisma.Decimal(String(mapped.otherFee)) : null,
            budgetPacing: mapped.budgetPacing as number | null,
          },
        });
      }

      imported++;
      logger.progress(imported, rows.length, 'ProjectBudgets');
    } catch (error) {
      logger.error(`Failed to import project budget: ${error}`, rowNumber);
    }
  }

  logger.success(`Imported ${imported}/${rows.length} project budgets`);
  return imported;
}

async function importProjectKPIs(
  prisma: PrismaClient,
  rows: Record<string, unknown>[],
  context: MigrationContext,
  config: MigrationConfig,
  logger: Logger
): Promise<number> {
  logger.info('Importing Project KPIs...');
  let imported = 0;

  for (let i = 0; i < rows.length; i++) {
    const rowNumber = i + 2;
    try {
      const mapped = mapRowToEntity(rows[i], SheetMappings.find(m => m.entity === 'ProjectKPI')!.columnMappings);

      if (!mapped._projectCode || !mapped.kpiType) {
        logger.error(`Missing required fields (_projectCode, kpiType)`, rowNumber);
        continue;
      }

      const projectId = context.getProjectId(String(mapped._projectCode));
      if (!projectId) {
        logger.error(`Project "${mapped._projectCode}" not found`, rowNumber);
        continue;
      }

      if (!config.dryRun) {
        await prisma.projectKPI.create({
          data: {
            projectId,
            kpiType: String(mapped.kpiType),
            targetValue: mapped.targetValue as number | null,
            actualValue: mapped.actualValue as number | null,
            unit: mapped.unit as string | null,
          },
        });
      }

      imported++;
      logger.progress(imported, rows.length, 'ProjectKPIs');
    } catch (error) {
      logger.error(`Failed to import project KPI: ${error}`, rowNumber);
    }
  }

  logger.success(`Imported ${imported}/${rows.length} project KPIs`);
  return imported;
}

async function importTasks(
  prisma: PrismaClient,
  rows: Record<string, unknown>[],
  context: MigrationContext,
  config: MigrationConfig,
  logger: Logger
): Promise<number> {
  logger.info('Importing Tasks...');
  let imported = 0;

  for (let i = 0; i < rows.length; i++) {
    const rowNumber = i + 2;
    try {
      const mapped = mapRowToEntity(rows[i], SheetMappings.find(m => m.entity === 'Task')!.columnMappings);

      if (!mapped._projectCode || !mapped.title || !mapped._creatorEmail) {
        logger.error(`Missing required fields (_projectCode, title, _creatorEmail)`, rowNumber);
        continue;
      }

      const projectId = context.getProjectId(String(mapped._projectCode));
      if (!projectId) {
        logger.error(`Project "${mapped._projectCode}" not found`, rowNumber);
        continue;
      }

      const createdById = context.getUserId(String(mapped._creatorEmail));
      if (!createdById) {
        logger.error(`Creator "${mapped._creatorEmail}" not found`, rowNumber);
        continue;
      }

      let reviewerId: string | null = null;
      if (mapped._reviewerEmail) {
        reviewerId = context.getUserId(String(mapped._reviewerEmail)) || null;
        if (!reviewerId && !config.dryRun) {
          logger.warn(`Reviewer "${mapped._reviewerEmail}" not found`);
        }
      }

      if (!config.dryRun) {
        const task = await prisma.task.create({
          data: {
            projectId,
            title: String(mapped.title),
            description: mapped.description as string | null,
            status: (mapped.status as any) || 'TODO',
            priority: (mapped.priority as any) || 'MEDIUM',
            estimatedHours: mapped.estimatedHours as number | null,
            actualHours: mapped.actualHours as number | null,
            deadline: mapped.deadline as Date | null,
            startedAt: mapped.startedAt as Date | null,
            completedAt: mapped.completedAt as Date | null,
            reviewerId,
            createdById,
            orderIndex: (mapped.orderIndex as number) || 0,
          },
        });

        // Handle assignees
        if (mapped._assigneeEmails) {
          const emails = String(mapped._assigneeEmails).split(',').map(e => e.trim()).filter(Boolean);
          for (const email of emails) {
            const assigneeId = context.getUserId(email);
            if (assigneeId) {
              await prisma.taskAssignee.create({
                data: {
                  taskId: task.id,
                  userId: assigneeId,
                },
              });
            } else {
              logger.warn(`Assignee "${email}" not found for task "${mapped.title}"`);
            }
          }
        }
      }

      imported++;
      logger.progress(imported, rows.length, 'Tasks');
    } catch (error) {
      logger.error(`Failed to import task: ${error}`, rowNumber);
    }
  }

  logger.success(`Imported ${imported}/${rows.length} tasks`);
  return imported;
}

// ============================================
// MAIN MIGRATION FUNCTION
// ============================================

async function runMigration(filePath: string, config: MigrationConfig): Promise<void> {
  const logger = new Logger(config.verbose);

  logger.info('Starting BC Agency PMS Excel Migration');
  logger.info(`File: ${filePath}`);
  logger.info(`Mode: ${config.dryRun ? 'DRY RUN' : config.reportOnly ? 'REPORT ONLY' : 'FULL MIGRATION'}`);

  // Check file exists
  if (!fs.existsSync(filePath)) {
    logger.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  // Read Excel file
  const sheetsData = await readExcelFile(filePath, logger);

  if (sheetsData.length === 0) {
    logger.error('No data found in Excel file');
    process.exit(1);
  }

  // Match sheets to entity mappings
  const matchedSheets: Array<{ data: SheetData; mapping: SheetMapping }> = [];

  for (const sheet of sheetsData) {
    const mapping = matchSheetToMapping(sheet.sheetName);
    if (mapping) {
      matchedSheets.push({ data: sheet, mapping });
      logger.debug(`Matched sheet "${sheet.sheetName}" to entity "${mapping.entity}"`);
    } else {
      logger.warn(`No mapping found for sheet "${sheet.sheetName}", skipping`);
    }
  }

  // Sort by import order (dependencies first)
  matchedSheets.sort((a, b) => a.mapping.orderPriority - b.mapping.orderPriority);

  // Initialize Prisma
  const prisma = new PrismaClient();
  const context = new MigrationContext();

  try {
    // =====================================
    // VALIDATION PHASE
    // =====================================

    if (!config.skipValidate) {
      logger.info('');
      logger.info('=== VALIDATION PHASE ===');

      const sheetReports: SheetValidationReport[] = [];

      for (const { data, mapping } of matchedSheets) {
        logger.info(`Validating ${mapping.entity} (${data.sheetName})...`);

        // Field validation
        const validationResult = validateSheet(mapping.entity, data.rows);

        // Duplicate check
        const uniqueFields = getUniqueFieldsForEntity(mapping.entity);
        const rowsWithNumbers = data.rows.map((row, i) => ({ rowNumber: i + 2, data: row }));
        const duplicateResult = checkDuplicates(rowsWithNumbers, uniqueFields);

        // Referential integrity (will be more accurate after first pass)
        const refIntegrityResult: ReferentialIntegrityResult = {
          isValid: true,
          missingReferences: [],
        };

        sheetReports.push({
          sheetName: data.sheetName,
          entityType: mapping.entity,
          totalRows: data.rows.length,
          validRows: data.rows.length - validationResult.rowsWithErrors,
          invalidRows: validationResult.rowsWithErrors,
          errors: validationResult.errors,
          warnings: validationResult.warnings,
          duplicates: duplicateResult,
          referentialIntegrity: refIntegrityResult,
        });

        logger.info(`  Errors: ${validationResult.errors.length}, Warnings: ${validationResult.warnings.length}`);
      }

      // Generate report
      const report = generateValidationReport(path.basename(filePath), sheetReports);
      const reportText = formatValidationReport(report);

      // Save report
      const reportPath = filePath.replace(/\.[^.]+$/, '_validation_report.txt');
      fs.writeFileSync(reportPath, reportText);
      logger.info(`Validation report saved to: ${reportPath}`);

      // Print summary
      console.log('');
      console.log(reportText);

      if (!report.canProceed) {
        logger.error('Validation failed. Please fix errors before migrating.');
        if (!config.reportOnly) {
          process.exit(1);
        }
      }

      if (config.reportOnly) {
        logger.info('Report-only mode. Exiting without importing.');
        return;
      }
    }

    // =====================================
    // IMPORT PHASE
    // =====================================

    logger.info('');
    logger.info('=== IMPORT PHASE ===');

    if (config.dryRun) {
      logger.info('DRY RUN MODE - No data will be written to database');
    }

    // Use transaction for atomicity
    if (!config.dryRun) {
      await prisma.$transaction(async (tx) => {
        for (const { data, mapping } of matchedSheets) {
          await importEntity(tx as PrismaClient, mapping.entity, data.rows, context, config, logger);
        }
      }, {
        maxWait: 60000, // 60 seconds
        timeout: 300000, // 5 minutes
      });
    } else {
      // Dry run - no transaction needed
      for (const { data, mapping } of matchedSheets) {
        await importEntity(prisma, mapping.entity, data.rows, context, config, logger);
      }
    }

    logger.summary();
    logger.success('Migration completed successfully!');

  } catch (error) {
    logger.error(`Migration failed: ${error}`);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function importEntity(
  prisma: PrismaClient,
  entityType: string,
  rows: Record<string, unknown>[],
  context: MigrationContext,
  config: MigrationConfig,
  logger: Logger
): Promise<number> {
  switch (entityType) {
    case 'User':
      return importUsers(prisma, rows, context, config, logger);
    case 'Client':
      return importClients(prisma, rows, context, config, logger);
    case 'Project':
      return importProjects(prisma, rows, context, config, logger);
    case 'ProjectBudget':
      return importProjectBudgets(prisma, rows, context, config, logger);
    case 'ProjectKPI':
      return importProjectKPIs(prisma, rows, context, config, logger);
    case 'Task':
      return importTasks(prisma, rows, context, config, logger);
    default:
      logger.warn(`Unknown entity type: ${entityType}`);
      return 0;
  }
}

function getUniqueFieldsForEntity(entityType: string): string[] {
  switch (entityType) {
    case 'User':
      return ['email'];
    case 'Client':
      return ['accessCode', 'companyName'];
    case 'Project':
      return ['code'];
    default:
      return [];
  }
}

// ============================================
// CLI
// ============================================

function printUsage(): void {
  console.log(`
BC Agency PMS - Excel Migration Script

Usage: npx ts-node scripts/migration/excel-migration.ts <excel-file-path> [options]

Options:
  --dry-run       Validate and simulate import without writing to database
  --skip-validate Skip validation phase (not recommended)
  --verbose       Show detailed progress and debug messages
  --report-only   Generate validation report without importing
  --help          Show this help message

Examples:
  npx ts-node scripts/migration/excel-migration.ts ./data/bc-agency-data.xlsx
  npx ts-node scripts/migration/excel-migration.ts ./data/bc-agency-data.xlsx --dry-run
  npx ts-node scripts/migration/excel-migration.ts ./data/bc-agency-data.xlsx --report-only --verbose
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(0);
  }

  // Parse arguments
  const filePath = args.find(arg => !arg.startsWith('--'));
  if (!filePath) {
    console.error('Error: Excel file path is required');
    printUsage();
    process.exit(1);
  }

  const config: MigrationConfig = {
    ...DEFAULT_CONFIG,
    dryRun: args.includes('--dry-run'),
    skipValidate: args.includes('--skip-validate'),
    verbose: args.includes('--verbose'),
    reportOnly: args.includes('--report-only'),
  };

  try {
    await runMigration(path.resolve(filePath), config);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
main();
