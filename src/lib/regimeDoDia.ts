import type { CorrelationAnalysis } from '@/hooks/useMarketCorrelations';

export type ViesWIN = 'alta' | 'baixa' | 'neutro';
export type Regime = 'risk-on' | 'risk-off' | 'neutro';

export interface RegimeDoDia {
  regime: Regime;
  viesWIN: ViesWIN;
  motivos: string[];
}

interface Quote {
  price: number;
  changePercent: number;
  isSuspicious?: boolean;
}

/** Um dado só é usável se não foi marcado como suspeito e tem variação finita. */
function usable(md: unknown): md is Quote {
  const q = md as Quote | null;
  return !!q && (q as any).isSuspicious !== true && Number.isFinite(q.changePercent);
}

const fmt = (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(2)}%`;

export interface RegimeInputs {
  /** Variação do DI Jan/29 no dia, em bps (positivo = juro subindo). */
  diJan29ChangeBps?: number | null;
}

/**
 * Fonte ÚNICA de verdade do dia: selo do topo, banner do Cenário do Dia
 * e Check List Diário devem ler deste objeto.
 */
export function calcularRegimeDoDia(
  data: CorrelationAnalysis | null | undefined,
  inputs: RegimeInputs = {}
): RegimeDoDia {
  const motivos: string[] = [];

  if (!data) {
    return { regime: 'neutro', viesWIN: 'neutro', motivos: ['Aguardando dados do mercado'] };
  }

  // ─── 1. SINAL PRIMÁRIO (70%): média de ES1! e NQ1! ───────────────────────
  const primarios: { label: string; v: number }[] = [];
  if (usable(data.sp500Futures)) primarios.push({ label: 'ES1!', v: data.sp500Futures.changePercent });
  else motivos.push('Dado de ES1! indisponível');
  if (usable(data.nasdaqFutures)) primarios.push({ label: 'NQ1!', v: data.nasdaqFutures.changePercent });
  else motivos.push('Dado de NQ1! indisponível');

  let direcao: ViesWIN = 'neutro';
  let media = 0;

  if (primarios.length > 0) {
    media = primarios.reduce((s, p) => s + p.v, 0) / primarios.length;
    if (media > 0.3) direcao = 'alta';
    else if (media < -0.3) direcao = 'baixa';

    const detalhe = primarios.map((p) => `${p.label} ${fmt(p.v)}`).join(' / ');
    if (direcao === 'alta') motivos.push(`Primário (70%): futuros americanos em alta — ${detalhe} (média ${fmt(media)})`);
    else if (direcao === 'baixa') motivos.push(`Primário (70%): futuros americanos em queda — ${detalhe} (média ${fmt(media)})`);
    else motivos.push(`Primário (70%): futuros americanos sem direção — ${detalhe} (média ${fmt(media)})`);
  } else {
    motivos.push('Primário (70%): sem futuros americanos válidos — viés neutro');
  }

  // ─── 2. CONFIRMAÇÃO (20%): Euro Stoxx 50 + VIX ───────────────────────────
  let confirmacoes = 0;
  let checagens = 0;

  if (direcao !== 'neutro') {
    if (usable(data.stoxx50)) {
      checagens++;
      const stoxxOk = direcao === 'alta' ? data.stoxx50.changePercent > 0 : data.stoxx50.changePercent < 0;
      if (stoxxOk) {
        confirmacoes++;
        motivos.push(`Confirmação (20%): Euro Stoxx 50 ${fmt(data.stoxx50.changePercent)} na mesma direção`);
      } else {
        motivos.push(`Confirmação (20%): Euro Stoxx 50 ${fmt(data.stoxx50.changePercent)} não acompanha — sinal enfraquecido`);
      }
    } else {
      motivos.push('Dado de Euro Stoxx 50 indisponível');
    }

    if (usable(data.vix)) {
      checagens++;
      const vixOk = direcao === 'alta' ? data.vix.changePercent < 0 : data.vix.changePercent > 0;
      if (vixOk) {
        confirmacoes++;
        motivos.push(`Confirmação (20%): VIX ${fmt(data.vix.changePercent)} no sentido oposto ao primário`);
      } else {
        motivos.push(`Confirmação (20%): VIX ${fmt(data.vix.changePercent)} contraria o primário — sinal enfraquecido`);
      }
    } else {
      motivos.push('Dado de VIX indisponível');
    }
  }

  let viesWIN: ViesWIN = direcao;

  // Enfraquecimento: nenhuma confirmação com sinal primário fraco → neutro (nunca inverte)
  if (direcao !== 'neutro' && checagens > 0 && confirmacoes === 0 && Math.abs(media) < 0.6) {
    viesWIN = 'neutro';
    motivos.push('Sem confirmação externa e primário fraco → viés rebaixado para neutro');
  }

  // ─── 3. VETO BRASIL (10%) ────────────────────────────────────────────────
  if (direcao !== 'neutro') {
    const bps = inputs.diJan29ChangeBps;
    if (typeof bps === 'number' && Number.isFinite(bps)) {
      const diContra = direcao === 'alta' ? bps >= 15 : bps <= -15;
      if (diContra) {
        viesWIN = 'neutro';
        motivos.push(`Veto Brasil (10%): DI Jan/29 ${bps > 0 ? '+' : ''}${bps.toFixed(0)} bps contra a direção → viés rebaixado para neutro`);
      }
    } else {
      motivos.push('Dado de DI Jan/29 indisponível');
    }

    if (usable(data.usdBrl)) {
      const brl = data.usdBrl.changePercent;
      const brlContra = direcao === 'alta' ? brl > 0.6 : brl < -0.6;
      if (brlContra) {
        viesWIN = 'neutro';
        motivos.push(`Veto Brasil (10%): USD/BRL ${fmt(brl)} contra a direção → viés rebaixado para neutro`);
      }
    } else {
      motivos.push('Dado de USD/BRL indisponível');
    }
  }

  // ─── 4. REGIME MACRO ─────────────────────────────────────────────────────
  let regime: Regime = 'neutro';
  if (direcao === 'alta') regime = confirmacoes > 0 ? 'risk-on' : 'neutro';
  else if (direcao === 'baixa') regime = confirmacoes > 0 ? 'risk-off' : 'neutro';

  if (usable(data.us10y)) {
    const bps10y = (data.us10y as unknown as { change: number }).change * 100;
    if (Number.isFinite(bps10y) && bps10y > 8) {
      motivos.push(`Cautela: juro real pressionando (US10Y +${bps10y.toFixed(0)} bps no dia)`);
    }
  } else {
    motivos.push('Dado de US10Y indisponível');
  }

  return { regime, viesWIN, motivos };
}

export function viesLabel(v: ViesWIN): string {
  return v === 'alta' ? 'ALTA' : v === 'baixa' ? 'BAIXA' : 'NEUTRO';
}

export function regimeLabel(r: Regime): string {
  return r === 'risk-on' ? 'RISK-ON' : r === 'risk-off' ? 'RISK-OFF' : 'NEUTRO';
}

export function viesToBias(v: ViesWIN): 'bullish' | 'bearish' | 'neutral' {
  return v === 'alta' ? 'bullish' : v === 'baixa' ? 'bearish' : 'neutral';
}
