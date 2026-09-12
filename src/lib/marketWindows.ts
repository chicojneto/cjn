import { isNyDst, NY_IANA, nowMinutesInTz } from '@/lib/timezones';

export type MarketWindowKind = 'session' | 'killzone' | 'overlap' | 'pause';

export interface MarketWindow {
  id: string;
  category: string;
  label: string;
  kind: MarketWindowKind;
  edt: { open: string; close: string; note?: string };
  est: { open: string; close: string; note?: string };
  detail: string;
  emphasis?: 'regional' | 'global' | 'triple' | 'specific';
}

export const MARKET_WINDOWS: MarketWindow[] = [
  {
    id: 'sydney', category: 'Sessão de bolsa', label: 'Sydney (ASX · Austrália)', kind: 'session',
    edt: { open: '17:00', close: '02:00', note: 'dia anterior' },
    est: { open: '16:00', close: '01:00', note: 'dia anterior' },
    detail: 'Abertura do dia financeiro no Pacífico. Volume inicial reduzido.',
  },
  {
    id: 'tokyo', category: 'Sessão de bolsa', label: 'Tóquio (TSE · Japão/Ásia)', kind: 'session',
    edt: { open: '19:00', close: '04:00', note: 'dia anterior' },
    est: { open: '18:00', close: '03:00', note: 'dia anterior' },
    detail: 'Definição e consolidação da faixa de variação inicial (Asian Range).',
  },
  {
    id: 'asia-killzone', category: 'Killzone ICT', label: 'Asia Killzone', kind: 'killzone',
    edt: { open: '20:00', close: '00:00' }, est: { open: '20:00', close: '00:00' },
    detail: 'Acumulação e marcação dos pontos de liquidez (Asian High / Asian Low).',
  },
  {
    id: 'asia-london', category: 'Overlap regional', label: 'Overlap Ásia / Londres', kind: 'overlap', emphasis: 'regional',
    edt: { open: '02:00', close: '04:00' }, est: { open: '02:00', close: '04:00', note: 'pode encerrar 03:00' },
    detail: 'Fim da sessão asiática cruzando com a pré-abertura de Londres. Janela do Judas Swing.',
  },
  {
    id: 'london-killzone', category: 'Killzone ICT', label: 'London Killzone', kind: 'killzone',
    edt: { open: '02:00', close: '05:00' }, est: { open: '02:00', close: '05:00' },
    detail: 'Manipulação inicial (Judas Swing) e formação da máxima ou mínima do dia.',
  },
  {
    id: 'london', category: 'Sessão de bolsa', label: 'Londres (LSE · Europa)', kind: 'session',
    edt: { open: '03:00', close: '11:30' }, est: { open: '03:00', close: '11:30', note: 'pode variar para 04:00–12:30' },
    detail: 'Entrada de grande volume europeu. Pode variar durante a transição do horário europeu.',
  },
  {
    id: 'ny-am-killzone', category: 'Killzone ICT', label: 'NY AM Killzone', kind: 'killzone',
    edt: { open: '07:00', close: '10:00' }, est: { open: '07:00', close: '10:00' },
    detail: 'Alta volatilidade institucional: dados dos EUA às 08:30 e abertura NYSE/Nasdaq às 09:30.',
  },
  {
    id: 'b3', category: 'Sessão de bolsa', label: 'B3 (Bovespa / Futuros)', kind: 'session',
    edt: { open: '08:30', close: '17:20' }, est: { open: '07:30', close: '16:20' },
    detail: 'Pregão brasileiro 09:30–18:20 BRT. Futuros iniciam às 08:30 NY em EDT e 07:30 NY em EST.',
  },
  {
    id: 'london-ny', category: 'Overlap geral', label: 'Overlap Londres / Nova York', kind: 'overlap', emphasis: 'global',
    edt: { open: '08:00', close: '12:00' }, est: { open: '08:00', close: '12:00' },
    detail: 'Pico máximo global: concentra cerca de 50% do volume diário do Forex e engloba a abertura de NY.',
  },
  {
    id: 'triple-overlap', category: 'Tríplice overlap', label: 'Londres + B3 + NY', kind: 'overlap', emphasis: 'triple',
    edt: { open: '08:30', close: '11:30' }, est: { open: '07:30', close: '11:30', note: 'núcleo 08:30–11:30' },
    detail: 'Mercados europeu, brasileiro e americano negociando simultaneamente. Pico de volatilidade em moedas emergentes, dólar e commodities.',
  },
  {
    id: 'new-york', category: 'Sessão de bolsa', label: 'Nova York (NYSE / Nasdaq)', kind: 'session',
    edt: { open: '09:30', close: '16:00' }, est: { open: '09:30', close: '16:00' },
    detail: 'Mercado regular de ações e índices americanos (RTH).',
  },
  {
    id: 'london-close-killzone', category: 'Killzone ICT', label: 'London Close Killzone', kind: 'killzone',
    edt: { open: '10:00', close: '12:00' }, est: { open: '10:00', close: '12:00' },
    detail: 'Encerramento europeu, leilão LSE às 11:30, WMR Fix às 12:00 e possível retração ou reversão.',
  },
  {
    id: 'london-close-b3-ny', category: 'Overlap específico', label: 'London Close + B3 + NY', kind: 'overlap', emphasis: 'specific',
    edt: { open: '10:00', close: '11:30' }, est: { open: '10:00', close: '11:30' },
    detail: 'Fechamento de Londres com B3 e manhã de NY. Engloba o Silver Bullet das 10:00–11:00.',
  },
  {
    id: 'ny-lunch', category: 'Pausa ICT', label: 'NY Lunch (almoço)', kind: 'pause',
    edt: { open: '12:00', close: '13:30' }, est: { open: '12:00', close: '13:30' },
    detail: 'Pausa algorítmica e menor liquidez nos EUA. Período indicado para evitar novas posições.',
  },
  {
    id: 'ny-pm-killzone', category: 'Killzone ICT', label: 'NY PM Killzone', kind: 'killzone',
    edt: { open: '13:30', close: '16:00' }, est: { open: '13:30', close: '16:00' },
    detail: 'Expansão da tarde americana, operações de scalping e encerramento do dia.',
  },
];

