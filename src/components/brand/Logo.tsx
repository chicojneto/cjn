import { cn } from '@/lib/utils';
import { CupSoda } from 'lucide-react';

export function CoffeeCandleMark({ className }: { className?: string }) {
  return (
    <span
      className={cn('inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground', className)}
      aria-hidden="true"
    >
      <CupSoda className="h-[55%] w-[55%]" strokeWidth={1.8} />
    </span>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('tracking-tight text-foreground', className)}>
      IcedTea <span className="text-brand">Trader</span>
    </span>
  );
}
