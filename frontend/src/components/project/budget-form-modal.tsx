'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useUpdateProjectBudget } from '@/hooks/use-projects';
import type { Project } from '@/lib/api/projects';
import type { UpdateBudgetInput } from '@/lib/api/projects';

type ProjectBudget = Project;
type UpsertBudgetInput = UpdateBudgetInput;

interface BudgetFormModalProps {
  projectId: string;
  budget: ProjectBudget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BudgetFormModal({
  projectId,
  budget,
  open,
  onOpenChange,
}: BudgetFormModalProps) {
  const upsertBudget = useUpdateProjectBudget();

  const [form, setForm] = useState<UpsertBudgetInput>({
    totalBudget: 0,
    monthlyBudget: undefined,
    spentAmount: undefined,
    fixedAdFee: undefined,
    adServiceFee: undefined,
    contentFee: undefined,
    designFee: undefined,
    mediaFee: undefined,
    otherFee: undefined,
    budgetPacing: undefined,
  });

  useEffect(() => {
    if (budget) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        totalBudget: budget.totalBudget ?? 0,
        monthlyBudget: budget.monthlyBudget ?? undefined,
        spentAmount: budget.spentAmount ?? 0,
        fixedAdFee: budget.fixedAdFee ?? undefined,
        adServiceFee: budget.adServiceFee ?? undefined,
        contentFee: budget.contentFee ?? undefined,
        designFee: budget.designFee ?? undefined,
        mediaFee: budget.mediaFee ?? undefined,
        otherFee: budget.otherFee ?? undefined,
        budgetPacing: budget.budgetPacing ?? undefined,
      });
    } else {
      setForm({
        totalBudget: 0,
        monthlyBudget: undefined,
        spentAmount: undefined,
        fixedAdFee: undefined,
        adServiceFee: undefined,
        contentFee: undefined,
        designFee: undefined,
        mediaFee: undefined,
        otherFee: undefined,
        budgetPacing: undefined,
      });
    }
  }, [budget, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.totalBudget || form.totalBudget <= 0) {
      toast.error('Tổng ngân sách phải lớn hơn 0');
      return;
    }

    try {
      await upsertBudget.mutateAsync({
        projectId,
        input: form,
      });
      toast.success(budget ? 'Đã cập nhật ngân sách' : 'Đã tạo ngân sách');
      onOpenChange(false);
    } catch {
      toast.error('Không thể lưu ngân sách');
    }
  };

  const updateField = (field: keyof UpsertBudgetInput, value: string) => {
    const num = value === '' ? undefined : Number(value);
    setForm((prev) => ({ ...prev, [field]: num }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {budget ? 'Chỉnh sửa ngân sách' : 'Thiết lập ngân sách'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Main budget */}
          <div className="space-y-4">
            <div className="text-footnote font-medium text-muted-foreground uppercase tracking-wider">
              Ngân sách tổng
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="totalBudget" className="text-footnote">
                  Tổng ngân sách *
                </Label>
                <Input
                  id="totalBudget"
                  type="number"
                  min="0"
                  step="1000"
                  value={form.totalBudget || ''}
                  onChange={(e) => updateField('totalBudget', e.target.value)}
                  placeholder="0"
                  className="rounded-lg"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthlyBudget" className="text-footnote">
                  Ngân sách / tháng
                </Label>
                <Input
                  id="monthlyBudget"
                  type="number"
                  min="0"
                  step="1000"
                  value={form.monthlyBudget ?? ''}
                  onChange={(e) => updateField('monthlyBudget', e.target.value)}
                  placeholder="0"
                  className="rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="spentAmount" className="text-footnote">
                  Đã chi tiêu
                </Label>
                <Input
                  id="spentAmount"
                  type="number"
                  min="0"
                  step="1000"
                  value={form.spentAmount ?? ''}
                  onChange={(e) => updateField('spentAmount', e.target.value)}
                  placeholder="0"
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budgetPacing" className="text-footnote">
                  Budget Pacing (%)
                </Label>
                <Input
                  id="budgetPacing"
                  type="number"
                  min="0"
                  step="0.1"
                  value={form.budgetPacing ?? ''}
                  onChange={(e) => updateField('budgetPacing', e.target.value)}
                  placeholder="0"
                  className="rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Fee breakdown */}
          <div className="space-y-4 pt-4 border-t border-border/50">
            <div className="text-footnote font-medium text-muted-foreground uppercase tracking-wider">
              Chi tiết phí
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="fixedAdFee" className="text-footnote">
                  Phí QC cố định
                </Label>
                <Input
                  id="fixedAdFee"
                  type="number"
                  min="0"
                  step="1000"
                  value={form.fixedAdFee ?? ''}
                  onChange={(e) => updateField('fixedAdFee', e.target.value)}
                  placeholder="0"
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adServiceFee" className="text-footnote">
                  Phí DV quảng cáo
                </Label>
                <Input
                  id="adServiceFee"
                  type="number"
                  min="0"
                  step="1000"
                  value={form.adServiceFee ?? ''}
                  onChange={(e) => updateField('adServiceFee', e.target.value)}
                  placeholder="0"
                  className="rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="contentFee" className="text-footnote">
                  Phí Content
                </Label>
                <Input
                  id="contentFee"
                  type="number"
                  min="0"
                  step="1000"
                  value={form.contentFee ?? ''}
                  onChange={(e) => updateField('contentFee', e.target.value)}
                  placeholder="0"
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="designFee" className="text-footnote">
                  Phí Design
                </Label>
                <Input
                  id="designFee"
                  type="number"
                  min="0"
                  step="1000"
                  value={form.designFee ?? ''}
                  onChange={(e) => updateField('designFee', e.target.value)}
                  placeholder="0"
                  className="rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="mediaFee" className="text-footnote">
                  Phí Media
                </Label>
                <Input
                  id="mediaFee"
                  type="number"
                  min="0"
                  step="1000"
                  value={form.mediaFee ?? ''}
                  onChange={(e) => updateField('mediaFee', e.target.value)}
                  placeholder="0"
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="otherFee" className="text-footnote">
                  Phí khác
                </Label>
                <Input
                  id="otherFee"
                  type="number"
                  min="0"
                  step="1000"
                  value={form.otherFee ?? ''}
                  onChange={(e) => updateField('otherFee', e.target.value)}
                  placeholder="0"
                  className="rounded-lg"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="rounded-full"
              disabled={upsertBudget.isPending}
            >
              {upsertBudget.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {budget ? 'Cập nhật' : 'Tạo ngân sách'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
