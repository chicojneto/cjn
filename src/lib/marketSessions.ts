// Global market sessions referenced to New York time (America/New_York).
// Each session has start/end in minutes since 00:00 NY (can wrap across midnight).
// NY observes DST (EDT UTC-4 / EST UTC-5) — see nextNyDstTransition() in timezones.ts.

import { tzOffsetMinutes } from '@/lib/timezones';

const NY = 'America/New_York';

/** A Date shifted so that its UTC fields equal the NY wall clock. */
function nyShift(now: Date): Date {
  return new Date(now.getTime() + tzOffsetMinutes(NY, now) * 60_000);
}

export type SessionId = 'asia' | 'middle_east' | 'europe' | 'americas';

export interface SessionDef {
  id: SessionId;
  label: string;
  subtitle: string;
  cities: string[];
  exchanges: string[];
  // New York hours (24h)
  openNY: string;  // "HH:MM"
  closeNY: string; // "HH:MM"
  // x position on the world map (0-100%)
  mapX: number;
  mapY: number;
  // Accent color (HSL components, e.g. "165 70% 45%")
  accent: string;
}

export const SESSIONS: SessionDef[] = [
  {
    id: 'asia',
    label: 'Ásia / Oceania',
    subtitle: 'Sydney, Tóquio e China continental',
    cities: ['Wellington', 'Sydney', 'Tóquio', 'Hong Kong', 'Shanghai', 'Singapore', 'Mumbai'],
    exchanges: ['JPX', 'HKEX', 'SSE', 'SGX', 'NSE', 'BSE'],
    openNY: '17:00',
    closeNY: '05:00',
    mapX: 82,
    mapY: 48,
    accent: '165 70% 48%',
  },
  {
    id: 'middle_east',
    label: 'Oriente Médio',
    subtitle: 'Dubai, Riyadh e Golfo',
    cities: ['Dubai', 'Riyadh'],
    exchanges: ['Tadawul', 'DFM'],
    openNY: '01:30',
    closeNY: '08:00',
    mapX: 60,
    mapY: 52,
    accent: '212 90% 60%',
  },
  {
    id: 'europe',
    label: 'Europa',
    subtitle: 'Londres, Frankfurt e Zurique',
    cities: ['Londres', 'Frankfurt', 'Paris', 'Zurique', 'Milão'],
    exchanges: ['LSE', 'XETRA', 'Euronext', 'SIX'],
    openNY: '03:00',
    closeNY: '12:30',
    mapX: 50,
    mapY: 40,
    accent: '270 75% 65%',
  },
  {
    id: 'americas',
    label: 'Américas',
    subtitle: 'B3, NYSE, NASDAQ e Canadá',
    cities: ['New York', 'Chicago', 'Toronto', 'São Paulo'],
    exchanges: ['NYSE', 'NASDAQ', 'CME', 'TSX', 'B3'],
    openNY: '09:30',
    closeNY: '16:00',
    mapX: 28,
    mapY: 45,
    accent: '24 90% 58%',
  },
];

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function nowNYMinutes(now: Date): number {
  const ny = nyShift(now);
  return ny.getUTCHours() * 60 + ny.getUTCMinutes();
}

/** Weekday in NY (0 Sun .. 6 Sat). */
export function nyWeekday(now: Date): number {
  return nyShift(now).getUTCDay();
}

export function isSessionActive(session: SessionDef, now: Date): boolean {
  const cur = nowNYMinutes(now);
  const open = toMinutes(session.openNY);
  const close = toMinutes(session.closeNY);
  const brtDay = nyWeekday(now);

  if (open < close) {
    // Same-day session — closed on BRT weekend
    if (brtDay === 0 || brtDay === 6) return false;
    return cur >= open && cur < close;
  }

  // Wraps midnight (e.g. Asia 18:00 → 06:00 BRT).
  // The trading day belongs to the *next* calendar day in the local region,
  // so we must exclude the BRT evenings/mornings that map to a weekend there.
  if (cur >= open) {
    // Evening portion → belongs to next day in Asia.
    // Exclude Fri evening (→ Sat Asia) and Sat evening (→ Sun Asia).
    return brtDay !== 5 && brtDay !== 6;
  }
  if (cur < close) {
    // Early-morning portion → started previous evening in BRT.
    // Exclude Sat morning (started Fri eve) and Sun morning (started Sat eve).
    return brtDay !== 6 && brtDay !== 0;
  }
  return false;
}

export function minutesUntilNextRollover(now: Date): number {
  // Next 17:00 NY (weekly FX rollover)
  const cur = nowNYMinutes(now);
  const target = 17 * 60;
  return ((target - cur) % 1440 + 1440) % 1440;
}

