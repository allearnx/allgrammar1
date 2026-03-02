import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  className?: string;
  text?: string;
}

export function LoadingSpinner({ className, text }: LoadingSpinnerProps) {
  return (
    <div className={cn('flex items-center justify-center gap-2', className)}>
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  );
}
