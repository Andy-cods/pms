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
import {
  MONTHS,
  type CreateMediaPlanInput,
  type MediaPlanType,
  MediaPlanTypeLabels,
} from '@/lib/api/media-plans';

interface MediaPlanFormProps {
  onSubmit: (data: CreateMediaPlanInput) => Promise<void>;
  isSubmitting: boolean;
  onCancel: () => void;
  defaultValues?: Partial<CreateMediaPlanInput>;
  defaultType?: MediaPlanType;
}

const PLAN_TYPES: MediaPlanType[] = ['ADS', 'DESIGN', 'CONTENT'];

export function MediaPlanForm({
  onSubmit,
  isSubmitting,
  onCancel,
  defaultValues,
  defaultType,
}: MediaPlanFormProps) {
  const now = new Date();
  const [name, setName] = useState(defaultValues?.name ?? '');
  const [planType, setPlanType] = useState<MediaPlanType>(defaultType ?? defaultValues?.type ?? 'ADS');
  const [month, setMonth] = useState(defaultValues?.month ?? now.getMonth() + 1);
  const [year, setYear] = useState(defaultValues?.year ?? now.getFullYear());
  const [totalBudget, setTotalBudget] = useState(
    defaultValues?.totalBudget ? String(defaultValues.totalBudget) : ''
  );
  const [startDate, setStartDate] = useState(defaultValues?.startDate ?? '');
  const [endDate, setEndDate] = useState(defaultValues?.endDate ?? '');
  const [notes, setNotes] = useState(defaultValues?.notes ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Vui lòng nhập tên kế hoạch';
    if (!totalBudget || Number(totalBudget) <= 0) newErrors.totalBudget = 'Vui lòng nhập ngân sách';
    if (!startDate) newErrors.startDate = 'Chọn ngày bắt đầu';
    if (!endDate) newErrors.endDate = 'Chọn ngày kết thúc';
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
      type: planType,
      month,
      year,
      totalBudget: Number(totalBudget),
      startDate,
      endDate,
      notes: notes.trim() || undefined,
    });
  };

  const years = Array.from({ length: 6 }, (_, i) => now.getFullYear() - 1 + i);
  const daysSpan =
    startDate && endDate
      ? Math.max(
          1,
          Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) + 1,
        )
      : 0;

  return (
    <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-footnote font-medium">
            Tên kế hoạch <span className="text-[#ff3b30]">*</span>
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="VD: Media Plan tháng 1/2026"
            className="h-11 rounded-xl bg-surface"
          />
          {errors.name && <p className="text-caption text-[#ff3b30]">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <Label className="text-footnote font-medium">Loại kế hoạch</Label>
          <Select value={planType} onValueChange={(v) => setPlanType(v as MediaPlanType)}>
            <SelectTrigger className="h-11 rounded-xl bg-surface">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {PLAN_TYPES.map((t) => (
                <SelectItem key={t} value={t} className="rounded-lg">
                  {MediaPlanTypeLabels[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-footnote font-medium">Tháng</Label>
            <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
              <SelectTrigger className="h-11 rounded-xl bg-surface">
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
            <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
              <SelectTrigger className="h-11 rounded-xl bg-surface">
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
            className="h-11 rounded-xl bg-surface"
          />
          {errors.totalBudget && (
            <p className="text-caption text-[#ff3b30]">{errors.totalBudget}</p>
          )}
        </div>

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
              className="h-11 rounded-xl bg-surface"
            />
            {errors.startDate && <p className="text-caption text-[#ff3b30]">{errors.startDate}</p>}
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
              className="h-11 rounded-xl bg-surface"
            />
            {errors.endDate && <p className="text-caption text-[#ff3b30]">{errors.endDate}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes" className="text-footnote font-medium">
            Ghi chú
          </Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ghi chú về kế hoạch..."
            rows={3}
            className="rounded-xl bg-surface border-0 resize-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            className="rounded-full px-5"
          >
            Hủy
          </Button>
          <Button type="submit" disabled={isSubmitting} className="rounded-full px-5">
            {isSubmitting ? 'Đang lưu...' : defaultValues ? 'Lưu thay đổi' : 'Tạo kế hoạch'}
          </Button>
        </div>
      </div>

      <div className="lg:sticky lg:top-8">
        <div className="rounded-2xl border border-border bg-card/70 backdrop-blur p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Tóm tắt</span>
            <span className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground">
              {MediaPlanTypeLabels[planType]} · {month}/{year}
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Tên kế hoạch</p>
            <p className="font-medium">{name || '—'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Ngân sách</p>
            <p className="font-semibold">
              {totalBudget ? Number(totalBudget).toLocaleString('vi-VN') + ' đ' : '—'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Bắt đầu</p>
              <p className="font-medium">{startDate || '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Kết thúc</p>
              <p className="font-medium">{endDate || '—'}</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Thời lượng</span>
            <span className="font-semibold">{daysSpan ? `${daysSpan} ngày` : '—'}</span>
          </div>
        </div>
      </div>
    </form>
  );
}
