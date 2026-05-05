// IANA timezone presets used across the app.
// All session windows in marketSessions.ts are stored in BRT (UTC-3).
// We never change that — we only re-render the *displayed* clock/labels.

export interface TzPreset {
  id: string;
  label: string;       // short label "BRT", "UTC", "NY"
  iana: string;        // IANA tz name
  description: string; // long name shown in dropdown
}

export const TZ_PRESETS: TzPreset[] = [
  { id: 'brt',    label: 'BRT',    iana: 'America/Sao_Paulo',  description: 'Brasília (UTC-3)' },
  { id: 'utc',    label: 'UTC',    iana: 'UTC',                 description: 'Tempo Universal' },
  { id: 'ny',     label: 'NY',     iana: 'America/New_York',    description: 'Nova York (EST/EDT)' },
  { id: 'london', label: 'LON',    iana: 'Europe/London',       description: 'Londres (GMT/BST)' },
  { id: 'frank',  label: 'FRA',    iana: 'Europe/Berlin',       description: 'Frankfurt (CET/CEST)' },
  { id: 'dubai',  label: 'DXB',    iana: 'Asia/Dubai',          description: 'Dubai (GST)' },
  { id: 'tokyo',  label: 'TYO',    iana: 'Asia/Tokyo',          description: 'Tóquio (JST)' },
  { id: 'sydney', label: 'SYD',    iana: 'Australia/Sydney',    description: 'Sydney (AEST/AEDT)' },
];

export const DEFAULT_TZ = TZ_PRESETS[0]; // BRT

/**
 * Returns offset (in minutes) for a given IANA timezone at a given date.
 * Positive = east of UTC. Example: America/Sao_Paulo -> -180.
 */
export function tzOffsetMinutes(iana: string, at: Date): number {
  // Use Intl to format an UTC date in the target tz, then diff.
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: iana,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });
  const parts = dtf.formatToParts(at);
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;
  const asUTC = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour === '24' ? '00' : map.hour),
    Number(map.minute),
    Number(map.second),
  );
  return Math.round((asUTC - at.getTime()) / 60000);
}

/** Minutes-of-day for `now` in the given IANA tz (0..1439). */
export function nowMinutesInTz(iana: string, now: Date): number {
  const off = tzOffsetMinutes(iana, now);
  const utcMin = now.getUTCHours() * 60 + now.getUTCMinutes();
  return ((utcMin + off) % 1440 + 1440) % 1440;
}

/** Seconds-of-day for `now` (with seconds precision) in tz. */
export function nowSecondsInTz(iana: string, now: Date): number {
  const off = tzOffsetMinutes(iana, now);
  const utcSec =
    now.getUTCHours() * 3600 + now.getUTCMinutes() * 60 + now.getUTCSeconds();
  const total = ((utcSec + off * 60) % 86400 + 86400) % 86400;
  return total;
}

/** Format current time HH:MM:SS in tz. */
export function formatClockInTz(iana: string, now: Date): string {
  const total = nowSecondsInTz(iana, now);
  const h = Math.floor(total / 3600).toString().padStart(2, '0');
  const m = Math.floor((total % 3600) / 60).toString().padStart(2, '0');
  const s = (total % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

/** Format date "segunda-feira, 5 de maio" for tz. */
export function formatDateInTz(iana: string, now: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: iana,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(now);
}

/**
 * Convert a HH:MM string from BRT to the given target IANA tz.
 * Used to relabel session open/close.
 */
export function convertHHMMFromBRT(hhmmBRT: string, targetIana: string, now: Date): string {
  const [h, m] = hhmmBRT.split(':').map(Number);
  // BRT offset right now (handles potential DST anywhere)
  const brtOff = tzOffsetMinutes('America/Sao_Paulo', now); // typically -180
  const targetOff = tzOffsetMinutes(targetIana, now);
  const deltaMin = targetOff - brtOff;
  let total = h * 60 + m + deltaMin;
  total = ((total % 1440) + 1440) % 1440;
  const hh = Math.floor(total / 60).toString().padStart(2, '0');
  const mm = (total % 60).toString().padStart(2, '0');
  return `${hh}:${mm}`;
}

/** Pretty UTC offset like "UTC-3" or "UTC+5:30". */
export function formatUtcOffset(iana: string, now: Date): string {
  const off = tzOffsetMinutes(iana, now);
  const sign = off >= 0 ? '+' : '-';
  const abs = Math.abs(off);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return m === 0 ? `UTC${sign}${h}` : `UTC${sign}${h}:${m.toString().padStart(2, '0')}`;
}
