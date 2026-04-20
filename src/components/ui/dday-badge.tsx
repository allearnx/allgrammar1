import { Badge } from '@/components/ui/badge';

interface DDayBadgeProps {
  dday: number;
  className?: string;
}

export function DDayBadge({ dday, className }: DDayBadgeProps) {
  const label = dday === 0 ? 'D-Day' : dday > 0 ? `D-${dday}` : `D+${Math.abs(dday)}`;

  const variant: 'destructive' | 'outline' | 'secondary' =
    dday <= 3 ? 'destructive' : dday <= 7 ? 'outline' : 'secondary';

  return (
    <Badge
      variant={variant}
      className={
        variant === 'outline'
          ? `border-yellow-400 bg-yellow-50 text-yellow-700 dark:border-yellow-600 dark:bg-yellow-950 dark:text-yellow-400 ${className ?? ''}`
          : className
      }
    >
      {label}
    </Badge>
  );
}
