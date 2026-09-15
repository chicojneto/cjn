import { cn } from '@/lib/utils';
import logoAsset from '@/assets/brew-the-market-logo.jpg.asset.json';

/** Xícara em linha; o vapor é um tique de preço (candle). */
export function CoffeeCandleMark({ className }: { className?: string }) {
  return (
    <img
      src={logoAsset.url}
      alt=""
      className={cn('h-7 w-7 rounded-full object-cover', className)}
      aria-hidden="true"
    />
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('tracking-tight text-foreground', className)}>
      Brew The <span className="text-brand">Market</span>
    </span>
  );
}
