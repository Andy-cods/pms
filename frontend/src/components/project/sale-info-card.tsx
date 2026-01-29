'use client';

import { useState } from 'react';
import { Pencil, Save, X, DollarSign, Target, FileText, Link as LinkIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import type { Project } from '@/types';
import { useUpdateProjectSale } from '@/hooks/use-projects';
import { formatCurrency, FeeLabels } from '@/lib/api/projects';

interface SaleInfoCardProps {
  project: Project;
  editable?: boolean;
}

const FEE_FIELDS = ['fixedAdFee', 'adServiceFee', 'contentFee', 'designFee', 'mediaFee', 'otherFee'] as const;

export function SaleInfoCard({ project, editable = false }: SaleInfoCardProps) {
  const [editing, setEditing] = useState(false);
  const updateSale = useUpdateProjectSale();

  const [form, setForm] = useState({
    clientType: project.clientType ?? '',
    campaignObjective: project.campaignObjective ?? '',
    initialGoal: project.initialGoal ?? '',
    totalBudget: project.totalBudget ?? 0,
    monthlyBudget: project.monthlyBudget ?? 0,
    fixedAdFee: project.fixedAdFee ?? 0,
    adServiceFee: project.adServiceFee ?? 0,
    contentFee: project.contentFee ?? 0,
    designFee: project.designFee ?? 0,
    mediaFee: project.mediaFee ?? 0,
    otherFee: project.otherFee ?? 0,
    upsellOpportunity: project.upsellOpportunity ?? '',
    licenseLink: project.licenseLink ?? '',
  });

  const totalFees = FEE_FIELDS.reduce((sum, f) => sum + (form[f] || 0), 0);

  function handleSave() {
    updateSale.mutate(
      {
        id: project.id,
        input: {
          clientType: form.clientType || undefined,
          campaignObjective: form.campaignObjective || undefined,
          initialGoal: form.initialGoal || undefined,
          totalBudget: form.totalBudget || undefined,
          monthlyBudget: form.monthlyBudget || undefined,
          fixedAdFee: form.fixedAdFee || undefined,
          adServiceFee: form.adServiceFee || undefined,
          contentFee: form.contentFee || undefined,
          designFee: form.designFee || undefined,
          mediaFee: form.mediaFee || undefined,
          otherFee: form.otherFee || undefined,
          upsellOpportunity: form.upsellOpportunity || undefined,
          licenseLink: form.licenseLink || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success('Đã cập nhật thông tin sale');
          setEditing(false);
        },
        onError: () => toast.error('Không thể cập nhật'),
      },
    );
  }

  function handleCancel() {
    setForm({
      clientType: project.clientType ?? '',
      campaignObjective: project.campaignObjective ?? '',
      initialGoal: project.initialGoal ?? '',
      totalBudget: project.totalBudget ?? 0,
      monthlyBudget: project.monthlyBudget ?? 0,
      fixedAdFee: project.fixedAdFee ?? 0,
      adServiceFee: project.adServiceFee ?? 0,
      contentFee: project.contentFee ?? 0,
      designFee: project.designFee ?? 0,
      mediaFee: project.mediaFee ?? 0,
      otherFee: project.otherFee ?? 0,
      upsellOpportunity: project.upsellOpportunity ?? '',
      licenseLink: project.licenseLink ?? '',
    });
    setEditing(false);
  }

  if (editing) {
    return (
      <Card className="rounded-2xl border-green-200 dark:border-green-800/50 shadow-apple-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-subheadline font-semibold text-green-700 dark:text-green-400">
            Thông tin Sale
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 rounded-lg"
              onClick={handleCancel}
              disabled={updateSale.isPending}
            >
              <X className="h-3.5 w-3.5 mr-1" /> Hủy
            </Button>
            <Button
              size="sm"
              className="h-8 rounded-lg bg-green-600 hover:bg-green-700 text-white"
              onClick={handleSave}
              disabled={updateSale.isPending}
            >
              <Save className="h-3.5 w-3.5 mr-1" /> Lưu
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-footnote">Loại khách hàng</Label>
              <Input
                value={form.clientType}
                onChange={(e) => setForm({ ...form, clientType: e.target.value })}
                placeholder="VD: Agency, Direct"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-footnote">Mục tiêu chiến dịch</Label>
              <Input
                value={form.campaignObjective}
                onChange={(e) => setForm({ ...form, campaignObjective: e.target.value })}
                placeholder="VD: Brand Awareness"
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label className="text-footnote">Mục tiêu ban đầu</Label>
            <Textarea
              value={form.initialGoal}
              onChange={(e) => setForm({ ...form, initialGoal: e.target.value })}
              placeholder="Mô tả mục tiêu..."
              className="mt-1 min-h-[60px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-footnote">Tổng ngân sách</Label>
              <Input
                type="number"
                value={form.totalBudget}
                onChange={(e) => setForm({ ...form, totalBudget: Number(e.target.value) })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-footnote">Ngân sách hàng tháng</Label>
              <Input
                type="number"
                value={form.monthlyBudget}
                onChange={(e) => setForm({ ...form, monthlyBudget: Number(e.target.value) })}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label className="text-footnote font-medium">Chi phí dịch vụ</Label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {FEE_FIELDS.map((field) => (
                <div key={field}>
                  <Label className="text-caption text-muted-foreground">{FeeLabels[field]}</Label>
                  <Input
                    type="number"
                    value={form[field]}
                    onChange={(e) => setForm({ ...form, [field]: Number(e.target.value) })}
                    className="mt-0.5"
                  />
                </div>
              ))}
            </div>
            <div className="mt-2 text-footnote text-muted-foreground text-right">
              Tổng phí: <span className="font-semibold text-foreground">{formatCurrency(totalFees)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-footnote">Cơ hội Upsell</Label>
              <Input
                value={form.upsellOpportunity}
                onChange={(e) => setForm({ ...form, upsellOpportunity: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-footnote">Link License</Label>
              <Input
                value={form.licenseLink}
                onChange={(e) => setForm({ ...form, licenseLink: e.target.value })}
                placeholder="https://..."
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Read-only mode
  const hasSaleData = project.clientType || project.campaignObjective || project.totalBudget;

  return (
    <Card className="rounded-2xl border-green-200 dark:border-green-800/50 shadow-apple-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-subheadline font-semibold text-green-700 dark:text-green-400">
          Thông tin Sale
        </CardTitle>
        {editable && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 rounded-lg text-footnote text-green-600 hover:text-green-700"
            onClick={() => setEditing(true)}
          >
            <Pencil className="h-3.5 w-3.5 mr-1" /> Sửa
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {!hasSaleData ? (
          <p className="text-footnote text-muted-foreground/50 italic">Chưa có thông tin sale</p>
        ) : (
          <div className="space-y-4">
            {/* Key info */}
            <div className="grid grid-cols-2 gap-3">
              {project.clientType && (
                <InfoRow icon={Target} label="Loại KH" value={project.clientType} />
              )}
              {project.campaignObjective && (
                <InfoRow icon={Target} label="Mục tiêu" value={project.campaignObjective} />
              )}
            </div>

            {project.initialGoal && (
              <div>
                <span className="text-caption text-muted-foreground">Mục tiêu ban đầu</span>
                <p className="text-footnote mt-0.5">{project.initialGoal}</p>
              </div>
            )}

            {/* Budget */}
            {(project.totalBudget || project.monthlyBudget) && (
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-green-50 dark:bg-green-900/10">
                {project.totalBudget != null && (
                  <div>
                    <span className="text-caption text-muted-foreground">Tổng ngân sách</span>
                    <p className="text-callout font-semibold text-green-700 dark:text-green-400">
                      {formatCurrency(project.totalBudget)}
                    </p>
                  </div>
                )}
                {project.monthlyBudget != null && (
                  <div>
                    <span className="text-caption text-muted-foreground">Hàng tháng</span>
                    <p className="text-callout font-semibold text-green-700 dark:text-green-400">
                      {formatCurrency(project.monthlyBudget)}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Fee breakdown */}
            {FEE_FIELDS.some((f) => project[f] != null && project[f]! > 0) && (
              <div className="space-y-1.5">
                <span className="text-caption text-muted-foreground font-medium">Chi phí dịch vụ</span>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {FEE_FIELDS.filter((f) => project[f] != null && project[f]! > 0).map((f) => (
                    <div key={f} className="flex justify-between text-footnote">
                      <span className="text-muted-foreground">{FeeLabels[f]}</span>
                      <span className="tabular-nums">{formatCurrency(project[f]!)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Links */}
            <div className="flex flex-wrap gap-2">
              {project.licenseLink && (
                <a
                  href={project.licenseLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-footnote text-green-600 hover:text-green-700"
                >
                  <LinkIcon className="h-3.5 w-3.5" /> License
                </a>
              )}
              {project.upsellOpportunity && (
                <span className="inline-flex items-center gap-1.5 text-footnote text-green-600">
                  <DollarSign className="h-3.5 w-3.5" /> Upsell: {project.upsellOpportunity}
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
      <div>
        <span className="text-caption text-muted-foreground">{label}</span>
        <p className="text-footnote font-medium">{value}</p>
      </div>
    </div>
  );
}
