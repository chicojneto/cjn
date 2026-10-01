import type { CorrelationAnalysis } from '@/hooks/useMarketCorrelations';

/**
 * Regime do dia — mercado internacional (out/2026).
 *
 * Fonte ÚNICA de verdade do dia: Manhã, barra de pulso, Cenário Macro e
 * Check List leem deste objeto.
 *
 * Entradas: futuros americanos (ES, NQ, YM), DXY, petróleo WTI, VIX, US10Y e GVZ.
 * Saída: um regime geral (pelos futuros) e um viés para cada ativo operado:
 * Nasdaq, S&P 500, Dow Jones, XAU/USD, EUR/USD e USD/JPY.
 *
 * Hierarquia 70/20/10, igual para todos os ativos:
 *   Primário (70%) .... único sinal que define a direção (passou do limiar ou não).
 *   Confirmação (20%) . nunca inverte. Se nenhuma confirma e o primário é fraco
 *                       (menos que 2× o limiar), o viés é rebaixado para neutro.
 *   Ajuste (10%) ...... só veta: um choque contra a direção rebaixa para neutro.
 *
 * Lê a variação do dia; antes da abertura de NY, isso é o overnight.
 * Descreve o contexto, não prevê.
 */

export type Vies = 'alta' | 'baixa' | 'neutro';
export type Regime = 'risk-on' | 'risk-off' | 'neutro';
export type AtivoId = 'nasdaq' | 'sp500' | 'dow' | 'xau' | 'eurusd' | 'usdjpy';

export interface ViesAtivo {
  id: AtivoId;
  label: string;
  vies: Vies;
  /** Variação do próprio ativo no dia (%), quando disponível. */
  variacao: number | null;
  motivos: string[];
  /** Só no XAU: estado de volatilidade pelo GVZ. */
  estado?: string | null;
}

export interface RegimeDoDia {
  regime: Regime;
  /** Direção dos futuros americanos (viés geral). */
  vies: Vies;
  motivos: string[];
  ativos: ViesAtivo[];
}

export const LIMIARES = {
  futuros: 0.3, // %
  dxy: 0.15, // %
  us10yBps: 3, // bps (primário do ouro)
  petroleoChoque: 2, // %
  gvz: 5, // %
  us10yCautelaBps: 8, // bps
};

interface Quote {
  price: number;
  change: number;
  changePercent: number;
  isSuspicious?: boolean;
}

/** Um dado só é usável se não foi marcado como suspeito e tem variação finita. */
function usable(md: unknown): md is Quote {
  const q = md as Quote | null;
  return !!q && (q as { isSuspicious?: boolean }).isSuspicious !== true && Number.isFinite(q.changePercent);
}

const pctOf = (md: unknown): number | null => (usable(md) ? md.changePercent : null);
const fmt = (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(2)}%`;
const fmtBps = (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(1)} bps`;
const sinal = (v: number): 1 | -1 | 0 => (v > 0 ? 1 : v < 0 ? -1 : 0);
const dirTxt = (v: Vies) => (v === 'alta' ? 'alta' : v === 'baixa' ? 'baixa' : 'sem direção');

/** Sinal de confirmação: dir = +1 favorece alta do ativo, −1 favorece baixa. null = dado indisponível. */
type Confirmacao = { nome: string; txt: string; dir: 1 | -1 | 0 } | { nome: string; txt: null; dir: null };

interface Regra {
  id: AtivoId;
  label: string;
  variacao: number | null;
  /** Valor do primário já no sentido do ativo (positivo = alta do ativo). null = indisponível. */
  primario: { nome: string; txt: string | null; valor: number | null; limiar: number };
  confirmacoes: Confirmacao[];
  /** Devolve o texto do veto quando há choque contra a direção. */
  veto?: (v: Vies) => string | null;
  estado?: string | null;
}

