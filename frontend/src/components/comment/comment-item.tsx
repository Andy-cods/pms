'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { MoreHorizontal, Reply, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/use-auth';
import { useDeleteComment } from '@/hooks/use-comments';
import { CommentInput } from './comment-input';
import type { Comment } from '@/lib/api/comments';
import { cn } from '@/lib/utils';

interface CommentItemProps {
  comment: Comment;
  projectId?: string;
  taskId?: string;
  isReply?: boolean;
}

export function CommentItem({ comment, projectId, taskId, isReply = false }: CommentItemProps) {
  const { user } = useAuth();
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const deleteComment = useDeleteComment();

  const isAuthor = user?.id === comment.author.id;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const renderContent = (content: string) => {
    // Parse and highlight mentions
    const parts = content.split(/(@[a-zA-Z0-9._-]+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return (
          <span key={i} className="text-primary font-medium">
            {part}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  const handleDelete = () => {
    deleteComment.mutate(comment.id, {
      onSuccess: () => setDeleteDialogOpen(false),
    });
  };

  return (
    <div className={cn('group', isReply && 'ml-8 mt-3')}>
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={comment.author.avatar || undefined} alt={comment.author.name} />
          <AvatarFallback className="text-xs">
            {getInitials(comment.author.name)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          {isEditing ? (
            <CommentInput
              projectId={projectId}
              taskId={taskId}
              editingComment={comment}
              onCancel={() => setIsEditing(false)}
              onSuccess={() => setIsEditing(false)}
            />
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{comment.author.name}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.createdAt), {
                    addSuffix: true,
                    locale: vi,
                  })}
                </span>
                {comment.createdAt !== comment.updatedAt && (
                  <span className="text-xs text-muted-foreground">(đã chỉnh sửa)</span>
                )}
              </div>

              <div className="text-sm mt-1 whitespace-pre-wrap break-words">
                {renderContent(comment.content)}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-2">
                {!isReply && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-muted-foreground"
                    onClick={() => setShowReplyInput(!showReplyInput)}
                  >
                    <Reply className="h-3 w-3 mr-1" />
                    Trả lời
                  </Button>
                )}

                {isAuthor && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem onClick={() => setIsEditing(true)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Chỉnh sửa
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDeleteDialogOpen(true)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Xóa
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </>
          )}

          {/* Reply input */}
          {showReplyInput && (
            <div className="mt-3">
              <CommentInput
                projectId={projectId}
                taskId={taskId}
                parentId={comment.id}
                onCancel={() => setShowReplyInput(false)}
                onSuccess={() => setShowReplyInput(false)}
                placeholder={`Trả lời ${comment.author.name}...`}
              />
            </div>
          )}

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-muted-foreground"
                onClick={() => setShowReplies(!showReplies)}
              >
                {showReplies ? (
                  <ChevronUp className="h-3 w-3 mr-1" />
                ) : (
                  <ChevronDown className="h-3 w-3 mr-1" />
                )}
                {comment.replies.length} phản hồi
              </Button>
              {showReplies && (
                <div className="space-y-3 mt-2">
                  {comment.replies.map((reply) => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      projectId={projectId}
                      taskId={taskId}
                      isReply
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa bình luận?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Bình luận và tất cả phản hồi sẽ bị xóa vĩnh viễn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={deleteComment.isPending}
            >
              {deleteComment.isPending ? 'Đang xóa...' : 'Xóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
