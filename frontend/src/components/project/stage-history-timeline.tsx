'use client';

import { History, ArrowRight, Loader2, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useStageHistory } from '@/hooks/use-stage-history';
import { ProjectLifecycleLabels } from '@/lib/api/projects';

interface StageHistoryTimelineProps {
  projectId: string;
}

export function StageHistoryTimeline({ projectId }: StageHistoryTimelineProps) {
  const { data: history, isLoading } = useStageHistory(projectId);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStageLabel = (stage: string) => {
    return ProjectLifecycleLabels[stage as keyof typeof ProjectLifecycleLabels] || stage;
  };

  if (isLoading) {
    return (
      <Card className="rounded-2xl border-border/50 shadow-apple-sm">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-border/50 shadow-apple-sm">
      <CardHeader>
        <CardTitle className="text-subheadline font-semibold">
          Lịch sử giai đoạn
        </CardTitle>
      </CardHeader>
      <CardContent>
        {(!history || history.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="h-12 w-12 rounded-2xl bg-surface flex items-center justify-center mb-3">
              <History className="h-6 w-6 text-muted-foreground/50" />
            </div>
            <p className="text-callout text-muted-foreground">
              Chưa có thay đổi giai đoạn nào
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-4 bottom-4 w-px bg-border/50" />

            <div className="space-y-4">
              {history.map((entry, index) => {
                const isStageChange = entry.fromStage !== entry.toStage;
                const isProgressOnly = !isStageChange;

                return (
                  <div key={entry.id} className="relative pl-10">
                    {/* Timeline dot */}
                    <div
                      className={cn(
                        'absolute left-2.5 top-2 h-3 w-3 rounded-full border-2 border-background',
                        index === 0
                          ? 'bg-primary'
                          : isStageChange
                            ? 'bg-[#0071e3] dark:bg-[#0a84ff]'
                            : 'bg-muted-foreground/30'
                      )}
                    />

                    <div className="p-3 rounded-xl bg-surface/50">
                      {/* Stage change */}
                      {isStageChange && (
                        <div className="flex items-center gap-2 flex-wrap">
                          {entry.fromStage && (
                            <span className="px-2.5 py-1 rounded-lg bg-muted text-footnote font-medium">
                              {getStageLabel(entry.fromStage)}
                            </span>
                          )}
                          <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-footnote font-medium">
                            {getStageLabel(entry.toStage)}
                          </span>
                        </div>
                      )}

                      {/* Progress only change */}
                      {isProgressOnly && (
                        <div className="flex items-center gap-2">
                          <span className="text-footnote font-medium">
                            {getStageLabel(entry.toStage)}
                          </span>
                          <span className="text-footnote text-muted-foreground tabular-nums">
                            {entry.fromProgress}%
                          </span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <span className="text-footnote font-medium tabular-nums text-primary">
                            {entry.toProgress}%
                          </span>
                        </div>
                      )}

                      {/* Reason */}
                      {entry.reason && (
                        <p className="text-footnote text-muted-foreground mt-2 pl-1 border-l-2 border-border/50 ml-1">
                          {entry.reason}
                        </p>
                      )}

                      {/* Meta */}
                      <div className="flex items-center gap-3 mt-2 text-caption text-muted-foreground/70">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {entry.changedBy.name}
                        </div>
                        <span>{formatDate(entry.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