function decidir(r: Regra): ViesAtivo {
  const motivos: string[] = [];
  const base = { id: r.id, label: r.label, variacao: r.variacao, estado: r.estado };
  const p = r.primario;

  if (p.valor == null || p.txt == null) {
    return { ...base, vies: 'neutro', motivos: [`Primário (70%): dado de ${p.nome} indisponível → neutro`] };
  }

  const direcao: Vies = p.valor > p.limiar ? 'alta' : p.valor < -p.limiar ? 'baixa' : 'neutro';
  motivos.push(`Primário (70%): ${p.txt} → ${dirTxt(direcao)}`);
  if (direcao === 'neutro') return { ...base, vies: 'neutro', motivos };

  const alvo = direcao === 'alta' ? 1 : -1;
  let checagens = 0;
  let confirmam = 0;
  const conf: string[] = [];
  for (const c of r.confirmacoes) {
    if (c.dir == null) {
      motivos.push(`Dado de ${c.nome} indisponível`);
      continue;
    }
    checagens++;
    if (c.dir === alvo) {
      confirmam++;
      conf.push(`${c.txt} confirma`);
    } else {
      conf.push(`${c.txt} não acompanha`);
    }
  }
  if (conf.length) motivos.push(`Confirmação (20%): ${conf.join(' · ')}`);

  let vies: Vies = direcao;
  if (checagens > 0 && confirmam === 0 && Math.abs(p.valor) < 2 * p.limiar) {
    vies = 'neutro';
    motivos.push('Sem confirmação e primário fraco → rebaixado para neutro');
  }

  if (vies !== 'neutro' && r.veto) {
    const v = r.veto(vies);
    if (v) {
      vies = 'neutro';
      motivos.push(`Ajuste (10%): ${v} → rebaixado para neutro`);
    }
  }

  return { ...base, vies, motivos };
}

