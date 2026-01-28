'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useLinkTask } from '@/hooks/use-project-phases';

interface TaskItem {
  id: string;
  title: string;
  status: string;
}

interface LinkTaskModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  phaseId: string;
  itemId: string;
  tasks: TaskItem[];
}

const STATUS_COLORS: Record<string, string> = {
  TODO: 'bg-secondary text-muted-foreground',
  IN_PROGRESS: 'bg-[#007aff]/10 text-[#007aff]',
  REVIEW: 'bg-[#ff9f0a]/10 text-[#ff9f0a]',
  DONE: 'bg-[#34c759]/10 text-[#34c759]',
  BLOCKED: 'bg-[#ff3b30]/10 text-[#ff3b30]',
};

export function LinkTaskModal({ open, onClose, projectId, phaseId, itemId, tasks }: LinkTaskModalProps) {
  const [search, setSearch] = useState('');
  const linkTask = useLinkTask();

  const filtered = search
    ? tasks.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()))
    : tasks;

  const handleSelect = (taskId: string) => {
    linkTask.mutate(
      { projectId, phaseId, itemId, taskId },
      { onSuccess: () => onClose() },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Liên kết Task</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm task..."
            className="pl-9"
          />
        </div>

        <div className="max-h-[300px] overflow-y-auto space-y-1 mt-2">
          {filtered.length === 0 && (
            <p className="text-center text-[13px] text-muted-foreground py-8">
              Không tìm thấy task
            </p>
          )}
          {filtered.map((task) => (
            <button
              key={task.id}
              onClick={() => handleSelect(task.id)}
              className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-left hover:bg-secondary/50 transition-colors"
            >
              <span className="flex-1 text-[13px] text-foreground truncate">{task.title}</span>
              <Badge className={cn('text-[10px]', STATUS_COLORS[task.status] || STATUS_COLORS.TODO)}>
                {task.status}
              </Badge>
            </button>
          ))}
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
