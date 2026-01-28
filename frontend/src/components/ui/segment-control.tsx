'use client';

import { cn } from '@/lib/utils';

interface SegmentItem {
  value: string;
  label: string;
  count?: number;
}

interface SegmentControlProps {
  value: string;
  onChange: (value: string) => void;
  items: SegmentItem[];
}

export function SegmentControl({ value, onChange, items }: SegmentControlProps) {
  return (
    <div className="inline-flex p-1 rounded-xl bg-surface">
      {items.map((item) => (
        <button
          key={item.value}
          onClick={() => onChange(item.value)}
          className={cn(
            'px-4 py-2 rounded-lg text-footnote font-medium transition-all duration-200',
            value === item.value
              ? 'bg-background shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {item.label}
          {item.count !== undefined && (
            <span className="ml-1.5 text-muted-foreground">({item.count})</span>
          )}
        </button>
      ))}
    </div>
  );
}
