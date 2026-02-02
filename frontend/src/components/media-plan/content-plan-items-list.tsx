"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  PenLine,
  Eye,
  MessageCircle,
  CalendarDays,
  Hash,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  type MediaPlanItem,
  type CreateMediaPlanItemInput,
  type UpdateMediaPlanItemInput,
  formatVND,
  formatVNDCompact,
  MEDIA_CHANNELS_BY_TYPE,
  CAMPAIGN_TYPES_BY_TYPE,
  CAMPAIGN_OBJECTIVES_BY_TYPE,
} from "@/lib/api/media-plans";
import { MediaPlanItemForm } from "./media-plan-item-form";

interface ContentPlanItemsListProps {
  items: MediaPlanItem[];
  totalBudget: number;
  projectId: string;
  planId: string;
  onAddItem: (input: CreateMediaPlanItemInput) => Promise<void>;
  onUpdateItem: (
    itemId: string,
    input: UpdateMediaPlanItemInput,
  ) => Promise<void>;
  onDeleteItem: (itemId: string) => Promise<void>;
  isEditable?: boolean;
}

const CHANNEL_IDENTITY: Record<
  string,
  { color: string; darkColor: string; icon: string }
> = {
  facebook: { color: "#007aff", darkColor: "#0a84ff", icon: "f" },
  instagram: { color: "#ff3b30", darkColor: "#ff453a", icon: "ig" },
  tiktok: { color: "#000000", darkColor: "#ffffff", icon: "tk" },
  blog: { color: "#34c759", darkColor: "#30d158", icon: "B" },
  email: { color: "#ff9f0a", darkColor: "#ffd60a", icon: "@" },
  ads_copy: { color: "#5856d6", darkColor: "#5e5ce6", icon: "Ad" },
  video_script: { color: "#ff2d55", darkColor: "#ff375f", icon: "V" },
  pr: { color: "#af52de", darkColor: "#bf5af2", icon: "PR" },
  other: { color: "#8e8e93", darkColor: "#98989d", icon: "?" },
};

