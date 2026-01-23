/**
 * BC Agency PMS - Data Validators for Excel Migration
 * Validates data before import, checks referential integrity
 */

import {
  ColumnMapping,
  normalizeString,
  normalizeNumber,
  normalizeDate,
  normalizeBoolean,
  normalizeDecimal,
  normalizeEnum,
  UserRoleMapping,
  ProjectStatusMapping,
  ProjectStageMapping,
  TaskStatusMapping,
  TaskPriorityMapping,
} from './column-mapping';

// ============================================
// TYPES
// ============================================

export interface ValidationError {
  rowNumber: number;
  column: string;
  value: unknown;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  rowsValidated: number;
  rowsWithErrors: number;
  rowsWithWarnings: number;
}

export interface ReferentialIntegrityCheck {
  entityType: string;
  foreignKey: string;
  referencedEntity: string;
  referencedField: string;
}

// ============================================
// VALIDATION RULES
// ============================================

const EmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PhoneRegex = /^[+]?[\d\s()-]{8,20}$/;
const UrlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i;
const ProjectCodeRegex = /^[A-Z]{2,4}\d{2,4}$/i; // e.g., QC09, ABC123

// ============================================
// FIELD VALIDATORS
// ============================================

export function validateEmail(value: unknown, rowNumber: number, column: string): ValidationError | null {
  const normalized = normalizeString(value);
  if (!normalized) return null; // Empty is handled by required check

  if (!EmailRegex.test(normalized)) {
    return {
      rowNumber,
      column,
      value,
      message: `Invalid email format: "${normalized}"`,
      severity: 'error',
    };
  }

  return null;
}

export function validatePhone(value: unknown, rowNumber: number, column: string): ValidationError | null {
  const normalized = normalizeString(value);
  if (!normalized) return null;

  if (!PhoneRegex.test(normalized)) {
    return {
      rowNumber,
      column,
      value,
      message: `Invalid phone format: "${normalized}"`,
      severity: 'warning',
    };
  }

  return null;
}

export function validateUrl(value: unknown, rowNumber: number, column: string): ValidationError | null {
  const normalized = normalizeString(value);
  if (!normalized) return null;

  if (!UrlRegex.test(normalized)) {
    return {
      rowNumber,
      column,
      value,
      message: `Invalid URL format: "${normalized}"`,
      severity: 'warning',
    };
  }

  return null;
}

export function validateProjectCode(value: unknown, rowNumber: number, column: string): ValidationError | null {
  const normalized = normalizeString(value);
  if (!normalized) return null;

  if (!ProjectCodeRegex.test(normalized)) {
    return {
      rowNumber,
      column,
      value,
      message: `Invalid project code format: "${normalized}". Expected format like "QC09" or "ABC123"`,
      severity: 'warning',
    };
  }

  return null;
}

export function validateRequired(
  value: unknown,
  rowNumber: number,
  column: string,
  fieldName: string
): ValidationError | null {
  const normalized = normalizeString(value);

  if (!normalized) {
    return {
      rowNumber,
      column,
      value,
      message: `Required field "${fieldName}" is missing or empty`,
      severity: 'error',
    };
  }

  return null;
}

export function validateNumber(
  value: unknown,
  rowNumber: number,
  column: string,
  options: { min?: number; max?: number } = {}
): ValidationError | null {
  const normalized = normalizeNumber(value);
  if (normalized === null) return null;

  if (options.min !== undefined && normalized < options.min) {
    return {
      rowNumber,
      column,
      value,
      message: `Value ${normalized} is less than minimum ${options.min}`,
      severity: 'error',
    };
  }

  if (options.max !== undefined && normalized > options.max) {
    return {
      rowNumber,
      column,
      value,
      message: `Value ${normalized} exceeds maximum ${options.max}`,
      severity: 'error',
    };
  }

  return null;
}

