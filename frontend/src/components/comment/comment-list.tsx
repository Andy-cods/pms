'use client';

import { MessageSquare } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useComments } from '@/hooks/use-comments';
import { CommentItem } from './comment-item';

interface CommentListProps {
  projectId?: string;
  taskId?: string;
}

export function CommentList({ projectId, taskId }: CommentListProps) {
  const { data, isLoading } = useComments({ projectId, taskId });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const comments = data?.comments ?? [];

  if (comments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <MessageSquare className="h-10 w-10 mb-2 opacity-50" />
        <p className="text-sm">Chưa có bình luận nào</p>
        <p className="text-xs">Hãy là người đầu tiên bình luận</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          projectId={projectId}
          taskId={taskId}
        />
      ))}
    </div>
  );
}
