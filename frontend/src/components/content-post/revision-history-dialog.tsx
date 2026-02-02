"use client";

import { Clock, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { type ContentPost } from "@/lib/api/content-posts";

interface RevisionHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: ContentPost | null;
}

export function RevisionHistoryDialog({
  open,
  onOpenChange,
  post,
}: RevisionHistoryDialogProps) {
  if (!post) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-headline font-semibold">
            Lịch sử chỉnh sửa
          </DialogTitle>
          <p className="text-caption text-muted-foreground">{post.title}</p>
        </DialogHeader>

        <div className="space-y-3 py-2 max-h-[400px] overflow-y-auto">
          {post.revisions.length === 0 ? (
            <div className="text-center py-8">
              <div className="h-12 w-12 rounded-2xl bg-[#ff9f0a]/10 flex items-center justify-center mx-auto mb-2">
                <FileText className="h-6 w-6 text-[#ff9f0a]" />
              </div>
              <p className="text-callout text-muted-foreground">
                Chưa có lịch sử chỉnh sửa
              </p>
            </div>
          ) : (
            post.revisions.map((rev, idx) => (
              <div
                key={rev.id}
                className="rounded-xl border border-border/50 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-callout font-medium">
                      Phiên bản {post.revisions.length - idx}
                    </p>
                    <p className="text-caption font-medium mt-1 text-foreground/80">
                      {rev.title}
                    </p>
                    {rev.content && (
                      <p className="text-caption text-muted-foreground mt-1 line-clamp-2">
                        {rev.content}
                      </p>
                    )}
                    {rev.revisionNote && (
                      <div className="mt-2 px-3 py-2 rounded-lg bg-orange-50 dark:bg-orange-950/20 text-[11px]">
                        <span className="font-medium text-orange-600 dark:text-orange-400">
                          Ghi chú:
                        </span>{" "}
                        <span className="text-orange-700 dark:text-orange-300">
                          {rev.revisionNote}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
                    <Clock className="h-3 w-3" />
                    <span>
                      {new Date(rev.createdAt).toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
