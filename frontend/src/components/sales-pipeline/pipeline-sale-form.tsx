'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { SalesPipeline } from '@/types';
import { useUpdatePipelineSale } from '@/hooks/use-sales-pipeline';

const saleFormSchema = z.object({
  projectName: z.string().min(1, 'Tên dự án là bắt buộc'),
  clientType: z.string().optional(),
  productType: z.string().optional(),
  licenseLink: z.string().url('URL không hợp lệ').optional().or(z.literal('')),
  campaignObjective: z.string().optional(),
  initialGoal: z.string().optional(),
  totalBudget: z.coerce.number().min(0).optional(),
  monthlyBudget: z.coerce.number().min(0).optional(),
  spentAmount: z.coerce.number().min(0).optional(),
  fixedAdFee: z.coerce.number().min(0).optional(),
  adServiceFee: z.coerce.number().min(0).optional(),
  contentFee: z.coerce.number().min(0).optional(),
  designFee: z.coerce.number().min(0).optional(),
  mediaFee: z.coerce.number().min(0).optional(),
  otherFee: z.coerce.number().min(0).optional(),
  upsellOpportunity: z.string().optional(),
});

type SaleFormValues = z.infer<typeof saleFormSchema>;

interface PipelineSaleFormProps {
  pipeline: SalesPipeline;
  readOnly?: boolean;
}

export function PipelineSaleForm({ pipeline, readOnly = false }: PipelineSaleFormProps) {
  const updateSale = useUpdatePipelineSale();

  const form = useForm<SaleFormValues>({
    resolver: zodResolver(saleFormSchema),
    defaultValues: {
      projectName: pipeline.projectName,
      clientType: pipeline.clientType ?? '',
      productType: pipeline.productType ?? '',
      licenseLink: pipeline.licenseLink ?? '',
      campaignObjective: pipeline.campaignObjective ?? '',
      initialGoal: pipeline.initialGoal ?? '',
      totalBudget: pipeline.totalBudget ?? undefined,
      monthlyBudget: pipeline.monthlyBudget ?? undefined,
      spentAmount: pipeline.spentAmount ?? undefined,
      fixedAdFee: pipeline.fixedAdFee ?? undefined,
      adServiceFee: pipeline.adServiceFee ?? undefined,
      contentFee: pipeline.contentFee ?? undefined,
      designFee: pipeline.designFee ?? undefined,
      mediaFee: pipeline.mediaFee ?? undefined,
      otherFee: pipeline.otherFee ?? undefined,
      upsellOpportunity: pipeline.upsellOpportunity ?? '',
    },
  });

  const onSubmit = (values: SaleFormValues) => {
    updateSale.mutate({ id: pipeline.id, input: values });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Project Info */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Thông tin dự án</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label htmlFor="projectName">Tên dự án *</Label>
            <Input id="projectName" {...form.register('projectName')} disabled={readOnly} />
            {form.formState.errors.projectName && (
              <p className="text-xs text-destructive mt-1">{form.formState.errors.projectName.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="clientType">Loại khách hàng</Label>
            <Input id="clientType" {...form.register('clientType')} disabled={readOnly} />
          </div>
          <div>
            <Label htmlFor="productType">Loại sản phẩm</Label>
            <Input id="productType" {...form.register('productType')} disabled={readOnly} />
          </div>
          <div className="col-span-2">
            <Label htmlFor="licenseLink">Link giấy phép</Label>
            <Input id="licenseLink" {...form.register('licenseLink')} disabled={readOnly} placeholder="https://..." />
          </div>
        </div>
      </div>

      {/* Campaign */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Mục tiêu chiến dịch</h3>
        <div>
          <Label htmlFor="campaignObjective">Mục tiêu</Label>
          <Textarea id="campaignObjective" {...form.register('campaignObjective')} disabled={readOnly} rows={3} />
        </div>
        <div>
          <Label htmlFor="initialGoal">Mục tiêu ban đầu</Label>
          <Textarea id="initialGoal" {...form.register('initialGoal')} disabled={readOnly} rows={2} />
        </div>
      </div>

      {/* Budget */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Ngân sách</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="totalBudget">Tổng ngân sách (VND)</Label>
            <Input id="totalBudget" type="number" {...form.register('totalBudget')} disabled={readOnly} />
          </div>
          <div>
            <Label htmlFor="monthlyBudget">Ngân sách/tháng (VND)</Label>
            <Input id="monthlyBudget" type="number" {...form.register('monthlyBudget')} disabled={readOnly} />
          </div>
          <div>
            <Label htmlFor="spentAmount">Đã chi (VND)</Label>
            <Input id="spentAmount" type="number" {...form.register('spentAmount')} disabled={readOnly} />
          </div>
        </div>
      </div>

      {/* Fees */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Phí dịch vụ</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="fixedAdFee">Fixed Ad Fee</Label>
            <Input id="fixedAdFee" type="number" {...form.register('fixedAdFee')} disabled={readOnly} />
          </div>
          <div>
            <Label htmlFor="adServiceFee">Ad Service Fee</Label>
            <Input id="adServiceFee" type="number" {...form.register('adServiceFee')} disabled={readOnly} />
          </div>
          <div>
            <Label htmlFor="contentFee">Content Fee</Label>
            <Input id="contentFee" type="number" {...form.register('contentFee')} disabled={readOnly} />
          </div>
          <div>
            <Label htmlFor="designFee">Design Fee</Label>
            <Input id="designFee" type="number" {...form.register('designFee')} disabled={readOnly} />
          </div>
          <div>
            <Label htmlFor="mediaFee">Media Fee</Label>
            <Input id="mediaFee" type="number" {...form.register('mediaFee')} disabled={readOnly} />
          </div>
          <div>
            <Label htmlFor="otherFee">Other Fee</Label>
            <Input id="otherFee" type="number" {...form.register('otherFee')} disabled={readOnly} />
          </div>
        </div>
      </div>

      {/* Upsell */}
      <div>
        <Label htmlFor="upsellOpportunity">Cơ hội upsell</Label>
        <Textarea id="upsellOpportunity" {...form.register('upsellOpportunity')} disabled={readOnly} rows={2} />
      </div>

      {!readOnly && (
        <div className="flex justify-end">
          <Button type="submit" disabled={updateSale.isPending}>
            {updateSale.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </div>
      )}
    </form>
  );
}
