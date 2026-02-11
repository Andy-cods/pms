'use client';

import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Target, TrendingUp, Loader2, CalendarDays } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useProjectKpis, useCreateKpi, useUpdateKpi, useDeleteKpi } from '@/hooks/use-project-kpi';
import { KpiTypeOptions, KpiTypeLabels } from '@/lib/api/kpi';
import type { ProjectKPI, CreateKpiInput } from '@/lib/api/kpi';

interface KpiCardProps {
  projectId: string;
}

export function KpiCard({ projectId }: KpiCardProps) {
  const { data: kpis, isLoading } = useProjectKpis(projectId);
  const createKpi = useCreateKpi();
  const updateKpi = useUpdateKpi();
  const deleteKpi = useDeleteKpi();

  const [showForm, setShowForm] = useState(false);
  const [editingKpi, setEditingKpi] = useState<ProjectKPI | null>(null);
  const [showPeriodForm, setShowPeriodForm] = useState(false);
  const [newPeriodLabel, setNewPeriodLabel] = useState('');
  const [newPeriodStart, setNewPeriodStart] = useState('');
  const [newPeriodEnd, setNewPeriodEnd] = useState('');
  const [form, setForm] = useState<CreateKpiInput>({
    kpiType: '',
    targetValue: undefined,
    actualValue: undefined,
    unit: undefined,
    periodLabel: undefined,
    periodStart: undefined,
    periodEnd: undefined,
    targetDate: undefined,
  });

  // Group KPIs by period
  const { periods, kpisByPeriod } = useMemo(() => {
    if (!kpis) return { periods: ['Tổng quan'], kpisByPeriod: { 'Tổng quan': [] as ProjectKPI[] } };

    const grouped: Record<string, ProjectKPI[]> = {};
    const noPeriod: ProjectKPI[] = [];

    for (const kpi of kpis) {
      if (kpi.periodLabel) {
        if (!grouped[kpi.periodLabel]) grouped[kpi.periodLabel] = [];
        grouped[kpi.periodLabel].push(kpi);
      } else {
        noPeriod.push(kpi);
      }
    }

    const result: Record<string, ProjectKPI[]> = {};
    if (noPeriod.length > 0 || Object.keys(grouped).length === 0) {
      result['Tổng quan'] = noPeriod;
    }
    // Sort periods by periodStart date
    const sortedPeriods = Object.keys(grouped).sort((a, b) => {
      const aStart = grouped[a][0]?.periodStart;
      const bStart = grouped[b][0]?.periodStart;
      if (!aStart || !bStart) return 0;
      return new Date(aStart).getTime() - new Date(bStart).getTime();
    });
    for (const p of sortedPeriods) {
      result[p] = grouped[p];
    }

    return { periods: Object.keys(result), kpisByPeriod: result };
  }, [kpis]);

  const [activeTab, setActiveTab] = useState<string>(periods[0] || 'Tổng quan');

  const openCreate = (periodLabel?: string) => {
    const currentPeriodKpis = periodLabel ? kpisByPeriod[periodLabel] : [];
    const sample = currentPeriodKpis[0];
    setEditingKpi(null);
    setForm({
      kpiType: '',
      targetValue: undefined,
      actualValue: undefined,
      unit: undefined,
      periodLabel: periodLabel && periodLabel !== 'Tổng quan' ? periodLabel : undefined,
      periodStart: sample?.periodStart?.split('T')[0] || undefined,
      periodEnd: sample?.periodEnd?.split('T')[0] || undefined,
      targetDate: undefined,
    });
    setShowForm(true);
  };

  const openEdit = (kpi: ProjectKPI) => {
    setEditingKpi(kpi);
    setForm({
      kpiType: kpi.kpiType,
      targetValue: kpi.targetValue ?? undefined,
      actualValue: kpi.actualValue ?? undefined,
      unit: kpi.unit ?? undefined,
      periodLabel: kpi.periodLabel ?? undefined,
      periodStart: kpi.periodStart?.split('T')[0] ?? undefined,
      periodEnd: kpi.periodEnd?.split('T')[0] ?? undefined,
      targetDate: kpi.targetDate?.split('T')[0] ?? undefined,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.kpiType) {
      toast.error('Vui lòng chọn loại KPI');
      return;
    }

    try {
      if (editingKpi) {
        await updateKpi.mutateAsync({
          projectId,
          kpiId: editingKpi.id,
          input: form,
        });
        toast.success('Đã cập nhật KPI');
      } else {
        await createKpi.mutateAsync({ projectId, input: form });
        toast.success('Đã thêm KPI');
      }
      setShowForm(false);
    } catch {
      toast.error('Không thể lưu KPI');
    }
  };

  const handleDelete = async (kpiId: string) => {
    try {
      await deleteKpi.mutateAsync({ projectId, kpiId });
      toast.success('Đã xóa KPI');
    } catch {
      toast.error('Không thể xóa KPI');
    }
  };

  const handleTypeChange = (type: string) => {
    const option = KpiTypeOptions.find((o) => o.value === type);
    setForm((prev) => ({
      ...prev,
      kpiType: type,
      unit: option?.unit || prev.unit,
    }));
  };

  const handleAddPeriod = () => {
    if (!newPeriodLabel.trim()) {
      toast.error('Vui lòng nhập tên giai đoạn');
      return;
    }
    setShowPeriodForm(false);
    // Open create form with the new period
    setEditingKpi(null);
    setForm({
      kpiType: '',
      targetValue: undefined,
      actualValue: undefined,
      unit: undefined,
      periodLabel: newPeriodLabel.trim(),
      periodStart: newPeriodStart || undefined,
      periodEnd: newPeriodEnd || undefined,
      targetDate: undefined,
    });
    setActiveTab(newPeriodLabel.trim());
    setShowForm(true);
    setNewPeriodLabel('');
    setNewPeriodStart('');
    setNewPeriodEnd('');
  };

  if (isLoading) {
    return (
      <Card className="rounded-2xl border-border/50 shadow-apple-sm">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="rounded-2xl border-border/50 shadow-apple-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-subheadline font-semibold">
            KPIs dự án
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full h-9 px-4"
            onClick={() => openCreate(activeTab)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Thêm KPI
          </Button>
        </CardHeader>
        <CardContent>
          {periods.length > 1 || (kpis && kpis.some(k => k.periodLabel)) ? (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="flex items-center gap-2 mb-4">
                <TabsList className="flex-1 justify-start h-auto flex-wrap gap-1 bg-transparent p-0">
                  {periods.map((period) => (
                    <TabsTrigger
                      key={period}
                      value={period}
                      className="rounded-full h-8 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4"
                    >
                      {period}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full h-8 text-xs px-3 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPeriodForm(true)}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Thêm tuần
                </Button>
              </div>

              {periods.map((period) => (
                <TabsContent key={period} value={period} className="mt-0">
                  <KpiList
                    kpis={kpisByPeriod[period] || []}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                    onCreate={() => openCreate(period)}
                  />
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <KpiList
              kpis={kpis || []}
              onEdit={openEdit}
              onDelete={handleDelete}
              onCreate={() => openCreate()}
            />
          )}
        </CardContent>
      </Card>

      {/* KPI Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingKpi ? 'Chỉnh sửa KPI' : 'Thêm KPI'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-footnote">Loại KPI *</Label>
              <Select value={form.kpiType} onValueChange={handleTypeChange}>
                <SelectTrigger className="rounded-lg">
                  <SelectValue placeholder="Chọn loại KPI..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {KpiTypeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="rounded-lg">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-footnote">Mục tiêu</Label>
                <Input
                  type="number"
                  step="any"
                  value={form.targetValue ?? ''}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      targetValue: e.target.value ? Number(e.target.value) : undefined,
                    }))
                  }
                  placeholder="0"
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-footnote">Thực tế</Label>
                <Input
                  type="number"
                  step="any"
                  value={form.actualValue ?? ''}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      actualValue: e.target.value ? Number(e.target.value) : undefined,
                    }))
                  }
                  placeholder="0"
                  className="rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-footnote">Đơn vị</Label>
                <Input
                  value={form.unit ?? ''}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, unit: e.target.value || undefined }))
                  }
                  placeholder="%, VND, leads..."
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-footnote">Hạn hoàn thành</Label>
                <Input
                  type="date"
                  value={form.targetDate ?? ''}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, targetDate: e.target.value || undefined }))
                  }
                  className="rounded-lg"
                />
              </div>
            </div>

            {form.periodLabel && (
              <div className="p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                Giai đoạn: <span className="font-medium text-foreground">{form.periodLabel}</span>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={() => setShowForm(false)}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                className="rounded-full"
                disabled={createKpi.isPending || updateKpi.isPending}
              >
                {(createKpi.isPending || updateKpi.isPending) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editingKpi ? 'Cập nhật' : 'Thêm'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Period Dialog */}
      <Dialog open={showPeriodForm} onOpenChange={setShowPeriodForm}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>Thêm giai đoạn mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-footnote">Tên giai đoạn *</Label>
              <Input
                value={newPeriodLabel}
                onChange={(e) => setNewPeriodLabel(e.target.value)}
                placeholder="VD: Tuần 1 (10/1-16/1)"
                className="rounded-lg"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-footnote">Từ ngày</Label>
                <Input
                  type="date"
                  value={newPeriodStart}
                  onChange={(e) => setNewPeriodStart(e.target.value)}
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-footnote">Đến ngày</Label>
                <Input
                  type="date"
                  value={newPeriodEnd}
                  onChange={(e) => setNewPeriodEnd(e.target.value)}
                  className="rounded-lg"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setShowPeriodForm(false)}>
              Hủy
            </Button>
            <Button className="rounded-full" onClick={handleAddPeriod}>
              Thêm & Tạo KPI
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Extracted KPI list component
function KpiList({
  kpis,
  onEdit,
  onDelete,
  onCreate,
}: {
  kpis: ProjectKPI[];
  onEdit: (kpi: ProjectKPI) => void;
  onDelete: (kpiId: string) => void;
  onCreate: () => void;
}) {
  if (kpis.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="h-12 w-12 rounded-2xl bg-surface flex items-center justify-center mb-3">
          <Target className="h-6 w-6 text-muted-foreground/50" />
        </div>
        <p className="text-callout text-muted-foreground mb-3">
          Chưa có KPI nào
        </p>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full h-8 px-4"
          onClick={onCreate}
        >
          Thêm KPI đầu tiên
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {kpis.map((kpi) => {
        const progress =
          kpi.targetValue && kpi.actualValue
            ? Math.min(100, Math.round((kpi.actualValue / kpi.targetValue) * 100))
            : 0;
        const isAchieved = kpi.targetValue && kpi.actualValue && kpi.actualValue >= kpi.targetValue;

        return (
          <div
            key={kpi.id}
            className="p-4 rounded-xl bg-surface/50 hover:bg-surface transition-colors group"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-callout font-medium">
                  {KpiTypeLabels[kpi.kpiType] || kpi.kpiType}
                </div>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  {kpi.actualValue !== null && (
                    <span className="text-footnote tabular-nums">
                      <span className={cn(
                        'font-semibold',
                        isAchieved
                          ? 'text-[#34c759] dark:text-[#30d158]'
                          : 'text-foreground'
                      )}>
                        {kpi.actualValue.toLocaleString('vi-VN')}
                      </span>
                      {kpi.unit && (
                        <span className="text-muted-foreground ml-0.5">
                          {kpi.unit}
                        </span>
                      )}
                    </span>
                  )}
                  {kpi.targetValue !== null && (
                    <span className="text-footnote text-muted-foreground tabular-nums">
                      Mục tiêu: {kpi.targetValue.toLocaleString('vi-VN')}
                      {kpi.unit && ` ${kpi.unit}`}
                    </span>
                  )}
                  {kpi.targetDate && (
                    <span className="text-footnote text-muted-foreground flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      {new Date(kpi.targetDate).toLocaleDateString('vi-VN')}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-lg"
                  onClick={() => onEdit(kpi)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-lg text-muted-foreground hover:text-[#ff3b30]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Xóa KPI?</AlertDialogTitle>
                      <AlertDialogDescription>
                        KPI &quot;{KpiTypeLabels[kpi.kpiType] || kpi.kpiType}&quot; sẽ bị xóa vĩnh viễn.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-full">Hủy</AlertDialogCancel>
                      <AlertDialogAction
                        className="rounded-full bg-[#ff3b30] hover:bg-[#ff3b30]/90"
                        onClick={() => onDelete(kpi.id)}
                      >
                        Xóa
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            {/* Progress bar */}
            {kpi.targetValue !== null && kpi.targetValue > 0 && (
              <div className="space-y-1.5">
                <div className="w-full rounded-full bg-background overflow-hidden h-1.5">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500 ease-out',
                      isAchieved
                        ? 'bg-[#34c759] dark:bg-[#30d158]'
                        : progress > 60
                          ? 'bg-[#0071e3] dark:bg-[#0a84ff]'
                          : 'bg-[#ff9f0a] dark:bg-[#ff9f0a]'
                    )}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-caption text-muted-foreground tabular-nums">
                    {progress}% hoàn thành
                  </span>
                  {isAchieved && (
                    <span className="text-caption font-medium text-[#34c759] dark:text-[#30d158] flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Đạt mục tiêu
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
