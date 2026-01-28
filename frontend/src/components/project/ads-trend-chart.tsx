'use client';

import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdsReports } from '@/hooks/use-ads-reports';
import type { AdsReportQuery } from '@/lib/api/ads-reports';

interface AdsTrendChartProps {
  projectId: string;
  query?: AdsReportQuery;
}

type ChartMode = 'impressions' | 'ctr' | 'conversions';

const modeConfig: Record<ChartMode, { label: string; lines: { key: string; name: string; color: string }[] }> = {
  impressions: {
    label: 'Impressions / Clicks',
    lines: [
      { key: 'impressions', name: 'Impressions', color: '#0071e3' },
      { key: 'clicks', name: 'Clicks', color: '#34c759' },
    ],
  },
  ctr: {
    label: 'CTR / CPC',
    lines: [
      { key: 'ctr', name: 'CTR (%)', color: '#5856d6' },
      { key: 'cpc', name: 'CPC (đ)', color: '#ff9f0a' },
    ],
  },
  conversions: {
    label: 'Conversions / ROAS',
    lines: [
      { key: 'conversions', name: 'Conversions', color: '#ff3b30' },
      { key: 'roas', name: 'ROAS', color: '#30b0c7' },
    ],
  },
};

export function AdsTrendChart({ projectId, query }: AdsTrendChartProps) {
  const [mode, setMode] = useState<ChartMode>('impressions');
  const { data: reports, isLoading } = useAdsReports(projectId, query);

  const chartData = useMemo(() => {
    if (!reports || reports.length === 0) return [];
    return [...reports]
      .sort((a, b) => new Date(a.reportDate).getTime() - new Date(b.reportDate).getTime())
      .map((r) => ({
        date: new Date(r.reportDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
        impressions: r.impressions,
        clicks: r.clicks,
        ctr: r.ctr,
        cpc: r.cpc,
        conversions: r.conversions,
        roas: r.roas,
      }));
  }, [reports]);

  if (isLoading) {
    return (
      <Card className="rounded-2xl border-border/50 shadow-apple-sm">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  const config = modeConfig[mode];

  return (
    <Card className="rounded-2xl border-border/50 shadow-apple-sm">
      <CardHeader className="pb-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <CardTitle className="text-subheadline font-semibold">Xu hướng Ads</CardTitle>
        <div className="flex gap-1">
          {(Object.keys(modeConfig) as ChartMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                mode === m
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-surface text-muted-foreground hover:text-foreground'
              }`}
            >
              {modeConfig[m].label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
            Chưa có dữ liệu
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              {config.lines.map((line) => (
                <Line
                  key={line.key}
                  type="monotone"
                  dataKey={line.key}
                  name={line.name}
                  stroke={line.color}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
