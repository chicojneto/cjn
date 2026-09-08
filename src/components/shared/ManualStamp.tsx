import { formatManualStamp, isStale } from '@/hooks/useDiCurve';

export function ManualStamp({ updatedAt, className = '' }: { updatedAt?: string | null; className?: string }) {
  if (!updatedAt) {
    return (
      <span className={`text-[9px] font-mono uppercase text-muted-foreground ${className}`}>
        manual · sem dados
      </span>
    );
  }
  const stale = isStale(updatedAt);
  return (
    <span
      className={`text-[9px] font-mono uppercase ${stale ? 'text-orange-400' : 'text-muted-foreground'} ${className}`}
      title={new Date(updatedAt).toLocaleString('pt-BR')}
    >
      {formatManualStamp(updatedAt)}
      {stale && ' · desatualizado'}
    </span>
  );
}
