'use client';

import { useState } from 'react';
import { Copy, Eye, EyeOff, RefreshCw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    return accessCode.slice(0, 2) + '*'.repeat(accessCode.length - 2);
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
      <div className={cn('flex items-center gap-2', className)}>
        <code className="bg-muted px-2 py-1 rounded text-sm font-mono min-w-[80px]">
          {displayCode}
        </code>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsRevealed(!isRevealed)}
            >
              {isRevealed ? (
                <EyeOff className="h-3.5 w-3.5" />
              ) : (
                <Eye className="h-3.5 w-3.5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isRevealed ? 'An ma' : 'Hien thi ma'}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleCopy}
            >
              {justCopied ? (
                <Check className="h-3.5 w-3.5 text-green-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy ma</TooltipContent>
        </Tooltip>

        {showRegenerateButton && onRegenerate && (
          <AlertDialog>
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    disabled={isRegenerating}
                  >
                    <RefreshCw
                      className={cn(
                        'h-3.5 w-3.5',
                        isRegenerating && 'animate-spin'
                      )}
                    />
                  </Button>
                </AlertDialogTrigger>
              </TooltipTrigger>
              <TooltipContent>Tao ma moi</TooltipContent>
            </Tooltip>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tao ma truy cap moi?</AlertDialogTitle>
                <AlertDialogDescription>
                  Ma truy cap cu se bi vo hieu hoa ngay lap tuc. Client se khong
                  the dang nhap bang ma cu nua. Ban co chac muon tiep tuc?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Huy</AlertDialogCancel>
                <AlertDialogAction onClick={onRegenerate}>
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
