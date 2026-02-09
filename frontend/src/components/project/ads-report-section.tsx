'use client';

import { useState } from 'react';
import { Plus, Eye, Users, MousePointerClick, DollarSign, MessageCircle, Inbox, Target, Wallet, UserPlus, CheckCircle, XCircle, TrendingUp, ShoppingCart, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
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
import {
  useAdsReportMessage,
  useAdsReportMessageSummary,
  useCreateAdsReportMessage,
  useAdsReportLead,
  useAdsReportLeadSummary,
  useCreateAdsReportLead,
  useAdsReportConversion,
  useAdsReportConversionSummary,
  useCreateAdsReportConversion,
} from '@/hooks/use-ads-reports';
import {
  AdsPlatformLabels,
  AdsReportPeriodLabels,
  type AdsPlatform,
  type AdsReportPeriod,
  type AdsReportTemplate,
} from '@/lib/api/ads-reports';

// ============================================
// UTILITIES
// ============================================

const formatNumber = (value: number) => value.toLocaleString('vi-VN');
const formatCurrency = (value: number) => `${value.toLocaleString('vi-VN')} đ`;
const formatPercent = (value: number) => `${value.toFixed(2)}%`;

// ============================================
// MAIN SECTION COMPONENT
// ============================================

interface AdsReportSectionProps {
  projectId: string;
}

export function AdsReportSection({ projectId }: AdsReportSectionProps) {
  const [template, setTemplate] = useState<AdsReportTemplate>('message');

  return (
    <div className="space-y-4">
      <Tabs value={template} onValueChange={(v) => setTemplate(v as AdsReportTemplate)}>
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="message" className="text-xs">Tin nhắn</TabsTrigger>
          <TabsTrigger value="lead" className="text-xs">Lead</TabsTrigger>
          <TabsTrigger value="conversion" className="text-xs">Chuyển đổi</TabsTrigger>
        </TabsList>

        <TabsContent value="message" className="space-y-4 mt-4">
          <MessageKpiCards projectId={projectId} />
          <MessageTable projectId={projectId} />
        </TabsContent>

        <TabsContent value="lead" className="space-y-4 mt-4">
          <LeadKpiCards projectId={projectId} />
          <LeadTable projectId={projectId} />
        </TabsContent>

        <TabsContent value="conversion" className="space-y-4 mt-4">
          <ConversionKpiCards projectId={projectId} />
          <ConversionTable projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================
// MESSAGE TEMPLATE COMPONENTS
// ============================================

function MessageKpiCards({ projectId }: { projectId: string }) {
  const { data: summary, isLoading } = useAdsReportMessageSummary(projectId);

  const kpis = [
    { key: 'totalImpressions', label: 'Impressions', icon: Eye, format: formatNumber, color: 'text-blue-600' },
    { key: 'totalReach', label: 'Reach', icon: Users, format: formatNumber, color: 'text-purple-600' },
    { key: 'totalClicks', label: 'Clicks', icon: MousePointerClick, format: formatNumber, color: 'text-green-600' },
    { key: 'totalAdSpend', label: 'Chi tiêu', icon: DollarSign, format: formatCurrency, color: 'text-orange-600' },
    { key: 'totalMessagingConversations', label: 'Hội thoại', icon: MessageCircle, format: formatNumber, color: 'text-cyan-600' },
    { key: 'totalInboxConversions', label: 'Inbox CV', icon: Inbox, format: formatNumber, color: 'text-pink-600' },
    { key: 'avgQualifiedRate', label: 'Qualified', icon: Target, format: formatPercent, color: 'text-emerald-600' },
    { key: 'avgCostPerConversation', label: 'Chi phí/HT', icon: Wallet, format: formatCurrency, color: 'text-amber-600' },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="rounded-xl">
            <CardContent className="p-3">
              <Skeleton className="h-4 w-4 mb-2" />
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-3 w-12 mt-1" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {kpis.map(({ key, label, icon: Icon, format, color }) => (
        <Card key={key} className="rounded-xl border-border/50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground">{label}</span>
            </div>
            <div className={`text-base font-semibold tabular-nums ${color}`}>
              {summary ? format(summary[key as keyof typeof summary] as number) : '-'}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function MessageTable({ projectId }: { projectId: string }) {
  const { data: reports, isLoading } = useAdsReportMessage(projectId);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Card className="rounded-xl border-border/50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Báo cáo Tin nhắn</CardTitle>
            <Button size="sm" onClick={() => setModalOpen(true)} className="h-8 text-xs rounded-lg">
              <Plus className="h-3.5 w-3.5 mr-1" /> Thêm
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && <Skeleton className="h-32 w-full" />}
          {!isLoading && (!reports || reports.length === 0) && (
            <p className="text-xs text-muted-foreground py-6 text-center">Chưa có báo cáo.</p>
          )}
          {!isLoading && reports && reports.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 font-medium">Ngày</th>
                    <th className="text-left py-2 font-medium">Platform</th>
                    <th className="text-right py-2 font-medium">Impr.</th>
                    <th className="text-right py-2 font-medium">Clicks</th>
                    <th className="text-right py-2 font-medium">Hội thoại</th>
                    <th className="text-right py-2 font-medium">Inbox CV</th>
                    <th className="text-right py-2 font-medium">Chi tiêu</th>
                    <th className="text-center py-2 font-medium">Nguồn</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr key={r.id} className="border-b border-border/30 hover:bg-muted/30">
                      <td className="py-2 tabular-nums">{new Date(r.reportDate).toLocaleDateString('vi-VN')}</td>
                      <td className="py-2">{AdsPlatformLabels[r.platform]}</td>
                      <td className="py-2 text-right tabular-nums">{formatNumber(r.impressions)}</td>
                      <td className="py-2 text-right tabular-nums">{formatNumber(r.clicks)}</td>
                      <td className="py-2 text-right tabular-nums">{formatNumber(r.messagingConversationsStarted)}</td>
                      <td className="py-2 text-right tabular-nums">{formatNumber(r.inboxConversions)}</td>
                      <td className="py-2 text-right tabular-nums font-medium">{formatCurrency(r.adSpend)}</td>
                      <td className="py-2 text-center">
                        <Badge variant={r.source === 'ZAPIER' ? 'default' : 'secondary'} className="text-[10px]">
                          {r.source === 'ZAPIER' ? 'Zapier' : 'Manual'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <MessageModal projectId={projectId} open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
}

function MessageModal({ projectId, open, onOpenChange }: { projectId: string; open: boolean; onOpenChange: (open: boolean) => void }) {
  const createMutation = useCreateAdsReportMessage(projectId);
  const [form, setForm] = useState({
    period: 'DAILY' as AdsReportPeriod,
    reportDate: new Date().toISOString().split('T')[0],
    platform: 'FACEBOOK' as AdsPlatform,
    campaignName: '',
    impressions: 0, reach: 0, clicks: 0, videoViews: 0, postComments: 0, engagement: 0,
    ctr: 0, cpm: 0, cpc: 0, adSpend: 0,
    welcomeMessageViews: 0, messagingConversationsStarted: 0, costPerMessagingConversation: 0,
    messagingConversationsReplied: 0, inboxConversions: 0, qualifiedRate: 0,
  });

  const handleSubmit = async () => {
    try {
      await createMutation.mutateAsync({ ...form, campaignName: form.campaignName || undefined });
      toast.success('Đã thêm báo cáo');
      onOpenChange(false);
    } catch {
      toast.error('Không thể thêm báo cáo');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto rounded-xl">
        <DialogHeader>
          <DialogTitle>Thêm báo cáo Tin nhắn</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Kỳ</Label>
              <Select value={form.period} onValueChange={(v) => setForm({ ...form, period: v as AdsReportPeriod })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(AdsReportPeriodLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Ngày</Label>
              <Input type="date" value={form.reportDate} onChange={(e) => setForm({ ...form, reportDate: e.target.value })} className="h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Nền tảng</Label>
              <Select value={form.platform} onValueChange={(v) => setForm({ ...form, platform: v as AdsPlatform })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(AdsPlatformLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Input placeholder="Tên chiến dịch (tùy chọn)" value={form.campaignName} onChange={(e) => setForm({ ...form, campaignName: e.target.value })} className="h-8 text-xs" />

          <Separator />

          {/* Delivery & Traffic */}
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-2">Delivery & Traffic</h4>
            <div className="grid grid-cols-3 gap-3">
              <NumInput label="Impressions" value={form.impressions} onChange={(v) => setForm({ ...form, impressions: v })} />
              <NumInput label="Reach" value={form.reach} onChange={(v) => setForm({ ...form, reach: v })} />
              <NumInput label="Clicks" value={form.clicks} onChange={(v) => setForm({ ...form, clicks: v })} />
              <NumInput label="Video Views" value={form.videoViews} onChange={(v) => setForm({ ...form, videoViews: v })} />
              <NumInput label="Bình luận" value={form.postComments} onChange={(v) => setForm({ ...form, postComments: v })} />
              <NumInput label="Tương tác" value={form.engagement} onChange={(v) => setForm({ ...form, engagement: v })} />
            </div>
          </div>

          {/* Cost */}
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-2">Cost</h4>
            <div className="grid grid-cols-4 gap-3">
              <NumInput label="CTR (%)" value={form.ctr} onChange={(v) => setForm({ ...form, ctr: v })} step={0.01} />
              <NumInput label="CPM (đ)" value={form.cpm} onChange={(v) => setForm({ ...form, cpm: v })} />
              <NumInput label="CPC (đ)" value={form.cpc} onChange={(v) => setForm({ ...form, cpc: v })} />
              <NumInput label="Chi tiêu (đ)" value={form.adSpend} onChange={(v) => setForm({ ...form, adSpend: v })} />
            </div>
          </div>

          <Separator />

          {/* Message Specific */}
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-2">Chỉ số Tin nhắn</h4>
            <div className="grid grid-cols-3 gap-3">
              <NumInput label="Lượt xem tin chào" value={form.welcomeMessageViews} onChange={(v) => setForm({ ...form, welcomeMessageViews: v })} />
              <NumInput label="Hội thoại bắt đầu" value={form.messagingConversationsStarted} onChange={(v) => setForm({ ...form, messagingConversationsStarted: v })} />
              <NumInput label="Chi phí/HT (đ)" value={form.costPerMessagingConversation} onChange={(v) => setForm({ ...form, costPerMessagingConversation: v })} />
              <NumInput label="HT đã trả lời" value={form.messagingConversationsReplied} onChange={(v) => setForm({ ...form, messagingConversationsReplied: v })} />
              <NumInput label="Inbox CV" value={form.inboxConversions} onChange={(v) => setForm({ ...form, inboxConversions: v })} />
              <NumInput label="Qualified (%)" value={form.qualifiedRate} onChange={(v) => setForm({ ...form, qualifiedRate: v })} step={0.01} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="text-xs">Hủy</Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending} className="text-xs">
            {createMutation.isPending ? 'Đang lưu...' : 'Thêm báo cáo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// LEAD TEMPLATE COMPONENTS
// ============================================

function LeadKpiCards({ projectId }: { projectId: string }) {
  const { data: summary, isLoading } = useAdsReportLeadSummary(projectId);

  const kpis = [
    { key: 'totalImpressions', label: 'Impressions', icon: Eye, format: formatNumber, color: 'text-blue-600' },
    { key: 'totalReach', label: 'Reach', icon: Users, format: formatNumber, color: 'text-purple-600' },
    { key: 'totalClicks', label: 'Clicks', icon: MousePointerClick, format: formatNumber, color: 'text-green-600' },
    { key: 'totalAdSpend', label: 'Chi tiêu', icon: DollarSign, format: formatCurrency, color: 'text-orange-600' },
    { key: 'totalLeads', label: 'Leads', icon: UserPlus, format: formatNumber, color: 'text-cyan-600' },
    { key: 'totalValidLeads', label: 'Lead hợp lệ', icon: CheckCircle, format: formatNumber, color: 'text-emerald-600' },
    { key: 'avgCostPerLead', label: 'CPL', icon: Wallet, format: formatCurrency, color: 'text-amber-600' },
    { key: 'avgQualifiedLeadRate', label: 'Qualified', icon: Target, format: formatPercent, color: 'text-pink-600' },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="rounded-xl">
            <CardContent className="p-3">
              <Skeleton className="h-4 w-4 mb-2" />
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-3 w-12 mt-1" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {kpis.map(({ key, label, icon: Icon, format, color }) => (
        <Card key={key} className="rounded-xl border-border/50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground">{label}</span>
            </div>
            <div className={`text-base font-semibold tabular-nums ${color}`}>
              {summary ? format(summary[key as keyof typeof summary] as number) : '-'}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function LeadTable({ projectId }: { projectId: string }) {
  const { data: reports, isLoading } = useAdsReportLead(projectId);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Card className="rounded-xl border-border/50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Báo cáo Lead</CardTitle>
            <Button size="sm" onClick={() => setModalOpen(true)} className="h-8 text-xs rounded-lg">
              <Plus className="h-3.5 w-3.5 mr-1" /> Thêm
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && <Skeleton className="h-32 w-full" />}
          {!isLoading && (!reports || reports.length === 0) && (
            <p className="text-xs text-muted-foreground py-6 text-center">Chưa có báo cáo.</p>
          )}
          {!isLoading && reports && reports.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 font-medium">Ngày</th>
                    <th className="text-left py-2 font-medium">Platform</th>
                    <th className="text-right py-2 font-medium">Impr.</th>
                    <th className="text-right py-2 font-medium">Clicks</th>
                    <th className="text-right py-2 font-medium">Leads</th>
                    <th className="text-right py-2 font-medium">Valid</th>
                    <th className="text-right py-2 font-medium">CPL</th>
                    <th className="text-right py-2 font-medium">Chi tiêu</th>
                    <th className="text-center py-2 font-medium">Nguồn</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr key={r.id} className="border-b border-border/30 hover:bg-muted/30">
                      <td className="py-2 tabular-nums">{new Date(r.reportDate).toLocaleDateString('vi-VN')}</td>
                      <td className="py-2">{AdsPlatformLabels[r.platform]}</td>
                      <td className="py-2 text-right tabular-nums">{formatNumber(r.impressions)}</td>
                      <td className="py-2 text-right tabular-nums">{formatNumber(r.clicks)}</td>
                      <td className="py-2 text-right tabular-nums">{formatNumber(r.leads)}</td>
                      <td className="py-2 text-right tabular-nums">{formatNumber(r.validLeads)}</td>
                      <td className="py-2 text-right tabular-nums">{formatCurrency(r.costPerLead)}</td>
                      <td className="py-2 text-right tabular-nums font-medium">{formatCurrency(r.adSpend)}</td>
                      <td className="py-2 text-center">
                        <Badge variant={r.source === 'ZAPIER' ? 'default' : 'secondary'} className="text-[10px]">
                          {r.source === 'ZAPIER' ? 'Zapier' : 'Manual'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <LeadModal projectId={projectId} open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
}

function LeadModal({ projectId, open, onOpenChange }: { projectId: string; open: boolean; onOpenChange: (open: boolean) => void }) {
  const createMutation = useCreateAdsReportLead(projectId);
  const [form, setForm] = useState({
    period: 'DAILY' as AdsReportPeriod,
    reportDate: new Date().toISOString().split('T')[0],
    platform: 'FACEBOOK' as AdsPlatform,
    campaignName: '',
    impressions: 0, reach: 0, clicks: 0, videoViews: 0, postComments: 0, engagement: 0,
    ctr: 0, cpm: 0, cpc: 0, adSpend: 0,
    leads: 0, costPerLead: 0, validLeads: 0, invalidLeads: 0, qualifiedLeadRate: 0,
  });

  const handleSubmit = async () => {
    try {
      await createMutation.mutateAsync({ ...form, campaignName: form.campaignName || undefined });
      toast.success('Đã thêm báo cáo');
      onOpenChange(false);
    } catch {
      toast.error('Không thể thêm báo cáo');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto rounded-xl">
        <DialogHeader>
          <DialogTitle>Thêm báo cáo Lead</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Kỳ</Label>
              <Select value={form.period} onValueChange={(v) => setForm({ ...form, period: v as AdsReportPeriod })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(AdsReportPeriodLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Ngày</Label>
              <Input type="date" value={form.reportDate} onChange={(e) => setForm({ ...form, reportDate: e.target.value })} className="h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Nền tảng</Label>
              <Select value={form.platform} onValueChange={(v) => setForm({ ...form, platform: v as AdsPlatform })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(AdsPlatformLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Input placeholder="Tên chiến dịch (tùy chọn)" value={form.campaignName} onChange={(e) => setForm({ ...form, campaignName: e.target.value })} className="h-8 text-xs" />

          <Separator />

          {/* Delivery & Cost */}
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-2">Delivery & Cost</h4>
            <div className="grid grid-cols-4 gap-3">
              <NumInput label="Impressions" value={form.impressions} onChange={(v) => setForm({ ...form, impressions: v })} />
              <NumInput label="Reach" value={form.reach} onChange={(v) => setForm({ ...form, reach: v })} />
              <NumInput label="Clicks" value={form.clicks} onChange={(v) => setForm({ ...form, clicks: v })} />
              <NumInput label="Chi tiêu (đ)" value={form.adSpend} onChange={(v) => setForm({ ...form, adSpend: v })} />
            </div>
          </div>

          <Separator />

          {/* Lead Specific */}
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-2">Chỉ số Lead</h4>
            <div className="grid grid-cols-3 gap-3">
              <NumInput label="Leads" value={form.leads} onChange={(v) => setForm({ ...form, leads: v })} />
              <NumInput label="CPL (đ)" value={form.costPerLead} onChange={(v) => setForm({ ...form, costPerLead: v })} />
              <NumInput label="Lead hợp lệ" value={form.validLeads} onChange={(v) => setForm({ ...form, validLeads: v })} />
              <NumInput label="Lead không hợp lệ" value={form.invalidLeads} onChange={(v) => setForm({ ...form, invalidLeads: v })} />
              <NumInput label="Qualified (%)" value={form.qualifiedLeadRate} onChange={(v) => setForm({ ...form, qualifiedLeadRate: v })} step={0.01} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="text-xs">Hủy</Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending} className="text-xs">
            {createMutation.isPending ? 'Đang lưu...' : 'Thêm báo cáo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// CONVERSION TEMPLATE COMPONENTS
// ============================================

function ConversionKpiCards({ projectId }: { projectId: string }) {
  const { data: summary, isLoading } = useAdsReportConversionSummary(projectId);

  const kpis = [
    { key: 'totalImpressions', label: 'Impressions', icon: Eye, format: formatNumber, color: 'text-blue-600' },
    { key: 'totalReach', label: 'Reach', icon: Users, format: formatNumber, color: 'text-purple-600' },
    { key: 'totalClicks', label: 'Clicks', icon: MousePointerClick, format: formatNumber, color: 'text-green-600' },
    { key: 'totalAdSpend', label: 'Chi tiêu', icon: DollarSign, format: formatCurrency, color: 'text-orange-600' },
    { key: 'totalConversions', label: 'Conversions', icon: ShoppingCart, format: formatNumber, color: 'text-cyan-600' },
    { key: 'totalRevenue', label: 'Doanh thu', icon: BarChart3, format: formatCurrency, color: 'text-emerald-600' },
    { key: 'avgRoas', label: 'ROAS', icon: TrendingUp, format: (v: number) => `${v.toFixed(2)}x`, color: 'text-amber-600' },
    { key: 'avgAov', label: 'AOV', icon: Wallet, format: formatCurrency, color: 'text-pink-600' },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="rounded-xl">
            <CardContent className="p-3">
              <Skeleton className="h-4 w-4 mb-2" />
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-3 w-12 mt-1" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {kpis.map(({ key, label, icon: Icon, format, color }) => (
        <Card key={key} className="rounded-xl border-border/50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground">{label}</span>
            </div>
            <div className={`text-base font-semibold tabular-nums ${color}`}>
              {summary ? format(summary[key as keyof typeof summary] as number) : '-'}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ConversionTable({ projectId }: { projectId: string }) {
  const { data: reports, isLoading } = useAdsReportConversion(projectId);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Card className="rounded-xl border-border/50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Báo cáo Chuyển đổi</CardTitle>
            <Button size="sm" onClick={() => setModalOpen(true)} className="h-8 text-xs rounded-lg">
              <Plus className="h-3.5 w-3.5 mr-1" /> Thêm
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && <Skeleton className="h-32 w-full" />}
          {!isLoading && (!reports || reports.length === 0) && (
            <p className="text-xs text-muted-foreground py-6 text-center">Chưa có báo cáo.</p>
          )}
          {!isLoading && reports && reports.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 font-medium">Ngày</th>
                    <th className="text-left py-2 font-medium">Platform</th>
                    <th className="text-right py-2 font-medium">Impr.</th>
                    <th className="text-right py-2 font-medium">Clicks</th>
                    <th className="text-right py-2 font-medium">Conv.</th>
                    <th className="text-right py-2 font-medium">Revenue</th>
                    <th className="text-right py-2 font-medium">ROAS</th>
                    <th className="text-right py-2 font-medium">Chi tiêu</th>
                    <th className="text-center py-2 font-medium">Nguồn</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr key={r.id} className="border-b border-border/30 hover:bg-muted/30">
                      <td className="py-2 tabular-nums">{new Date(r.reportDate).toLocaleDateString('vi-VN')}</td>
                      <td className="py-2">{AdsPlatformLabels[r.platform]}</td>
                      <td className="py-2 text-right tabular-nums">{formatNumber(r.impressions)}</td>
                      <td className="py-2 text-right tabular-nums">{formatNumber(r.clicks)}</td>
                      <td className="py-2 text-right tabular-nums">{formatNumber(r.conversions)}</td>
                      <td className="py-2 text-right tabular-nums">{formatCurrency(r.revenue)}</td>
                      <td className="py-2 text-right tabular-nums">{r.roas.toFixed(2)}x</td>
                      <td className="py-2 text-right tabular-nums font-medium">{formatCurrency(r.adSpend)}</td>
                      <td className="py-2 text-center">
                        <Badge variant={r.source === 'ZAPIER' ? 'default' : 'secondary'} className="text-[10px]">
                          {r.source === 'ZAPIER' ? 'Zapier' : 'Manual'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <ConversionModal projectId={projectId} open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
}

function ConversionModal({ projectId, open, onOpenChange }: { projectId: string; open: boolean; onOpenChange: (open: boolean) => void }) {
  const createMutation = useCreateAdsReportConversion(projectId);
  const [form, setForm] = useState({
    period: 'DAILY' as AdsReportPeriod,
    reportDate: new Date().toISOString().split('T')[0],
    platform: 'FACEBOOK' as AdsPlatform,
    campaignName: '',
    impressions: 0, reach: 0, clicks: 0, videoViews: 0, postComments: 0, engagement: 0,
    ctr: 0, cpm: 0, cpc: 0, adSpend: 0,
    conversions: 0, cpa: 0, conversionRate: 0, revenue: 0, roas: 0, aov: 0,
  });

  const handleSubmit = async () => {
    try {
      await createMutation.mutateAsync({ ...form, campaignName: form.campaignName || undefined });
      toast.success('Đã thêm báo cáo');
      onOpenChange(false);
    } catch {
      toast.error('Không thể thêm báo cáo');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto rounded-xl">
        <DialogHeader>
          <DialogTitle>Thêm báo cáo Chuyển đổi</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Kỳ</Label>
              <Select value={form.period} onValueChange={(v) => setForm({ ...form, period: v as AdsReportPeriod })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(AdsReportPeriodLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Ngày</Label>
              <Input type="date" value={form.reportDate} onChange={(e) => setForm({ ...form, reportDate: e.target.value })} className="h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Nền tảng</Label>
              <Select value={form.platform} onValueChange={(v) => setForm({ ...form, platform: v as AdsPlatform })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(AdsPlatformLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Input placeholder="Tên chiến dịch (tùy chọn)" value={form.campaignName} onChange={(e) => setForm({ ...form, campaignName: e.target.value })} className="h-8 text-xs" />

          <Separator />

          {/* Delivery & Cost */}
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-2">Delivery & Cost</h4>
            <div className="grid grid-cols-4 gap-3">
              <NumInput label="Impressions" value={form.impressions} onChange={(v) => setForm({ ...form, impressions: v })} />
              <NumInput label="Reach" value={form.reach} onChange={(v) => setForm({ ...form, reach: v })} />
              <NumInput label="Clicks" value={form.clicks} onChange={(v) => setForm({ ...form, clicks: v })} />
              <NumInput label="Chi tiêu (đ)" value={form.adSpend} onChange={(v) => setForm({ ...form, adSpend: v })} />
            </div>
          </div>

          <Separator />

          {/* Conversion Specific */}
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-2">Chỉ số Chuyển đổi</h4>
            <div className="grid grid-cols-3 gap-3">
              <NumInput label="Conversions" value={form.conversions} onChange={(v) => setForm({ ...form, conversions: v })} />
              <NumInput label="CPA (đ)" value={form.cpa} onChange={(v) => setForm({ ...form, cpa: v })} />
              <NumInput label="Tỷ lệ CV (%)" value={form.conversionRate} onChange={(v) => setForm({ ...form, conversionRate: v })} step={0.01} />
              <NumInput label="Doanh thu (đ)" value={form.revenue} onChange={(v) => setForm({ ...form, revenue: v })} />
              <NumInput label="ROAS" value={form.roas} onChange={(v) => setForm({ ...form, roas: v })} step={0.01} />
              <NumInput label="AOV (đ)" value={form.aov} onChange={(v) => setForm({ ...form, aov: v })} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="text-xs">Hủy</Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending} className="text-xs">
            {createMutation.isPending ? 'Đang lưu...' : 'Thêm báo cáo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// HELPER COMPONENTS
// ============================================

function NumInput({ label, value, onChange, step = 1 }: { label: string; value: number; onChange: (v: number) => void; step?: number }) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] text-muted-foreground">{label}</Label>
      <Input
        type="number"
        min={0}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-8 text-xs"
      />
    </div>
  );
}
