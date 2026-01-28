'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';

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

export default function SalesPipelinePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { data, isLoading } = usePipelines({ limit: 200 });
  const updateStage = useUpdatePipelineStage();
  const [search, setSearch] = useState('');

  const pipelines = data?.pipelines ?? [];
  const filtered = search
    ? pipelines.filter((p) =>
        p.projectName.toLowerCase().includes(search.toLowerCase())
      )
    : pipelines;

  const handleStageChange = (pipelineId: string, newStage: PipelineStage) => {
    updateStage.mutate({ id: pipelineId, stage: newStage });
  };

  const handlePipelineClick = (pipeline: SalesPipeline) => {
    router.push(`/dashboard/sales-pipeline/${pipeline.id}`);
  };

  const canCreate = user?.role && [UserRole.NVKD, UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(user.role);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sales Pipeline</h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Quản lý pipeline bán hàng theo giai đoạn
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            placeholder="Tìm kiếm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
          {canCreate && <CreatePipelineDialog />}
        </div>
      </div>

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
        <Button>
          <Plus className="h-4 w-4 mr-2" />
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
