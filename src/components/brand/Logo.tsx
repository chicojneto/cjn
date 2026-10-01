import { cn } from '@/lib/utils';
import logoAsset from '@/assets/icedtea-trader-logo.png.asset.json';

export function CoffeeCandleMark({ className }: { className?: string }) {
  return (
    <img
      src={logoAsset.url}
      alt=""
      className={cn('inline-block h-7 w-7 shrink-0 rounded-full object-cover', className)}
      onError={(event) => {
        event.currentTarget.onerror = null;
        event.currentTarget.src = '/favicon.png';
      }}
      aria-hidden="true"
    />
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('tracking-tight text-foreground', className)}>
      IcedTea <span className="text-brand">Trader</span>
    </span>
  );
}
