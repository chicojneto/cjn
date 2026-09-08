import type { CorrelationAnalysis } from '@/hooks/useMarketCorrelations';

export type CondStatus = 'met' | 'unmet' | 'manual';

export interface EvaluatedCondition {
  text: string;
  status: CondStatus;
  detail?: string;
}

type Data = CorrelationAnalysis;

function pct(v: number) {
  const s = Math.abs(v).toFixed(2).replace('.', ',');
  return `${v >= 0 ? '+' : '−'}${s}%`;
}

function num(v: number, decimals = 2) {
  return v.toFixed(decimals).replace('.', ',');
}

function ch(m: { changePercent: number } | null | undefined): number | null {
  const v = m?.changePercent;
  return typeof v === 'number' && Number.isFinite(v) && !(m as any)?.isSuspicious ? v : null;
}

function px(m: { price: number } | null | undefined): number | null {
  const v = m?.price;
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

interface Rule {
  test: RegExp;
  run: (d: Data) => { ok: boolean; detail: string } | null;
}

const rules: Rule[] = [
  // --- VIX níveis explícitos ---
  {
    test: /vix\s*[<>]\s*\d+/i,
    run: () => null, // tratado abaixo com captura
  },
  // --- DXY ---
  {
    test: /dxy\s+(caindo|fraco|desmorona)/i,
    run: (d) => {
      const v = ch(d.dxy);
      return v === null ? null : { ok: v < 0, detail: `DXY ${pct(v)}` };
    },
  },
  {
    test: /dxy\s+(subindo|forte|disparando|repricando)/i,
    run: (d) => {
      const v = ch(d.dxy);
      return v === null ? null : { ok: v > 0, detail: `DXY ${pct(v)}` };
    },
  },
  // --- VIX qualitativo ---
  {
    test: /vix\s+(subindo|disparando)/i,
    run: (d) => {
      const v = ch(d.vix);
      const p = px(d.vix);
      return v === null ? null : { ok: v > 0, detail: `VIX ${p !== null ? num(p) : ''} ${pct(v)}`.trim() };
    },
  },
  {
    test: /vix\s+(baixo|calmo)|vix baixo/i,
    run: (d) => {
      const p = px(d.vix);
      return p === null ? null : { ok: p < 18, detail: `VIX ${num(p)}` };
    },
  },
  {
    test: /vix\s+alto/i,
    run: (d) => {
      const p = px(d.vix);
      return p === null ? null : { ok: p > 20, detail: `VIX ${num(p)}` };
    },
  },
  // --- Yields / juros EUA ---
  {
    test: /yields?[^.]*(caindo|convergindo para baixo)/i,
    run: (d) => {
      const v = ch(d.us10y);
      const p = px(d.us10y);
      return v === null ? null : { ok: v < 0, detail: `US10Y ${p !== null ? num(p) + '%' : ''} ${pct(v)}`.trim() };
    },
  },
  {
    test: /yields?[^.]*subindo/i,
    run: (d) => {
      const v = ch(d.us10y);
      const p = px(d.us10y);
      return v === null ? null : { ok: v > 0, detail: `US10Y ${p !== null ? num(p) + '%' : ''} ${pct(v)}`.trim() };
    },
  },
  // --- Risk on/off ---
  {
    test: /risk-?on/i,
    run: (d) => {
      const es = ch(d.sp500Futures);
      const vx = ch(d.vix);
      if (es === null) return null;
      const ok = es > 0 && (vx === null || vx < 0);
      return { ok, detail: `ES1! ${pct(es)}${vx !== null ? ` · VIX ${pct(vx)}` : ''}` };
    },
  },
  {
    test: /risk-?off/i,
    run: (d) => {
      const es = ch(d.sp500Futures);
      const vx = ch(d.vix);
      if (es === null) return null;
      const ok = es < 0 && (vx === null || vx > 0);
      return { ok, detail: `ES1! ${pct(es)}${vx !== null ? ` · VIX ${pct(vx)}` : ''}` };
    },
  },
  // --- Índices EUA ---
  {
    test: /(s&p( 500)?|ações)\s+subindo/i,
    run: (d) => {
      const v = ch(d.sp500Futures);
      return v === null ? null : { ok: v > 0, detail: `ES1! ${pct(v)}` };
    },
  },
  {
    test: /(nasdaq|tech(s)?)\s+(subindo|forte)/i,
    run: (d) => {
      const v = ch(d.nasdaqFutures);
      return v === null ? null : { ok: v > 0, detail: `NQ1! ${pct(v)}` };
    },
  },
  // --- Petróleo ---
  {
    test: /petróleo\s+(subindo|dispara)/i,
    run: (d) => {
      const v = ch(d.oil);
      return v === null ? null : { ok: v > 1, detail: `WTI ${pct(v)}` };
    },
  },
  {
    test: /petróleo\s+caindo/i,
    run: (d) => {
      const v = ch(d.oil);
      return v === null ? null : { ok: v < -1, detail: `WTI ${pct(v)}` };
    },
  },
  // --- Commodities (cesta petróleo + cobre + minério) ---
  {
    test: /commodities\s+(fortes|subindo)/i,
    run: (d) => {
      const vals = [ch(d.oil), ch(d.copper), ch(d.ironOre)].filter((v): v is number => v !== null);
      if (!vals.length) return null;
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      return { ok: avg > 0, detail: `Cesta ${pct(avg)}` };
    },
  },
  {
    test: /commodities\s+(fracas|caindo)/i,
    run: (d) => {
      const vals = [ch(d.oil), ch(d.copper), ch(d.ironOre)].filter((v): v is number => v !== null);
      if (!vals.length) return null;
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      return { ok: avg < 0, detail: `Cesta ${pct(avg)}` };
    },
  },
  // --- Brasil / câmbio ---
  {
    test: /real forte/i,
    run: (d) => {
      const v = ch(d.usdBrl);
      return v === null ? null : { ok: v < 0, detail: `USD/BRL ${pct(v)}` };
    },
  },
  {
    test: /real fraco/i,
    run: (d) => {
      const v = ch(d.usdBrl);
      return v === null ? null : { ok: v > 0, detail: `USD/BRL ${pct(v)}` };
    },
  },
  // --- Ásia / China ---
  {
    test: /nikkei\s+subindo/i,
    run: (d) => {
      const v = ch(d.nikkei);
      return v === null ? null : { ok: v > 0, detail: `NKY ${pct(v)}` };
    },
  },
  {
    test: /china\s+(forte|anunciou)|hk50 subindo/i,
    run: (d) => {
      const v = ch(d.hangSeng);
      return v === null ? null : { ok: v > 0, detail: `HSI ${pct(v)}` };
    },
  },
  {
    test: /china\s+fraca/i,
    run: (d) => {
      const v = ch(d.hangSeng);
      return v === null ? null : { ok: v < 0, detail: `HSI ${pct(v)}` };
    },
  },
  // --- Ouro ---
  {
    test: /ouro\s+(subindo|forte)/i,
    run: (d) => {
      const v = ch(d.gold);
      return v === null ? null : { ok: v > 0, detail: `XAU ${pct(v)}` };
    },
  },
  // --- Pares FX ---
  {
    test: /eur\/gbp caindo/i,
    run: () => null,
  },
];

function vixThreshold(text: string, d: Data) {
  const m = text.match(/vix\s*([<>])\s*(\d+(?:[.,]\d+)?)/i);
  if (!m) return null;
  const p = px(d.vix);
  if (p === null) return null;
  const limit = parseFloat(m[2].replace(',', '.'));
  const ok = m[1] === '<' ? p < limit : p > limit;
  return { ok, detail: `VIX ${num(p)}` };
}

export function evaluateCondition(text: string, data: Data | null | undefined): EvaluatedCondition {
  if (!data) return { text, status: 'manual' };

  const vt = vixThreshold(text, data);
  if (vt) return { text, status: vt.ok ? 'met' : 'unmet', detail: vt.detail };

  for (const rule of rules) {
    if (!rule.test.test(text)) continue;
    const res = rule.run(data);
    if (res) return { text, status: res.ok ? 'met' : 'unmet', detail: res.detail };
  }
  return { text, status: 'manual' };
}

export function evaluateConditions(list: string[], data: Data | null | undefined): EvaluatedCondition[] {
  return list.map((t) => evaluateCondition(t, data));
}

export function summarize(list: EvaluatedCondition[]) {
  const auto = list.filter((c) => c.status !== 'manual');
  return {
    met: auto.filter((c) => c.status === 'met').length,
    total: auto.length,
    manual: list.length - auto.length,
  };
}
