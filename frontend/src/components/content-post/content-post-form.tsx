"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type ContentPost,
  type CreateContentPostInput,
  type UpdateContentPostInput,
  POST_TYPE_OPTIONS,
  DEFAULT_POST_TYPES,
} from "@/lib/api/content-posts";

interface ContentPostFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channel: string;
  post?: ContentPost;
  teamMembers?: { id: string; name: string }[];
  onSubmit: (
    input: CreateContentPostInput | UpdateContentPostInput,
  ) => Promise<void>;
  isSubmitting?: boolean;
}

export function ContentPostForm({
  open,
  onOpenChange,
  channel,
  post,
  teamMembers = [],
  onSubmit,
  isSubmitting = false,
}: ContentPostFormProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-[520px]">
        {open && (
          <ContentPostFormInner
            channel={channel}
            post={post}
            teamMembers={teamMembers}
            onSubmit={onSubmit}
            onClose={() => onOpenChange(false)}
            isSubmitting={isSubmitting}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ContentPostFormInner({
  channel,
  post,
  teamMembers,
  onSubmit,
  onClose,
  isSubmitting,
}: {
  channel: string;
  post?: ContentPost;
  teamMembers: { id: string; name: string }[];
  onSubmit: (
    input: CreateContentPostInput | UpdateContentPostInput,
  ) => Promise<void>;
  onClose: () => void;
  isSubmitting: boolean;
}) {
  const postTypes = POST_TYPE_OPTIONS[channel] ?? DEFAULT_POST_TYPES;
  const isEditing = !!post;

  const [title, setTitle] = useState(post?.title ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [postType, setPostType] = useState(
    post?.postType ?? postTypes[0]?.value ?? "",
  );
  const [scheduledDate, setScheduledDate] = useState(
    post?.scheduledDate ? post.scheduledDate.slice(0, 10) : "",
  );
  const [assigneeId, setAssigneeId] = useState(post?.assignee?.id ?? "");
  const [notes, setNotes] = useState(post?.notes ?? "");

  const handleSubmit = async () => {
    if (!title.trim() || !postType) return;

    const input: CreateContentPostInput = {
      title: title.trim(),
      postType,
      ...(content.trim() && { content: content.trim() }),
      ...(scheduledDate && {
        scheduledDate: new Date(scheduledDate).toISOString(),
      }),
      ...(assigneeId && { assigneeId }),
      ...(notes.trim() && { notes: notes.trim() }),
    };

    await onSubmit(input);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-headline font-semibold">
          {isEditing ? "Chỉnh sửa bài viết" : "Thêm bài viết mới"}
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-4 py-2">
        {/* Title */}
        <div className="space-y-2">
          <Label className="text-caption font-medium">Tiêu đề *</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nhập tiêu đề bài viết..."
            className="rounded-xl"
          />
        </div>

        {/* Post Type */}
        <div className="space-y-2">
          <Label className="text-caption font-medium">Loại bài viết *</Label>
          <Select value={postType} onValueChange={setPostType}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Chọn loại bài viết" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {postTypes.map((pt) => (
                <SelectItem key={pt.value} value={pt.value}>
                  {pt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <Label className="text-caption font-medium">Nội dung</Label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Script, nội dung bài viết, ý tưởng..."
            rows={4}
            className="rounded-xl resize-none"
          />
        </div>

        {/* Scheduled Date & Assignee */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-caption font-medium">Ngày lên lịch</Label>
            <Input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-caption font-medium">Người phụ trách</Label>
            <Select value={assigneeId} onValueChange={setAssigneeId}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Chọn..." />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="none">Không chỉ định</SelectItem>
                {teamMembers.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label className="text-caption font-medium">Ghi chú</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ghi chú thêm..."
            rows={2}
            className="rounded-xl resize-none"
          />
        </div>
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          className="rounded-full"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Hủy
        </Button>
        <Button
          className="rounded-full bg-[#ff9f0a] hover:bg-[#ff9f0a]/90 text-white"
          onClick={handleSubmit}
          disabled={isSubmitting || !title.trim() || !postType}
        >
          {isSubmitting
            ? "Đang lưu..."
            : isEditing
              ? "Cập nhật"
              : "Thêm bài viết"}
        </Button>
      </DialogFooter>
    </>
  );
}
