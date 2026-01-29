'use client';

import { cn } from '@/lib/utils';

interface SegmentItem {
  value: string;
  label: string;
  count?: number;
  disabled?: boolean;
}

interface SegmentControlProps {
  value: string;
  onChange: (value: string) => void;
  items: SegmentItem[];
}

export function SegmentControl({ value, onChange, items }: SegmentControlProps) {
  return (
    <div className="inline-flex flex-wrap gap-1 p-1 rounded-xl bg-surface">
      {items.map((item) => (
        <button
          key={item.value}
          onClick={() => !item.disabled && onChange(item.value)}
          disabled={item.disabled}
          className={cn(
            'px-4 py-2 rounded-lg text-footnote font-medium transition-all duration-200',
            item.disabled
              ? 'text-muted-foreground/40 cursor-not-allowed'
              : value === item.value
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
          )}
          title={item.disabled ? 'Mở khi đạt giai đoạn tiếp theo' : undefined}
        >
          {item.disabled && (
            <span className="mr-1 text-[10px]">🔒</span>
          )}
          {item.label}
          {item.count !== undefined && !item.disabled && (
            <span className="ml-1.5 text-muted-foreground">({item.count})</span>
          )}
        </button>
      ))}
    </div>
  );
}
