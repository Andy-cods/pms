"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { type ContentPost } from "@/lib/api/content-posts";

interface ChannelOption {
  id: string;
  channel: string;
  label: string;
}

interface DuplicatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: ContentPost | null;
  channels: ChannelOption[];
  currentItemId: string;
  onDuplicate: (postId: string, targetItemId: string) => Promise<void>;
  isSubmitting?: boolean;
}

export function DuplicatePostDialog({
  open,
  onOpenChange,
  post,
  channels,
  currentItemId,
  onDuplicate,
  isSubmitting = false,
}: DuplicatePostDialogProps) {
  const [targetItemId, setTargetItemId] = useState("");

  const otherChannels = channels.filter((c) => c.id !== currentItemId);

  const handleDuplicate = async () => {
    if (!post || !targetItemId) return;
    await onDuplicate(post.id, targetItemId);
    setTargetItemId("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="text-headline font-semibold">
            Sao chép bài viết
          </DialogTitle>
          <DialogDescription className="text-caption text-muted-foreground">
            Sao chép &ldquo;{post?.title}&rdquo; sang kênh khác trong cùng kế
            hoạch.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <div className="space-y-2">
            <Label className="text-caption font-medium">Kênh đích</Label>
            <Select value={targetItemId} onValueChange={setTargetItemId}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Chọn kênh..." />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {otherChannels.map((ch) => (
                  <SelectItem key={ch.id} value={ch.id}>
                    {ch.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Hủy
          </Button>
          <Button
            className="rounded-full bg-[#ff9f0a] hover:bg-[#ff9f0a]/90 text-white"
            onClick={handleDuplicate}
            disabled={isSubmitting || !targetItemId}
          >
            {isSubmitting ? "Đang sao chép..." : "Sao chép"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
