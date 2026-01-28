'use client';

import { Calendar, Layers, Megaphone, Palette, FileText, Eye, MousePointerClick, Users, Package, RotateCcw, Clock, PenLine, BarChart3 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  type MediaPlan,
  type MediaPlanItem,
  type MediaPlanType,
  MediaPlanStatusLabels,
  MediaPlanStatusColors,
  MediaPlanTypeLabels,
  MediaPlanTypeColors,
  formatVNDCompact,
  MONTHS,
  MEDIA_CHANNELS_BY_TYPE,
} from '@/lib/api/media-plans';

// ============================================
// TYPE IDENTITY CONFIG
// ============================================

const TYPE_ACCENT_COLORS: Record<MediaPlanType, string> = {
  ADS: 'border-l-[#007aff] dark:border-l-[#0a84ff]',
  DESIGN: 'border-l-[#af52de] dark:border-l-[#bf5af2]',
  CONTENT: 'border-l-[#ff9f0a] dark:border-l-[#ffd60a]',
};

const TYPE_BG_WASH: Record<MediaPlanType, string> = {
  ADS: 'bg-[#007aff]/[0.02] dark:bg-[#0a84ff]/[0.03]',
  DESIGN: 'bg-[#af52de]/[0.02] dark:bg-[#bf5af2]/[0.03]',
  CONTENT: 'bg-[#ff9f0a]/[0.02] dark:bg-[#ffd60a]/[0.03]',
};

const TYPE_ICON: Record<MediaPlanType, React.ReactNode> = {
  ADS: <Megaphone className="h-3.5 w-3.5" />,
  DESIGN: <Palette className="h-3.5 w-3.5" />,
  CONTENT: <FileText className="h-3.5 w-3.5" />,
};

const TYPE_ITEM_LABEL: Record<MediaPlanType, string> = {
  ADS: 'kênh',
  DESIGN: 'sản phẩm',
  CONTENT: 'nội dung',
};

const TYPE_PROGRESS_COLOR: Record<MediaPlanType, string> = {
  ADS: 'bg-[#007aff] dark:bg-[#0a84ff]',
  DESIGN: 'bg-[#af52de] dark:bg-[#bf5af2]',
  CONTENT: 'bg-[#ff9f0a] dark:bg-[#ffd60a]',
};

// ============================================
// MAIN CARD COMPONENT
// ============================================

interface MediaPlanCardProps {
  plan: MediaPlan;
  onClick: () => void;
}

