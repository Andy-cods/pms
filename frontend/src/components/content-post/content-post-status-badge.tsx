"use client";

import { cn } from "@/lib/utils";
import {
  type ContentPostStatus,
  STATUS_LABELS,
  STATUS_COLORS,
  STATUS_DOT_COLORS,
} from "@/lib/api/content-posts";

interface ContentPostStatusBadgeProps {
  status: ContentPostStatus;
  showDot?: boolean;
  className?: string;
}

export function ContentPostStatusBadge({
  status,
  showDot = true,
  className,
}: ContentPostStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium",
        STATUS_COLORS[status],
        className,
      )}
    >
      {showDot && (
        <span
          className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT_COLORS[status])}
        />
      )}
      {STATUS_LABELS[status]}
    </span>
  );
}
