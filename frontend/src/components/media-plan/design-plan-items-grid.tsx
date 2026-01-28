'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, ImageIcon, RotateCcw, Clock, Package, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import {
  type MediaPlanItem,
  type CreateMediaPlanItemInput,
  type UpdateMediaPlanItemInput,
  formatVND,
  formatVNDCompact,
  MEDIA_CHANNELS_BY_TYPE,
  CAMPAIGN_TYPES_BY_TYPE,
  CAMPAIGN_OBJECTIVES_BY_TYPE,
} from '@/lib/api/media-plans';
import { MediaPlanItemForm } from './media-plan-item-form';

interface DesignPlanItemsGridProps {
  items: MediaPlanItem[];
  totalBudget: number;
  onAddItem: (input: CreateMediaPlanItemInput) => Promise<void>;
  onUpdateItem: (itemId: string, input: UpdateMediaPlanItemInput) => Promise<void>;
  onDeleteItem: (itemId: string) => Promise<void>;
  isEditable?: boolean;
}

const CHANNEL_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  social_media: { bg: 'bg-[#007aff]/8', text: 'text-[#007aff]', border: 'border-[#007aff]/20' },
  website: { bg: 'bg-[#34c759]/8', text: 'text-[#34c759]', border: 'border-[#34c759]/20' },
  display_ads: { bg: 'bg-[#ff9f0a]/8', text: 'text-[#ff9f0a]', border: 'border-[#ff9f0a]/20' },
  video: { bg: 'bg-[#ff3b30]/8', text: 'text-[#ff3b30]', border: 'border-[#ff3b30]/20' },
  brand: { bg: 'bg-[#af52de]/8', text: 'text-[#af52de]', border: 'border-[#af52de]/20' },
  print: { bg: 'bg-[#5856d6]/8', text: 'text-[#5856d6]', border: 'border-[#5856d6]/20' },
  other: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-500', border: 'border-gray-200 dark:border-gray-700' },
};

