'use client';

import { Eye, MousePointerClick, Percent, DollarSign, Target, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdsReportSummary } from '@/hooks/use-ads-reports';
import type { AdsReportQuery } from '@/lib/api/ads-reports';

interface AdsKpiCardsProps {
  projectId: string;
  query?: AdsReportQuery;
}

const formatNumber = (value: number) => value.toLocaleString('vi-VN');
const formatCurrency = (value: number) => `${value.toLocaleString('vi-VN')} đ`;
const formatPercent = (value: number) => `${value.toFixed(2)}%`;

const kpiConfig = [
  { key: 'totalImpressions', label: 'Impressions', icon: Eye, format: formatNumber, color: 'text-[#0071e3] dark:text-[#0a84ff]' },
  { key: 'totalClicks', label: 'Clicks', icon: MousePointerClick, format: formatNumber, color: 'text-[#34c759] dark:text-[#30d158]' },
  { key: 'avgCtr', label: 'CTR', icon: Percent, format: formatPercent, color: 'text-[#5856d6] dark:text-[#5e5ce6]' },
  { key: 'avgCpc', label: 'CPC', icon: DollarSign, format: formatCurrency, color: 'text-[#ff9f0a] dark:text-[#ff9f0a]' },
  { key: 'totalConversions', label: 'Conversions', icon: Target, format: formatNumber, color: 'text-[#ff3b30] dark:text-[#ff453a]' },
  { key: 'avgRoas', label: 'ROAS', icon: TrendingUp, format: (v: number) => `${v.toFixed(2)}x`, color: 'text-[#30b0c7] dark:text-[#5ac8fa]' },
] as const;

export function AdsKpiCards({ projectId, query }: AdsKpiCardsProps) {
  const { data: summary, isLoading } = useAdsReportSummary(projectId, query);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="rounded-2xl border-border/50 shadow-apple-sm">
            <CardContent className="pt-4 pb-3">
              <Skeleton className="h-4 w-4 mb-2" />
              <Skeleton className="h-6 w-16 mb-1" />
              <Skeleton className="h-3 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {kpiConfig.map(({ key, label, icon: Icon, format, color }) => {
        const value = summary ? summary[key as keyof typeof summary] as number : 0;
        return (
          <Card key={key} className="rounded-2xl border-border/50 shadow-apple-sm">
            <CardContent className="pt-4 pb-3">
              <Icon className="h-4 w-4 text-muted-foreground mb-2" />
              <div className={`text-lg font-semibold tabular-nums ${color}`}>
                {format(value)}
              </div>
              <div className="text-footnote text-muted-foreground">{label}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