export function validateDate(
  value: unknown,
  rowNumber: number,
  column: string,
  options: { minDate?: Date; maxDate?: Date } = {}
): ValidationError | null {
  const normalized = normalizeDate(value);
  if (normalized === null) return null;

  if (options.minDate && normalized < options.minDate) {
    return {
      rowNumber,
      column,
      value,
      message: `Date is before minimum allowed date`,
      severity: 'warning',
    };
  }

  if (options.maxDate && normalized > options.maxDate) {
    return {
      rowNumber,
      column,
      value,
      message: `Date is after maximum allowed date`,
      severity: 'warning',
    };
  }

  return null;
}

export function validateEnum(
  value: unknown,
  rowNumber: number,
  column: string,
  enumMapping: Record<string, string>,
  enumName: string
): ValidationError | null {
  const normalized = normalizeString(value);
  if (!normalized) return null;

  const result = normalizeEnum(value, enumMapping);
  if (!result) {
    const validValues = Object.keys(enumMapping).join(', ');
    return {
      rowNumber,
      column,
      value,
      message: `Invalid ${enumName} value: "${normalized}". Valid values: ${validValues}`,
      severity: 'error',
    };
  }

  return null;
}

// ============================================
// ENTITY VALIDATORS
// ============================================

export function validateUserRow(
  row: Record<string, unknown>,
  rowNumber: number
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Required: email
  const emailColumns = ['Email', 'email'];
  const emailCol = emailColumns.find(c => row[c] !== undefined);
  if (emailCol) {
    const emailReq = validateRequired(row[emailCol], rowNumber, emailCol, 'email');
    if (emailReq) errors.push(emailReq);
    const emailFmt = validateEmail(row[emailCol], rowNumber, emailCol);
    if (emailFmt) errors.push(emailFmt);
  }

  // Required: name
  const nameColumns = ['Ho Ten', 'Name', 'Ten'];
  const nameCol = nameColumns.find(c => row[c] !== undefined);
  if (nameCol) {
    const nameReq = validateRequired(row[nameCol], rowNumber, nameCol, 'name');
    if (nameReq) errors.push(nameReq);
  }

  // Required: role
  const roleColumns = ['Vai Tro', 'Role', 'Chuc Vu'];
  const roleCol = roleColumns.find(c => row[c] !== undefined);
  if (roleCol) {
    const roleReq = validateRequired(row[roleCol], rowNumber, roleCol, 'role');
    if (roleReq) errors.push(roleReq);
    const roleEnum = validateEnum(row[roleCol], rowNumber, roleCol, UserRoleMapping, 'UserRole');
    if (roleEnum) errors.push(roleEnum);
  }

  return errors;
}

export function validateClientRow(
  row: Record<string, unknown>,
  rowNumber: number
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Required: companyName
  const companyColumns = ['Ten Cong Ty', 'Company Name', 'Cong Ty', 'Ten Khach Hang'];
  const companyCol = companyColumns.find(c => row[c] !== undefined);
  if (companyCol) {
    const companyReq = validateRequired(row[companyCol], rowNumber, companyCol, 'companyName');
    if (companyReq) errors.push(companyReq);
  }

  // Required: accessCode
  const accessColumns = ['Ma Truy Cap', 'Access Code'];
  const accessCol = accessColumns.find(c => row[c] !== undefined);
  if (accessCol) {
    const accessReq = validateRequired(row[accessCol], rowNumber, accessCol, 'accessCode');
    if (accessReq) errors.push(accessReq);
  }

  // Optional: email validation
  const emailColumns = ['Email', 'Email Lien He'];
  const emailCol = emailColumns.find(c => row[c] !== undefined);
  if (emailCol && row[emailCol]) {
    const emailFmt = validateEmail(row[emailCol], rowNumber, emailCol);
    if (emailFmt) errors.push(emailFmt);
  }

  // Optional: phone validation
  const phoneColumns = ['So Dien Thoai', 'Phone', 'SDT'];
  const phoneCol = phoneColumns.find(c => row[c] !== undefined);
  if (phoneCol && row[phoneCol]) {
    const phoneFmt = validatePhone(row[phoneCol], rowNumber, phoneCol);
    if (phoneFmt) errors.push(phoneFmt);
  }

  return errors;
}

