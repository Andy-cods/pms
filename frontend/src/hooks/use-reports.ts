import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  reportsApi,
  type GenerateReportInput,
  type ReportFormat,
  type ReportType,
  generateReportFilename,
} from '@/lib/api/reports';

// Helper function to download blob as file
function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

// Generate report mutation
export function useGenerateReport() {
  return useMutation({
    mutationFn: async ({
      input,
      projectName,
    }: {
      input: GenerateReportInput;
      projectName?: string;
    }) => {
      const blob = await reportsApi.generate(input);
      return { blob, input, projectName };
    },
    onSuccess: ({ blob, input, projectName }) => {
      const filename = generateReportFilename(input.type, input.format, projectName);
      downloadBlob(blob, filename);
      toast.success('Tạo báo cáo thành công', {
        description: `File ${filename} đã được tải xuống.`,
      });
    },
    onError: (error: Error) => {
      toast.error('Tạo báo cáo thất bại', {
        description: error.message || 'Đã xảy ra lỗi khi tạo báo cáo.',
      });
    },
  });
}
