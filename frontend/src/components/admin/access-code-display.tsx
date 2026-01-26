'use client';

import { useState } from 'react';
import { Copy, Eye, EyeOff, RefreshCw, Check } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AccessCodeDisplayProps {
  code: string;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
  showRegenerateButton?: boolean;
  className?: string;
}

export function AccessCodeDisplay({
  code,
  onRegenerate,
  isRegenerating = false,
  showRegenerateButton = true,
  className,
}: AccessCodeDisplayProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [justCopied, setJustCopied] = useState(false);

  const maskCode = (accessCode: string) => {
    if (accessCode.length <= 2) return accessCode;
    return accessCode.slice(0, 2) + '\u2022'.repeat(Math.min(accessCode.length - 2, 6));
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setJustCopied(true);
      toast.success('Da copy ma truy cap');
      setTimeout(() => setJustCopied(false), 2000);
    } catch {
      toast.error('Khong the copy ma truy cap');
    }
  };

  const displayCode = isRevealed ? code : maskCode(code);

  return (
    <TooltipProvider>
      <div className={cn('flex items-center gap-1.5', className)}>
        {/* Code Display */}
        <code
          className={cn(
            'px-2.5 py-1 rounded-lg text-sm font-mono min-w-[72px] text-center transition-all',
            'bg-surface border border-border/50',
            isRevealed ? 'tracking-wider' : 'tracking-widest'
          )}
        >
          {displayCode}
        </code>

        {/* Toggle Visibility */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setIsRevealed(!isRevealed)}
              className={cn(
                'p-1.5 rounded-lg transition-all',
                'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              {isRevealed ? (
                <EyeOff className="h-3.5 w-3.5" />
              ) : (
                <Eye className="h-3.5 w-3.5" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="rounded-lg text-xs">
            {isRevealed ? 'An ma' : 'Hien thi'}
          </TooltipContent>
        </Tooltip>

        {/* Copy Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleCopy}
              className={cn(
                'p-1.5 rounded-lg transition-all',
                justCopied
                  ? 'text-emerald-500 bg-emerald-500/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              {justCopied ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="rounded-lg text-xs">
            {justCopied ? 'Da copy!' : 'Copy ma'}
          </TooltipContent>
        </Tooltip>

        {/* Regenerate Button */}
        {showRegenerateButton && onRegenerate && (
          <AlertDialog>
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertDialogTrigger asChild>
                  <button
                    disabled={isRegenerating}
                    className={cn(
                      'p-1.5 rounded-lg transition-all',
                      'text-muted-foreground hover:text-foreground hover:bg-muted',
                      isRegenerating && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <RefreshCw
                      className={cn(
                        'h-3.5 w-3.5',
                        isRegenerating && 'animate-spin'
                      )}
                    />
                  </button>
                </AlertDialogTrigger>
              </TooltipTrigger>
              <TooltipContent side="top" className="rounded-lg text-xs">
                Tao ma moi
              </TooltipContent>
            </Tooltip>
            <AlertDialogContent className="rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Tao ma truy cap moi?</AlertDialogTitle>
                <AlertDialogDescription className="space-y-2">
                  <p>
                    Ma truy cap cu se bi vo hieu hoa ngay lap tuc. Client se khong the dang nhap bang ma cu.
                  </p>
                  <p className="text-amber-600 dark:text-amber-400 font-medium">
                    Ban co chac muon tiep tuc?
                  </p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl">Huy</AlertDialogCancel>
                <AlertDialogAction onClick={onRegenerate} className="rounded-xl">
                  Tao ma moi
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </TooltipProvider>
  );
}