export function validateProjectRow(
  row: Record<string, unknown>,
  rowNumber: number
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Required: code
  const codeColumns = ['Ma Du An', 'Project Code', 'Code', 'Ma'];
  const codeCol = codeColumns.find(c => row[c] !== undefined);
  if (codeCol) {
    const codeReq = validateRequired(row[codeCol], rowNumber, codeCol, 'code');
    if (codeReq) errors.push(codeReq);
    const codeFmt = validateProjectCode(row[codeCol], rowNumber, codeCol);
    if (codeFmt) errors.push(codeFmt);
  }

  // Required: name
  const nameColumns = ['Ten Du An', 'Project Name', 'Ten'];
  const nameCol = nameColumns.find(c => row[c] !== undefined);
  if (nameCol) {
    const nameReq = validateRequired(row[nameCol], rowNumber, nameCol, 'name');
    if (nameReq) errors.push(nameReq);
  }

  // Optional: status enum validation
  const statusColumns = ['Trang Thai', 'Status'];
  const statusCol = statusColumns.find(c => row[c] !== undefined);
  if (statusCol && row[statusCol]) {
    const statusEnum = validateEnum(row[statusCol], rowNumber, statusCol, ProjectStatusMapping, 'ProjectStatus');
    if (statusEnum) errors.push(statusEnum);
  }

  // Optional: stage enum validation
  const stageColumns = ['Giai Doan', 'Stage'];
  const stageCol = stageColumns.find(c => row[c] !== undefined);
  if (stageCol && row[stageCol]) {
    const stageEnum = validateEnum(row[stageCol], rowNumber, stageCol, ProjectStageMapping, 'ProjectStage');
    if (stageEnum) errors.push(stageEnum);
  }

  // Optional: progress validation (0-100)
  const progressColumns = ['Tien Do Giai Doan', 'Stage Progress', 'Tien Do Timeline', 'Timeline Progress'];
  for (const col of progressColumns) {
    if (row[col] !== undefined && row[col] !== null && row[col] !== '') {
      const progressVal = validateNumber(row[col], rowNumber, col, { min: 0, max: 100 });
      if (progressVal) errors.push(progressVal);
    }
  }

  // Optional: URL validations
  const urlColumns = ['Drive Link', 'Link Drive', 'Plan Link', 'Link Ke Hoach', 'Tracking Link', 'Link Tracking'];
  for (const col of urlColumns) {
    if (row[col] !== undefined && row[col] !== null && row[col] !== '') {
      const urlVal = validateUrl(row[col], rowNumber, col);
      if (urlVal) errors.push(urlVal);
    }
  }

  // Date validation: endDate should be after startDate
  const startDateCols = ['Ngay Bat Dau', 'Start Date', 'Bat Dau'];
  const endDateCols = ['Ngay Ket Thuc', 'End Date', 'Ket Thuc'];
  const startCol = startDateCols.find(c => row[c] !== undefined);
  const endCol = endDateCols.find(c => row[c] !== undefined);

  if (startCol && endCol && row[startCol] && row[endCol]) {
    const startDate = normalizeDate(row[startCol]);
    const endDate = normalizeDate(row[endCol]);

    if (startDate && endDate && endDate < startDate) {
      errors.push({
        rowNumber,
        column: endCol,
        value: row[endCol],
        message: 'End date is before start date',
        severity: 'error',
      });
    }
  }

  return errors;
}

