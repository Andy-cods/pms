'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { CalendarIcon, FileBarChart, FileSpreadsheet, Loader2 } from 'lucide-react';
import { DateRange } from 'react-day-picker';

import { useGenerateReport } from '@/hooks/use-reports';
import { useProjects } from '@/hooks/use-projects';
import {
  type ReportType,
  type ReportFormat,
  ReportTypeLabels,
  ReportFormatLabels,
} from '@/lib/api/reports';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('WEEKLY');
  const [reportFormat, setReportFormat] = useState<ReportFormat>('PDF');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const { data: projectsData, isLoading: projectsLoading } = useProjects({ limit: 100 });
  const generateReport = useGenerateReport();

  const selectedProject = projectsData?.projects.find((p) => p.id === selectedProjectId);

  const handleGenerateReport = () => {
    const input = {
      type: reportType,
      format: reportFormat,
      projectId: selectedProjectId !== 'all' ? selectedProjectId : undefined,
      startDate: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
      endDate: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
    };

    generateReport.mutate({
      input,
      projectName: selectedProject?.name,
    });
  };

  const isDateRangeRequired = reportType === 'CUSTOM';
  const isProjectRequired = reportType === 'WEEKLY_PER_PROJECT';
  const isFormValid =
    (!isDateRangeRequired || (dateRange?.from && dateRange?.to)) &&
    (!isProjectRequired || selectedProjectId !== 'all');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Báo cáo</h1>
        <p className="text-muted-foreground">Tạo và tải xuống báo cáo dự án</p>
      </div>

      {/* Report Form */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileBarChart className="h-5 w-5" />
            Tạo báo cáo mới
          </CardTitle>
          <CardDescription>
            Chọn loại báo cáo, định dạng và dự án để tạo báo cáo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Report Type */}
          <div className="space-y-2">
            <Label htmlFor="report-type">Loại báo cáo</Label>
            <Select
              value={reportType}
              onValueChange={(value) => setReportType(value as ReportType)}
            >
              <SelectTrigger id="report-type">
                <SelectValue placeholder="Chọn loại báo cáo" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ReportTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {reportType === 'WEEKLY' && 'Báo cáo tổng hợp theo tuần (7 ngày gần nhất).'}
              {reportType === 'WEEKLY_PER_PROJECT' &&
                'Báo cáo tuần dành riêng cho một dự án (bắt buộc chọn dự án).'}
              {reportType === 'MONTHLY' && 'Báo cáo tổng hợp theo tháng (30 ngày gần nhất).'}
              {reportType === 'CUSTOM' && 'Báo cáo theo khoảng thời gian tùy chọn.'}
            </p>
          </div>

          {/* Report Format */}
          <div className="space-y-2">
            <Label htmlFor="report-format">Định dạng</Label>
            <Select
              value={reportFormat}
              onValueChange={(value) => setReportFormat(value as ReportFormat)}
            >
              <SelectTrigger id="report-format">
                <SelectValue placeholder="Chọn định dạng" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ReportFormatLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    <div className="flex items-center gap-2">
                      {value === 'PDF' ? (
                        <FileBarChart className="h-4 w-4 text-red-500" />
                      ) : (
                        <FileSpreadsheet className="h-4 w-4 text-green-500" />
                      )}
                      {label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Project Selector */}
          <div className="space-y-2">
            <Label htmlFor="project">Dự án {reportType === 'WEEKLY_PER_PROJECT' ? '(bắt buộc)' : '(tùy chọn)'}</Label>
            <Select
              value={selectedProjectId}
              onValueChange={setSelectedProjectId}
              disabled={projectsLoading}
            >
              <SelectTrigger id="project">
                <SelectValue placeholder="Chọn dự án" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả dự án</SelectItem>
                {projectsData?.projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    <div className="flex flex-col">
                      <span>{project.name}</span>
                      <span className="text-xs text-muted-foreground">{project.code}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Chọn một dự án cụ thể hoặc để trống để tạo báo cáo tổng hợp tất cả.
            </p>
          </div>

          {/* Date Range (for Custom type) */}
          {(reportType === 'CUSTOM' || reportType === 'WEEKLY_PER_PROJECT') && (
            <div className="space-y-2">
              <Label>Khoảng thời gian</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !dateRange && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, 'dd/MM/yyyy', { locale: vi })} -{' '}
                          {format(dateRange.to, 'dd/MM/yyyy', { locale: vi })}
                        </>
                      ) : (
                        format(dateRange.from, 'dd/MM/yyyy', { locale: vi })
                      )
                    ) : (
                      <span>Chọn khoảng thời gian</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    locale={vi}
                  />
                </PopoverContent>
              </Popover>
              {!isFormValid && reportType === 'CUSTOM' && (
                <p className="text-sm text-destructive">
                  Vui lòng chọn khoảng thời gian cho báo cáo tùy chọn.
                </p>
              )}
            </div>
          )}
          {reportType === 'WEEKLY_PER_PROJECT' && selectedProjectId === 'all' && (
            <p className="text-sm text-destructive">Hãy chọn dự án để tạo báo cáo tuần.</p>
          )}

          {/* Generate Button */}
          <div className="pt-4">
            <Button
              onClick={handleGenerateReport}
              disabled={!isFormValid || generateReport.isPending}
              className="w-full"
              size="lg"
            >
              {generateReport.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang tạo báo cáo...
                </>
              ) : (
                <>
                  {reportFormat === 'PDF' ? (
                    <FileBarChart className="mr-2 h-4 w-4" />
                  ) : (
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                  )}
                  Tạo báo cáo
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-3 max-w-4xl">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Báo cáo tuần</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Tổng hợp công việc, tiến độ và vấn đề trong 7 ngày qua. Phù hợp cho meeting hàng tuần.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Báo cáo tháng</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Phân tích chi tiết hoạt động trong tháng. Bao gồm thống kê tasks, milestone và nguồn lực.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Báo cáo tùy chọn</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Tạo báo cáo theo khoảng thời gian bất kỳ. Linh hoạt cho các nhu cầu đặc biệt.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
