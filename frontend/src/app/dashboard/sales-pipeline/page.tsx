'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, TrendingUp, DollarSign, BarChart3, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PipelineKanbanBoard } from '@/components/sales-pipeline/pipeline-kanban-board';
import { usePipelines, useUpdatePipelineStage, useCreatePipeline } from '@/hooks/use-sales-pipeline';
import { useAuth } from '@/hooks/use-auth';
import { UserRole, PipelineStage } from '@/types';
import type { SalesPipeline } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

function formatCompactValue(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value.toLocaleString('vi-VN');
}

export default function SalesPipelinePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { data, isLoading } = usePipelines({ limit: 200 });
  const updateStage = useUpdatePipelineStage();
  const [search, setSearch] = useState('');

  const pipelines = data?.data ?? [];
  const filtered = search
    ? pipelines.filter((p) =>
        p.projectName.toLowerCase().includes(search.toLowerCase())
      )
    : pipelines;

  const stats = useMemo(() => {
    const totalValue = pipelines.reduce((sum, p) => sum + (p.totalBudget ?? 0), 0);
    const activeCount = pipelines.filter(
      (p) => p.status !== PipelineStage.WON && p.status !== PipelineStage.LOST
    ).length;
    const wonCount = pipelines.filter((p) => p.status === PipelineStage.WON).length;
    const avgMargin = pipelines.filter((p) => p.profitMargin != null).length > 0
      ? pipelines.reduce((sum, p) => sum + (p.profitMargin ?? 0), 0) /
        pipelines.filter((p) => p.profitMargin != null).length
      : 0;
    return { totalValue, activeCount, wonCount, avgMargin };
  }, [pipelines]);

  const handleStageChange = (pipelineId: string, newStage: PipelineStage) => {
    updateStage.mutate({ id: pipelineId, stage: newStage });
  };

  const handlePipelineClick = (pipeline: SalesPipeline) => {
    router.push(`/dashboard/sales-pipeline/${pipeline.id}`);
  };

  const canCreate = user?.role && [UserRole.NVKD, UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(user.role);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Sales Pipeline</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Quản lý pipeline bán hàng theo giai đoạn
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 pl-9"
            />
          </div>
          {canCreate && <CreatePipelineDialog />}
        </div>
      </div>

      {/* Stats Bar */}
      {!isLoading && pipelines.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          <StatCard
            icon={<DollarSign className="h-4 w-4" />}
            label="Tổng giá trị"
            value={`${formatCompactValue(stats.totalValue)} VND`}
            accent="text-blue-600 bg-blue-500/10"
          />
          <StatCard
            icon={<BarChart3 className="h-4 w-4" />}
            label="Đang xử lý"
            value={String(stats.activeCount)}
            accent="text-violet-600 bg-violet-500/10"
          />
          <StatCard
            icon={<Users className="h-4 w-4" />}
            label="Đã thắng"
            value={String(stats.wonCount)}
            accent="text-emerald-600 bg-emerald-500/10"
          />
          <StatCard
            icon={<TrendingUp className="h-4 w-4" />}
            label="Margin TB"
            value={`${stats.avgMargin.toFixed(1)}%`}
            accent={
              stats.avgMargin >= 30
                ? 'text-emerald-600 bg-emerald-500/10'
                : stats.avgMargin >= 15
                  ? 'text-amber-600 bg-amber-500/10'
                  : 'text-rose-600 bg-rose-500/10'
            }
          />
        </div>
      )}

      {/* Kanban Board */}
      <PipelineKanbanBoard
        pipelines={filtered}
        onStageChange={handleStageChange}
        onPipelineClick={handlePipelineClick}
        isLoading={isLoading}
      />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/40 bg-card p-3.5 transition-colors hover:bg-card/80">
      <div className={`flex items-center justify-center h-9 w-9 rounded-lg ${accent}`}>
        {icon}
      </div>
      <div>
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </p>
        <p className="text-[16px] font-bold text-foreground tabular-nums tracking-tight">
          {value}
        </p>
      </div>
    </div>
  );
}

function CreatePipelineDialog() {
  const [open, setOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const create = useCreatePipeline();

  const handleCreate = () => {
    if (!projectName.trim()) return;
    create.mutate(
      { projectName: projectName.trim() },
      {
        onSuccess: () => {
          setProjectName('');
          setOpen(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          Tạo Pipeline
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tạo Pipeline mới</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="new-project-name">Tên dự án *</Label>
            <Input
              id="new-project-name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Nhập tên dự án..."
              className="mt-1.5"
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreate} disabled={!projectName.trim() || create.isPending}>
              {create.isPending ? 'Đang tạo...' : 'Tạo'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
