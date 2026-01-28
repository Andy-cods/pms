'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  type MediaPlanItem,
  type MediaPlanType,
  type CreateMediaPlanItemInput,
  type UpdateMediaPlanItemInput,
  MEDIA_CHANNELS_BY_TYPE,
  CAMPAIGN_TYPES_BY_TYPE,
  CAMPAIGN_OBJECTIVES_BY_TYPE,
  METRIC_FIELDS_BY_TYPE,
  MediaPlanTypeLabels,
} from '@/lib/api/media-plans';

interface MediaPlanItemFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: MediaPlanItem;
  planType?: MediaPlanType;
  onSubmit: (input: CreateMediaPlanItemInput) => Promise<void>;
  isSubmitting: boolean;
}

// Map DB field keys to state getter/setter indices
const METRIC_KEYS = ['targetReach', 'targetClicks', 'targetLeads', 'targetCPL', 'targetCPC', 'targetROAS'] as const;

export function MediaPlanItemForm({
  open,
  onOpenChange,
  item,
  planType = 'ADS',
  onSubmit,
  isSubmitting,
}: MediaPlanItemFormProps) {
  const isEditing = !!item;

  const [channel, setChannel] = useState('');
  const [campaignType, setCampaignType] = useState('');
  const [objective, setObjective] = useState('');
  const [budget, setBudget] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  // Single object for all metric values (keyed by DB field name)
  const [metrics, setMetrics] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const metricFields = METRIC_FIELDS_BY_TYPE[planType];

  useEffect(() => {
    if (item) {
      setChannel(item.channel);
      setCampaignType(item.campaignType);
      setObjective(item.objective);
      setBudget(String(item.budget));
      setStartDate(item.startDate.split('T')[0]);
      setEndDate(item.endDate.split('T')[0]);
      const m: Record<string, string> = {};
      for (const k of METRIC_KEYS) {
        m[k] = item[k] ? String(item[k]) : '';
      }
      setMetrics(m);
    } else {
      setChannel('');
      setCampaignType('');
      setObjective('');
      setBudget('');
      setStartDate('');
      setEndDate('');
      setMetrics({});
    }
    setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item, open]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!channel) newErrors.channel = 'Vui lòng chọn kênh';
    if (!campaignType) newErrors.campaignType = 'Vui lòng chọn loại';
    if (!objective) newErrors.objective = 'Vui lòng chọn mục tiêu';
    if (!budget || Number(budget) <= 0) newErrors.budget = 'Vui lòng nhập ngân sách';
    if (!isEditing) {
      if (!startDate) newErrors.startDate = 'Vui lòng chọn ngày bắt đầu';
      if (!endDate) newErrors.endDate = 'Vui lòng chọn ngày kết thúc';
    }
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      newErrors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const data: CreateMediaPlanItemInput = {
      channel,
      campaignType,
      objective,
      budget: Number(budget),
      startDate,
      endDate,
      targetReach: metrics.targetReach ? Number(metrics.targetReach) : undefined,
      targetClicks: metrics.targetClicks ? Number(metrics.targetClicks) : undefined,
      targetLeads: metrics.targetLeads ? Number(metrics.targetLeads) : undefined,
      targetCPL: metrics.targetCPL ? Number(metrics.targetCPL) : undefined,
      targetCPC: metrics.targetCPC ? Number(metrics.targetCPC) : undefined,
      targetROAS: metrics.targetROAS ? Number(metrics.targetROAS) : undefined,
    };

    await onSubmit(data);
  };

  const setMetric = (key: string, value: string) => {
    setMetrics((prev) => ({ ...prev, [key]: value }));
  };

  // Contextual labels based on plan type
  const channelLabel = planType === 'DESIGN' ? 'Kênh thiết kế' : planType === 'CONTENT' ? 'Kênh nội dung' : 'Kênh media';
  const typeLabel = planType === 'DESIGN' ? 'Loại sản phẩm' : planType === 'CONTENT' ? 'Loại nội dung' : 'Loại chiến dịch';
  const objectiveLabel = planType === 'DESIGN' ? 'Mục tiêu thiết kế' : planType === 'CONTENT' ? 'Mục tiêu nội dung' : 'Mục tiêu';
  const dialogTitle = isEditing
    ? `Chỉnh sửa ${planType === 'DESIGN' ? 'sản phẩm' : planType === 'CONTENT' ? 'nội dung' : 'kênh'}`
    : `Thêm ${planType === 'DESIGN' ? 'sản phẩm thiết kế' : planType === 'CONTENT' ? 'nội dung' : 'kênh media'}`;
  const submitLabel = isEditing ? 'Lưu thay đổi' : `Thêm ${planType === 'DESIGN' ? 'sản phẩm' : planType === 'CONTENT' ? 'nội dung' : 'kênh'}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-headline font-semibold">
            {dialogTitle}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          {/* Channel */}
          <div className="space-y-2">
            <Label className="text-footnote font-medium">
              {channelLabel} <span className="text-[#ff3b30]">*</span>
            </Label>
            <Select value={channel} onValueChange={setChannel}>
              <SelectTrigger className="h-11 rounded-xl bg-surface border-0">
                <SelectValue placeholder={`Chọn ${channelLabel.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {MEDIA_CHANNELS_BY_TYPE[planType].map((c) => (
                  <SelectItem key={c.value} value={c.value} className="rounded-lg">
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.channel && (
              <p className="text-caption text-[#ff3b30]">{errors.channel}</p>
            )}
          </div>

          {/* Campaign Type */}
          <div className="space-y-2">
            <Label className="text-footnote font-medium">
              {typeLabel} <span className="text-[#ff3b30]">*</span>
            </Label>
            <Select value={campaignType} onValueChange={setCampaignType}>
              <SelectTrigger className="h-11 rounded-xl bg-surface border-0">
                <SelectValue placeholder={`Chọn ${typeLabel.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {CAMPAIGN_TYPES_BY_TYPE[planType].map((c) => (
                  <SelectItem key={c.value} value={c.value} className="rounded-lg">
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.campaignType && (
              <p className="text-caption text-[#ff3b30]">{errors.campaignType}</p>
            )}
          </div>

          {/* Objective */}
          <div className="space-y-2">
            <Label className="text-footnote font-medium">
              {objectiveLabel} <span className="text-[#ff3b30]">*</span>
            </Label>
            <Select value={objective} onValueChange={setObjective}>
              <SelectTrigger className="h-11 rounded-xl bg-surface border-0">
                <SelectValue placeholder={`Chọn ${objectiveLabel.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {CAMPAIGN_OBJECTIVES_BY_TYPE[planType].map((c) => (
                  <SelectItem key={c.value} value={c.value} className="rounded-lg">
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.objective && (
              <p className="text-caption text-[#ff3b30]">{errors.objective}</p>
            )}
          </div>

          {/* Budget */}
          <div className="space-y-2">
            <Label className="text-footnote font-medium">
              Ngân sách (VND) <span className="text-[#ff3b30]">*</span>
            </Label>
            <Input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="VD: 10000000"
              min={0}
              className="h-11 rounded-xl bg-surface border-0"
            />
            {errors.budget && (
              <p className="text-caption text-[#ff3b30]">{errors.budget}</p>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-footnote font-medium">
                Ngày bắt đầu {!isEditing && <span className="text-[#ff3b30]">*</span>}
              </Label>
              <Input
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
              <Label className="text-footnote font-medium">
                Ngày kết thúc {!isEditing && <span className="text-[#ff3b30]">*</span>}
              </Label>
              <Input
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

          {/* Dynamic Target Metrics - changes per plan type */}
          <div className="space-y-3">
            <Label className="text-footnote font-medium text-muted-foreground">
              Chỉ tiêu mục tiêu (tùy chọn)
            </Label>
            <div className="grid grid-cols-2 gap-3">
              {metricFields.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <Label className="text-caption text-muted-foreground">
                    {field.label}
                  </Label>
                  <Input
                    type="number"
                    value={metrics[field.key] ?? ''}
                    onChange={(e) => setMetric(field.key, e.target.value)}
                    placeholder={field.placeholder ?? '0'}
                    min={0}
                    step={field.step}
                    className="h-10 rounded-xl bg-surface border-0 text-footnote"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="rounded-full px-5"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full px-6 bg-primary"
            >
              {isSubmitting
                ? isEditing ? 'Đang lưu...' : 'Đang thêm...'
                : submitLabel}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