export function validateProjectBudgetRow(
  row: Record<string, unknown>,
  rowNumber: number
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Required: projectCode reference
  const codeColumns = ['Ma Du An', 'Project Code'];
  const codeCol = codeColumns.find(c => row[c] !== undefined);
  if (codeCol) {
    const codeReq = validateRequired(row[codeCol], rowNumber, codeCol, 'projectCode');
    if (codeReq) errors.push(codeReq);
  }

  // Required: totalBudget
  const budgetColumns = ['Tong Ngan Sach', 'Total Budget', 'Budget'];
  const budgetCol = budgetColumns.find(c => row[c] !== undefined);
  if (budgetCol) {
    const budgetReq = validateRequired(row[budgetCol], rowNumber, budgetCol, 'totalBudget');
    if (budgetReq) errors.push(budgetReq);
    const budgetVal = validateNumber(row[budgetCol], rowNumber, budgetCol, { min: 0 });
    if (budgetVal) errors.push(budgetVal);
  }

  // Optional: numeric validations for fees (must be >= 0)
  const feeColumns = [
    'Ngan Sach Thang', 'Monthly Budget',
    'Da Chi Tieu', 'Spent', 'Spent Amount',
    'Phi Quang Cao', 'Fixed Ad Fee',
    'Phi DV Quang Cao', 'Ad Service Fee',
    'Phi Content', 'Content Fee',
    'Phi Design', 'Design Fee',
    'Phi Media', 'Media Fee',
    'Phi Khac', 'Other Fee',
  ];

  for (const col of feeColumns) {
    if (row[col] !== undefined && row[col] !== null && row[col] !== '') {
      const feeVal = validateNumber(row[col], rowNumber, col, { min: 0 });
      if (feeVal) errors.push(feeVal);
    }
  }

  return errors;
}

export function validateProjectKPIRow(
  row: Record<string, unknown>,
  rowNumber: number
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Required: projectCode reference
  const codeColumns = ['Ma Du An', 'Project Code'];
  const codeCol = codeColumns.find(c => row[c] !== undefined);
  if (codeCol) {
    const codeReq = validateRequired(row[codeCol], rowNumber, codeCol, 'projectCode');
    if (codeReq) errors.push(codeReq);
  }

  // Required: kpiType
  const typeColumns = ['Loai KPI', 'KPI Type', 'Type'];
  const typeCol = typeColumns.find(c => row[c] !== undefined);
  if (typeCol) {
    const typeReq = validateRequired(row[typeCol], rowNumber, typeCol, 'kpiType');
    if (typeReq) errors.push(typeReq);
  }

  return errors;
}

