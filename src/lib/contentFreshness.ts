export const STALE_DAYS = 45;
export const ARCHIVE_DAYS = 90;

export function daysSince(iso: string): number {
  const d = new Date(iso + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return Infinity;
  return Math.floor((Date.now() - d.getTime()) / 86_400_000);
}

export function formatUpdated(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return 'sem data';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  return `atualizado em ${dd}/${mm}/${yy}`;
}

export function isStale(iso: string): boolean {
  return daysSince(iso) > STALE_DAYS;
}

export function isArchived(iso: string): boolean {
  return daysSince(iso) > ARCHIVE_DAYS;
}