export function formatHMS(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
  const s = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export function nyTimeString(now: Date): string {
  const cur = nowNYMinutes(now);
  const h = Math.floor(cur / 60).toString().padStart(2, '0');
  const m = (cur % 60).toString().padStart(2, '0');
  const s = now.getUTCSeconds().toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export function nyDateString(now: Date): string {
  const nyDate = nyShift(now);
  return nyDate.toLocaleDateString('pt-BR', {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function countOverlaps(now: Date): number {
  const active = SESSIONS.filter((s) => isSessionActive(s, now));
  return active.length > 1 ? active.length - 1 : 0;
}

// ──────────────────────────────────────────────────────────
// Next open / close across all sessions (in seconds)
// ──────────────────────────────────────────────────────────
export interface NextEvent {
  session: SessionDef;
  type: 'open' | 'close';
  totalSeconds: number;
}

export function nextOpenAndClose(now: Date) {
  let bestOpen: NextEvent | null = null;
  let bestClose: NextEvent | null = null;
  // Scan minute-by-minute over the next 8 days to find the next valid
  // open/close transition for each session, respecting weekends.
  const HORIZON = 8 * 1440; // minutes
  const STEP = 1; // minute
  const sec = now.getUTCSeconds();
  for (const s of SESSIONS) {
    const activeNow = isSessionActive(s, now);
    let foundOpen: number | null = null;
    let foundClose: number | null = null;
    let prevActive = activeNow;
    for (let m = STEP; m <= HORIZON; m += STEP) {
      const t = new Date(now.getTime() + m * 60_000);
      const act = isSessionActive(s, t);
      if (!prevActive && act && foundOpen === null) foundOpen = m;
      if (prevActive && !act && foundClose === null) foundClose = m;
      prevActive = act;
      if (foundOpen !== null && foundClose !== null) break;
    }
    if (!activeNow && foundOpen !== null) {
      const total = foundOpen * 60 - sec;
      if (!bestOpen || total < bestOpen.totalSeconds) {
        bestOpen = { session: s, type: 'open', totalSeconds: total };
      }
    }
    if (activeNow && foundClose !== null) {
      const total = foundClose * 60 - sec;
      if (!bestClose || total < bestClose.totalSeconds) {
        bestClose = { session: s, type: 'close', totalSeconds: total };
      }
    }
  }
  return { nextOpen: bestOpen, nextClose: bestClose };
}

// ──────────────────────────────────────────────────────────
// Forex 24h status — opens Sun 17:00 NY, closes Fri 17:00 NY
// ──────────────────────────────────────────────────────────
export function forexStatus(now: Date): { isOpen: boolean; label: string; nextEventSec: number } {
  const brt = nyShift(now);
  const day = brt.getUTCDay(); // 0 Sun .. 6 Sat
  const minutes = brt.getUTCHours() * 60 + brt.getUTCMinutes();
  const sec = brt.getUTCSeconds();

  // Closed window: Fri 17:00 → Sun 17:00 NY
  let isOpen = true;
  if (day === 5 && minutes >= 17 * 60) isOpen = false;
  if (day === 6) isOpen = false;
  if (day === 0 && minutes < 17 * 60) isOpen = false;

  // Compute next event time (in seconds)
  let nextEventSec = 0;
  if (isOpen) {
    // next close: next Friday 17:00 NY
    const daysUntilFri = ((5 - day) % 7 + 7) % 7;
    const targetMin = daysUntilFri * 1440 + 17 * 60;
    nextEventSec = (targetMin - minutes) * 60 - sec;
    if (nextEventSec <= 0) nextEventSec += 7 * 86400;
  } else {
    // next open: next Sunday 17:00 NY
    const daysUntilSun = ((0 - day) % 7 + 7) % 7;
    const targetMin = daysUntilSun * 1440 + 17 * 60;
    nextEventSec = (targetMin - minutes) * 60 - sec;
    if (nextEventSec <= 0) nextEventSec += 7 * 86400;
  }

  return {
    isOpen,
    label: isOpen ? 'Forex aberto 24h' : 'Forex fechado (fim de semana)',
    nextEventSec,
  };
}

// ──────────────────────────────────────────────────────────
// Liquidity level based on active sessions
// ──────────────────────────────────────────────────────────
export type LiquidityLevel = 'baixa' | 'media' | 'alta' | 'pico';

export function liquidityLevel(now: Date): { level: LiquidityLevel; score: number; label: string } {
  const active = SESSIONS.filter((s) => isSessionActive(s, now));
  const ids = new Set(active.map((s) => s.id));
  const goldenWindow = isGoldenWindow(now);

  let score = active.length; // 0..4
  if (goldenWindow) score = Math.max(score, 3);

  let level: LiquidityLevel = 'baixa';
  if (score >= 3) level = goldenWindow ? 'pico' : 'alta';
  else if (score === 2) level = 'media';
  else if (score === 1) level = 'baixa';
  else level = 'baixa';

  const label =
    level === 'pico'
      ? 'Janela London + NY ativa'
      : level === 'alta'
      ? 'Múltiplas sessões sobrepostas'
      : level === 'media'
      ? 'Duas sessões ativas'
      : active.length === 0
      ? 'Sem sessões ativas'
      : 'Apenas uma sessão ativa';

  return { level, score, label };
}

// ──────────────────────────────────────────────────────────
// Golden window: 08:00 - 11:30 NY (London + NY overlap)
// ──────────────────────────────────────────────────────────
export function isGoldenWindow(now: Date): boolean {
  const cur = nowNYMinutes(now);
  const day = nyWeekday(now);
  if (day === 0 || day === 6) return false;
  return cur >= 8 * 60 && cur < 11 * 60 + 30;
}

export function timeUntilGoldenWindow(now: Date): { active: boolean; secondsToStart: number; secondsToEnd: number } {
  const cur = nowNYMinutes(now);
  const sec = now.getUTCSeconds();
  const start = 8 * 60;
  const end = 11 * 60 + 30;
  if (cur >= start && cur < end) {
    return { active: true, secondsToStart: 0, secondsToEnd: (end - cur) * 60 - sec };
  }
  const minutesToStart = ((start - cur) % 1440 + 1440) % 1440;
  return { active: false, secondsToStart: minutesToStart * 60 - sec, secondsToEnd: 0 };
}
