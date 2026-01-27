'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
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
  MEDIA_CHANNELS,
  CAMPAIGN_TYPES,
} from '@/lib/api/media-plans';
import { MediaPlanItemForm } from './media-plan-item-form';

interface MediaPlanItemsTableProps {
  items: MediaPlanItem[];
  totalBudget: number;
  onAddItem: (input: CreateMediaPlanItemInput) => Promise<void>;
  onUpdateItem: (itemId: string, input: UpdateMediaPlanItemInput) => Promise<void>;
  onDeleteItem: (itemId: string) => Promise<void>;
  isEditable?: boolean;
}

export function MediaPlanItemsTable({
  items,
  totalBudget,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  isEditable = true,
}: MediaPlanItemsTableProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MediaPlanItem | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allocatedBudget = items.reduce((sum, item) => sum + item.budget, 0);

  const getChannelLabel = (value: string) =>
    MEDIA_CHANNELS.find((c) => c.value === value)?.label ?? value;

  const getCampaignTypeLabel = (value: string) =>
    CAMPAIGN_TYPES.find((c) => c.value === value)?.label ?? value;

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

  return (
    <>
      <Card className="rounded-2xl border-border/50 shadow-apple-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-subheadline font-semibold">
              Chi tiết kênh
            </CardTitle>
            <p className="text-footnote text-muted-foreground mt-1">
              {items.length} kênh · {formatVND(allocatedBudget)} / {formatVND(totalBudget)}
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
              Thêm kênh
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-3">
                <Plus className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="text-callout font-medium mb-1">Chưa có kênh nào</p>
              <p className="text-footnote text-muted-foreground mb-4">
                Thêm kênh media để bắt đầu lập kế hoạch
              </p>
              {isEditable && (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => setShowAddForm(true)}
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Thêm kênh đầu tiên
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="pb-3 text-footnote font-medium text-muted-foreground">Kênh</th>
                    <th className="pb-3 text-footnote font-medium text-muted-foreground">Loại</th>
                    <th className="pb-3 text-footnote font-medium text-muted-foreground">Mục tiêu</th>
                    <th className="pb-3 text-footnote font-medium text-muted-foreground text-right">Ngân sách</th>
                    <th className="pb-3 text-footnote font-medium text-muted-foreground text-right">Reach</th>
                    <th className="pb-3 text-footnote font-medium text-muted-foreground text-right">Clicks</th>
                    <th className="pb-3 text-footnote font-medium text-muted-foreground text-right">Leads</th>
                    <th className="pb-3 text-footnote font-medium text-muted-foreground text-right">CPL</th>
                    {isEditable && (
                      <th className="pb-3 text-footnote font-medium text-muted-foreground w-20" />
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {items.map((item) => (
                    <tr key={item.id} className="group hover:bg-surface/50 transition-colors">
                      <td className="py-3 pr-3">
                        <div className="text-callout font-medium">
                          {getChannelLabel(item.channel)}
                        </div>
                      </td>
                      <td className="py-3 pr-3">
                        <span className="text-footnote text-muted-foreground">
                          {getCampaignTypeLabel(item.campaignType)}
                        </span>
                      </td>
                      <td className="py-3 pr-3">
                        <span className="text-footnote text-muted-foreground">
                          {item.objective}
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-right">
                        <span className="text-callout font-medium tabular-nums">
                          {formatVND(item.budget)}
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-right">
                        <span className="text-footnote tabular-nums text-muted-foreground">
                          {item.targetReach?.toLocaleString('vi-VN') ?? '-'}
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-right">
                        <span className="text-footnote tabular-nums text-muted-foreground">
                          {item.targetClicks?.toLocaleString('vi-VN') ?? '-'}
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-right">
                        <span className="text-footnote tabular-nums text-muted-foreground">
                          {item.targetLeads?.toLocaleString('vi-VN') ?? '-'}
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-right">
                        <span className="text-footnote tabular-nums text-muted-foreground">
                          {item.targetCPL ? formatVND(item.targetCPL) : '-'}
                        </span>
                      </td>
                      {isEditable && (
                        <td className="py-3">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-lg"
                              onClick={() => setEditingItem(item)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-lg text-muted-foreground hover:text-[#ff3b30]"
                              onClick={() => setDeletingItemId(item.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
                {/* Summary Row */}
                <tfoot>
                  <tr className="border-t-2 border-border/50">
                    <td colSpan={3} className="py-3 text-callout font-semibold">
                      Tổng
                    </td>
                    <td className="py-3 text-right text-callout font-semibold tabular-nums">
                      {formatVND(allocatedBudget)}
                    </td>
                    <td className="py-3 text-right text-footnote tabular-nums text-muted-foreground">
                      {items.reduce((s, i) => s + (i.targetReach ?? 0), 0).toLocaleString('vi-VN') || '-'}
                    </td>
                    <td className="py-3 text-right text-footnote tabular-nums text-muted-foreground">
                      {items.reduce((s, i) => s + (i.targetClicks ?? 0), 0).toLocaleString('vi-VN') || '-'}
                    </td>
                    <td className="py-3 text-right text-footnote tabular-nums text-muted-foreground">
                      {items.reduce((s, i) => s + (i.targetLeads ?? 0), 0).toLocaleString('vi-VN') || '-'}
                    </td>
                    <td className="py-3" />
                    {isEditable && <td className="py-3" />}
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Item Dialog */}
      <MediaPlanItemForm
        open={showAddForm}
        onOpenChange={setShowAddForm}
        onSubmit={handleAddItem}
        isSubmitting={isSubmitting}
      />

      {/* Edit Item Dialog */}
      <MediaPlanItemForm
        open={!!editingItem}
        onOpenChange={(open) => !open && setEditingItem(null)}
        item={editingItem ?? undefined}
        onSubmit={handleUpdateItem}
        isSubmitting={isSubmitting}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingItemId}
        onOpenChange={() => setDeletingItemId(null)}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa kênh?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa kênh này khỏi kế hoạch media? Hành động này
              không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteItem}
              className="rounded-full bg-[#ff3b30] hover:bg-[#ff3b30]/90"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
