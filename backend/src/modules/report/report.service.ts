import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/persistence/prisma.service.js';
import {
  ReportType,
  ReportFormat,
  GenerateReportDto,
  ProjectReportData,
  TaskReportData,
  ReportSummary,
  FullReportData,
} from '../../application/dto/report/report.dto.js';
import { TaskStatus, ProjectStatus, UserRole } from '@prisma/client';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

@Injectable()
export class ReportService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate report based on parameters
   */
  async generateReport(
    dto: GenerateReportDto,
    userId: string,
    userRole: string,
  ): Promise<Buffer> {
    // Calculate date range based on report type
    const { startDate, endDate } = this.calculateDateRange(dto);

    // Get report data
    const reportData = await this.aggregateReportData(
      startDate,
      endDate,
      dto.projectId,
      userId,
      userRole,
    );

    // Generate report in requested format
    if (dto.format === ReportFormat.PDF) {
      return this.generatePdfReport(reportData, dto.type);
    } else {
      return this.generateExcelReport(reportData, dto.type);
    }
  }

  /**
   * Calculate date range based on report type
   */
  private calculateDateRange(dto: GenerateReportDto): {
    startDate: Date;
    endDate: Date;
  } {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now);

    switch (dto.type) {
      case ReportType.WEEKLY:
        // Start of current week (Monday)
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay() + 1);
        startDate.setHours(0, 0, 0, 0);
        break;

      case ReportType.MONTHLY:
        // Start of current month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;

      case ReportType.CUSTOM:
        if (!dto.startDate || !dto.endDate) {
          throw new BadRequestException(
            'Custom report requires startDate and endDate',
          );
        }
        startDate = new Date(dto.startDate);
        endDate = new Date(dto.endDate);
        break;

      default:
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
    }

    return { startDate, endDate };
  }

  /**
   * Aggregate all data needed for the report
   */
  private async aggregateReportData(
    startDate: Date,
    endDate: Date,
    projectId: string | undefined,
    userId: string,
    userRole: string,
  ): Promise<FullReportData> {
    // Build project filter
    const projectWhere: Record<string, unknown> = {
      archivedAt: null,
    };

    // Scope to user's accessible projects if not admin
    const isAdmin = userRole === UserRole.SUPER_ADMIN || userRole === UserRole.ADMIN;
    if (!isAdmin) {
      projectWhere.team = {
        some: { userId },
      };
    }

    if (projectId) {
      projectWhere.id = projectId;
    }

    // Get projects with task stats
    const projects = await this.prisma.project.findMany({
      where: projectWhere,
      include: {
        client: { select: { companyName: true } },
        tasks: {
          where: {
            OR: [
              { createdAt: { gte: startDate, lte: endDate } },
              { updatedAt: { gte: startDate, lte: endDate } },
            ],
          },
          select: {
            status: true,
          },
        },
        _count: {
          select: { tasks: true },
        },
      },
    });

    // Get all tasks for detailed report
    const tasks = await this.prisma.task.findMany({
      where: {
        project: projectWhere,
        OR: [
          { createdAt: { gte: startDate, lte: endDate } },
          { updatedAt: { gte: startDate, lte: endDate } },
        ],
      },
      include: {
        project: { select: { name: true, code: true } },
        assignees: {
          include: {
            user: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform project data
    const projectReportData: ProjectReportData[] = projects.map((project) => {
      const taskStats = {
        total: project._count.tasks,
        todo: 0,
        inProgress: 0,
        review: 0,
        done: 0,
        blocked: 0,
        cancelled: 0,
      };

      project.tasks.forEach((task) => {
        switch (task.status) {
          case TaskStatus.TODO:
            taskStats.todo++;
            break;
          case TaskStatus.IN_PROGRESS:
            taskStats.inProgress++;
            break;
          case TaskStatus.REVIEW:
            taskStats.review++;
            break;
          case TaskStatus.DONE:
            taskStats.done++;
            break;
          case TaskStatus.BLOCKED:
            taskStats.blocked++;
            break;
          case TaskStatus.CANCELLED:
            taskStats.cancelled++;
            break;
        }
      });

      const completionPercentage =
        taskStats.total > 0
          ? Math.round((taskStats.done / taskStats.total) * 100)
          : 0;

      return {
        id: project.id,
        code: project.code,
        name: project.name,
        status: project.status,
        stage: project.stage,
        stageProgress: project.stageProgress,
        startDate: project.startDate,
        endDate: project.endDate,
        client: project.client,
        taskStats,
        completionPercentage,
      };
    });

    // Transform task data
    const taskReportData: TaskReportData[] = tasks.map((task) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      projectName: task.project.name,
      projectCode: task.project.code,
      assignees: task.assignees.map((a) => a.user.name),
      deadline: task.deadline,
      estimatedHours: task.estimatedHours,
      actualHours: task.actualHours,
      createdAt: task.createdAt,
      completedAt: task.completedAt,
    }));

    // Calculate summary
    const projectStatusBreakdown = {
      stable: projects.filter((p) => p.status === ProjectStatus.STABLE).length,
      warning: projects.filter((p) => p.status === ProjectStatus.WARNING).length,
      critical: projects.filter((p) => p.status === ProjectStatus.CRITICAL).length,
    };

    const taskStatusBreakdown = {
      todo: tasks.filter((t) => t.status === TaskStatus.TODO).length,
      inProgress: tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length,
      review: tasks.filter((t) => t.status === TaskStatus.REVIEW).length,
      done: tasks.filter((t) => t.status === TaskStatus.DONE).length,
      blocked: tasks.filter((t) => t.status === TaskStatus.BLOCKED).length,
      cancelled: tasks.filter((t) => t.status === TaskStatus.CANCELLED).length,
    };

    const overallCompletionRate =
      tasks.length > 0
        ? Math.round((taskStatusBreakdown.done / tasks.length) * 100)
        : 0;

    const summary: ReportSummary = {
      generatedAt: new Date(),
      reportType: ReportType.CUSTOM, // Will be set by caller
      dateRange: { startDate, endDate },
      totalProjects: projects.length,
      totalTasks: tasks.length,
      projectStatusBreakdown,
      taskStatusBreakdown,
      overallCompletionRate,
    };

    return {
      summary,
      projects: projectReportData,
      tasks: taskReportData,
    };
  }

  /**
   * Generate PDF report using pdfkit
   */
  private async generatePdfReport(
    data: FullReportData,
    reportType: ReportType,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Title
      doc.fontSize(24).font('Helvetica-Bold');
      doc.text('BAO CAO DU AN', { align: 'center' });
      doc.moveDown();

      // Report type and date range
      doc.fontSize(12).font('Helvetica');
      const reportTypeVi = this.getReportTypeVietnamese(reportType);
      doc.text(`Loai bao cao: ${reportTypeVi}`, { align: 'center' });
      doc.text(
        `Thoi gian: ${this.formatDate(data.summary.dateRange.startDate)} - ${this.formatDate(data.summary.dateRange.endDate)}`,
        { align: 'center' },
      );
      doc.text(`Ngay tao: ${this.formatDate(data.summary.generatedAt)}`, {
        align: 'center',
      });
      doc.moveDown(2);

      // Summary Section
      doc.fontSize(16).font('Helvetica-Bold');
      doc.text('TONG QUAN', { underline: true });
      doc.moveDown();

      doc.fontSize(11).font('Helvetica');
      doc.text(`Tong so du an: ${data.summary.totalProjects}`);
      doc.text(`Tong so cong viec: ${data.summary.totalTasks}`);
      doc.text(`Ti le hoan thanh: ${data.summary.overallCompletionRate}%`);
      doc.moveDown();

      // Project Status Breakdown
      doc.text('Trang thai du an:', { underline: true });
      doc.text(`  - On dinh (Stable): ${data.summary.projectStatusBreakdown.stable}`);
      doc.text(`  - Canh bao (Warning): ${data.summary.projectStatusBreakdown.warning}`);
      doc.text(`  - Nghiem trong (Critical): ${data.summary.projectStatusBreakdown.critical}`);
      doc.moveDown();

      // Task Status Breakdown
      doc.text('Trang thai cong viec:', { underline: true });
      doc.text(`  - Chua bat dau: ${data.summary.taskStatusBreakdown.todo}`);
      doc.text(`  - Dang thuc hien: ${data.summary.taskStatusBreakdown.inProgress}`);
      doc.text(`  - Dang review: ${data.summary.taskStatusBreakdown.review}`);
      doc.text(`  - Hoan thanh: ${data.summary.taskStatusBreakdown.done}`);
      doc.text(`  - Bi chan: ${data.summary.taskStatusBreakdown.blocked}`);
      doc.text(`  - Da huy: ${data.summary.taskStatusBreakdown.cancelled}`);
      doc.moveDown(2);

      // Projects Section
      if (data.projects.length > 0) {
        doc.addPage();
        doc.fontSize(16).font('Helvetica-Bold');
        doc.text('DANH SACH DU AN', { underline: true });
        doc.moveDown();

        data.projects.forEach((project, index) => {
          doc.fontSize(12).font('Helvetica-Bold');
          doc.text(`${index + 1}. [${project.code}] ${project.name}`);

          doc.fontSize(10).font('Helvetica');
          doc.text(`   Khach hang: ${project.client?.companyName || 'N/A'}`);
          doc.text(`   Trang thai: ${this.getProjectStatusVietnamese(project.status)}`);
          doc.text(`   Giai doan: ${this.getProjectStageVietnamese(project.stage)}`);
          doc.text(`   Tien do: ${project.stageProgress}%`);
          doc.text(
            `   Cong viec: ${project.taskStats.done}/${project.taskStats.total} hoan thanh (${project.completionPercentage}%)`,
          );
          doc.moveDown();

          // Add page if needed
          if (doc.y > 700 && index < data.projects.length - 1) {
            doc.addPage();
          }
        });
      }

      // Tasks Section
      if (data.tasks.length > 0) {
        doc.addPage();
        doc.fontSize(16).font('Helvetica-Bold');
        doc.text('DANH SACH CONG VIEC', { underline: true });
        doc.moveDown();

        // Group tasks by project
        const tasksByProject = data.tasks.reduce(
          (acc, task) => {
            const key = task.projectCode;
            if (!acc[key]) {
              acc[key] = { name: task.projectName, tasks: [] };
            }
            acc[key].tasks.push(task);
            return acc;
          },
          {} as Record<string, { name: string; tasks: TaskReportData[] }>,
        );

        Object.entries(tasksByProject).forEach(([code, projectData]) => {
          doc.fontSize(12).font('Helvetica-Bold');
          doc.text(`[${code}] ${projectData.name}`);
          doc.moveDown(0.5);

          projectData.tasks.forEach((task) => {
            doc.fontSize(10).font('Helvetica');
            const statusVi = this.getTaskStatusVietnamese(task.status);
            const priorityVi = this.getTaskPriorityVietnamese(task.priority);
            doc.text(`  - ${task.title}`);
            doc.text(`    Trang thai: ${statusVi} | Uu tien: ${priorityVi}`);
            if (task.assignees.length > 0) {
              doc.text(`    Phu trach: ${task.assignees.join(', ')}`);
            }
            if (task.deadline) {
              doc.text(`    Han: ${this.formatDate(task.deadline)}`);
            }
          });

          doc.moveDown();

          // Add page if needed
          if (doc.y > 700) {
            doc.addPage();
          }
        });
      }

      // Footer
      doc.fontSize(8).font('Helvetica');
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc.text(
          `Trang ${i + 1}/${pageCount}`,
          50,
          doc.page.height - 50,
          { align: 'center' },
        );
      }

      doc.end();
    });
  }

  /**
   * Generate Excel report using exceljs
   */
  private async generateExcelReport(
    data: FullReportData,
    reportType: ReportType,
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'BC Agency PMS';
    workbook.created = new Date();

    // Sheet 1: Summary
    const summarySheet = workbook.addWorksheet('Tong quan');
    this.createSummarySheet(summarySheet, data.summary, reportType);

    // Sheet 2: Projects
    const projectsSheet = workbook.addWorksheet('Du an');
    this.createProjectsSheet(projectsSheet, data.projects);

    // Sheet 3: Tasks
    const tasksSheet = workbook.addWorksheet('Cong viec');
    this.createTasksSheet(tasksSheet, data.tasks);

    // Sheet 4: Progress
    const progressSheet = workbook.addWorksheet('Tien do');
    this.createProgressSheet(progressSheet, data);

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Create Summary Sheet
   */
  private createSummarySheet(
    sheet: ExcelJS.Worksheet,
    summary: ReportSummary,
    reportType: ReportType,
  ): void {
    // Title
    sheet.mergeCells('A1:D1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'BAO CAO TONG QUAN DU AN';
    titleCell.font = { size: 18, bold: true };
    titleCell.alignment = { horizontal: 'center' };

    // Report info
    sheet.getCell('A3').value = 'Loai bao cao:';
    sheet.getCell('B3').value = this.getReportTypeVietnamese(reportType);
    sheet.getCell('A4').value = 'Thoi gian:';
    sheet.getCell('B4').value = `${this.formatDate(summary.dateRange.startDate)} - ${this.formatDate(summary.dateRange.endDate)}`;
    sheet.getCell('A5').value = 'Ngay tao:';
    sheet.getCell('B5').value = this.formatDate(summary.generatedAt);

    // Summary stats
    sheet.getCell('A7').value = 'THONG KE TONG QUAN';
    sheet.getCell('A7').font = { bold: true };

    sheet.getCell('A8').value = 'Tong so du an:';
    sheet.getCell('B8').value = summary.totalProjects;
    sheet.getCell('A9').value = 'Tong so cong viec:';
    sheet.getCell('B9').value = summary.totalTasks;
    sheet.getCell('A10').value = 'Ti le hoan thanh:';
    sheet.getCell('B10').value = `${summary.overallCompletionRate}%`;

    // Project status breakdown
    sheet.getCell('A12').value = 'TRANG THAI DU AN';
    sheet.getCell('A12').font = { bold: true };

    sheet.getCell('A13').value = 'On dinh (Stable):';
    sheet.getCell('B13').value = summary.projectStatusBreakdown.stable;
    sheet.getCell('A14').value = 'Canh bao (Warning):';
    sheet.getCell('B14').value = summary.projectStatusBreakdown.warning;
    sheet.getCell('A15').value = 'Nghiem trong (Critical):';
    sheet.getCell('B15').value = summary.projectStatusBreakdown.critical;

    // Task status breakdown
    sheet.getCell('A17').value = 'TRANG THAI CONG VIEC';
    sheet.getCell('A17').font = { bold: true };

    sheet.getCell('A18').value = 'Chua bat dau:';
    sheet.getCell('B18').value = summary.taskStatusBreakdown.todo;
    sheet.getCell('A19').value = 'Dang thuc hien:';
    sheet.getCell('B19').value = summary.taskStatusBreakdown.inProgress;
    sheet.getCell('A20').value = 'Dang review:';
    sheet.getCell('B20').value = summary.taskStatusBreakdown.review;
    sheet.getCell('A21').value = 'Hoan thanh:';
    sheet.getCell('B21').value = summary.taskStatusBreakdown.done;
    sheet.getCell('A22').value = 'Bi chan:';
    sheet.getCell('B22').value = summary.taskStatusBreakdown.blocked;
    sheet.getCell('A23').value = 'Da huy:';
    sheet.getCell('B23').value = summary.taskStatusBreakdown.cancelled;

    // Set column widths
    sheet.getColumn('A').width = 25;
    sheet.getColumn('B').width = 30;
  }

  /**
   * Create Projects Sheet
   */
  private createProjectsSheet(
    sheet: ExcelJS.Worksheet,
    projects: ProjectReportData[],
  ): void {
    // Headers
    const headers = [
      'Ma du an',
      'Ten du an',
      'Khach hang',
      'Trang thai',
      'Giai doan',
      'Tien do (%)',
      'Ngay bat dau',
      'Ngay ket thuc',
      'Tong cong viec',
      'Hoan thanh',
      'Ti le hoan thanh (%)',
    ];

    const headerRow = sheet.addRow(headers);
    headerRow.font = { bold: true };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '4472C4' },
      };
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.alignment = { horizontal: 'center' };
    });

    // Data rows
    projects.forEach((project) => {
      sheet.addRow([
        project.code,
        project.name,
        project.client?.companyName || 'N/A',
        this.getProjectStatusVietnamese(project.status),
        this.getProjectStageVietnamese(project.stage),
        project.stageProgress,
        project.startDate ? this.formatDate(project.startDate) : 'N/A',
        project.endDate ? this.formatDate(project.endDate) : 'N/A',
        project.taskStats.total,
        project.taskStats.done,
        project.completionPercentage,
      ]);
    });

    // Set column widths
    sheet.columns.forEach((column) => {
      column.width = 18;
    });
    sheet.getColumn(2).width = 30; // Project name wider
  }

  /**
   * Create Tasks Sheet
   */
  private createTasksSheet(
    sheet: ExcelJS.Worksheet,
    tasks: TaskReportData[],
  ): void {
    // Headers
    const headers = [
      'Ma du an',
      'Ten du an',
      'Ten cong viec',
      'Trang thai',
      'Uu tien',
      'Nguoi phu trach',
      'Han hoan thanh',
      'Gio du kien',
      'Gio thuc te',
      'Ngay tao',
      'Ngay hoan thanh',
    ];

    const headerRow = sheet.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '4472C4' },
      };
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.alignment = { horizontal: 'center' };
    });

    // Data rows
    tasks.forEach((task) => {
      sheet.addRow([
        task.projectCode,
        task.projectName,
        task.title,
        this.getTaskStatusVietnamese(task.status),
        this.getTaskPriorityVietnamese(task.priority),
        task.assignees.join(', ') || 'N/A',
        task.deadline ? this.formatDate(task.deadline) : 'N/A',
        task.estimatedHours ?? 'N/A',
        task.actualHours ?? 'N/A',
        this.formatDate(task.createdAt),
        task.completedAt ? this.formatDate(task.completedAt) : 'N/A',
      ]);
    });

    // Set column widths
    sheet.columns.forEach((column) => {
      column.width = 15;
    });
    sheet.getColumn(2).width = 25; // Project name wider
    sheet.getColumn(3).width = 35; // Task title wider
    sheet.getColumn(6).width = 25; // Assignees wider
  }

  /**
   * Create Progress Sheet
   */
  private createProgressSheet(
    sheet: ExcelJS.Worksheet,
    data: FullReportData,
  ): void {
    // Title
    sheet.mergeCells('A1:E1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'TIEN DO CHI TIET THEO DU AN';
    titleCell.font = { size: 14, bold: true };
    titleCell.alignment = { horizontal: 'center' };

    let currentRow = 3;

    data.projects.forEach((project) => {
      // Project header
      sheet.mergeCells(`A${currentRow}:E${currentRow}`);
      const projectHeaderCell = sheet.getCell(`A${currentRow}`);
      projectHeaderCell.value = `[${project.code}] ${project.name}`;
      projectHeaderCell.font = { bold: true };
      projectHeaderCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'E2EFDA' },
      };
      currentRow++;

      // Task breakdown
      const statuses = [
        { label: 'Chua bat dau', value: project.taskStats.todo },
        { label: 'Dang thuc hien', value: project.taskStats.inProgress },
        { label: 'Dang review', value: project.taskStats.review },
        { label: 'Hoan thanh', value: project.taskStats.done },
        { label: 'Bi chan', value: project.taskStats.blocked },
        { label: 'Da huy', value: project.taskStats.cancelled },
      ];

      statuses.forEach((status) => {
        sheet.getCell(`A${currentRow}`).value = `  ${status.label}:`;
        sheet.getCell(`B${currentRow}`).value = status.value;
        currentRow++;
      });

      // Summary row
      sheet.getCell(`A${currentRow}`).value = '  TONG:';
      sheet.getCell(`A${currentRow}`).font = { bold: true };
      sheet.getCell(`B${currentRow}`).value = project.taskStats.total;
      sheet.getCell(`B${currentRow}`).font = { bold: true };
      sheet.getCell(`C${currentRow}`).value = `${project.completionPercentage}% hoan thanh`;
      currentRow += 2;
    });

    // Set column widths
    sheet.getColumn('A').width = 25;
    sheet.getColumn('B').width = 15;
    sheet.getColumn('C').width = 20;
  }

  // Helper methods for Vietnamese translations
  private getReportTypeVietnamese(type: ReportType): string {
    const map: Record<ReportType, string> = {
      [ReportType.WEEKLY]: 'Bao cao tuan',
      [ReportType.MONTHLY]: 'Bao cao thang',
      [ReportType.CUSTOM]: 'Bao cao tuy chinh',
    };
    return map[type] || type;
  }

  private getProjectStatusVietnamese(status: string): string {
    const map: Record<string, string> = {
      STABLE: 'On dinh',
      WARNING: 'Canh bao',
      CRITICAL: 'Nghiem trong',
    };
    return map[status] || status;
  }

  private getProjectStageVietnamese(stage: string): string {
    const map: Record<string, string> = {
      INTAKE: 'Tiep nhan',
      DISCOVERY: 'Phan tich',
      PLANNING: 'Lap ke hoach',
      UNDER_REVIEW: 'Cho duyet',
      PROPOSAL_PITCH: 'Trinh bay',
      ONGOING: 'Dang thuc hien',
      OPTIMIZATION: 'Toi uu',
      COMPLETED: 'Hoan thanh',
      CLOSED: 'Dong',
    };
    return map[stage] || stage;
  }

  private getTaskStatusVietnamese(status: string): string {
    const map: Record<string, string> = {
      TODO: 'Chua bat dau',
      IN_PROGRESS: 'Dang thuc hien',
      REVIEW: 'Dang review',
      DONE: 'Hoan thanh',
      BLOCKED: 'Bi chan',
      CANCELLED: 'Da huy',
    };
    return map[status] || status;
  }

  private getTaskPriorityVietnamese(priority: string): string {
    const map: Record<string, string> = {
      LOW: 'Thap',
      MEDIUM: 'Trung binh',
      HIGH: 'Cao',
      URGENT: 'Khan cap',
    };
    return map[priority] || priority;
  }

  private formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
}
