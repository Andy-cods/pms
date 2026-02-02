"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, PenLine } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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

import { useMediaPlan } from "@/hooks/use-media-plans";
import { useProjectTeam } from "@/hooks/use-projects";
import {
  useContentPosts,
  useCreateContentPost,
  useUpdateContentPost,
  useDeleteContentPost,
  useChangeContentPostStatus,
  useDuplicateContentPost,
} from "@/hooks/use-content-posts";
import {
  type ContentPost,
  type ContentPostStatus,
  type CreateContentPostInput,
  type UpdateContentPostInput,
  STATUS_LABELS,
} from "@/lib/api/content-posts";
import {
  MEDIA_CHANNELS_BY_TYPE,
  formatVNDCompact,
} from "@/lib/api/media-plans";

import { ContentPostCard } from "@/components/content-post/content-post-card";
import { ContentPostForm } from "@/components/content-post/content-post-form";
import { DuplicatePostDialog } from "@/components/content-post/duplicate-post-dialog";
import { RevisionHistoryDialog } from "@/components/content-post/revision-history-dialog";

const CHANNEL_IDENTITY: Record<string, { color: string; icon: string }> = {
  facebook: { color: "#007aff", icon: "f" },
  instagram: { color: "#ff3b30", icon: "ig" },
  tiktok: { color: "#000000", icon: "tk" },
  blog: { color: "#34c759", icon: "B" },
  email: { color: "#ff9f0a", icon: "@" },
  ads_copy: { color: "#5856d6", icon: "Ad" },
  video_script: { color: "#ff2d55", icon: "V" },
  pr: { color: "#af52de", icon: "PR" },
  other: { color: "#8e8e93", icon: "?" },
};

const ALL_STATUSES: (ContentPostStatus | "ALL")[] = [
  "ALL",
  "IDEA",
  "DRAFT",
  "REVIEW",
  "APPROVED",
  "REVISION_REQUESTED",
  "SCHEDULED",
  "PUBLISHED",
  "CANCELLED",
];

