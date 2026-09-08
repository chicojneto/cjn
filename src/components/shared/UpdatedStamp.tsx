import { formatUpdated, isStale } from '@/lib/contentFreshness';
import { cn } from '@/lib/utils';

export function UpdatedStamp({ date, className }: { date: string; className?: string }) {
  return (
    <span
      className={cn(
        'font-mono text-[10px] whitespace-nowrap',
        isStale(date) ? 'text-orange-400' : 'text-muted-foreground/70',
        className
      )}
    >
      {formatUpdated(date)}
    </span>
  );
}
