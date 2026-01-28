'use client';

import { Trash2, Link2, Unlink } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ProjectPhaseItem } from '@/lib/api/project-phases';
import { useUpdatePhaseItem, useDeletePhaseItem, useLinkTask } from '@/hooks/use-project-phases';

interface PhaseItemRowProps {
  item: ProjectPhaseItem;
  projectId: string;
  phaseId: string;
  onLinkTask: (itemId: string) => void;
}

export function PhaseItemRow({ item, projectId, phaseId, onLinkTask }: PhaseItemRowProps) {
  const updateItem = useUpdatePhaseItem();
  const deleteItem = useDeletePhaseItem();
  const unlinkTask = useLinkTask();

  const toggleComplete = () => {
    updateItem.mutate({
      projectId,
      phaseId,
      itemId: item.id,
      data: { isComplete: !item.isComplete },
    });
  };

  const handleDelete = () => {
    deleteItem.mutate({ projectId, phaseId, itemId: item.id });
  };

  const handleUnlink = () => {
    unlinkTask.mutate({ projectId, phaseId, itemId: item.id, taskId: null });
  };

  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-secondary/50 group transition-colors">
      <Checkbox
        checked={item.isComplete}
        onCheckedChange={toggleComplete}
      />
      <span
        className={cn(
          'flex-1 text-[13px]',
          item.isComplete && 'line-through text-muted-foreground'
        )}
      >
        {item.name}
      </span>
      <Badge variant="secondary" className="text-[10px] font-medium shrink-0">
        {item.weight}%
      </Badge>

      {item.task ? (
        <div className="flex items-center gap-1">
          <Badge variant="outline" className="text-[10px] max-w-[120px] truncate">
            {item.task.title}
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100"
            onClick={handleUnlink}
          >
            <Unlink className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-[11px] opacity-0 group-hover:opacity-100"
          onClick={() => onLinkTask(item.id)}
        >
          <Link2 className="h-3 w-3 mr-1" /> Link Task
        </Button>
      )}

      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
        onClick={handleDelete}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}