export function validateTaskRow(
  row: Record<string, unknown>,
  rowNumber: number
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Required: projectCode reference
  const codeColumns = ['Ma Du An', 'Project Code'];
  const codeCol = codeColumns.find(c => row[c] !== undefined);
  if (codeCol) {
    const codeReq = validateRequired(row[codeCol], rowNumber, codeCol, 'projectCode');
    if (codeReq) errors.push(codeReq);
  }

  // Required: title
  const titleColumns = ['Tieu De', 'Title', 'Ten Task', 'Task Name'];
  const titleCol = titleColumns.find(c => row[c] !== undefined);
  if (titleCol) {
    const titleReq = validateRequired(row[titleCol], rowNumber, titleCol, 'title');
    if (titleReq) errors.push(titleReq);
  }

  // Required: createdBy reference
  const creatorColumns = ['Nguoi Tao', 'Created By', 'Creator'];
  const creatorCol = creatorColumns.find(c => row[c] !== undefined);
  if (creatorCol) {
    const creatorReq = validateRequired(row[creatorCol], rowNumber, creatorCol, 'createdBy');
    if (creatorReq) errors.push(creatorReq);
    const creatorEmail = validateEmail(row[creatorCol], rowNumber, creatorCol);
    if (creatorEmail) errors.push(creatorEmail);
  }

  // Optional: status enum validation
  const statusColumns = ['Trang Thai', 'Status'];
  const statusCol = statusColumns.find(c => row[c] !== undefined);
  if (statusCol && row[statusCol]) {
    const statusEnum = validateEnum(row[statusCol], rowNumber, statusCol, TaskStatusMapping, 'TaskStatus');
    if (statusEnum) errors.push(statusEnum);
  }

  // Optional: priority enum validation
  const priorityColumns = ['Muc Do Uu Tien', 'Priority', 'Do Uu Tien'];
  const priorityCol = priorityColumns.find(c => row[c] !== undefined);
  if (priorityCol && row[priorityCol]) {
    const priorityEnum = validateEnum(row[priorityCol], rowNumber, priorityCol, TaskPriorityMapping, 'TaskPriority');
    if (priorityEnum) errors.push(priorityEnum);
  }

  // Optional: hours validation (must be >= 0)
  const hoursColumns = ['Gio Du Kien', 'Estimated Hours', 'Gio Thuc Te', 'Actual Hours'];
  for (const col of hoursColumns) {
    if (row[col] !== undefined && row[col] !== null && row[col] !== '') {
      const hoursVal = validateNumber(row[col], rowNumber, col, { min: 0 });
      if (hoursVal) errors.push(hoursVal);
    }
  }

  // Optional: assignee email validation
  const assigneeColumns = ['Nguoi Phu Trach', 'Assignee', 'Assignees'];
  const assigneeCol = assigneeColumns.find(c => row[c] !== undefined);
  if (assigneeCol && row[assigneeCol]) {
    const emails = String(row[assigneeCol]).split(',').map(e => e.trim()).filter(Boolean);
    for (const email of emails) {
      const emailFmt = validateEmail(email, rowNumber, assigneeCol);
      if (emailFmt) errors.push(emailFmt);
    }
  }

  // Optional: reviewer email validation
  const reviewerColumns = ['Nguoi Review', 'Reviewer'];
  const reviewerCol = reviewerColumns.find(c => row[c] !== undefined);
  if (reviewerCol && row[reviewerCol]) {
    const emailFmt = validateEmail(row[reviewerCol], rowNumber, reviewerCol);
    if (emailFmt) errors.push(emailFmt);
  }

  return errors;
}

// ============================================
// MAIN VALIDATION FUNCTIONS
// ============================================

export function validateEntity(
  entityType: string,
  row: Record<string, unknown>,
  rowNumber: number
): ValidationError[] {
  switch (entityType) {
    case 'User':
      return validateUserRow(row, rowNumber);
    case 'Client':
      return validateClientRow(row, rowNumber);
    case 'Project':
      return validateProjectRow(row, rowNumber);
    case 'ProjectBudget':
      return validateProjectBudgetRow(row, rowNumber);
    case 'ProjectKPI':
      return validateProjectKPIRow(row, rowNumber);
    case 'Task':
      return validateTaskRow(row, rowNumber);
    default:
      return [];
  }
}

