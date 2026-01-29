'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useProject } from '@/hooks/use-projects';
import { useAuth } from '@/hooks/use-auth';
import { UserRole, PipelineDecision, ProjectLifecycleLabels, ProjectLifecycle } from '@/types';
import { PipelineSaleForm } from '@/components/sales-pipeline/pipeline-sale-form';
import { PipelinePmForm } from '@/components/sales-pipeline/pipeline-pm-form';
import { PipelineProfitCalculator } from '@/components/sales-pipeline/pipeline-profit-calculator';
import { PipelineWeeklyNotes } from '@/components/sales-pipeline/pipeline-weekly-notes';
import { PipelineDecisionPanel } from '@/components/sales-pipeline/pipeline-decision-panel';

const STAGE_FLOW: ProjectLifecycle[] = [
  ProjectLifecycle.LEAD,
  ProjectLifecycle.QUALIFIED,
  ProjectLifecycle.EVALUATION,
  ProjectLifecycle.NEGOTIATION,
  ProjectLifecycle.WON,
];

const STAGE_COLORS: Record<string, string> = {
  LEAD: 'bg-slate-400',
  QUALIFIED: 'bg-blue-500',
  EVALUATION: 'bg-amber-500',
  NEGOTIATION: 'bg-violet-500',
  WON: 'bg-emerald-500',
  LOST: 'bg-rose-500',
};

const DECISION_BADGE: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: 'bg-amber-500/10', text: 'text-amber-600' },
  ACCEPTED: { bg: 'bg-emerald-500/10', text: 'text-emerald-600' },
  DECLINED: { bg: 'bg-rose-500/10', text: 'text-rose-600' },
};

export default function PipelineDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = params.id as string;
  const { data: pipeline, isLoading } = useProject(id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-9 w-9 bg-muted rounded-lg animate-pulse" />
          <div className="space-y-2">
            <div className="h-6 w-48 bg-muted rounded-md animate-pulse" />
            <div className="h-4 w-32 bg-muted rounded-md animate-pulse" />
          </div>
        </div>
        <div className="h-2 bg-muted rounded-full animate-pulse" />
        <div className="h-[500px] bg-muted/30 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!pipeline) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground text-[15px]">Pipeline not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          Quay lại
        </Button>
      </div>
    );
  }

  const isDecided = pipeline.decision !== PipelineDecision.PENDING;
  const isNVKD = user?.role === UserRole.NVKD;
  const isPMOrAdmin = user?.role && [UserRole.PM, UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(user.role);

  const saleReadOnly = isDecided || !isNVKD;
  const pmReadOnly = isDecided || !isPMOrAdmin;

  const decisionInfo = DECISION_BADGE[pipeline.decision] || DECISION_BADGE.PENDING;
  const currentStageIdx = STAGE_FLOW.indexOf(pipeline.lifecycle as ProjectLifecycle);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-lg shrink-0 mt-0.5"
          onClick={() => router.push('/dashboard/sales-pipeline')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-bold text-foreground tracking-tight truncate">
              {pipeline.name}
            </h1>
            <span className={cn(
              'shrink-0 px-2.5 py-0.5 rounded-md text-[11px] font-bold',
              decisionInfo.bg, decisionInfo.text
            )}>
              {pipeline.decision === 'ACCEPTED' ? 'Accepted' : pipeline.decision === 'DECLINED' ? 'Declined' : 'Pending'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[12px] text-muted-foreground">
            <span>NVKD: <span className="font-medium text-foreground/80">{pipeline.nvkd?.name ?? '—'}</span></span>
            {pipeline.pm && (
              <>
                <span className="text-border">|</span>
                <span>PM: <span className="font-medium text-foreground/80">{pipeline.pm.name}</span></span>
              </>
            )}
            {pipeline.dealCode && (
              <>
                <span className="text-border">|</span>
                <button
                  onClick={() => router.push(`/dashboard/projects/${pipeline.id}`)}
                  className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                >
                  {pipeline.dealCode} <ExternalLink className="h-3 w-3" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stage Progress Flow */}
      {pipeline.lifecycle !== ProjectLifecycle.LOST && (
        <div className="flex items-center gap-1">
          {STAGE_FLOW.map((stage, idx) => {
            const isReached = currentStageIdx >= idx;
            const isCurrent = pipeline.lifecycle === stage;
            const color = STAGE_COLORS[stage];
            return (
              <div key={stage} className="flex items-center gap-1 flex-1">
                <div className="flex-1 relative">
                  <div className={cn(
                    'h-1.5 rounded-full transition-all duration-500',
                    isReached ? color : 'bg-muted'
                  )} />
                  {isCurrent && (
                    <div className={cn(
                      'absolute -top-1 right-0 h-3.5 w-3.5 rounded-full border-2 border-background',
                      color
                    )} />
                  )}
                </div>
                {idx < STAGE_FLOW.length - 1 && <div className="w-1" />}
              </div>
            );
          })}
        </div>
      )}
      {pipeline.lifecycle !== ProjectLifecycle.LOST && (
        <div className="flex items-center gap-1 -mt-4">
          {STAGE_FLOW.map((stage) => (
            <div key={stage} className="flex-1 text-center">
              <span className={cn(
                'text-[10px] font-medium',
                pipeline.lifecycle === stage ? 'text-foreground' : 'text-muted-foreground/60'
              )}>
                {ProjectLifecycleLabels[stage]}
              </span>
            </div>
          ))}
        </div>
      )}
      {pipeline.lifecycle === ProjectLifecycle.LOST && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-500/10">
          <div className="h-2 w-2 rounded-full bg-rose-500" />
          <span className="text-[12px] font-semibold text-rose-600">Lost</span>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start bg-muted/50 p-1 rounded-lg">
          <TabsTrigger value="overview" className="rounded-md text-[13px]">Tổng quan</TabsTrigger>
          <TabsTrigger value="sale" className="rounded-md text-[13px]">Thông tin Sale</TabsTrigger>
          <TabsTrigger value="evaluation" className="rounded-md text-[13px]">Đánh giá PM</TabsTrigger>
          <TabsTrigger value="notes" className="rounded-md text-[13px]">Weekly Notes</TabsTrigger>
          {isPMOrAdmin && <TabsTrigger value="decision" className="rounded-md text-[13px]">Quyết định</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PipelineProfitCalculator pipeline={pipeline} />
            <PipelineWeeklyNotes pipeline={pipeline} readOnly />
          </div>
        </TabsContent>

        <TabsContent value="sale" className="mt-6">
          <div className="max-w-2xl">
            <PipelineSaleForm pipeline={pipeline} readOnly={saleReadOnly} />
          </div>
        </TabsContent>

        <TabsContent value="evaluation" className="mt-6">
          <div className="max-w-2xl">
            <PipelinePmForm pipeline={pipeline} readOnly={pmReadOnly} />
          </div>
        </TabsContent>

        <TabsContent value="notes" className="mt-6">
          <div className="max-w-2xl">
            <PipelineWeeklyNotes pipeline={pipeline} readOnly={isDecided} />
          </div>
        </TabsContent>

        {isPMOrAdmin && (
          <TabsContent value="decision" className="mt-6">
            <div className="max-w-2xl">
              <PipelineDecisionPanel pipeline={pipeline} />
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