export function DesignPlanItemsGrid({
  items,
  totalBudget,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  isEditable = true,
}: DesignPlanItemsGridProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MediaPlanItem | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allocatedBudget = items.reduce((sum, item) => sum + item.budget, 0);
  const totalProducts = items.reduce((s, i) => s + (i.targetReach ?? 0), 0);

  const getChannelLabel = (value: string) =>
    MEDIA_CHANNELS_BY_TYPE.DESIGN.find((c) => c.value === value)?.label ?? value;
  const getCampaignTypeLabel = (value: string) =>
    CAMPAIGN_TYPES_BY_TYPE.DESIGN.find((c) => c.value === value)?.label ?? value;
  const getObjectiveLabel = (value: string) =>
    CAMPAIGN_OBJECTIVES_BY_TYPE.DESIGN.find((c) => c.value === value)?.label ?? value;

  const handleAddItem = async (input: CreateMediaPlanItemInput) => {
    setIsSubmitting(true);
    try {
      await onAddItem(input);
      setShowAddForm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateItem = async (input: CreateMediaPlanItemInput) => {
    if (!editingItem) return;
    setIsSubmitting(true);
    try {
      await onUpdateItem(editingItem.id, input);
      setEditingItem(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!deletingItemId) return;
    await onDeleteItem(deletingItemId);
    setDeletingItemId(null);
  };

  const colors = (channel: string) => CHANNEL_COLORS[channel] ?? CHANNEL_COLORS.other;

  return (
    <>
      <Card className="rounded-2xl border-border/50 shadow-apple-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-subheadline font-semibold">
              Sản phẩm thiết kế
            </CardTitle>
            <p className="text-footnote text-muted-foreground mt-1">
              {totalProducts} sản phẩm · {items.length} hạng mục · {formatVND(allocatedBudget)} / {formatVND(totalBudget)}
            </p>
          </div>
          {isEditable && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-full h-9 px-4"
              onClick={() => setShowAddForm(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Thêm sản phẩm
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="h-16 w-16 rounded-2xl bg-[#af52de]/10 flex items-center justify-center mb-3">
                <ImageIcon className="h-8 w-8 text-[#af52de]" />
              </div>
              <p className="text-callout font-medium mb-1">Chưa có sản phẩm thiết kế</p>
              <p className="text-footnote text-muted-foreground mb-4">
                Thêm sản phẩm để quản lý deliverables thiết kế
              </p>
              {isEditable && (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => setShowAddForm(true)}
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Thêm sản phẩm đầu tiên
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => {
                const c = colors(item.channel);
                return (
                  <div
                    key={item.id}
                    className={cn(
                      'group relative rounded-xl border overflow-hidden transition-all hover:shadow-md',
                      c.border,
                    )}
                  >
                    {/* Image upload area */}
                    <div className={cn('aspect-[4/3] flex flex-col items-center justify-center gap-2 border-b', c.border, c.bg)}>
                      <div className={cn('h-12 w-12 rounded-xl flex items-center justify-center', c.bg)}>
                        <Upload className={cn('h-6 w-6', c.text)} style={{ opacity: 0.6 }} />
                      </div>
                      <p className={cn('text-caption font-medium', c.text)} style={{ opacity: 0.7 }}>
                        Tải lên thiết kế
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        PNG, JPG, PDF · Tối đa 10MB
                      </p>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-3">
                      {/* Channel + Type badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn('px-2 py-0.5 rounded-md text-[10px] font-semibold', c.bg, c.text)}>
                          {getChannelLabel(item.channel)}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-secondary text-muted-foreground">
                          {getCampaignTypeLabel(item.campaignType)}
                        </span>
                      </div>

                      {/* Objective */}
                      <p className="text-footnote text-muted-foreground">
                        {getObjectiveLabel(item.objective)}
                      </p>

                      {/* Budget */}
                      <p className="text-callout font-semibold tabular-nums text-[#af52de] dark:text-[#bf5af2]">
                        {formatVNDCompact(item.budget)}
                      </p>

                      {/* Stats row */}
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-1 border-t border-border/30">
                        {(item.targetReach ?? 0) > 0 && (
                          <div className="flex items-center gap-1">
                            <Package className="h-3 w-3 text-[#af52de]/60" />
                            <span className="tabular-nums font-medium">{item.targetReach} SP</span>
                          </div>
                        )}
                        {(item.targetClicks ?? 0) > 0 && (
                          <div className="flex items-center gap-1">
                            <RotateCcw className="h-3 w-3" />
                            <span className="tabular-nums">{item.targetClicks} rev</span>
                          </div>
                        )}
                        {(item.targetLeads ?? 0) > 0 && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span className="tabular-nums">{item.targetLeads} ngày</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Edit/Delete overlay */}
                    {isEditable && (
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-7 w-7 rounded-lg shadow-sm bg-background/90 backdrop-blur-sm"
                          onClick={(e) => { e.stopPropagation(); setEditingItem(item); }}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-7 w-7 rounded-lg shadow-sm bg-background/90 backdrop-blur-sm hover:text-[#ff3b30]"
                          onClick={(e) => { e.stopPropagation(); setDeletingItemId(item.id); }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Add card */}
              {isEditable && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="rounded-xl border-2 border-dashed border-[#af52de]/30 hover:border-[#af52de]/60 transition-colors flex flex-col items-center justify-center gap-2 py-12 text-[#af52de]/60 hover:text-[#af52de] cursor-pointer"
                >
                  <Plus className="h-8 w-8" />
                  <span className="text-footnote font-medium">Thêm sản phẩm</span>
                </button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary stats */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl bg-[#af52de]/5 dark:bg-[#bf5af2]/10 p-3.5 text-center">
            <p className="text-[22px] font-bold tabular-nums text-[#af52de] dark:text-[#bf5af2]">{totalProducts}</p>
            <p className="text-caption text-muted-foreground mt-0.5">Tổng sản phẩm</p>
          </div>
          <div className="rounded-xl bg-[#af52de]/5 dark:bg-[#bf5af2]/10 p-3.5 text-center">
            <p className="text-[22px] font-bold tabular-nums text-[#af52de] dark:text-[#bf5af2]">{items.length}</p>
            <p className="text-caption text-muted-foreground mt-0.5">Hạng mục</p>
          </div>
          <div className="rounded-xl bg-[#af52de]/5 dark:bg-[#bf5af2]/10 p-3.5 text-center">
            <p className="text-[22px] font-bold tabular-nums text-[#af52de] dark:text-[#bf5af2]">
              {items.length > 0
                ? (items.reduce((s, i) => s + (i.targetClicks ?? 0), 0) / items.length).toFixed(1)
                : '0'}
            </p>
            <p className="text-caption text-muted-foreground mt-0.5">TB Revisions</p>
          </div>
          <div className="rounded-xl bg-[#af52de]/5 dark:bg-[#bf5af2]/10 p-3.5 text-center">
            <p className="text-[22px] font-bold tabular-nums text-[#af52de] dark:text-[#bf5af2]">
              {items.length > 0
                ? Math.round(items.reduce((s, i) => s + (i.targetLeads ?? 0), 0) / items.length)
                : '0'}
            </p>
            <p className="text-caption text-muted-foreground mt-0.5">TB Ngày HT</p>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <MediaPlanItemForm
        open={showAddForm}
        onOpenChange={setShowAddForm}
        planType="DESIGN"
        onSubmit={handleAddItem}
        isSubmitting={isSubmitting}
      />
      <MediaPlanItemForm
        open={!!editingItem}
        onOpenChange={(open) => !open && setEditingItem(null)}
        item={editingItem ?? undefined}
        planType="DESIGN"
        onSubmit={handleUpdateItem}
        isSubmitting={isSubmitting}
      />
      <AlertDialog open={!!deletingItemId} onOpenChange={() => setDeletingItemId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa sản phẩm?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa sản phẩm này khỏi kế hoạch? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteItem} className="rounded-full bg-[#ff3b30] hover:bg-[#ff3b30]/90">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