export function MediaPlanCard({ plan, onClick }: MediaPlanCardProps) {
  const planType = (plan.type as MediaPlanType) ?? 'ADS';
  const budgetPercent =
    plan.totalBudget > 0
      ? Math.min(100, Math.round((plan.allocatedBudget / plan.totalBudget) * 100))
      : 0;

  const monthLabel = MONTHS.find((m) => m.value === plan.month)?.label ?? `T${plan.month}`;

  return (
    <Card
      className={cn(
        'rounded-2xl border-border/50 shadow-apple-sm hover:shadow-apple transition-all cursor-pointer group',
        'border-l-[3px]',
        TYPE_ACCENT_COLORS[planType],
        TYPE_BG_WASH[planType],
      )}
      onClick={onClick}
    >
      <CardContent className="p-0">
        {/* Zone 1: Header */}
        <div className="px-5 pt-4 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-callout font-semibold truncate group-hover:text-primary transition-colors">
                  {plan.name}
                </h3>
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 flex items-center gap-1',
                    MediaPlanTypeColors[planType] ?? MediaPlanTypeColors.ADS,
                  )}
                >
                  {TYPE_ICON[planType]}
                  {MediaPlanTypeLabels[planType] ?? plan.type}
                </span>
              </div>
              <p className="text-footnote text-muted-foreground mt-0.5">
                {monthLabel}/{plan.year} · v{plan.version}
              </p>
            </div>
            <span
              className={cn(
                'px-2.5 py-0.5 rounded-full text-caption font-medium shrink-0',
                MediaPlanStatusColors[plan.status],
              )}
            >
              {MediaPlanStatusLabels[plan.status]}
            </span>
          </div>
        </div>

        {/* Zone 2: Feature Zone (type-specific) */}
        <div className="px-5 py-3 border-t border-border/30">
          {planType === 'ADS' && <AdsFeatureZone items={plan.items} />}
          {planType === 'DESIGN' && <DesignFeatureZone items={plan.items} />}
          {planType === 'CONTENT' && <ContentFeatureZone items={plan.items} />}
        </div>

        {/* Zone 3: Budget Bar */}
        <div className="px-5 py-3 border-t border-border/30">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-caption text-muted-foreground">Ngân sách</span>
            <span className="text-caption font-medium tabular-nums">
              {formatVNDCompact(plan.allocatedBudget)} / {formatVNDCompact(plan.totalBudget)}
              <span className="text-muted-foreground ml-1">({budgetPercent}%)</span>
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500 ease-out',
                budgetPercent >= 100
                  ? 'bg-[#ff3b30] dark:bg-[#ff453a]'
                  : budgetPercent >= 80
                    ? 'bg-[#ff9f0a] dark:bg-[#ffd60a]'
                    : TYPE_PROGRESS_COLOR[planType],
              )}
              style={{ width: `${budgetPercent}%` }}
            />
          </div>
        </div>

        {/* Zone 4: Footer */}
        <div className="px-5 py-3 border-t border-border/30">
          <div className="flex items-center gap-4 text-caption text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Layers className="h-3 w-3" />
              <span className="tabular-nums">{plan.itemCount} {TYPE_ITEM_LABEL[planType]}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3 w-3" />
              <span>
                {new Date(plan.startDate).toLocaleDateString('vi-VN', {
                  day: '2-digit',
                  month: '2-digit',
                })}
                {' – '}
                {new Date(plan.endDate).toLocaleDateString('vi-VN', {
                  day: '2-digit',
                  month: '2-digit',
                })}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// ADS FEATURE ZONE
// Channel budget distribution bars
// ============================================

