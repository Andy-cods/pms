"use client";

import {
  Pencil,
  Trash2,
  Copy,
  MoreHorizontal,
  Clock,
  FileText,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ContentPostStatusBadge } from "./content-post-status-badge";
import {
  type ContentPost,
  type ContentPostStatus,
  STATUS_TRANSITIONS,
  STATUS_LABELS,
  STATUS_DOT_COLORS,
} from "@/lib/api/content-posts";

interface ContentPostCardProps {
  post: ContentPost;
  onEdit: (post: ContentPost) => void;
  onDelete: (post: ContentPost) => void;
  onStatusChange: (post: ContentPost, newStatus: ContentPostStatus) => void;
  onDuplicate: (post: ContentPost) => void;
  onViewRevisions: (post: ContentPost) => void;
  isEditable?: boolean;
}

export function ContentPostCard({
  post,
  onEdit,
  onDelete,
  onStatusChange,
  onDuplicate,
  onViewRevisions,
  isEditable = true,
}: ContentPostCardProps) {
  const nextStatuses = STATUS_TRANSITIONS[post.status];
  const initials =
    post.assignee?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2) ?? "";

  return (
    <div className="group relative rounded-xl border border-border/50 hover:border-[#ff9f0a]/30 hover:shadow-sm transition-all overflow-hidden">
      {/* Left status accent bar */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${STATUS_DOT_COLORS[post.status]}`}
      />

      <div className="pl-5 pr-4 py-3.5">
        {/* Top row */}
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-callout font-semibold truncate">
                {post.title}
              </span>
              <ContentPostStatusBadge status={post.status} />
            </div>
            {post.content && (
              <p className="text-caption text-muted-foreground mt-1 line-clamp-1">
                {post.content}
              </p>
            )}
          </div>

          {/* Actions */}
          {isEditable && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-lg shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl">
                <DropdownMenuItem onClick={() => onEdit(post)}>
                  <Pencil className="h-3.5 w-3.5 mr-2" />
                  Chỉnh sửa
                </DropdownMenuItem>
                {nextStatuses.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    {nextStatuses.map((s) => (
                      <DropdownMenuItem
                        key={s}
                        onClick={() => onStatusChange(post, s)}
                      >
                        <span
                          className={`h-2 w-2 rounded-full mr-2 ${STATUS_DOT_COLORS[s]}`}
                        />
                        {STATUS_LABELS[s]}
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onDuplicate(post)}>
                  <Copy className="h-3.5 w-3.5 mr-2" />
                  Sao chép sang kênh khác
                </DropdownMenuItem>
                {post.revisions.length > 0 && (
                  <DropdownMenuItem onClick={() => onViewRevisions(post)}>
                    <History className="h-3.5 w-3.5 mr-2" />
                    Lịch sử ({post.revisions.length})
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(post)}
                  className="text-[#ff3b30] focus:text-[#ff3b30]"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                  Xóa
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Bottom metadata row */}
        <div className="flex items-center gap-3 mt-2.5 flex-wrap">
          <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#ff9f0a]/10 text-[#ff9f0a] dark:bg-[#ffd60a]/15 dark:text-[#ffd60a]">
            {post.postType.replace(/_/g, " ")}
          </span>

          {post.scheduledDate && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>
                {new Date(post.scheduledDate).toLocaleDateString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                })}
              </span>
            </div>
          )}

          {post.assignee && (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Avatar className="h-4 w-4">
                <AvatarFallback className="text-[7px] bg-[#ff9f0a]/10 text-[#ff9f0a]">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="truncate max-w-[100px]">
                {post.assignee.name}
              </span>
            </div>
          )}

          {post.fileCount > 0 && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <FileText className="h-3 w-3" />
              <span>{post.fileCount}</span>
            </div>
          )}

          {post.postUrl && (
            <a
              href={post.postUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-[#007aff] hover:underline truncate max-w-[120px]"
              onClick={(e) => e.stopPropagation()}
            >
              Xem bài
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
