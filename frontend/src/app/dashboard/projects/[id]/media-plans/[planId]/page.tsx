"use client";

import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Trash2,
  MoreHorizontal,
  Calendar,
  DollarSign,
  Layers,
  User,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { useProject } from "@/hooks/use-projects";
import {
  useMediaPlan,
  useUpdateMediaPlan,
  useDeleteMediaPlan,
  useAddMediaPlanItem,
  useUpdateMediaPlanItem,
  useDeleteMediaPlanItem,
} from "@/hooks/use-media-plans";
import {
  type MediaPlanStatus,
  type MediaPlanType,
  MediaPlanStatusLabels,
  MediaPlanStatusColors,
  MediaPlanTypeLabels,
  MediaPlanTypeColors,
  formatVNDCompact,
  MONTHS,
} from "@/lib/api/media-plans";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
} from "@/components/ui/alert-dialog";
import { MediaPlanItemsTable } from "@/components/media-plan/media-plan-items-table";
import { DesignPlanItemsGrid } from "@/components/media-plan/design-plan-items-grid";
import { ContentPlanItemsList } from "@/components/media-plan/content-plan-items-list";

// Status transition options
const STATUS_TRANSITIONS: Record<MediaPlanStatus, MediaPlanStatus[]> = {
  DRAFT: ["PENDING_APPROVAL", "CANCELLED"],
  PENDING_APPROVAL: ["APPROVED", "DRAFT"],
  APPROVED: ["ACTIVE", "DRAFT"],
  ACTIVE: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: ["DRAFT"],
};

