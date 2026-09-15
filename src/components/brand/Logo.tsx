import { cn } from '@/lib/utils';

/** Xícara em linha; o vapor é um tique de preço (candle). */
export function CoffeeCandleMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('h-6 w-6', className)}
      aria-hidden="true"
    >
      {/* vapor = candle */}
      <path d="M16 3.5v10" />
      <rect x="13.4" y="5.5" width="5.2" height="5.4" rx="1" />
      {/* xícara */}
      <path d="M6 16.5h16v4.2a5.5 5.5 0 0 1-5.5 5.5h-5A5.5 5.5 0 0 1 6 20.7z" />
      <path d="M22 17.8h1.6a3 3 0 0 1 0 6H22" />
      <path d="M6.5 28.5h15" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('tracking-tight text-foreground', className)}>
      Brew The <span className="text-brand">Market</span>
    </span>
  );
}
