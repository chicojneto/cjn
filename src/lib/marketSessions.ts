// Global market sessions in BRT (UTC-3) reference
// Each session has start/end in minutes since 00:00 BRT (can wrap across midnight)

export type SessionId = 'asia' | 'middle_east' | 'europe' | 'americas';

export interface SessionDef {
  id: SessionId;
  label: string;
  cities: string[];
  exchanges: string[];
  // BRT hours (24h)
  openBRT: string;  // "HH:MM"
  closeBRT: string; // "HH:MM"
  // x position on the world map (0-100%)
  mapX: number;
  mapY: number;
}

export const SESSIONS: SessionDef[] = [
  {
    id: 'asia',
    label: 'Ásia / Oceania',
    cities: ['Wellington', 'Sydney', 'Tóquio', 'Hong Kong', 'Shanghai', 'Singapore', 'Mumbai'],
    exchanges: ['JPX', 'HKEX', 'SSE', 'SGX', 'NSE', 'BSE'],
    openBRT: '18:00',
    closeBRT: '06:00',
    mapX: 82,
    mapY: 48,
  },
  {
    id: 'middle_east',
    label: 'Oriente Médio',
    cities: ['Dubai', 'Riyadh'],
    exchanges: ['Tadawul', 'DFM'],
    openBRT: '02:30',
    closeBRT: '09:00',
    mapX: 60,
    mapY: 52,
  },
  {
    id: 'europe',
    label: 'Europa',
    cities: ['Londres', 'Frankfurt', 'Paris', 'Zurique', 'Milão'],
    exchanges: ['LSE', 'XETRA', 'Euronext', 'SIX'],
    openBRT: '04:00',
    closeBRT: '13:30',
    mapX: 50,
    mapY: 40,
  },
  {
    id: 'americas',
    label: 'Américas',
    cities: ['New York', 'Chicago', 'Toronto', 'São Paulo'],
    exchanges: ['NYSE', 'NASDAQ', 'CME', 'TSX', 'B3'],
    openBRT: '10:00',
    closeBRT: '17:00',
    mapX: 28,
    mapY: 45,
  },
];

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function nowBRTMinutes(now: Date): number {
  // BRT = UTC-3
  const utc = now.getUTCHours() * 60 + now.getUTCMinutes();
  return ((utc - 180) % 1440 + 1440) % 1440;
}

export function isSessionActive(session: SessionDef, now: Date): boolean {
  const cur = nowBRTMinutes(now);
  const open = toMinutes(session.openBRT);
  const close = toMinutes(session.closeBRT);
  const day = now.getUTCDay(); // 0 Sun, 6 Sat (use UTC reference; close enough)
  if (day === 0 || day === 6) return false;
  if (open < close) {
    return cur >= open && cur < close;
  }
  // wraps midnight (e.g. 18:00 -> 06:00)
  return cur >= open || cur < close;
}

export function minutesUntilNextRollover(now: Date): number {
  // Next 18:00 BRT
  const cur = nowBRTMinutes(now);
  const target = 18 * 60;
  return ((target - cur) % 1440 + 1440) % 1440;
}

export function formatHMS(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
  const s = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export function brtTimeString(now: Date): string {
  const cur = nowBRTMinutes(now);
  const h = Math.floor(cur / 60).toString().padStart(2, '0');
  const m = (cur % 60).toString().padStart(2, '0');
  const s = now.getUTCSeconds().toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export function brtDateString(now: Date): string {
  // shift to BRT
  const brtMs = now.getTime() - 3 * 60 * 60 * 1000;
  const brtDate = new Date(brtMs);
  return brtDate.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function countOverlaps(now: Date): number {
  const active = SESSIONS.filter((s) => isSessionActive(s, now));
  return active.length > 1 ? active.length - 1 : 0;
}