export default function MediaPlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const planId = params.planId as string;

  const { data: project } = useProject(projectId);
  const { data: plan, isLoading } = useMediaPlan(projectId, planId);
  const updateMutation = useUpdateMediaPlan();
  const deleteMutation = useDeleteMediaPlan();
  const addItemMutation = useAddMediaPlanItem();
  const updateItemMutation = useUpdateMediaPlanItem();
  const deleteItemMutation = useDeleteMediaPlanItem();

  const handleStatusChange = async (newStatus: MediaPlanStatus) => {
    try {
      await updateMutation.mutateAsync({
        projectId,
        planId,
        input: { status: newStatus },
      });
      toast.success(`Đã chuyển sang ${MediaPlanStatusLabels[newStatus]}`);
    } catch {
      toast.error("Không thể cập nhật trạng thái");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync({ projectId, planId });
      toast.success("Đã xóa kế hoạch media");
      router.push(`/dashboard/projects/${projectId}/media-plans`);
    } catch {
      toast.error("Không thể xóa kế hoạch media");
    }
  };

  if (isLoading) {
    return <MediaPlanDetailSkeleton />;
  }

  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h3 className="text-headline font-semibold mb-2">
          Không tìm thấy kế hoạch
        </h3>
        <p className="text-callout text-muted-foreground mb-6">
          Kế hoạch media này có thể đã bị xóa.
        </p>
        <Button
          variant="outline"
          onClick={() =>
            router.push(`/dashboard/projects/${projectId}/media-plans`)
          }
          className="rounded-full px-5"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
      </div>
    );
  }

  const monthLabel =
    MONTHS.find((m) => m.value === plan.month)?.label ?? `T${plan.month}`;
  const budgetPercent =
    plan.totalBudget > 0
      ? Math.min(
          100,
          Math.round((plan.allocatedBudget / plan.totalBudget) * 100),
        )
      : 0;
  const availableTransitions = STATUS_TRANSITIONS[plan.status] ?? [];
  const isEditable = plan.status === "DRAFT" || plan.status === "ACTIVE";
  const planType = (plan.type as MediaPlanType) ?? "ADS";
  const itemCountLabel =
    planType === "DESIGN"
      ? "Sản phẩm"
      : planType === "CONTENT"
        ? "Nội dung"
        : "Số kênh";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              router.push(`/dashboard/projects/${projectId}/media-plans`)
            }
            className="h-10 w-10 rounded-xl hover:bg-secondary"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-headline font-semibold tracking-tight">
                {plan.name}
              </h1>
              <span
                className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-medium",
                  MediaPlanTypeColors[plan.type as MediaPlanType] ??
                    MediaPlanTypeColors.ADS,
                )}
              >
                {MediaPlanTypeLabels[plan.type as MediaPlanType] ?? plan.type}
              </span>
              <span
                className={cn(
                  "px-2.5 py-0.5 rounded-full text-caption font-medium",
                  MediaPlanStatusColors[plan.status],
                )}
              >
                {MediaPlanStatusLabels[plan.status]}
              </span>
            </div>
            <p className="text-[14px] text-muted-foreground mt-0.5">
              {project?.dealCode} · {monthLabel}/{plan.year} · v{plan.version}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Status transition buttons */}
          {availableTransitions.length > 0 && (
            <div className="flex gap-2">
              {availableTransitions.slice(0, 1).map((status) => (
                <Button
                  key={status}
                  size="sm"
                  className="rounded-full h-9 px-4"
                  onClick={() => handleStatusChange(status)}
                  disabled={updateMutation.isPending}
                >
                  {MediaPlanStatusLabels[status]}
                </Button>
              ))}
            </div>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-lg"
              >
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl">
              {availableTransitions.slice(1).map((status) => (
                <DropdownMenuItem
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  className="rounded-lg"
                >
                  {MediaPlanStatusLabels[status]}
                </DropdownMenuItem>
              ))}
              {availableTransitions.length > 1 && <DropdownMenuSeparator />}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className="rounded-lg text-[#ff3b30] dark:text-[#ff453a] focus:text-[#ff3b30]"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Xóa kế hoạch
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Xóa kế hoạch media?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Kế hoạch &quot;{plan.name}&quot; và tất cả dữ liệu kênh sẽ
                      bị xóa vĩnh viễn. Hành động này không thể hoàn tác.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-full">
                      Hủy
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="rounded-full bg-[#ff3b30] hover:bg-[#ff3b30]/90"
                    >
                      Xóa
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-border/50 shadow-apple-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#007aff]/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-[#007aff]" />
            </div>
            <div>
              <p className="text-caption text-muted-foreground">
                Tổng ngân sách
              </p>
              <p className="text-callout font-semibold tabular-nums">
                {formatVNDCompact(plan.totalBudget)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/50 shadow-apple-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#34c759]/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-[#34c759]" />
            </div>
            <div>
              <p className="text-caption text-muted-foreground">Đã phân bổ</p>
              <p className="text-callout font-semibold tabular-nums">
                {formatVNDCompact(plan.allocatedBudget)}
                <span className="text-caption text-muted-foreground ml-1">
                  ({budgetPercent}%)
                </span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/50 shadow-apple-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#ff9f0a]/10 flex items-center justify-center">
              <Layers className="h-5 w-5 text-[#ff9f0a]" />
            </div>
            <div>
              <p className="text-caption text-muted-foreground">
                {itemCountLabel}
              </p>
              <p className="text-callout font-semibold tabular-nums">
                {plan.itemCount}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/50 shadow-apple-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#af52de]/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-[#af52de]" />
            </div>
            <div>
              <p className="text-caption text-muted-foreground">Thời gian</p>
              <p className="text-footnote font-medium">
                {new Date(plan.startDate).toLocaleDateString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                })}
                {" - "}
                {new Date(plan.endDate).toLocaleDateString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {plan.notes && (
        <Card className="rounded-2xl border-border/50 shadow-apple-sm">
          <CardContent className="p-5">
            <p className="text-footnote text-muted-foreground whitespace-pre-wrap">
              {plan.notes}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Created By Info */}
      <div className="flex items-center gap-2 text-footnote text-muted-foreground">
        <User className="h-3.5 w-3.5" />
        <span>
          Tạo bởi {plan.createdBy.name} ·{" "}
          {new Date(plan.createdAt).toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </span>
      </div>

      {/* Items - type-specific views */}
      {planType === "DESIGN" ? (
        <DesignPlanItemsGrid
          items={plan.items}
          totalBudget={plan.totalBudget}
          isEditable={isEditable}
          onAddItem={async (input) => {
            await addItemMutation.mutateAsync({ projectId, planId, input });
          }}
          onUpdateItem={async (itemId, input) => {
            await updateItemMutation.mutateAsync({
              projectId,
              planId,
              itemId,
              input,
            });
          }}
          onDeleteItem={async (itemId) => {
            await deleteItemMutation.mutateAsync({ projectId, planId, itemId });
          }}
        />
      ) : planType === "CONTENT" ? (
        <ContentPlanItemsList
          items={plan.items}
          totalBudget={plan.totalBudget}
          projectId={projectId}
          planId={planId}
          isEditable={isEditable}
          onAddItem={async (input) => {
            await addItemMutation.mutateAsync({ projectId, planId, input });
          }}
          onUpdateItem={async (itemId, input) => {
            await updateItemMutation.mutateAsync({
              projectId,
              planId,
              itemId,
              input,
            });
          }}
          onDeleteItem={async (itemId) => {
            await deleteItemMutation.mutateAsync({ projectId, planId, itemId });
          }}
        />
      ) : (
        <MediaPlanItemsTable
          items={plan.items}
          totalBudget={plan.totalBudget}
          planType="ADS"
          isEditable={isEditable}
          onAddItem={async (input) => {
            await addItemMutation.mutateAsync({ projectId, planId, input });
          }}
          onUpdateItem={async (itemId, input) => {
            await updateItemMutation.mutateAsync({
              projectId,
              planId,
              itemId,
              input,
            });
          }}
          onDeleteItem={async (itemId) => {
            await deleteItemMutation.mutateAsync({ projectId, planId, itemId });
          }}
        />
      )}
    </div>
  );
}

function MediaPlanDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}