export function validateSheet(
  entityType: string,
  rows: Record<string, unknown>[]
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const rowsWithErrorsSet = new Set<number>();
  const rowsWithWarningsSet = new Set<number>();

  for (let i = 0; i < rows.length; i++) {
    const rowNumber = i + 2; // Account for header row (1-indexed in Excel)
    const rowErrors = validateEntity(entityType, rows[i], rowNumber);

    for (const error of rowErrors) {
      if (error.severity === 'error') {
        errors.push(error);
        rowsWithErrorsSet.add(rowNumber);
      } else {
        warnings.push(error);
        rowsWithWarningsSet.add(rowNumber);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    rowsValidated: rows.length,
    rowsWithErrors: rowsWithErrorsSet.size,
    rowsWithWarnings: rowsWithWarningsSet.size,
  };
}

// ============================================
// REFERENTIAL INTEGRITY CHECKS
// ============================================

export const ReferentialIntegrityRules: ReferentialIntegrityCheck[] = [
  {
    entityType: 'Project',
    foreignKey: '_clientName',
    referencedEntity: 'Client',
    referencedField: 'companyName',
  },
  {
    entityType: 'ProjectBudget',
    foreignKey: '_projectCode',
    referencedEntity: 'Project',
    referencedField: 'code',
  },
  {
    entityType: 'ProjectKPI',
    foreignKey: '_projectCode',
    referencedEntity: 'Project',
    referencedField: 'code',
  },
  {
    entityType: 'Task',
    foreignKey: '_projectCode',
    referencedEntity: 'Project',
    referencedField: 'code',
  },
  {
    entityType: 'Task',
    foreignKey: '_creatorEmail',
    referencedEntity: 'User',
    referencedField: 'email',
  },
  {
    entityType: 'Task',
    foreignKey: '_reviewerEmail',
    referencedEntity: 'User',
    referencedField: 'email',
  },
];

export interface ReferentialIntegrityResult {
  isValid: boolean;
  missingReferences: Array<{
    entityType: string;
    rowNumber: number;
    foreignKey: string;
    value: unknown;
    referencedEntity: string;
    referencedField: string;
  }>;
}

export function checkReferentialIntegrity(
  entityType: string,
  rows: Array<{ rowNumber: number; data: Record<string, unknown> }>,
  referenceData: Map<string, Set<string>> // entityType -> Set of valid values
): ReferentialIntegrityResult {
  const missingReferences: ReferentialIntegrityResult['missingReferences'] = [];

  const rules = ReferentialIntegrityRules.filter(r => r.entityType === entityType);

  for (const rule of rules) {
    const validValues = referenceData.get(`${rule.referencedEntity}.${rule.referencedField}`);

    if (!validValues) continue;

    for (const { rowNumber, data } of rows) {
      const value = data[rule.foreignKey];

      if (!value) continue;

      // Handle comma-separated values (e.g., multiple assignees)
      const values = String(value).split(',').map(v => v.trim().toLowerCase()).filter(Boolean);

      for (const v of values) {
        if (!validValues.has(v)) {
          missingReferences.push({
            entityType,
            rowNumber,
            foreignKey: rule.foreignKey,
            value: v,
            referencedEntity: rule.referencedEntity,
            referencedField: rule.referencedField,
          });
        }
      }
    }
  }

  return {
    isValid: missingReferences.length === 0,
    missingReferences,
  };
}

// ============================================
// DUPLICATE CHECK
// ============================================

export interface DuplicateCheckResult {
  hasDuplicates: boolean;
  duplicates: Array<{
    field: string;
    value: string;
    rowNumbers: number[];
  }>;
}

export function checkDuplicates(
  rows: Array<{ rowNumber: number; data: Record<string, unknown> }>,
  uniqueFields: string[]
): DuplicateCheckResult {
  const fieldValueMap = new Map<string, Map<string, number[]>>(); // field -> (value -> rowNumbers[])

  for (const field of uniqueFields) {
    fieldValueMap.set(field, new Map());
  }

  for (const { rowNumber, data } of rows) {
    for (const field of uniqueFields) {
      const value = normalizeString(data[field]);
      if (!value) continue;

      const valueMap = fieldValueMap.get(field)!;
      const normalizedValue = value.toLowerCase();

      if (!valueMap.has(normalizedValue)) {
        valueMap.set(normalizedValue, []);
      }
      valueMap.get(normalizedValue)!.push(rowNumber);
    }
  }

  const duplicates: DuplicateCheckResult['duplicates'] = [];

  for (const [field, valueMap] of fieldValueMap) {
    for (const [value, rowNumbers] of valueMap) {
      if (rowNumbers.length > 1) {
        duplicates.push({
          field,
          value,
          rowNumbers,
        });
      }
    }
  }

  return {
    hasDuplicates: duplicates.length > 0,
    duplicates,
  };
}

// ============================================
// VALIDATION REPORT GENERATOR
// ============================================

export interface SheetValidationReport {
  sheetName: string;
  entityType: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: ValidationError[];
  warnings: ValidationError[];
  duplicates: DuplicateCheckResult;
  referentialIntegrity: ReferentialIntegrityResult;
}

export interface FullValidationReport {
  timestamp: Date;
  fileName: string;
  totalSheets: number;
  totalRows: number;
  totalErrors: number;
  totalWarnings: number;
  canProceed: boolean;
  sheets: SheetValidationReport[];
}

export function generateValidationReport(
  fileName: string,
  sheetReports: SheetValidationReport[]
): FullValidationReport {
  let totalRows = 0;
  let totalErrors = 0;
  let totalWarnings = 0;

  for (const report of sheetReports) {
    totalRows += report.totalRows;
    totalErrors += report.errors.length;
    totalWarnings += report.warnings.length;

    // Count referential integrity issues as errors
    totalErrors += report.referentialIntegrity.missingReferences.length;

    // Count duplicates as errors
    totalErrors += report.duplicates.duplicates.length;
  }

  return {
    timestamp: new Date(),
    fileName,
    totalSheets: sheetReports.length,
    totalRows,
    totalErrors,
    totalWarnings,
    canProceed: totalErrors === 0,
    sheets: sheetReports,
  };
}

export function formatValidationReport(report: FullValidationReport): string {
  const lines: string[] = [];

  lines.push('='.repeat(80));
  lines.push('BC AGENCY PMS - EXCEL MIGRATION VALIDATION REPORT');
  lines.push('='.repeat(80));
  lines.push('');
  lines.push(`File: ${report.fileName}`);
  lines.push(`Timestamp: ${report.timestamp.toISOString()}`);
  lines.push(`Total Sheets: ${report.totalSheets}`);
  lines.push(`Total Rows: ${report.totalRows}`);
  lines.push(`Total Errors: ${report.totalErrors}`);
  lines.push(`Total Warnings: ${report.totalWarnings}`);
  lines.push(`Can Proceed: ${report.canProceed ? 'YES' : 'NO'}`);
  lines.push('');

  for (const sheet of report.sheets) {
    lines.push('-'.repeat(80));
    lines.push(`Sheet: ${sheet.sheetName} (${sheet.entityType})`);
    lines.push('-'.repeat(80));
    lines.push(`  Total Rows: ${sheet.totalRows}`);
    lines.push(`  Valid Rows: ${sheet.validRows}`);
    lines.push(`  Invalid Rows: ${sheet.invalidRows}`);
    lines.push('');

    if (sheet.errors.length > 0) {
      lines.push('  ERRORS:');
      for (const error of sheet.errors) {
        lines.push(`    Row ${error.rowNumber}, Column "${error.column}": ${error.message}`);
      }
      lines.push('');
    }

    if (sheet.warnings.length > 0) {
      lines.push('  WARNINGS:');
      for (const warning of sheet.warnings) {
        lines.push(`    Row ${warning.rowNumber}, Column "${warning.column}": ${warning.message}`);
      }
      lines.push('');
    }

    if (sheet.duplicates.hasDuplicates) {
      lines.push('  DUPLICATES:');
      for (const dup of sheet.duplicates.duplicates) {
        lines.push(`    Field "${dup.field}", Value "${dup.value}" found in rows: ${dup.rowNumbers.join(', ')}`);
      }
      lines.push('');
    }

    if (!sheet.referentialIntegrity.isValid) {
      lines.push('  MISSING REFERENCES:');
      for (const missing of sheet.referentialIntegrity.missingReferences) {
        lines.push(`    Row ${missing.rowNumber}: ${missing.foreignKey} = "${missing.value}" not found in ${missing.referencedEntity}.${missing.referencedField}`);
      }
      lines.push('');
    }
  }

  lines.push('='.repeat(80));
  lines.push(report.canProceed ? 'VALIDATION PASSED - READY TO MIGRATE' : 'VALIDATION FAILED - PLEASE FIX ERRORS BEFORE MIGRATING');
  lines.push('='.repeat(80));

  return lines.join('\n');
}
