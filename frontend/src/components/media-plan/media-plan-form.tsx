'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MONTHS, type CreateMediaPlanInput } from '@/lib/api/media-plans';

interface MediaPlanFormProps {
  onSubmit: (data: CreateMediaPlanInput) => Promise<void>;
  isSubmitting: boolean;
  onCancel: () => void;
}

export function MediaPlanForm({ onSubmit, isSubmitting, onCancel }: MediaPlanFormProps) {
  const now = new Date();
  const [name, setName] = useState('');
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [totalBudget, setTotalBudget] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Vui lòng nhập tên kế hoạch';
    if (!totalBudget || Number(totalBudget) <= 0) newErrors.totalBudget = 'Vui lòng nhập ngân sách';
    if (!startDate) newErrors.startDate = 'Vui lòng chọn ngày bắt đầu';
    if (!endDate) newErrors.endDate = 'Vui lòng chọn ngày kết thúc';
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      newErrors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    await onSubmit({
      name: name.trim(),
      month,
      year,
      totalBudget: Number(totalBudget),
      startDate,
      endDate,
      notes: notes.trim() || undefined,
    });
  };

  const years = Array.from({ length: 6 }, (_, i) => now.getFullYear() - 1 + i);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-footnote font-medium">
          Tên kế hoạch <span className="text-[#ff3b30]">*</span>
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="VD: Media Plan tháng 1/2026"
          className="h-11 rounded-xl bg-surface border-0"
        />
        {errors.name && (
          <p className="text-caption text-[#ff3b30]">{errors.name}</p>
        )}
      </div>

      {/* Month + Year */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-footnote font-medium">Tháng</Label>
          <Select
            value={String(month)}
            onValueChange={(v) => setMonth(Number(v))}
          >
            <SelectTrigger className="h-11 rounded-xl bg-surface border-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {MONTHS.map((m) => (
                <SelectItem key={m.value} value={String(m.value)} className="rounded-lg">
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-footnote font-medium">Năm</Label>
          <Select
            value={String(year)}
            onValueChange={(v) => setYear(Number(v))}
          >
            <SelectTrigger className="h-11 rounded-xl bg-surface border-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {years.map((y) => (
                <SelectItem key={y} value={String(y)} className="rounded-lg">
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Total Budget */}
      <div className="space-y-2">
        <Label htmlFor="totalBudget" className="text-footnote font-medium">
          Tổng ngân sách (VND) <span className="text-[#ff3b30]">*</span>
        </Label>
        <Input
          id="totalBudget"
          type="number"
          value={totalBudget}
          onChange={(e) => setTotalBudget(e.target.value)}
          placeholder="VD: 50000000"
          min={0}
          className="h-11 rounded-xl bg-surface border-0"
        />
        {errors.totalBudget && (
          <p className="text-caption text-[#ff3b30]">{errors.totalBudget}</p>
        )}
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate" className="text-footnote font-medium">
            Ngày bắt đầu <span className="text-[#ff3b30]">*</span>
          </Label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-11 rounded-xl bg-surface border-0"
          />
          {errors.startDate && (
            <p className="text-caption text-[#ff3b30]">{errors.startDate}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate" className="text-footnote font-medium">
            Ngày kết thúc <span className="text-[#ff3b30]">*</span>
          </Label>
          <Input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-11 rounded-xl bg-surface border-0"
          />
          {errors.endDate && (
            <p className="text-caption text-[#ff3b30]">{errors.endDate}</p>
          )}
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes" className="text-footnote font-medium">
          Ghi chú
        </Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ghi chú về kế hoạch media..."
          rows={3}
          className="rounded-xl bg-surface border-0 resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          className="rounded-full px-5"
        >
          Hủy
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full px-6 bg-primary"
        >
          {isSubmitting ? 'Đang tạo...' : 'Tạo kế hoạch'}
        </Button>
      </div>
    </form>
  );
}
