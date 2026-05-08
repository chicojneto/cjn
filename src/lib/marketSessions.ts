// Global market sessions in BRT (UTC-3) reference
// Each session has start/end in minutes since 00:00 BRT (can wrap across midnight)

export type SessionId = 'asia' | 'middle_east' | 'europe' | 'americas';

export interface SessionDef {
  id: SessionId;
  label: string;
  subtitle: string;
  cities: string[];
  exchanges: string[];
  // BRT hours (24h)
  openBRT: string;  // "HH:MM"
  closeBRT: string; // "HH:MM"
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
    openBRT: '18:00',
    closeBRT: '06:00',
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
    openBRT: '02:30',
    closeBRT: '09:00',
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
    openBRT: '04:00',
    closeBRT: '13:30',
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
    openBRT: '10:00',
    closeBRT: '17:00',
    mapX: 28,
    mapY: 45,
    accent: '24 90% 58%',
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

// ──────────────────────────────────────────────────────────
// Next open / close across all sessions (in seconds)
// ──────────────────────────────────────────────────────────
export interface NextEvent {
  session: SessionDef;
  type: 'open' | 'close';
  totalSeconds: number;
}

export function nextOpenAndClose(now: Date) {
  const cur = nowBRTMinutes(now);
  const sec = now.getUTCSeconds();
  let bestOpen: NextEvent | null = null;
  let bestClose: NextEvent | null = null;
  for (const s of SESSIONS) {
    const o = toMinutes(s.openBRT);
    const c = toMinutes(s.closeBRT);
    const active = isSessionActive(s, now);
    if (!active) {
      // minutes until open
      const diff = ((o - cur) % 1440 + 1440) % 1440;
      const total = diff * 60 - sec;
      if (!bestOpen || total < bestOpen.totalSeconds) {
        bestOpen = { session: s, type: 'open', totalSeconds: total };
      }
    } else {
      // minutes until close (handle wrap)
      let diff: number;
      if (o < c) diff = c - cur;
      else diff = cur < c ? c - cur : (1440 - cur) + c;
      const total = diff * 60 - sec;
      if (!bestClose || total < bestClose.totalSeconds) {
        bestClose = { session: s, type: 'close', totalSeconds: total };
      }
    }
  }
  return { nextOpen: bestOpen, nextClose: bestClose };
}

// ──────────────────────────────────────────────────────────
// Forex 24h status — opens Sun 18:00 BRT, closes Fri 18:00 BRT
// ──────────────────────────────────────────────────────────
export function forexStatus(now: Date): { isOpen: boolean; label: string; nextEventSec: number } {
  // Use BRT-shifted Date for weekday and minutes
  const brt = new Date(now.getTime() - 3 * 3600_000);
  const day = brt.getUTCDay(); // 0 Sun .. 6 Sat
  const minutes = brt.getUTCHours() * 60 + brt.getUTCMinutes();
  const sec = brt.getUTCSeconds();

  // Closed window: Fri 18:00 → Sun 18:00 BRT
  let isOpen = true;
  if (day === 5 && minutes >= 18 * 60) isOpen = false;
  if (day === 6) isOpen = false;
  if (day === 0 && minutes < 18 * 60) isOpen = false;

  // Compute next event time (in seconds)
  let nextEventSec = 0;
  if (isOpen) {
    // next close: next Friday 18:00
    const daysUntilFri = ((5 - day) % 7 + 7) % 7;
    const targetMin = daysUntilFri * 1440 + 18 * 60;
    nextEventSec = (targetMin - minutes) * 60 - sec;
    if (nextEventSec <= 0) nextEventSec += 7 * 86400;
  } else {
    // next open: next Sunday 18:00
    const daysUntilSun = ((0 - day) % 7 + 7) % 7;
    const targetMin = daysUntilSun * 1440 + 18 * 60;
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
// Golden window: 10:00 - 13:00 BRT (London + NY overlap)
// ──────────────────────────────────────────────────────────
export function isGoldenWindow(now: Date): boolean {
  const cur = nowBRTMinutes(now);
  const day = new Date(now.getTime() - 3 * 3600_000).getUTCDay();
  if (day === 0 || day === 6) return false;
  return cur >= 10 * 60 && cur < 13 * 60;
}

export function timeUntilGoldenWindow(now: Date): { active: boolean; secondsToStart: number; secondsToEnd: number } {
  const cur = nowBRTMinutes(now);
  const sec = new Date(now.getTime() - 3 * 3600_000).getUTCSeconds();
  const start = 10 * 60;
  const end = 13 * 60;
  if (cur >= start && cur < end) {
    return { active: true, secondsToStart: 0, secondsToEnd: (end - cur) * 60 - sec };
  }
  const minutesToStart = ((start - cur) % 1440 + 1440) % 1440;
  return { active: false, secondsToStart: minutesToStart * 60 - sec, secondsToEnd: 0 };
}