export function windowHours(window: MarketWindow, at: Date) {
  return isNyDst(at) ? window.edt : window.est;
}

export function marketWindowIsActive(window: MarketWindow, at: Date): boolean {
  const current = nowMinutesInTz(NY_IANA, at);
  const day = Number(new Intl.DateTimeFormat('en-US', { timeZone: NY_IANA, weekday: 'short' })
    .formatToParts(at).find((part) => part.type === 'weekday')?.value === 'Sun' ? 0 :
    new Intl.DateTimeFormat('en-US', { timeZone: NY_IANA, weekday: 'short' }).format(at) === 'Mon' ? 1 :
    new Intl.DateTimeFormat('en-US', { timeZone: NY_IANA, weekday: 'short' }).format(at) === 'Tue' ? 2 :
    new Intl.DateTimeFormat('en-US', { timeZone: NY_IANA, weekday: 'short' }).format(at) === 'Wed' ? 3 :
    new Intl.DateTimeFormat('en-US', { timeZone: NY_IANA, weekday: 'short' }).format(at) === 'Thu' ? 4 :
    new Intl.DateTimeFormat('en-US', { timeZone: NY_IANA, weekday: 'short' }).format(at) === 'Fri' ? 5 : 6);
  const { open, close } = windowHours(window, at);
  const start = toMinutes(open);
  const end = toMinutes(close);
  if (start < end) return day >= 1 && day <= 5 && current >= start && current < end;
  if (current >= start) return day >= 0 && day <= 4;
  return day >= 1 && day <= 5 && current < end;
}

export function nextMarketWindow(at: Date): { window: MarketWindow; startsInSeconds: number } | null {
  const seconds = at.getUTCSeconds();
  for (let minute = 1; minute <= 8 * 1440; minute += 1) {
    const candidate = new Date(at.getTime() + minute * 60_000);
    const previous = new Date(candidate.getTime() - 60_000);
    const opening = MARKET_WINDOWS.find((window) => !marketWindowIsActive(window, previous) && marketWindowIsActive(window, candidate));
    if (opening) return { window: opening, startsInSeconds: minute * 60 - seconds };
  }
  return null;
}

export function activeMarketWindows(at: Date) {
  return MARKET_WINDOWS.filter((window) => marketWindowIsActive(window, at));
}

function toMinutes(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}