export function ContentPlanItemsList({
  items,
  totalBudget,
  projectId,
  planId,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  isEditable = true,
}: ContentPlanItemsListProps) {
  const router = useRouter();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MediaPlanItem | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allocatedBudget = items.reduce((sum, item) => sum + item.budget, 0);
  const totalPosts = items.reduce((s, i) => s + (i.targetReach ?? 0), 0);
  const totalViews = items.reduce((s, i) => s + (i.targetClicks ?? 0), 0);

  const getChannelLabel = (value: string) =>
    MEDIA_CHANNELS_BY_TYPE.CONTENT.find((c) => c.value === value)?.label ??
    value;
  const getCampaignTypeLabel = (value: string) =>
    CAMPAIGN_TYPES_BY_TYPE.CONTENT.find((c) => c.value === value)?.label ??
    value;
  const getObjectiveLabel = (value: string) =>
    CAMPAIGN_OBJECTIVES_BY_TYPE.CONTENT.find((c) => c.value === value)?.label ??
    value;

  const identity = (channel: string) =>
    CHANNEL_IDENTITY[channel] ?? CHANNEL_IDENTITY.other;

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
              Kế hoạch nội dung
            </CardTitle>
            <p className="text-footnote text-muted-foreground mt-1">
              {totalPosts} bài viết · {items.length} kênh ·{" "}
              {formatVND(allocatedBudget)} / {formatVND(totalBudget)}
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
              Thêm nội dung
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="h-16 w-16 rounded-2xl bg-[#ff9f0a]/10 flex items-center justify-center mb-3">
                <PenLine className="h-8 w-8 text-[#ff9f0a]" />
              </div>
              <p className="text-callout font-medium mb-1">Chưa có nội dung</p>
              <p className="text-footnote text-muted-foreground mb-4">
                Thêm nội dung để lập kế hoạch editorial
              </p>
              {isEditable && (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => setShowAddForm(true)}
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Thêm nội dung đầu tiên
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => {
                const ch = identity(item.channel);
                return (
                  <div
                    key={item.id}
                    className="group relative rounded-xl border border-border/50 hover:border-[#ff9f0a]/30 hover:shadow-sm transition-all overflow-hidden cursor-pointer"
                    onClick={() =>
                      router.push(
                        `/dashboard/projects/${projectId}/media-plans/${planId}/channels/${item.id}`,
                      )
                    }
                  >
                    {/* Left accent bar */}
                    <div
                      className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
                      style={{ backgroundColor: ch.color }}
                    />

                    <div className="pl-5 pr-4 py-4">
                      {/* Top row: avatar + channel + type + budget */}
                      <div className="flex items-center gap-3">
                        {/* Channel avatar */}
                        <div
                          className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-sm"
                          style={{ backgroundColor: ch.color }}
                        >
                          {ch.icon}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-callout font-semibold truncate">
                              {getChannelLabel(item.channel)}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#ff9f0a]/10 text-[#ff9f0a] dark:bg-[#ffd60a]/15 dark:text-[#ffd60a] shrink-0">
                              {getCampaignTypeLabel(item.campaignType)}
                            </span>
                          </div>
                          <p className="text-caption text-muted-foreground mt-0.5">
                            {getObjectiveLabel(item.objective)}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="text-callout font-semibold tabular-nums text-[#ff9f0a] dark:text-[#ffd60a]">
                            {formatVNDCompact(item.budget)}
                          </p>
                        </div>

                        <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0 group-hover:text-[#ff9f0a] transition-colors" />

                        {/* Edit/Delete */}
                        {isEditable && (
                          <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-lg"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingItem(item);
                              }}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-lg text-muted-foreground hover:text-[#ff3b30]"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingItemId(item.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Metrics row */}
                      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/30 flex-wrap">
                        {(item.targetReach ?? 0) > 0 && (
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <div className="h-5 w-5 rounded-md bg-[#ff9f0a]/10 flex items-center justify-center">
                              <Hash className="h-3 w-3 text-[#ff9f0a]" />
                            </div>
                            <span className="tabular-nums font-medium">
                              {item.targetReach}
                            </span>
                            <span className="text-muted-foreground">
                              bài viết
                            </span>
                          </div>
                        )}
                        {(item.targetClicks ?? 0) > 0 && (
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <div className="h-5 w-5 rounded-md bg-[#007aff]/10 flex items-center justify-center">
                              <Eye className="h-3 w-3 text-[#007aff]" />
                            </div>
                            <span className="tabular-nums font-medium">
                              {(item.targetClicks! / 1000).toFixed(0)}K
                            </span>
                            <span className="text-muted-foreground">views</span>
                          </div>
                        )}
                        {(item.targetLeads ?? 0) > 0 && (
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <div className="h-5 w-5 rounded-md bg-[#34c759]/10 flex items-center justify-center">
                              <MessageCircle className="h-3 w-3 text-[#34c759]" />
                            </div>
                            <span className="tabular-nums font-medium">
                              {(item.targetLeads! / 1000).toFixed(
                                item.targetLeads! >= 1000 ? 0 : 1,
                              )}
                              K
                            </span>
                            <span className="text-muted-foreground">
                              engagement
                            </span>
                          </div>
                        )}
                        {(item.targetCPL ?? 0) > 0 && (
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <div className="h-5 w-5 rounded-md bg-[#af52de]/10 flex items-center justify-center">
                              <CalendarDays className="h-3 w-3 text-[#af52de]" />
                            </div>
                            <span className="tabular-nums font-medium">
                              {item.targetCPL}
                            </span>
                            <span className="text-muted-foreground">
                              bài/tuần
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary stats */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl bg-[#ff9f0a]/5 dark:bg-[#ffd60a]/10 p-3.5 text-center">
            <p className="text-[22px] font-bold tabular-nums text-[#ff9f0a] dark:text-[#ffd60a]">
              {totalPosts}
            </p>
            <p className="text-caption text-muted-foreground mt-0.5">
              Tổng bài viết
            </p>
          </div>
          <div className="rounded-xl bg-[#ff9f0a]/5 dark:bg-[#ffd60a]/10 p-3.5 text-center">
            <p className="text-[22px] font-bold tabular-nums text-[#ff9f0a] dark:text-[#ffd60a]">
              {items.length}
            </p>
            <p className="text-caption text-muted-foreground mt-0.5">
              Kênh nội dung
            </p>
          </div>
          <div className="rounded-xl bg-[#ff9f0a]/5 dark:bg-[#ffd60a]/10 p-3.5 text-center">
            <p className="text-[22px] font-bold tabular-nums text-[#ff9f0a] dark:text-[#ffd60a]">
              {totalViews > 0 ? `${(totalViews / 1000).toFixed(0)}K` : "0"}
            </p>
            <p className="text-caption text-muted-foreground mt-0.5">
              Target Views
            </p>
          </div>
          <div className="rounded-xl bg-[#ff9f0a]/5 dark:bg-[#ffd60a]/10 p-3.5 text-center">
            <p className="text-[22px] font-bold tabular-nums text-[#ff9f0a] dark:text-[#ffd60a]">
              {items.length > 0
                ? (
                    items.reduce((s, i) => s + (i.targetCPL ?? 0), 0) /
                    items.length
                  ).toFixed(1)
                : "0"}
            </p>
            <p className="text-caption text-muted-foreground mt-0.5">
              TB bài/tuần
            </p>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <MediaPlanItemForm
        open={showAddForm}
        onOpenChange={setShowAddForm}
        planType="CONTENT"
        onSubmit={handleAddItem}
        isSubmitting={isSubmitting}
      />
      <MediaPlanItemForm
        open={!!editingItem}
        onOpenChange={(open) => !open && setEditingItem(null)}
        item={editingItem ?? undefined}
        planType="CONTENT"
        onSubmit={handleUpdateItem}
        isSubmitting={isSubmitting}
      />
      <AlertDialog
        open={!!deletingItemId}
        onOpenChange={() => setDeletingItemId(null)}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa nội dung?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa nội dung này khỏi kế hoạch? Hành động này
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