function AdsFeatureZone({ items }: { items: MediaPlanItem[] }) {
  if (items.length === 0) {
    return (
      <div className="flex items-center gap-2 text-caption text-muted-foreground py-1">
        <Megaphone className="h-3.5 w-3.5 text-[#007aff]/50" />
        <span>Chưa có kênh quảng cáo</span>
      </div>
    );
  }

  // Group items by channel, sum budget
  const channelBudgets = new Map<string, number>();
  let totalAllocated = 0;
  for (const item of items) {
    const current = channelBudgets.get(item.channel) ?? 0;
    channelBudgets.set(item.channel, current + item.budget);
    totalAllocated += item.budget;
  }

  // Sort by budget desc, take top 4
  const sorted = [...channelBudgets.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const channelColors = ['#007aff', '#5856d6', '#34c759', '#ff9f0a', '#ff3b30'];

  // Summary metrics
  const totalReach = items.reduce((s, i) => s + (i.targetReach ?? 0), 0);
  const totalClicks = items.reduce((s, i) => s + (i.targetClicks ?? 0), 0);

  return (
    <div className="space-y-2.5">
      {/* Channel budget bars */}
      <div className="space-y-1.5">
        {sorted.map(([channel, budget], idx) => {
          const pct = totalAllocated > 0 ? (budget / totalAllocated) * 100 : 0;
          const label = MEDIA_CHANNELS_BY_TYPE.ADS.find((c) => c.value === channel)?.label ?? channel;
          return (
            <div key={channel} className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground w-20 truncate">{label}</span>
              <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: channelColors[idx % channelColors.length],
                    opacity: 0.8,
                  }}
                />
              </div>
              <span className="text-[10px] tabular-nums text-muted-foreground w-8 text-right">
                {Math.round(pct)}%
              </span>
            </div>
          );
        })}
      </div>

      {/* Quick metrics */}
      <div className="flex items-center gap-3 pt-0.5">
        {totalReach > 0 && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Eye className="h-3 w-3 text-[#007aff]/60" />
            <span className="tabular-nums">{(totalReach / 1000).toFixed(0)}K reach</span>
          </div>
        )}
        {totalClicks > 0 && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <MousePointerClick className="h-3 w-3 text-[#5856d6]/60" />
            <span className="tabular-nums">{(totalClicks / 1000).toFixed(0)}K clicks</span>
          </div>
        )}
        {items.reduce((s, i) => s + (i.targetLeads ?? 0), 0) > 0 && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Users className="h-3 w-3 text-[#34c759]/60" />
            <span className="tabular-nums">{items.reduce((s, i) => s + (i.targetLeads ?? 0), 0).toLocaleString()} leads</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// DESIGN FEATURE ZONE
// Product count ring + revision/deadline stats
// ============================================

function DesignFeatureZone({ items }: { items: MediaPlanItem[] }) {
  if (items.length === 0) {
    return (
      <div className="flex items-center gap-2 text-caption text-muted-foreground py-1">
        <Palette className="h-3.5 w-3.5 text-[#af52de]/50" />
        <span>Chưa có sản phẩm thiết kế</span>
      </div>
    );
  }

  const totalProducts = items.reduce((s, i) => s + (i.targetReach ?? 0), 0);
  const avgRevisions = items.length > 0
    ? items.reduce((s, i) => s + (i.targetClicks ?? 0), 0) / items.length
    : 0;
  const avgDays = items.length > 0
    ? items.reduce((s, i) => s + (i.targetLeads ?? 0), 0) / items.length
    : 0;

  // Group by channel (design category)
  const channelCounts = new Map<string, number>();
  for (const item of items) {
    channelCounts.set(item.channel, (channelCounts.get(item.channel) ?? 0) + (item.targetReach ?? 0));
  }

  return (
    <div className="flex items-center gap-4">
      {/* Progress ring SVG */}
      <div className="relative flex-shrink-0">
        <svg width="52" height="52" viewBox="0 0 52 52" className="transform -rotate-90">
          <circle
            cx="26" cy="26" r="22"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-secondary"
          />
          {/* Segments for each channel */}
          {(() => {
            if (totalProducts === 0) return null;
            const ringColors = ['#af52de', '#bf5af2', '#da8fff', '#5856d6'];
            const circumference = 2 * Math.PI * 22;
            let offset = 0;
            return [...channelCounts.entries()].map(([channel, count], idx) => {
              const pct = count / totalProducts;
              const dashLen = pct * circumference;
              const el = (
                <circle
                  key={channel}
                  cx="26" cy="26" r="22"
                  fill="none"
                  stroke={ringColors[idx % ringColors.length]}
                  strokeWidth="3"
                  strokeDasharray={`${dashLen} ${circumference - dashLen}`}
                  strokeDashoffset={-offset}
                  strokeLinecap="round"
                  className="opacity-80"
                />
              );
              offset += dashLen;
              return el;
            });
          })()}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold tabular-nums text-[#af52de] dark:text-[#bf5af2]">
            {totalProducts}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="flex-1 space-y-1.5">
        <div className="flex items-center gap-1.5 text-[11px]">
          <Package className="h-3 w-3 text-[#af52de]/60" />
          <span className="font-medium">{totalProducts} sản phẩm</span>
          <span className="text-muted-foreground">· {items.length} hạng mục</span>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <RotateCcw className="h-3 w-3" />
            <span className="tabular-nums">{avgRevisions.toFixed(1)} revisions</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span className="tabular-nums">~{Math.round(avgDays)} ngày</span>
          </div>
        </div>
        {/* Mini channel chips */}
        <div className="flex flex-wrap gap-1 pt-0.5">
          {[...channelCounts.entries()].slice(0, 3).map(([channel, count]) => {
            const label = MEDIA_CHANNELS_BY_TYPE.DESIGN.find((c) => c.value === channel)?.label ?? channel;
            return (
              <span
                key={channel}
                className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-[#af52de]/10 text-[#af52de] dark:bg-[#bf5af2]/15 dark:text-[#bf5af2]"
              >
                {label} ({count})
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================
// CONTENT FEATURE ZONE
// Post frequency bars + channel summary
// ============================================

function ContentFeatureZone({ items }: { items: MediaPlanItem[] }) {
  if (items.length === 0) {
    return (
      <div className="flex items-center gap-2 text-caption text-muted-foreground py-1">
        <FileText className="h-3.5 w-3.5 text-[#ff9f0a]/50" />
        <span>Chưa có nội dung</span>
      </div>
    );
  }

  const totalPosts = items.reduce((s, i) => s + (i.targetReach ?? 0), 0);
  const totalViews = items.reduce((s, i) => s + (i.targetClicks ?? 0), 0);
  const avgFrequency = items.length > 0
    ? items.reduce((s, i) => s + (i.targetCPL ?? 0), 0) / items.length
    : 0;

  // Group by channel for frequency bars
  const channelData = items.map((item) => ({
    channel: item.channel,
    posts: item.targetReach ?? 0,
    frequency: item.targetCPL ?? 0,
  }));

  const maxPosts = Math.max(...channelData.map((d) => d.posts), 1);
  const barColors = ['#ff9f0a', '#ff6723', '#ffd60a', '#ff3b30', '#34c759'];

  return (
    <div className="space-y-2.5">
      {/* Frequency bars (vertical mini chart) */}
      <div className="flex items-end gap-1 h-8">
        {channelData.slice(0, 7).map((d, idx) => {
          const height = (d.posts / maxPosts) * 100;
          const label = MEDIA_CHANNELS_BY_TYPE.CONTENT.find((c) => c.value === d.channel)?.label ?? d.channel;
          return (
            <div key={`${d.channel}-${idx}`} className="flex-1 flex flex-col items-center gap-0.5" title={`${label}: ${d.posts} bài`}>
              <div
                className="w-full rounded-t transition-all duration-500"
                style={{
                  height: `${Math.max(height, 8)}%`,
                  backgroundColor: barColors[idx % barColors.length],
                  opacity: 0.7,
                  minHeight: '3px',
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Labels below bars */}
      <div className="flex items-center gap-1">
        {channelData.slice(0, 7).map((d, idx) => {
          const label = MEDIA_CHANNELS_BY_TYPE.CONTENT.find((c) => c.value === d.channel)?.label ?? d.channel;
          // Shorten label to first word
          const short = label.split(/[\s/]/)[0];
          return (
            <span key={`label-${d.channel}-${idx}`} className="flex-1 text-[8px] text-muted-foreground text-center truncate">
              {short}
            </span>
          );
        })}
      </div>

      {/* Summary stats */}
      <div className="flex items-center gap-3 pt-0.5">
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <PenLine className="h-3 w-3 text-[#ff9f0a]/60" />
          <span className="tabular-nums font-medium">{totalPosts} bài viết</span>
        </div>
        {totalViews > 0 && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Eye className="h-3 w-3 text-[#ff6723]/60" />
            <span className="tabular-nums">{(totalViews / 1000).toFixed(0)}K views</span>
          </div>
        )}
        {avgFrequency > 0 && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <BarChart3 className="h-3 w-3 text-[#ffd60a]/60" />
            <span className="tabular-nums">{avgFrequency.toFixed(1)} bài/tuần</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// SKELETON
// ============================================

export function MediaPlanCardSkeleton() {
  return (
    <Card className="rounded-2xl border-border/50 shadow-apple-sm border-l-[3px] border-l-muted">
      <CardContent className="p-0">
        <div className="px-5 pt-4 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <div className="h-5 w-40 rounded-md bg-muted animate-pulse" />
              <div className="h-4 w-24 rounded-md bg-muted animate-pulse" />
            </div>
            <div className="h-5 w-16 rounded-full bg-muted animate-pulse" />
          </div>
        </div>
        <div className="px-5 py-3 border-t border-border/30">
          <div className="space-y-2">
            <div className="h-3 w-full rounded bg-muted animate-pulse" />
            <div className="h-3 w-3/4 rounded bg-muted animate-pulse" />
            <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
          </div>
        </div>
        <div className="px-5 py-3 border-t border-border/30 space-y-1.5">
          <div className="flex justify-between">
            <div className="h-3 w-16 rounded-md bg-muted animate-pulse" />
            <div className="h-3 w-28 rounded-md bg-muted animate-pulse" />
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted animate-pulse" />
        </div>
        <div className="px-5 py-3 border-t border-border/30">
          <div className="flex gap-4">
            <div className="h-3 w-16 rounded-md bg-muted animate-pulse" />
            <div className="h-3 w-24 rounded-md bg-muted animate-pulse" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
