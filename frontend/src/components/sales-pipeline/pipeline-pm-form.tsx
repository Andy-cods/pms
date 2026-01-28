'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { SalesPipeline } from '@/types';
import { useEvaluatePipeline } from '@/hooks/use-sales-pipeline';

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
  pipeline: SalesPipeline;
  readOnly?: boolean;
}

export function PipelinePmForm({ pipeline, readOnly = false }: PipelinePmFormProps) {
  const evaluate = useEvaluatePipeline();

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
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Cost Structure */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Chi phí nội bộ (COGS)</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="costNSQC">Chi phí NSQC</Label>
            <Input id="costNSQC" type="number" {...form.register('costNSQC')} disabled={readOnly} />
          </div>
          <div>
            <Label htmlFor="costDesign">Chi phí Design</Label>
            <Input id="costDesign" type="number" {...form.register('costDesign')} disabled={readOnly} />
          </div>
          <div>
            <Label htmlFor="costMedia">Chi phí Media</Label>
            <Input id="costMedia" type="number" {...form.register('costMedia')} disabled={readOnly} />
          </div>
          <div>
            <Label htmlFor="costKOL">Chi phí KOL</Label>
            <Input id="costKOL" type="number" {...form.register('costKOL')} disabled={readOnly} />
          </div>
          <div>
            <Label htmlFor="costOther">Chi phí khác</Label>
            <Input id="costOther" type="number" {...form.register('costOther')} disabled={readOnly} />
          </div>
        </div>
      </div>

      {/* Evaluation */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Đánh giá khách hàng</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="clientTier">Client Tier</Label>
            <Select
              value={form.watch('clientTier') || ''}
              onValueChange={(val) => form.setValue('clientTier', val as 'A' | 'B' | 'C' | 'D')}
              disabled={readOnly}
            >
              <SelectTrigger>
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
            <Input id="averageScore" type="number" step="0.1" min="0" max="10" {...form.register('averageScore')} disabled={readOnly} />
          </div>
          <div>
            <Label htmlFor="marketSize">Quy mô thị trường</Label>
            <Input id="marketSize" {...form.register('marketSize')} disabled={readOnly} />
          </div>
          <div>
            <Label htmlFor="competitionLevel">Mức độ cạnh tranh</Label>
            <Input id="competitionLevel" {...form.register('competitionLevel')} disabled={readOnly} />
          </div>
          <div className="col-span-2">
            <Label htmlFor="productUSP">USP sản phẩm</Label>
            <Textarea id="productUSP" {...form.register('productUSP')} disabled={readOnly} rows={2} />
          </div>
          <div>
            <Label htmlFor="audienceSize">Quy mô đối tượng</Label>
            <Input id="audienceSize" {...form.register('audienceSize')} disabled={readOnly} />
          </div>
          <div>
            <Label htmlFor="productLifecycle">Vòng đời sản phẩm</Label>
            <Input id="productLifecycle" {...form.register('productLifecycle')} disabled={readOnly} />
          </div>
          <div>
            <Label htmlFor="scalePotential">Tiềm năng mở rộng</Label>
            <Input id="scalePotential" {...form.register('scalePotential')} disabled={readOnly} />
          </div>
        </div>
      </div>

      {!readOnly && (
        <div className="flex justify-end">
          <Button type="submit" disabled={evaluate.isPending}>
            {evaluate.isPending ? 'Đang lưu...' : 'Lưu đánh giá'}
          </Button>
        </div>
      )}
    </form>
  );
}