export default function ChannelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const planId = params.planId as string;
  const itemId = params.itemId as string;

  // State
  const [statusFilter, setStatusFilter] = useState<ContentPostStatus | "ALL">(
    "ALL",
  );
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPost, setEditingPost] = useState<ContentPost | null>(null);
  const [deletingPost, setDeletingPost] = useState<ContentPost | null>(null);
  const [duplicatingPost, setDuplicatingPost] = useState<ContentPost | null>(
    null,
  );
  const [revisionsPost, setRevisionsPost] = useState<ContentPost | null>(null);
  const [revisionNotePost, setRevisionNotePost] = useState<{
    post: ContentPost;
    status: ContentPostStatus;
  } | null>(null);
  const [revisionNote, setRevisionNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data
  const { data: plan, isLoading: planLoading } = useMediaPlan(
    projectId,
    planId,
  );
  const { data: teamData } = useProjectTeam(projectId);
  const { data: postsData, isLoading: postsLoading } = useContentPosts(
    projectId,
    planId,
    itemId,
    statusFilter === "ALL" ? undefined : { status: statusFilter },
  );

  // Mutations
  const createPost = useCreateContentPost();
  const updatePost = useUpdateContentPost();
  const deletePost = useDeleteContentPost();
  const changeStatus = useChangeContentPostStatus();
  const duplicatePost = useDuplicateContentPost();

  // Find current item from plan
  const currentItem = plan?.items.find((i) => i.id === itemId);
  const channelKey = currentItem?.channel ?? "";
  const ch = CHANNEL_IDENTITY[channelKey] ?? CHANNEL_IDENTITY.other;
  const channelLabel =
    MEDIA_CHANNELS_BY_TYPE.CONTENT.find((c) => c.value === channelKey)?.label ??
    channelKey;

  // Team members for assignee selector
  const teamMembers = (teamData ?? [])
    .filter((m) => m.user)
    .map((m) => ({ id: m.user!.id, name: m.user!.name }));

  // Other channels in same plan for duplicate
  const otherChannels = (plan?.items ?? []).map((item) => ({
    id: item.id,
    channel: item.channel,
    label:
      MEDIA_CHANNELS_BY_TYPE.CONTENT.find((c) => c.value === item.channel)
        ?.label ?? item.channel,
  }));

  const posts = postsData?.data ?? [];
  const totalPosts = postsData?.total ?? 0;

  // Stats
  const publishedCount = posts.filter((p) => p.status === "PUBLISHED").length;
  const scheduledCount = posts.filter((p) => p.status === "SCHEDULED").length;
  const draftCount = posts.filter((p) =>
    ["IDEA", "DRAFT"].includes(p.status),
  ).length;

  // Handlers
  const handleCreate = async (
    input: CreateContentPostInput | UpdateContentPostInput,
  ) => {
    setIsSubmitting(true);
    try {
      await createPost.mutateAsync({
        projectId,
        planId,
        itemId,
        input: input as CreateContentPostInput,
      });
      setShowAddForm(false);
      toast.success("Đã thêm bài viết mới");
    } catch {
      toast.error("Không thể thêm bài viết");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (
    input: CreateContentPostInput | UpdateContentPostInput,
  ) => {
    if (!editingPost) return;
    setIsSubmitting(true);
    try {
      await updatePost.mutateAsync({
        projectId,
        planId,
        itemId,
        postId: editingPost.id,
        input: input as UpdateContentPostInput,
      });
      setEditingPost(null);
      toast.success("Đã cập nhật bài viết");
    } catch {
      toast.error("Không thể cập nhật bài viết");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingPost) return;
    try {
      await deletePost.mutateAsync({
        projectId,
        planId,
        itemId,
        postId: deletingPost.id,
      });
      setDeletingPost(null);
      toast.success("Đã xóa bài viết");
    } catch {
      toast.error("Không thể xóa bài viết");
    }
  };

  const handleStatusChange = (
    post: ContentPost,
    newStatus: ContentPostStatus,
  ) => {
    if (newStatus === "REVISION_REQUESTED") {
      setRevisionNotePost({ post, status: newStatus });
      setRevisionNote("");
      return;
    }
    doStatusChange(post, newStatus);
  };

  const doStatusChange = async (
    post: ContentPost,
    newStatus: ContentPostStatus,
    note?: string,
  ) => {
    try {
      await changeStatus.mutateAsync({
        projectId,
        planId,
        itemId,
        postId: post.id,
        input: { status: newStatus, ...(note && { revisionNote: note }) },
      });
      toast.success(`Đã chuyển trạng thái sang "${STATUS_LABELS[newStatus]}"`);
    } catch {
      toast.error("Không thể thay đổi trạng thái");
    }
  };

  const handleRevisionConfirm = async () => {
    if (!revisionNotePost) return;
    await doStatusChange(
      revisionNotePost.post,
      revisionNotePost.status,
      revisionNote,
    );
    setRevisionNotePost(null);
    setRevisionNote("");
  };

  const handleDuplicate = async (postId: string, targetItemId: string) => {
    setIsSubmitting(true);
    try {
      await duplicatePost.mutateAsync({
        projectId,
        planId,
        itemId,
        postId,
        input: { targetItemId },
      });
      setDuplicatingPost(null);
      toast.success("Đã sao chép bài viết");
    } catch {
      toast.error("Không thể sao chép bài viết");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (planLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-48 rounded-xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!currentItem) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-callout text-muted-foreground">Kênh không tồn tại</p>
        <Button
          variant="outline"
          className="rounded-full mt-4"
          onClick={() => router.back()}
        >
          Quay lại
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-xl h-10 w-10"
          onClick={() =>
            router.push(
              `/dashboard/projects/${projectId}/media-plans/${planId}`,
            )
          }
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div
          className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-lg"
          style={{ backgroundColor: ch.color }}
        >
          {ch.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-headline font-bold truncate">{channelLabel}</h1>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#ff9f0a]/10 text-[#ff9f0a] dark:bg-[#ffd60a]/15 dark:text-[#ffd60a]">
              {currentItem.campaignType.replace(/_/g, " ")}
            </span>
          </div>
          <p className="text-footnote text-muted-foreground">
            {plan?.name} · {formatVNDCompact(currentItem.budget)}
          </p>
        </div>

        <Button
          className="rounded-full bg-[#ff9f0a] hover:bg-[#ff9f0a]/90 text-white"
          onClick={() => setShowAddForm(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Thêm bài viết
        </Button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl bg-[#ff9f0a]/5 dark:bg-[#ffd60a]/10 p-3.5 text-center">
          <p className="text-[22px] font-bold tabular-nums text-[#ff9f0a] dark:text-[#ffd60a]">
            {totalPosts}
          </p>
          <p className="text-caption text-muted-foreground mt-0.5">
            Tổng bài viết
          </p>
        </div>
        <div className="rounded-xl bg-emerald-500/5 dark:bg-emerald-400/10 p-3.5 text-center">
          <p className="text-[22px] font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
            {publishedCount}
          </p>
          <p className="text-caption text-muted-foreground mt-0.5">Đã đăng</p>
        </div>
        <div className="rounded-xl bg-purple-500/5 dark:bg-purple-400/10 p-3.5 text-center">
          <p className="text-[22px] font-bold tabular-nums text-purple-600 dark:text-purple-400">
            {scheduledCount}
          </p>
          <p className="text-caption text-muted-foreground mt-0.5">
            Đã lên lịch
          </p>
        </div>
        <div className="rounded-xl bg-blue-500/5 dark:bg-blue-400/10 p-3.5 text-center">
          <p className="text-[22px] font-bold tabular-nums text-blue-600 dark:text-blue-400">
            {draftCount}
          </p>
          <p className="text-caption text-muted-foreground mt-0.5">Bản nháp</p>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {ALL_STATUSES.map((s) => {
          const isActive = statusFilter === s;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? "bg-[#ff9f0a] text-white"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              {s === "ALL" ? "Tất cả" : STATUS_LABELS[s]}
            </button>
          );
        })}
      </div>

      {/* Posts list */}
      <Card className="rounded-2xl border-border/50 shadow-apple-sm">
        <CardContent className="pt-6">
          {postsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="h-16 w-16 rounded-2xl bg-[#ff9f0a]/10 flex items-center justify-center mb-3">
                <PenLine className="h-8 w-8 text-[#ff9f0a]" />
              </div>
              <p className="text-callout font-medium mb-1">
                {statusFilter === "ALL"
                  ? "Chưa có bài viết"
                  : `Không có bài viết "${STATUS_LABELS[statusFilter]}"`}
              </p>
              <p className="text-footnote text-muted-foreground mb-4">
                Thêm bài viết đầu tiên cho kênh này
              </p>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => setShowAddForm(true)}
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Thêm bài viết
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <ContentPostCard
                  key={post.id}
                  post={post}
                  onEdit={setEditingPost}
                  onDelete={setDeletingPost}
                  onStatusChange={handleStatusChange}
                  onDuplicate={setDuplicatingPost}
                  onViewRevisions={setRevisionsPost}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add form dialog */}
      <ContentPostForm
        open={showAddForm}
        onOpenChange={setShowAddForm}
        channel={channelKey}
        teamMembers={teamMembers}
        onSubmit={handleCreate}
        isSubmitting={isSubmitting}
      />

      {/* Edit form dialog */}
      <ContentPostForm
        open={!!editingPost}
        onOpenChange={(open) => !open && setEditingPost(null)}
        channel={channelKey}
        post={editingPost ?? undefined}
        teamMembers={teamMembers}
        onSubmit={handleUpdate}
        isSubmitting={isSubmitting}
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deletingPost}
        onOpenChange={() => setDeletingPost(null)}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa bài viết?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa &ldquo;{deletingPost?.title}&rdquo;? Hành
              động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="rounded-full bg-[#ff3b30] hover:bg-[#ff3b30]/90"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revision note dialog */}
      <AlertDialog
        open={!!revisionNotePost}
        onOpenChange={() => setRevisionNotePost(null)}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Yêu cầu chỉnh sửa</AlertDialogTitle>
            <AlertDialogDescription>
              Nhập ghi chú cho yêu cầu chỉnh sửa. Phiên bản hiện tại sẽ được lưu
              vào lịch sử.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <textarea
            value={revisionNote}
            onChange={(e) => setRevisionNote(e.target.value)}
            placeholder="Lý do yêu cầu chỉnh sửa..."
            rows={3}
            className="w-full rounded-xl border border-border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#ff9f0a]/50"
          />
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevisionConfirm}
              className="rounded-full bg-[#ff9f0a] hover:bg-[#ff9f0a]/90"
            >
              Yêu cầu sửa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Duplicate dialog */}
      <DuplicatePostDialog
        open={!!duplicatingPost}
        onOpenChange={(open) => !open && setDuplicatingPost(null)}
        post={duplicatingPost}
        channels={otherChannels}
        currentItemId={itemId}
        onDuplicate={handleDuplicate}
        isSubmitting={isSubmitting}
      />

      {/* Revision history dialog */}
      <RevisionHistoryDialog
        open={!!revisionsPost}
        onOpenChange={(open) => !open && setRevisionsPost(null)}
        post={revisionsPost}
      />
    </div>
  );
}
