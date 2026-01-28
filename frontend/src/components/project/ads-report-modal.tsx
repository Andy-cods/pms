'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateAdsReport } from '@/hooks/use-ads-reports';
import {
  AdsPlatformLabels,
  AdsReportPeriodLabels,
  type AdsPlatform,
  type AdsReportPeriod,
} from '@/lib/api/ads-reports';

interface AdsReportModalProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdsReportModal({ projectId, open, onOpenChange }: AdsReportModalProps) {
  const createMutation = useCreateAdsReport(projectId);

  const [period, setPeriod] = useState<AdsReportPeriod>('DAILY');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [platform, setPlatform] = useState<AdsPlatform>('FACEBOOK');
  const [campaignName, setCampaignName] = useState('');
  const [impressions, setImpressions] = useState(0);
  const [clicks, setClicks] = useState(0);
  const [ctr, setCtr] = useState(0);
  const [cpc, setCpc] = useState(0);
  const [cpm, setCpm] = useState(0);
  const [cpa, setCpa] = useState(0);
  const [conversions, setConversions] = useState(0);
  const [roas, setRoas] = useState(0);
  const [adSpend, setAdSpend] = useState(0);

  const resetForm = () => {
    setPeriod('DAILY');
    setReportDate(new Date().toISOString().split('T')[0]);
    setPlatform('FACEBOOK');
    setCampaignName('');
    setImpressions(0);
    setClicks(0);
    setCtr(0);
    setCpc(0);
    setCpm(0);
    setCpa(0);
    setConversions(0);
    setRoas(0);
    setAdSpend(0);
  };

  const handleSubmit = async () => {
    if (!reportDate) {
      toast.error('Vui lòng chọn ngày báo cáo');
      return;
    }

    try {
      await createMutation.mutateAsync({
        period,
        reportDate,
        platform,
        campaignName: campaignName || undefined,
        impressions,
        clicks,
        ctr,
        cpc,
        cpm,
        cpa,
        conversions,
        roas,
        adSpend,
      });
      toast.success('Đã thêm báo cáo quảng cáo');
      resetForm();
      onOpenChange(false);
    } catch {
      toast.error('Không thể thêm báo cáo');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] rounded-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Thêm báo cáo quảng cáo</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Row 1: Period, Date, Platform */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Kỳ báo cáo</Label>
              <Select value={period} onValueChange={(v) => setPeriod(v as AdsReportPeriod)}>
                <SelectTrigger className="h-9 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(AdsReportPeriodLabels) as AdsReportPeriod[]).map((p) => (
                    <SelectItem key={p} value={p}>{AdsReportPeriodLabels[p]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Ngày báo cáo</Label>
              <Input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="h-9 rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Nền tảng</Label>
              <Select value={platform} onValueChange={(v) => setPlatform(v as AdsPlatform)}>
                <SelectTrigger className="h-9 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(AdsPlatformLabels) as AdsPlatform[]).map((p) => (
                    <SelectItem key={p} value={p}>{AdsPlatformLabels[p]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Campaign name */}
          <div className="space-y-1.5">
            <Label className="text-xs">Tên chiến dịch (tùy chọn)</Label>
            <Input
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="VD: Summer Sale 2026"
              className="h-9 rounded-lg"
            />
          </div>

          {/* Metrics grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Impressions</Label>
              <Input
                type="number"
                min={0}
                value={impressions}
                onChange={(e) => setImpressions(Number(e.target.value))}
                className="h-9 rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Clicks</Label>
              <Input
                type="number"
                min={0}
                value={clicks}
                onChange={(e) => setClicks(Number(e.target.value))}
                className="h-9 rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">CTR (%)</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={ctr}
                onChange={(e) => setCtr(Number(e.target.value))}
                className="h-9 rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">CPC (đ)</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={cpc}
                onChange={(e) => setCpc(Number(e.target.value))}
                className="h-9 rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">CPM (đ)</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={cpm}
                onChange={(e) => setCpm(Number(e.target.value))}
                className="h-9 rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">CPA (đ)</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={cpa}
                onChange={(e) => setCpa(Number(e.target.value))}
                className="h-9 rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Conversions</Label>
              <Input
                type="number"
                min={0}
                value={conversions}
                onChange={(e) => setConversions(Number(e.target.value))}
                className="h-9 rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">ROAS</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={roas}
                onChange={(e) => setRoas(Number(e.target.value))}
                className="h-9 rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Chi tiêu (đ)</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={adSpend}
                onChange={(e) => setAdSpend(Number(e.target.value))}
                className="h-9 rounded-lg"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-full"
          >
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createMutation.isPending}
            className="rounded-full"
          >
            {createMutation.isPending ? 'Đang lưu...' : 'Thêm báo cáo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
