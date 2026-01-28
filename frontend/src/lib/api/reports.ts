import { api } from './index';

// Types
export type ReportType = 'WEEKLY' | 'WEEKLY_PER_PROJECT' | 'MONTHLY' | 'CUSTOM';
export type ReportFormat = 'PDF' | 'EXCEL';

export interface GenerateReportInput {
  type: ReportType;
  format: ReportFormat;
  projectId?: string;
  startDate?: string;
  endDate?: string;
}

// Labels for UI
export const ReportTypeLabels: Record<ReportType, string> = {
  WEEKLY: 'Báo cáo tuần (tổng hợp)',
  WEEKLY_PER_PROJECT: 'Báo cáo tuần theo dự án',
  MONTHLY: 'Báo cáo tháng',
  CUSTOM: 'Tùy chỉnh',
};

export const ReportFormatLabels: Record<ReportFormat, string> = {
  PDF: 'PDF',
  EXCEL: 'Excel',
};

// Helper function to generate filename
export function generateReportFilename(
  type: ReportType,
  format: ReportFormat,
  projectName?: string
): string {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const extension = format === 'PDF' ? 'pdf' : 'xlsx';
  const projectPart = projectName ? `_${projectName.replace(/\s+/g, '-')}` : '';
  return `report_${type.toLowerCase()}${projectPart}_${dateStr}.${extension}`;
}

// API Functions
export const reportsApi = {
  // Generate a report
  generate: async (input: GenerateReportInput): Promise<Blob> => {
    const response = await api.post('/reports/generate', input, {
      responseType: 'blob',
    });
    return response.data;
  },
};
