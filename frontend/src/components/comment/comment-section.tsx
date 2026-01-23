'use client';

import { MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useComments } from '@/hooks/use-comments';
import { CommentInput } from './comment-input';
import { CommentList } from './comment-list';

interface CommentSectionProps {
  projectId?: string;
  taskId?: string;
  title?: string;
  showCard?: boolean;
}

export function CommentSection({
  projectId,
  taskId,
  title = 'Bình luận',
  showCard = true,
}: CommentSectionProps) {
  const { data } = useComments({ projectId, taskId });
  const commentCount = data?.total ?? 0;

  const content = (
    <div className="space-y-4">
      <CommentInput projectId={projectId} taskId={taskId} />
      <Separator />
      <CommentList projectId={projectId} taskId={taskId} />
    </div>
  );

  if (!showCard) {
    return content;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="h-5 w-5" />
          {title}
          {commentCount > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              ({commentCount})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}
