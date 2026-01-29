'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FileText, Target, Wallet, Receipt, Lightbulb } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { Project } from '@/types';
import { useUpdateProjectSale } from '@/hooks/use-projects';

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
  pipeline: Project;
  readOnly?: boolean;
}

export function PipelineSaleForm({ pipeline, readOnly = false }: PipelineSaleFormProps) {
  const updateSale = useUpdateProjectSale();

  const form = useForm<SaleFormValues>({
    resolver: zodResolver(saleFormSchema) as any,
    defaultValues: {
      projectName: pipeline.name,
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
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      {/* Project Info */}
      <FormSection icon={<FileText className="h-3.5 w-3.5" />} title="Thông tin dự án">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label htmlFor="projectName">Tên dự án *</Label>
            <Input id="projectName" {...form.register('projectName')} disabled={readOnly} className="mt-1.5" />
            {form.formState.errors.projectName && (
              <p className="text-xs text-destructive mt-1">{form.formState.errors.projectName.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="clientType">Loại khách hàng</Label>
            <Input id="clientType" {...form.register('clientType')} disabled={readOnly} className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="productType">Loại sản phẩm</Label>
            <Input id="productType" {...form.register('productType')} disabled={readOnly} className="mt-1.5" />
          </div>
          <div className="col-span-2">
            <Label htmlFor="licenseLink">Link giấy phép</Label>
            <Input id="licenseLink" {...form.register('licenseLink')} disabled={readOnly} placeholder="https://..." className="mt-1.5" />
          </div>
        </div>
      </FormSection>

      {/* Campaign */}
      <FormSection icon={<Target className="h-3.5 w-3.5" />} title="Mục tiêu chiến dịch">
        <div className="space-y-4">
          <div>
            <Label htmlFor="campaignObjective">Mục tiêu</Label>
            <Textarea id="campaignObjective" {...form.register('campaignObjective')} disabled={readOnly} rows={3} className="mt-1.5 resize-none" />
          </div>
          <div>
            <Label htmlFor="initialGoal">Mục tiêu ban đầu</Label>
            <Textarea id="initialGoal" {...form.register('initialGoal')} disabled={readOnly} rows={2} className="mt-1.5 resize-none" />
          </div>
        </div>
      </FormSection>

      {/* Budget */}
      <FormSection icon={<Wallet className="h-3.5 w-3.5" />} title="Ngân sách">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="totalBudget">Tổng ngân sách (VND)</Label>
            <Input id="totalBudget" type="number" {...form.register('totalBudget')} disabled={readOnly} className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="monthlyBudget">Ngân sách/tháng (VND)</Label>
            <Input id="monthlyBudget" type="number" {...form.register('monthlyBudget')} disabled={readOnly} className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="spentAmount">Đã chi (VND)</Label>
            <Input id="spentAmount" type="number" {...form.register('spentAmount')} disabled={readOnly} className="mt-1.5" />
          </div>
        </div>
      </FormSection>

      {/* Fees */}
      <FormSection icon={<Receipt className="h-3.5 w-3.5" />} title="Phí dịch vụ">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="fixedAdFee">Fixed Ad Fee</Label>
            <Input id="fixedAdFee" type="number" {...form.register('fixedAdFee')} disabled={readOnly} className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="adServiceFee">Ad Service Fee</Label>
            <Input id="adServiceFee" type="number" {...form.register('adServiceFee')} disabled={readOnly} className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="contentFee">Content Fee</Label>
            <Input id="contentFee" type="number" {...form.register('contentFee')} disabled={readOnly} className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="designFee">Design Fee</Label>
            <Input id="designFee" type="number" {...form.register('designFee')} disabled={readOnly} className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="mediaFee">Media Fee</Label>
            <Input id="mediaFee" type="number" {...form.register('mediaFee')} disabled={readOnly} className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="otherFee">Other Fee</Label>
            <Input id="otherFee" type="number" {...form.register('otherFee')} disabled={readOnly} className="mt-1.5" />
          </div>
        </div>
      </FormSection>

      {/* Upsell */}
      <FormSection icon={<Lightbulb className="h-3.5 w-3.5" />} title="Cơ hội upsell">
        <Textarea id="upsellOpportunity" {...form.register('upsellOpportunity')} disabled={readOnly} rows={2} className="resize-none" />
      </FormSection>

      {!readOnly && (
        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={updateSale.isPending}>
            {updateSale.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
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
