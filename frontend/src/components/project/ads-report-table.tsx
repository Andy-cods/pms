'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAdsReports } from '@/hooks/use-ads-reports';
import {
  AdsPlatformLabels,
  AdsReportPeriodLabels,
  type AdsPlatform,
  type AdsReportPeriod,
  type AdsReportQuery,
} from '@/lib/api/ads-reports';

interface AdsReportTableProps {
  projectId: string;
}

const formatVND = (value: number) => value.toLocaleString('vi-VN') + ' đ';

export function AdsReportTable({ projectId }: AdsReportTableProps) {
  const [platform, setPlatform] = useState<AdsPlatform | 'ALL'>('ALL');
  const [period, setPeriod] = useState<AdsReportPeriod | 'ALL'>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const query: AdsReportQuery = {};
  if (platform !== 'ALL') query.platform = platform;
  if (period !== 'ALL') query.period = period;
  if (startDate) query.startDate = startDate;
  if (endDate) query.endDate = endDate;

  const { data: reports, isLoading } = useAdsReports(projectId, query);

  return (
    <Card className="rounded-2xl border-border/50 shadow-apple-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-subheadline font-semibold">
            Chi tiết báo cáo
            {reports && <span className="text-muted-foreground font-normal ml-2">({reports.length})</span>}
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={platform} onValueChange={(v) => setPlatform(v as AdsPlatform | 'ALL')}>
              <SelectTrigger className="h-8 text-xs rounded-lg w-[130px]">
                <SelectValue placeholder="Nền tảng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả</SelectItem>
                {(Object.keys(AdsPlatformLabels) as AdsPlatform[]).map((p) => (
                  <SelectItem key={p} value={p}>{AdsPlatformLabels[p]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={period} onValueChange={(v) => setPeriod(v as AdsReportPeriod | 'ALL')}>
              <SelectTrigger className="h-8 text-xs rounded-lg w-[130px]">
                <SelectValue placeholder="Kỳ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả</SelectItem>
                {(Object.keys(AdsReportPeriodLabels) as AdsReportPeriod[]).map((p) => (
                  <SelectItem key={p} value={p}>{AdsReportPeriodLabels[p]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-8 text-xs rounded-lg w-[130px]"
              placeholder="Từ ngày"
            />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-8 text-xs rounded-lg w-[130px]"
              placeholder="Đến ngày"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && <Skeleton className="h-40 w-full rounded-xl" />}
        {!isLoading && (!reports || reports.length === 0) && (
          <p className="text-footnote text-muted-foreground py-8 text-center">
            Chưa có báo cáo quảng cáo.
          </p>
        )}
        {!isLoading && reports && reports.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left py-2 pr-3 font-medium text-xs">Ngày</th>
                  <th className="text-left py-2 px-2 font-medium text-xs">Kỳ</th>
                  <th className="text-left py-2 px-2 font-medium text-xs">Nền tảng</th>
                  <th className="text-left py-2 px-2 font-medium text-xs">Campaign</th>
                  <th className="text-right py-2 px-2 font-medium text-xs">Impr.</th>
                  <th className="text-right py-2 px-2 font-medium text-xs">Clicks</th>
                  <th className="text-right py-2 px-2 font-medium text-xs">CTR</th>
                  <th className="text-right py-2 px-2 font-medium text-xs">CPC</th>
                  <th className="text-right py-2 px-2 font-medium text-xs">Conv.</th>
                  <th className="text-right py-2 px-2 font-medium text-xs">ROAS</th>
                  <th className="text-right py-2 px-2 font-medium text-xs">Chi tiêu</th>
                  <th className="text-center py-2 pl-2 font-medium text-xs">Nguồn</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id} className="border-b border-border/50 hover:bg-surface/50">
                    <td className="py-2.5 pr-3 text-xs tabular-nums">
                      {new Date(r.reportDate).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="py-2.5 px-2 text-xs">
                      {AdsReportPeriodLabels[r.period]}
                    </td>
                    <td className="py-2.5 px-2 text-xs font-medium">
                      {AdsPlatformLabels[r.platform]}
                    </td>
                    <td className="py-2.5 px-2 text-xs text-muted-foreground max-w-[120px] truncate">
                      {r.campaignName || '—'}
                    </td>
                    <td className="py-2.5 px-2 text-xs text-right tabular-nums">
                      {r.impressions.toLocaleString('vi-VN')}
                    </td>
                    <td className="py-2.5 px-2 text-xs text-right tabular-nums">
                      {r.clicks.toLocaleString('vi-VN')}
                    </td>
                    <td className="py-2.5 px-2 text-xs text-right tabular-nums">
                      {r.ctr.toFixed(2)}%
                    </td>
                    <td className="py-2.5 px-2 text-xs text-right tabular-nums">
                      {formatVND(r.cpc)}
                    </td>
                    <td className="py-2.5 px-2 text-xs text-right tabular-nums">
                      {r.conversions.toLocaleString('vi-VN')}
                    </td>
                    <td className="py-2.5 px-2 text-xs text-right tabular-nums">
                      {r.roas.toFixed(2)}x
                    </td>
                    <td className="py-2.5 px-2 text-xs text-right tabular-nums font-medium">
                      {formatVND(r.adSpend)}
                    </td>
                    <td className="py-2.5 pl-2 text-center">
                      <Badge
                        variant={r.source === 'ZAPIER' ? 'default' : 'secondary'}
                        className={`text-[10px] ${
                          r.source === 'ZAPIER'
                            ? 'bg-blue-500/15 text-blue-700 dark:text-blue-400 hover:bg-blue-500/15'
                            : 'bg-muted text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {r.source === 'ZAPIER' ? 'Zapier' : 'Manual'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
