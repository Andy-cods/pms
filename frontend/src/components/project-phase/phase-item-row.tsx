'use client';

import { useState, useEffect } from 'react';
import { Trash2, Link2, Unlink, User, Users, FileOutput, Pencil } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

  const [editing, setEditing] = useState(false);
  const [editPic, setEditPic] = useState(item.pic ?? '');
  const [editSupport, setEditSupport] = useState(item.support ?? '');
  const [editOutput, setEditOutput] = useState(item.expectedOutput ?? '');

  // Reset local state when item changes
  useEffect(() => {
    if (!editing) {
      setEditPic(item.pic ?? '');
      setEditSupport(item.support ?? '');
      setEditOutput(item.expectedOutput ?? '');
    }
  }, [item.pic, item.support, item.expectedOutput, editing]);

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

  const handleSaveMeta = () => {
    const pic = editPic.trim() || undefined;
    const support = editSupport.trim() || undefined;
    const expectedOutput = editOutput.trim() || undefined;

    // Only save if something changed
    if (pic !== (item.pic ?? undefined) || support !== (item.support ?? undefined) || expectedOutput !== (item.expectedOutput ?? undefined)) {
      updateItem.mutate({
        projectId,
        phaseId,
        itemId: item.id,
        data: { pic: pic ?? '', support: support ?? '', expectedOutput: expectedOutput ?? '' },
      });
    }
    setEditing(false);
  };

  const hasMeta = item.pic || item.support || item.expectedOutput;

  return (
    <div className="py-2 px-3 rounded-lg hover:bg-muted/40 group transition-colors">
      {/* Main row */}
      <div className="flex items-center gap-3">
        <Checkbox
          checked={item.isComplete}
          onCheckedChange={toggleComplete}
          className="shrink-0"
        />
        <span
          className={cn(
            'flex-1 text-[13px]',
            item.isComplete && 'line-through text-muted-foreground'
          )}
        >
          {item.name}
        </span>

        <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md shrink-0 tabular-nums">
          {item.weight}%
        </span>

        {item.task ? (
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-medium text-foreground/70 bg-muted/60 border border-border/30 px-1.5 py-0.5 rounded-md max-w-[120px] truncate">
              {item.task.title}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleUnlink}
            >
              <Unlink className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-[11px] opacity-0 group-hover:opacity-100 transition-opacity gap-1"
            onClick={() => onLinkTask(item.id)}
          >
            <Link2 className="h-3 w-3" /> Link Task
          </Button>
        )}

        {/* Edit meta button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
          onClick={() => setEditing(!editing)}
        >
          <Pencil className="h-3 w-3" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
          onClick={handleDelete}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {/* Inline Edit Form */}
      {editing && (
        <div className="ml-9 mt-2 space-y-2 p-3 rounded-lg border border-border/40 bg-muted/10">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] font-medium text-muted-foreground flex items-center gap-1 mb-1">
                <User className="h-3 w-3 text-blue-500" /> PIC
              </label>
              <Input
                value={editPic}
                onChange={(e) => setEditPic(e.target.value)}
                placeholder="Sale, Planner..."
                className="h-7 text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-muted-foreground flex items-center gap-1 mb-1">
                <Users className="h-3 w-3 text-amber-500" /> Support
              </label>
              <Input
                value={editSupport}
                onChange={(e) => setEditSupport(e.target.value)}
                placeholder="Account/Team..."
                className="h-7 text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-muted-foreground flex items-center gap-1 mb-1">
                <FileOutput className="h-3 w-3 text-emerald-500" /> Output
              </label>
              <Input
                value={editOutput}
                onChange={(e) => setEditOutput(e.target.value)}
                placeholder="Brief, Report..."
                className="h-7 text-xs"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" className="h-6 text-[11px]" onClick={() => setEditing(false)}>
              Hủy
            </Button>
            <Button size="sm" className="h-6 text-[11px]" onClick={handleSaveMeta}>
              Lưu
            </Button>
          </div>
        </div>
      )}

      {/* Meta row: PIC, Support, Expected Output (read-only display) */}
      {!editing && hasMeta && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 ml-9 mt-1.5">
          {item.pic && (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <User className="h-3 w-3 text-blue-500" />
              <span className="font-medium text-foreground/70">{item.pic}</span>
            </span>
          )}
          {item.support && (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Users className="h-3 w-3 text-amber-500" />
              <span className="font-medium text-foreground/70">{item.support}</span>
            </span>
          )}
          {item.expectedOutput && (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <FileOutput className="h-3 w-3 text-emerald-500" />
              <span className="font-medium text-foreground/70">{item.expectedOutput}</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
