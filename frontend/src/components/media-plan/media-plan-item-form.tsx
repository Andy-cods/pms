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
  type CreateMediaPlanItemInput,
  type UpdateMediaPlanItemInput,
  MEDIA_CHANNELS,
  CAMPAIGN_TYPES,
  CAMPAIGN_OBJECTIVES,
} from '@/lib/api/media-plans';

interface MediaPlanItemFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: MediaPlanItem;
  onSubmit: (input: CreateMediaPlanItemInput) => Promise<void>;
  isSubmitting: boolean;
}

export function MediaPlanItemForm({
  open,
  onOpenChange,
  item,
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
  const [targetReach, setTargetReach] = useState('');
  const [targetClicks, setTargetClicks] = useState('');
  const [targetLeads, setTargetLeads] = useState('');
  const [targetCPL, setTargetCPL] = useState('');
  const [targetCPC, setTargetCPC] = useState('');
  const [targetROAS, setTargetROAS] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (item) {
      setChannel(item.channel);
      setCampaignType(item.campaignType);
      setObjective(item.objective);
      setBudget(String(item.budget));
      setStartDate(item.startDate.split('T')[0]);
      setEndDate(item.endDate.split('T')[0]);
      setTargetReach(item.targetReach ? String(item.targetReach) : '');
      setTargetClicks(item.targetClicks ? String(item.targetClicks) : '');
      setTargetLeads(item.targetLeads ? String(item.targetLeads) : '');
      setTargetCPL(item.targetCPL ? String(item.targetCPL) : '');
      setTargetCPC(item.targetCPC ? String(item.targetCPC) : '');
      setTargetROAS(item.targetROAS ? String(item.targetROAS) : '');
    } else {
      setChannel('');
      setCampaignType('');
      setObjective('');
      setBudget('');
      setStartDate('');
      setEndDate('');
      setTargetReach('');
      setTargetClicks('');
      setTargetLeads('');
      setTargetCPL('');
      setTargetCPC('');
      setTargetROAS('');
    }
    setErrors({});
  }, [item, open]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!channel) newErrors.channel = 'Vui lòng chọn kênh';
    if (!campaignType) newErrors.campaignType = 'Vui lòng chọn loại chiến dịch';
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
      targetReach: targetReach ? Number(targetReach) : undefined,
      targetClicks: targetClicks ? Number(targetClicks) : undefined,
      targetLeads: targetLeads ? Number(targetLeads) : undefined,
      targetCPL: targetCPL ? Number(targetCPL) : undefined,
      targetCPC: targetCPC ? Number(targetCPC) : undefined,
      targetROAS: targetROAS ? Number(targetROAS) : undefined,
    };

    await onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-headline font-semibold">
            {isEditing ? 'Chỉnh sửa kênh' : 'Thêm kênh media'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          {/* Channel */}
          <div className="space-y-2">
            <Label className="text-footnote font-medium">
              Kênh <span className="text-[#ff3b30]">*</span>
            </Label>
            <Select value={channel} onValueChange={setChannel}>
              <SelectTrigger className="h-11 rounded-xl bg-surface border-0">
                <SelectValue placeholder="Chọn kênh media" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {MEDIA_CHANNELS.map((c) => (
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
              Loại chiến dịch <span className="text-[#ff3b30]">*</span>
            </Label>
            <Select value={campaignType} onValueChange={setCampaignType}>
              <SelectTrigger className="h-11 rounded-xl bg-surface border-0">
                <SelectValue placeholder="Chọn loại chiến dịch" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {CAMPAIGN_TYPES.map((c) => (
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
              Mục tiêu <span className="text-[#ff3b30]">*</span>
            </Label>
            <Select value={objective} onValueChange={setObjective}>
              <SelectTrigger className="h-11 rounded-xl bg-surface border-0">
                <SelectValue placeholder="Chọn mục tiêu" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {CAMPAIGN_OBJECTIVES.map((c) => (
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

          {/* Target Metrics */}
          <div className="space-y-3">
            <Label className="text-footnote font-medium text-muted-foreground">
              Chỉ tiêu mục tiêu (tùy chọn)
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-caption text-muted-foreground">
                  Target Reach
                </Label>
                <Input
                  type="number"
                  value={targetReach}
                  onChange={(e) => setTargetReach(e.target.value)}
                  placeholder="0"
                  min={0}
                  className="h-10 rounded-xl bg-surface border-0 text-footnote"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-caption text-muted-foreground">
                  Target Clicks
                </Label>
                <Input
                  type="number"
                  value={targetClicks}
                  onChange={(e) => setTargetClicks(e.target.value)}
                  placeholder="0"
                  min={0}
                  className="h-10 rounded-xl bg-surface border-0 text-footnote"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-caption text-muted-foreground">
                  Target Leads
                </Label>
                <Input
                  type="number"
                  value={targetLeads}
                  onChange={(e) => setTargetLeads(e.target.value)}
                  placeholder="0"
                  min={0}
                  className="h-10 rounded-xl bg-surface border-0 text-footnote"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-caption text-muted-foreground">
                  Target CPL (VND)
                </Label>
                <Input
                  type="number"
                  value={targetCPL}
                  onChange={(e) => setTargetCPL(e.target.value)}
                  placeholder="0"
                  min={0}
                  className="h-10 rounded-xl bg-surface border-0 text-footnote"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-caption text-muted-foreground">
                  Target CPC (VND)
                </Label>
                <Input
                  type="number"
                  value={targetCPC}
                  onChange={(e) => setTargetCPC(e.target.value)}
                  placeholder="0"
                  min={0}
                  className="h-10 rounded-xl bg-surface border-0 text-footnote"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-caption text-muted-foreground">
                  Target ROAS
                </Label>
                <Input
                  type="number"
                  value={targetROAS}
                  onChange={(e) => setTargetROAS(e.target.value)}
                  placeholder="0"
                  min={0}
                  step="0.1"
                  className="h-10 rounded-xl bg-surface border-0 text-footnote"
                />
              </div>
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
                : isEditing ? 'Lưu thay đổi' : 'Thêm kênh'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
