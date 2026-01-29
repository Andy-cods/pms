'use client';

import { useState } from 'react';
import { Pencil, Save, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { Project } from '@/types';
import { useEvaluateProject } from '@/hooks/use-projects';
import { formatCurrency } from '@/lib/api/projects';
import { cn } from '@/lib/utils';

interface EvaluationCardProps {
  project: Project;
  editable?: boolean;
}

const COST_FIELDS = [
  { key: 'costNSQC' as const, label: 'Chi phí NSQC' },
  { key: 'costDesign' as const, label: 'Chi phí Design' },
  { key: 'costMedia' as const, label: 'Chi phí Media' },
  { key: 'costKOL' as const, label: 'Chi phí KOL' },
  { key: 'costOther' as const, label: 'Chi phí khác' },
];

const EVAL_TEXT_FIELDS = [
  { key: 'marketSize' as const, label: 'Quy mô thị trường' },
  { key: 'competitionLevel' as const, label: 'Mức cạnh tranh' },
  { key: 'productUSP' as const, label: 'USP sản phẩm' },
  { key: 'audienceSize' as const, label: 'Quy mô đối tượng' },
  { key: 'productLifecycle' as const, label: 'Vòng đời sản phẩm' },
  { key: 'scalePotential' as const, label: 'Tiềm năng mở rộng' },
];

function getMarginColor(margin: number): string {
  if (margin > 50) return 'text-green-600 dark:text-green-400';
  if (margin >= 20) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

function getMarginBg(margin: number): string {
  if (margin > 50) return 'bg-green-50 dark:bg-green-900/10';
  if (margin >= 20) return 'bg-amber-50 dark:bg-amber-900/10';
  return 'bg-red-50 dark:bg-red-900/10';
}

function getMarginLabel(margin: number): string {
  if (margin > 50) return 'Tốt';
  if (margin >= 20) return 'Hiệu quả';
  return 'Không hiệu quả';
}

export function EvaluationCard({ project, editable = false }: EvaluationCardProps) {
  const [editing, setEditing] = useState(false);
  const evaluate = useEvaluateProject();

  const [form, setForm] = useState({
    costNSQC: project.costNSQC ?? 0,
    costDesign: project.costDesign ?? 0,
    costMedia: project.costMedia ?? 0,
    costKOL: project.costKOL ?? 0,
    costOther: project.costOther ?? 0,
    marketSize: project.marketSize ?? '',
    competitionLevel: project.competitionLevel ?? '',
    productUSP: project.productUSP ?? '',
    audienceSize: project.audienceSize ?? '',
    productLifecycle: project.productLifecycle ?? '',
    scalePotential: project.scalePotential ?? '',
  });

  // Live auto-calc preview
  const liveCogs = form.costNSQC + form.costDesign + form.costMedia + form.costKOL + form.costOther;
  const liveGrossProfit = (project.totalBudget ?? 0) - liveCogs;
  const liveMargin = (project.totalBudget ?? 0) > 0
    ? (liveGrossProfit / (project.totalBudget ?? 1)) * 100
    : 0;

  function handleSave() {
    evaluate.mutate(
      {
        id: project.id,
        input: {
          costNSQC: form.costNSQC || undefined,
          costDesign: form.costDesign || undefined,
          costMedia: form.costMedia || undefined,
          costKOL: form.costKOL || undefined,
          costOther: form.costOther || undefined,
          marketSize: form.marketSize || undefined,
          competitionLevel: form.competitionLevel || undefined,
          productUSP: form.productUSP || undefined,
          audienceSize: form.audienceSize || undefined,
          productLifecycle: form.productLifecycle || undefined,
          scalePotential: form.scalePotential || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success('Đã cập nhật đánh giá PM');
          setEditing(false);
        },
        onError: () => toast.error('Không thể cập nhật'),
      },
    );
  }

  function handleCancel() {
    setForm({
      costNSQC: project.costNSQC ?? 0,
      costDesign: project.costDesign ?? 0,
      costMedia: project.costMedia ?? 0,
      costKOL: project.costKOL ?? 0,
      costOther: project.costOther ?? 0,
      marketSize: project.marketSize ?? '',
      competitionLevel: project.competitionLevel ?? '',
      productUSP: project.productUSP ?? '',
      audienceSize: project.audienceSize ?? '',
      productLifecycle: project.productLifecycle ?? '',
      scalePotential: project.scalePotential ?? '',
    });
    setEditing(false);
  }

  if (editing) {
    return (
      <Card className="rounded-2xl border-pink-200 dark:border-pink-800/50 shadow-apple-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-subheadline font-semibold text-pink-700 dark:text-pink-400">
            Đánh giá PM
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 rounded-lg"
              onClick={handleCancel}
              disabled={evaluate.isPending}
            >
              <X className="h-3.5 w-3.5 mr-1" /> Hủy
            </Button>
            <Button
              size="sm"
              className="h-8 rounded-lg bg-pink-600 hover:bg-pink-700 text-white"
              onClick={handleSave}
              disabled={evaluate.isPending}
            >
              <Save className="h-3.5 w-3.5 mr-1" /> Lưu
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Cost fields */}
          <div>
            <Label className="text-footnote font-medium">Chi phí (COGS)</Label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {COST_FIELDS.map(({ key, label }) => (
                <div key={key}>
                  <Label className="text-caption text-muted-foreground">{label}</Label>
                  <Input
                    type="number"
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) })}
                    className="mt-0.5"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Live profit preview */}
          <div className={cn('p-3 rounded-xl', getMarginBg(liveMargin))}>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <span className="text-caption text-muted-foreground">COGS</span>
                <p className="text-callout font-semibold tabular-nums">{formatCurrency(liveCogs)}</p>
              </div>
              <div>
                <span className="text-caption text-muted-foreground">Lợi nhuận gộp</span>
                <p className="text-callout font-semibold tabular-nums">{formatCurrency(liveGrossProfit)}</p>
              </div>
              <div>
                <span className="text-caption text-muted-foreground">Biên LN</span>
                <p className={cn('text-callout font-bold tabular-nums', getMarginColor(liveMargin))}>
                  {liveMargin.toFixed(1)}% · {getMarginLabel(liveMargin)}
                </p>
              </div>
            </div>
          </div>

          {/* Evaluation text fields */}
          <div>
            <Label className="text-footnote font-medium">Đánh giá thị trường</Label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {EVAL_TEXT_FIELDS.map(({ key, label }) => (
                <div key={key}>
                  <Label className="text-caption text-muted-foreground">{label}</Label>
                  <Input
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="mt-0.5"
                  />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Read-only mode
  const hasEvalData = project.cogs != null || project.costNSQC != null || project.marketSize;
  const margin = project.profitMargin ?? 0;

  return (
    <Card className="rounded-2xl border-pink-200 dark:border-pink-800/50 shadow-apple-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-subheadline font-semibold text-pink-700 dark:text-pink-400">
          Đánh giá PM
        </CardTitle>
        {editable && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 rounded-lg text-footnote text-pink-600 hover:text-pink-700"
            onClick={() => setEditing(true)}
          >
            <Pencil className="h-3.5 w-3.5 mr-1" /> Sửa
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {!hasEvalData ? (
          <p className="text-footnote text-muted-foreground/50 italic">Chưa có đánh giá PM</p>
        ) : (
          <div className="space-y-4">
            {/* Profit indicator */}
            {project.cogs != null && (
              <div className={cn('p-3 rounded-xl', getMarginBg(margin))}>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <span className="text-caption text-muted-foreground">COGS</span>
                    <p className="text-callout font-semibold tabular-nums">
                      {formatCurrency(project.cogs)}
                    </p>
                  </div>
                  <div>
                    <span className="text-caption text-muted-foreground">Lợi nhuận gộp</span>
                    <p className="text-callout font-semibold tabular-nums">
                      {formatCurrency(project.grossProfit ?? 0)}
                    </p>
                  </div>
                  <div>
                    <span className="text-caption text-muted-foreground">Biên LN</span>
                    <p className={cn('text-callout font-bold tabular-nums', getMarginColor(margin))}>
                      {margin.toFixed(1)}% · {getMarginLabel(margin)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Cost breakdown */}
            {COST_FIELDS.some(({ key }) => project[key] != null && project[key]! > 0) && (
              <div className="space-y-1.5">
                <span className="text-caption text-muted-foreground font-medium">Chi phí chi tiết</span>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {COST_FIELDS.filter(({ key }) => project[key] != null && project[key]! > 0).map(({ key, label }) => (
                    <div key={key} className="flex justify-between text-footnote">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="tabular-nums">{formatCurrency(project[key]!)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Market evaluation */}
            {EVAL_TEXT_FIELDS.some(({ key }) => project[key]) && (
              <div className="space-y-1.5">
                <span className="text-caption text-muted-foreground font-medium">Đánh giá thị trường</span>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {EVAL_TEXT_FIELDS.filter(({ key }) => project[key]).map(({ key, label }) => (
                    <div key={key} className="text-footnote">
                      <span className="text-muted-foreground">{label}: </span>
                      <span className="font-medium">{project[key]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