export function calcularRegimeDoDia(data: CorrelationAnalysis | null | undefined): RegimeDoDia {
  if (!data) {
    return { regime: 'neutro', vies: 'neutro', motivos: ['Aguardando dados do mercado'], ativos: [] };
  }

  const es = pctOf(data.sp500Futures);
  const nq = pctOf(data.nasdaqFutures);
  const ym = pctOf(data.dowFutures);
  const dxy = pctOf(data.dxy);
  const oil = pctOf(data.oil);
  const vix = pctOf(data.vix);
  const gvz = pctOf(data.gvz);
  const bps = usable(data.us10y) && Number.isFinite(data.us10y.change) ? data.us10y.change * 100 : null;

  const futs = [es, nq, ym].filter((v): v is number => v != null);
  const futMedia = futs.length ? futs.reduce((s, v) => s + v, 0) / futs.length : null;

  // ── confirmações reutilizadas ──
  const cFut = (nome: string, v: number | null): Confirmacao =>
    v == null ? { nome, txt: null, dir: null } : { nome, txt: `${nome} ${fmt(v)}`, dir: sinal(v) };
  const cVix: Confirmacao =
    vix == null ? { nome: 'VIX', txt: null, dir: null } : { nome: 'VIX', txt: `VIX ${fmt(vix)}`, dir: sinal(-vix) as 1 | -1 | 0 };
  const cFutMedia = (favorece: 1 | -1, rotulo: string): Confirmacao =>
    futMedia == null
      ? { nome: 'futuros americanos', txt: null, dir: null }
      : { nome: 'futuros', txt: `${rotulo} ${fmt(futMedia)}`, dir: (sinal(futMedia) * favorece) as 1 | -1 | 0 };

  const choquePetroleo = oil != null && oil >= LIMIARES.petroleoChoque;
  const txtPetroleo = oil != null ? `petróleo ${fmt(oil)} (choque)` : '';

  // ── índices: primário = o próprio futuro; confirmação = os outros dois + VIX ──
  const indice = (id: AtivoId, label: string, nome: string, v: number | null, outros: [string, number | null][]): Regra => ({
    id,
    label,
    variacao: v,
    primario: { nome, txt: v != null ? `${nome} ${fmt(v)}` : null, valor: v, limiar: LIMIARES.futuros },
    confirmacoes: [...outros.map(([n, x]) => cFut(n, x)), cVix],
    // choque de petróleo para cima = pressão inflacionária contra a alta dos índices
    veto: (vies) => (vies === 'alta' && choquePetroleo ? `${txtPetroleo} contra a alta` : null),
  });

  // ── XAU: primário = US10Y invertido; confirmação = DXY invertido, futuros em queda, petróleo ──
  let estadoGvz: string | null = null;
  if (gvz != null) {
    estadoGvz =
      gvz > LIMIARES.gvz ? `GVZ ${fmt(gvz)}: expansão de volatilidade`
        : gvz < -LIMIARES.gvz ? `GVZ ${fmt(gvz)}: compressão de volatilidade`
        : `GVZ ${fmt(gvz)}: volatilidade normal`;
  }
  const xau: Regra = {
    id: 'xau',
    label: 'XAU/USD',
    variacao: pctOf(data.gold),
    primario: {
      nome: 'US10Y',
      txt: bps != null ? `US10Y ${fmtBps(bps)} (juro ${bps < 0 ? 'caindo' : bps > 0 ? 'subindo' : 'estável'})` : null,
      valor: bps != null ? -bps : null,
      limiar: LIMIARES.us10yBps,
    },
    confirmacoes: [
      dxy == null ? { nome: 'DXY', txt: null, dir: null } : { nome: 'DXY', txt: `DXY ${fmt(dxy)}`, dir: sinal(-dxy) as 1 | -1 | 0 },
      cFutMedia(-1, 'futuros'),
      oil == null ? { nome: 'petróleo', txt: null, dir: null } : { nome: 'petróleo', txt: `petróleo ${fmt(oil)}`, dir: sinal(oil) },
    ],
    estado: estadoGvz,
  };

  // ── EUR/USD: primário = DXY invertido; confirmação = futuros (risk-on ajuda o euro) ──
  const eurusd: Regra = {
    id: 'eurusd',
    label: 'EUR/USD',
    variacao: pctOf(data.eurUsd),
    primario: { nome: 'DXY', txt: dxy != null ? `DXY ${fmt(dxy)}` : null, valor: dxy != null ? -dxy : null, limiar: LIMIARES.dxy },
    confirmacoes: [cFutMedia(1, 'futuros')],
    veto: (vies) => (vies === 'alta' && choquePetroleo ? `${txtPetroleo} pesa contra o euro` : null),
  };

  // ── USD/JPY: primário = DXY; confirmação = futuros (risk-on enfraquece o iene) + US10Y ──
  const usdjpy: Regra = {
    id: 'usdjpy',
    label: 'USD/JPY',
    variacao: pctOf(data.usdJpy),
    primario: { nome: 'DXY', txt: dxy != null ? `DXY ${fmt(dxy)}` : null, valor: dxy, limiar: LIMIARES.dxy },
    confirmacoes: [
      cFutMedia(1, 'futuros'),
      bps == null ? { nome: 'US10Y', txt: null, dir: null } : { nome: 'US10Y', txt: `US10Y ${fmtBps(bps)}`, dir: sinal(bps) },
    ],
    veto: (vies) => (vies === 'baixa' && choquePetroleo ? `${txtPetroleo} favorece o dólar contra o iene` : null),
  };

  const ativos = [
    indice('nasdaq', 'Nasdaq', 'NQ1!', nq, [['ES1!', es], ['YM1!', ym]]),
    indice('sp500', 'S&P 500', 'ES1!', es, [['NQ1!', nq], ['YM1!', ym]]),
    indice('dow', 'Dow Jones', 'YM1!', ym, [['ES1!', es], ['NQ1!', nq]]),
    xau,
    eurusd,
    usdjpy,
  ].map(decidir);

  // ── regime geral: direção dos futuros, confirmada pelo VIX ──
  const motivos: string[] = [];
  let vies: Vies = 'neutro';
  let regime: Regime = 'neutro';
  if (futMedia == null) {
    motivos.push('Sem futuros americanos válidos');
  } else {
    vies = futMedia > LIMIARES.futuros ? 'alta' : futMedia < -LIMIARES.futuros ? 'baixa' : 'neutro';
    const det = [['ES1!', es], ['NQ1!', nq], ['YM1!', ym]]
      .filter(([, v]) => v != null)
      .map(([n, v]) => `${n} ${fmt(v as number)}`)
      .join(' / ');
    motivos.push(`Futuros: ${det} (média ${fmt(futMedia)})`);
    if (vies !== 'neutro') {
      if (vix == null) motivos.push('Dado de VIX indisponível');
      else {
        const vixOk = vies === 'alta' ? vix < 0 : vix > 0;
        motivos.push(`VIX ${fmt(vix)} ${vixOk ? 'confirma' : 'não confirma'}`);
        if (vixOk) regime = vies === 'alta' ? 'risk-on' : 'risk-off';
        else if (Math.abs(futMedia) < 2 * LIMIARES.futuros) {
          vies = 'neutro';
          motivos.push('Sem confirmação do VIX e futuros fracos → neutro');
        }
      }
    }
  }
  if (dxy != null) motivos.push(`DXY ${fmt(dxy)}`);
  if (oil != null) motivos.push(`Petróleo ${fmt(oil)}${choquePetroleo ? ' (choque)' : ''}`);
  if (bps != null && bps > LIMIARES.us10yCautelaBps) motivos.push(`Cautela: juro pressionando (US10Y ${fmtBps(bps)})`);

  return { regime, vies, motivos, ativos };
}

export function viesLabel(v: Vies): string {
  return v === 'alta' ? 'ALTA' : v === 'baixa' ? 'BAIXA' : 'NEUTRO';
}

export function regimeLabel(r: Regime): string {
  return r === 'risk-on' ? 'RISK-ON' : r === 'risk-off' ? 'RISK-OFF' : 'NEUTRO';
}

export function viesToBias(v: Vies): 'bullish' | 'bearish' | 'neutral' {
  return v === 'alta' ? 'bullish' : v === 'baixa' ? 'bearish' : 'neutral';
}
