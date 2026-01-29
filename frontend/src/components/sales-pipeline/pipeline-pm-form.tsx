'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calculator, UserCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Project } from '@/types';
import { useEvaluateProject } from '@/hooks/use-projects';

const pmFormSchema = z.object({
  pmId: z.string().optional(),
  plannerId: z.string().optional(),
  costNSQC: z.coerce.number().min(0).optional(),
  costDesign: z.coerce.number().min(0).optional(),
  costMedia: z.coerce.number().min(0).optional(),
  costKOL: z.coerce.number().min(0).optional(),
  costOther: z.coerce.number().min(0).optional(),
  clientTier: z.enum(['A', 'B', 'C', 'D']).optional(),
  marketSize: z.string().optional(),
  competitionLevel: z.string().optional(),
  productUSP: z.string().optional(),
  averageScore: z.coerce.number().min(0).max(10).optional(),
  audienceSize: z.string().optional(),
  productLifecycle: z.string().optional(),
  scalePotential: z.string().optional(),
});

type PmFormValues = z.infer<typeof pmFormSchema>;

interface PipelinePmFormProps {
  pipeline: Project;
  readOnly?: boolean;
}

export function PipelinePmForm({ pipeline, readOnly = false }: PipelinePmFormProps) {
  const evaluate = useEvaluateProject();

  const form = useForm<PmFormValues>({
    resolver: zodResolver(pmFormSchema) as any,
    defaultValues: {
      pmId: pipeline.pmId ?? '',
      plannerId: pipeline.plannerId ?? '',
      costNSQC: pipeline.costNSQC ?? undefined,
      costDesign: pipeline.costDesign ?? undefined,
      costMedia: pipeline.costMedia ?? undefined,
      costKOL: pipeline.costKOL ?? undefined,
      costOther: pipeline.costOther ?? undefined,
      clientTier: (pipeline.clientTier as 'A' | 'B' | 'C' | 'D') ?? undefined,
      marketSize: pipeline.marketSize ?? '',
      competitionLevel: pipeline.competitionLevel ?? '',
      productUSP: pipeline.productUSP ?? '',
      averageScore: pipeline.averageScore ?? undefined,
      audienceSize: pipeline.audienceSize ?? '',
      productLifecycle: pipeline.productLifecycle ?? '',
      scalePotential: pipeline.scalePotential ?? '',
    },
  });

  const onSubmit = (values: PmFormValues) => {
    evaluate.mutate({ id: pipeline.id, input: values });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      {/* Cost Structure */}
      <FormSection icon={<Calculator className="h-3.5 w-3.5" />} title="Chi phí nội bộ (COGS)">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="costNSQC">Chi phí NSQC</Label>
            <Input id="costNSQC" type="number" {...form.register('costNSQC')} disabled={readOnly} className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="costDesign">Chi phí Design</Label>
            <Input id="costDesign" type="number" {...form.register('costDesign')} disabled={readOnly} className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="costMedia">Chi phí Media</Label>
            <Input id="costMedia" type="number" {...form.register('costMedia')} disabled={readOnly} className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="costKOL">Chi phí KOL</Label>
            <Input id="costKOL" type="number" {...form.register('costKOL')} disabled={readOnly} className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="costOther">Chi phí khác</Label>
            <Input id="costOther" type="number" {...form.register('costOther')} disabled={readOnly} className="mt-1.5" />
          </div>
        </div>
      </FormSection>

      {/* Evaluation */}
      <FormSection icon={<UserCheck className="h-3.5 w-3.5" />} title="Đánh giá khách hàng">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="clientTier">Client Tier</Label>
            <Select
              value={form.watch('clientTier') || ''}
              onValueChange={(val) => form.setValue('clientTier', val as 'A' | 'B' | 'C' | 'D')}
              disabled={readOnly}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Chọn tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A">Tier A (Premium)</SelectItem>
                <SelectItem value="B">Tier B (Standard)</SelectItem>
                <SelectItem value="C">Tier C (Basic)</SelectItem>
                <SelectItem value="D">Tier D (Low)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="averageScore">Điểm trung bình (0-10)</Label>
            <Input id="averageScore" type="number" step="0.1" min="0" max="10" {...form.register('averageScore')} disabled={readOnly} className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="marketSize">Quy mô thị trường</Label>
            <Input id="marketSize" {...form.register('marketSize')} disabled={readOnly} className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="competitionLevel">Mức độ cạnh tranh</Label>
            <Input id="competitionLevel" {...form.register('competitionLevel')} disabled={readOnly} className="mt-1.5" />
          </div>
          <div className="col-span-2">
            <Label htmlFor="productUSP">USP sản phẩm</Label>
            <Textarea id="productUSP" {...form.register('productUSP')} disabled={readOnly} rows={2} className="mt-1.5 resize-none" />
          </div>
          <div>
            <Label htmlFor="audienceSize">Quy mô đối tượng</Label>
            <Input id="audienceSize" {...form.register('audienceSize')} disabled={readOnly} className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="productLifecycle">Vòng đời sản phẩm</Label>
            <Input id="productLifecycle" {...form.register('productLifecycle')} disabled={readOnly} className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="scalePotential">Tiềm năng mở rộng</Label>
            <Input id="scalePotential" {...form.register('scalePotential')} disabled={readOnly} className="mt-1.5" />
          </div>
        </div>
      </FormSection>

      {!readOnly && (
        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={evaluate.isPending}>
            {evaluate.isPending ? 'Đang lưu...' : 'Lưu đánh giá'}
          </Button>
        </div>
      )}
    </form>
  );
}

function FormSection({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/40 bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border/30 bg-muted/20">
        <div className="flex items-center justify-center h-6 w-6 rounded-md bg-primary/10 text-primary">
          {icon}
        </div>
        <h3 className="text-[13px] font-bold text-foreground">{title}</h3>
      </div>
      <div className="px-5 py-4">
        {children}
      </div>
    </div>
  );
}
