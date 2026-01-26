'use client';

import { useState, useRef, useEffect, startTransition } from 'react';
import { Send, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { useCreateComment, useUpdateComment } from '@/hooks/use-comments';
import type { Comment } from '@/lib/api/comments';

interface CommentInputProps {
  projectId?: string;
  taskId?: string;
  parentId?: string;
  editingComment?: Comment;
  onCancel?: () => void;
  onSuccess?: () => void;
  placeholder?: string;
}

export function CommentInput({
  projectId,
  taskId,
  parentId,
  editingComment,
  onCancel,
  onSuccess,
  placeholder = 'Viết bình luận... (dùng @ để mention)',
}: CommentInputProps) {
  const { user } = useAuth();
  const [content, setContent] = useState(editingComment?.content || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const createComment = useCreateComment();
  const updateComment = useUpdateComment();

  const isEditing = !!editingComment;
  const isPending = createComment.isPending || updateComment.isPending;

  useEffect(() => {
    if (editingComment) {
      startTransition(() => {
        setContent(editingComment.content);
        textareaRef.current?.focus();
      });
    } else {
      startTransition(() => setContent(''));
    }
  }, [editingComment]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSubmit = () => {
    if (!content.trim()) return;

    if (isEditing) {
      updateComment.mutate(
        { id: editingComment.id, input: { content: content.trim() } },
        {
          onSuccess: () => {
            setContent('');
            onSuccess?.();
          },
        }
      );
    } else {
      createComment.mutate(
        {
          content: content.trim(),
          projectId,
          taskId,
          parentId,
        },
        {
          onSuccess: () => {
            setContent('');
            onSuccess?.();
          },
        }
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex gap-3">
      {!isEditing && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={user?.avatar || undefined} alt={user?.name} />
          <AvatarFallback className="text-xs">
            {user?.name ? getInitials(user.name) : 'U'}
          </AvatarFallback>
        </Avatar>
      )}

      <div className="flex-1 space-y-2">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="min-h-[80px] resize-none"
          disabled={isPending}
        />

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Ctrl + Enter để gửi
          </p>
          <div className="flex items-center gap-2">
            {(onCancel || isEditing) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
                disabled={isPending}
              >
                <X className="h-4 w-4 mr-1" />
                Hủy
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!content.trim() || isPending}
            >
              <Send className="h-4 w-4 mr-1" />
              {isPending ? 'Đang gửi...' : isEditing ? 'Cập nhật' : 'Gửi'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
