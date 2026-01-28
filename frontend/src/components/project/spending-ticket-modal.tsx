'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useCreateBudgetEvent } from '@/hooks/use-budget-events';
import {
  type BudgetEventType,
  type BudgetEventCategory,
  BudgetEventCategoryLabels,
  BudgetEventTypeLabels,
} from '@/lib/api/budget-events';

interface SpendingTicketModalProps {
  projectId: string;
}

const EVENT_TYPES: BudgetEventType[] = ['SPEND', 'ALLOC', 'ADJUST'];
const CATEGORIES: BudgetEventCategory[] = ['FIXED_AD', 'AD_SERVICE', 'CONTENT', 'DESIGN', 'MEDIA', 'OTHER'];

export function SpendingTicketModal({ projectId }: SpendingTicketModalProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<BudgetEventType>('SPEND');
  const [category, setCategory] = useState<BudgetEventCategory>('OTHER');
  const [amount, setAmount] = useState('');
  const [stage, setStage] = useState('');
  const [note, setNote] = useState('');

  const createMutation = useCreateBudgetEvent(projectId);

  const resetForm = () => {
    setType('SPEND');
    setCategory('OTHER');
    setAmount('');
    setStage('');
    setNote('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      toast.error('Số tiền phải lớn hơn 0');
      return;
    }

    try {
      await createMutation.mutateAsync({
        type,
        category,
        amount: amountNum,
        stage: stage || undefined,
        note: note || undefined,
      });
      toast.success('Đã tạo ticket chi tiêu');
      resetForm();
      setOpen(false);
    } catch {
      toast.error('Không thể tạo ticket');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" />
          Tạo ticket
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Tạo ticket chi tiêu</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Loại</Label>
              <Select value={type} onValueChange={(v) => setType(v as BudgetEventType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{BudgetEventTypeLabels[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Hạng mục</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as BudgetEventCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{BudgetEventCategoryLabels[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Số tiền (VND)</Label>
            <Input
              type="number"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={0}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Giai đoạn</Label>
            <Input
              placeholder="VD: Execution, Planning..."
              value={stage}
              onChange={(e) => setStage(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Ghi chú</Label>
            <Textarea
              placeholder="Mô tả chi tiêu..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Đang tạo...' : 'Tạo ticket'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
