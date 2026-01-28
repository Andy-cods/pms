'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePipeline } from '@/hooks/use-sales-pipeline';
import { useAuth } from '@/hooks/use-auth';
import { UserRole, PipelineDecision, PipelineStageLabels } from '@/types';
import { PipelineSaleForm } from '@/components/sales-pipeline/pipeline-sale-form';
import { PipelinePmForm } from '@/components/sales-pipeline/pipeline-pm-form';
import { PipelineProfitCalculator } from '@/components/sales-pipeline/pipeline-profit-calculator';
import { PipelineWeeklyNotes } from '@/components/sales-pipeline/pipeline-weekly-notes';
import { PipelineDecisionPanel } from '@/components/sales-pipeline/pipeline-decision-panel';

export default function PipelineDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = params.id as string;
  const { data: pipeline, isLoading } = usePipeline(id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 bg-secondary rounded animate-pulse" />
        <div className="h-[600px] bg-secondary/30 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!pipeline) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">Pipeline not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          Quay lại
        </Button>
      </div>
    );
  }

  const isDecided = pipeline.decision !== PipelineDecision.PENDING;
  const isNVKD = user?.role === UserRole.NVKD;
  const isPMOrAdmin = user?.role && [UserRole.PM, UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(user.role);

  // NVKD can edit sale fields if pending; PM can edit eval fields if pending
  const saleReadOnly = isDecided || !isNVKD;
  const pmReadOnly = isDecided || !isPMOrAdmin;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/sales-pipeline')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">{pipeline.projectName}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[12px] text-muted-foreground">
              Stage: {PipelineStageLabels[pipeline.status]}
            </span>
            <span className="text-[12px] text-muted-foreground">
              NVKD: {pipeline.nvkd.name}
            </span>
            {pipeline.pm && (
              <span className="text-[12px] text-muted-foreground">
                PM: {pipeline.pm.name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="sale">Thông tin Sale</TabsTrigger>
          <TabsTrigger value="evaluation">Đánh giá PM</TabsTrigger>
          <TabsTrigger value="notes">Weekly Notes</TabsTrigger>
          {isPMOrAdmin && <TabsTrigger value="decision">Quyết định</TabsTrigger>}
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
