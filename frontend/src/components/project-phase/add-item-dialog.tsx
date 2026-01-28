'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAddPhaseItem } from '@/hooks/use-project-phases';

interface AddItemDialogProps {
  projectId: string;
  phaseId: string;
}

export function AddItemDialog({ projectId, phaseId }: AddItemDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [weight, setWeight] = useState('5');
  const [description, setDescription] = useState('');
  const addItem = useAddPhaseItem();

  const handleSubmit = () => {
    if (!name.trim()) return;
    addItem.mutate(
      {
        projectId,
        phaseId,
        data: {
          name: name.trim(),
          description: description.trim() || undefined,
          weight: Number(weight) || 5,
        },
      },
      {
        onSuccess: () => {
          setName('');
          setWeight('5');
          setDescription('');
          setOpen(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-[12px] text-muted-foreground">
          <Plus className="h-3.5 w-3.5 mr-1" /> Thêm item
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thêm item mới</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="item-name">Tên *</Label>
            <Input
              id="item-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tên item..."
            />
          </div>
          <div>
            <Label htmlFor="item-weight">Weight (%)</Label>
            <Input
              id="item-weight"
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              min="1"
              max="100"
            />
          </div>
          <div>
            <Label htmlFor="item-desc">Mô tả (tùy chọn)</Label>
            <Input
              id="item-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSubmit} disabled={!name.trim() || addItem.isPending}>
              {addItem.isPending ? 'Đang thêm...' : 'Thêm'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
