// ============================================================================
// GEX Map v5 — port fiel do gex_map_v5.py (auditoria de 25/09/2026)
//
// Módulo puro: recebe a cadeia da Cboe já baixada e devolve o mapa. Não faz
// rede. É o mesmo código que roda na função gex-api e no teste de comparação
// contra o Python, então o número do site é o número do script.
//
// Convenção SqueezeMetrics naive: dealers long call / short put.
//
// Equivalências com o Python (linha a linha):
//   carregar_cboe ........ feito em index.ts (rede)
//   preencher_iv ......... preencherIv
//   zeros_do_perfil ...... zerosDoPerfil
//   flip_perfil .......... flipPerfil      (±15%, depois ±45%)
//   montar_df ............ montarDf
//   sensibilidade_flip ... sensibilidadeFlip
//   main() ............... calcularGex
//
// Única diferença conhecida: em preencher_iv, quando a call e a put do mesmo
// strike têm IVs diferentes, o np.interp do Python usa a ordem de desempate do
// sort (instável) do pandas. Aqui o desempate é estável (ordem da Cboe). Afeta
// só a IV interpolada de contratos sem IV, entre strikes vizinhos.
// ============================================================================

export const R = 0.045;
const OSI = /^([A-Z]+)(\d{6})([CP])(\d{8})$/;

export const PRESETS: Record<string, { und: string; ref: string; refNome: string; fmtPts: boolean }> = {
  win: { und: "EWZ", ref: "^BVSP", refNome: "IBOV", fmtPts: true },
  gold: { und: "GLD", ref: "GC=F", refNome: "XAU/USD", fmtPts: false },
  nasdaq: { und: "QQQ", ref: "NQ=F", refNome: "NQ/US100", fmtPts: false },
};

export type CboeContrato = {
  option: string;
  open_interest?: number | null;
  iv?: number | null;
  gamma?: number | null;
};

type Linha = {
  strike: number;
  tipo: "call" | "put";
  oi: number;
  venc: number; // dte (só serve de chave de agrupamento)
  t: number;
  ivRaw: number;
  iv: number; // NaN = sem IV
  gammaCboe: number;
  gamma: number;
  gex: number;
};

// ── utilitários ──────────────────────────────────────────────────────────────

function bsGamma(spot: number, strike: number, t: number, iv: number): number {
  if (t <= 0 || iv == null || !(iv > 0) || Number.isNaN(iv)) return 0;
  const d1 = (Math.log(spot / strike) + (R + 0.5 * iv * iv) * t) / (iv * Math.sqrt(t));
  return Math.exp(-0.5 * d1 * d1) / (Math.sqrt(2 * Math.PI) * spot * iv * Math.sqrt(t));
}

/** f"{x:.Nf}" do Python: arredonda empate exato para o par (o toFixed do JS sobe). */
export function pyFixed(x: number, d: number): string {
  const p = 10 ** d;
  const s = x * p;
  if (!Number.isInteger(s) && Number.isInteger(s * 2) && s / p === x) {
    const fl = Math.floor(s);
    const par = fl % 2 === 0 ? fl : fl + 1;
    const v = par / p;
    const txt = Math.abs(v).toFixed(d);
    return (x < 0 ? "-" : "") + txt;
  }
  return x.toFixed(d);
}

function mediana(v: number[]): number {
  const a = [...v].sort((x, y) => x - y);
  const n = a.length;
  return n % 2 ? a[(n - 1) / 2] : (a[n / 2 - 1] + a[n / 2]) / 2;
}

/** np.interp para um x fora de xp (o caso de preencher_iv). */
function npInterp(x: number, xp: number[], fp: number[]): number {
  const n = xp.length;
  if (x < xp[0]) return fp[0];
  if (x >= xp[n - 1]) return fp[n - 1];
  // último j com xp[j] <= x (binary search do numpy)
  let lo = 0, hi = n - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (xp[mid] <= x) lo = mid; else hi = mid;
  }
  const j = lo;
  const slope = (fp[j + 1] - fp[j]) / (xp[j + 1] - xp[j]);
  return slope * (x - xp[j]) + fp[j];
}

/** np.arange(start, stop, step) com a mesma aritmética do numpy. */
function npArange(start: number, stop: number, step: number): Float64Array {
  const n = Math.max(0, Math.ceil((stop - start) / step));
  const out = new Float64Array(n);
  if (n === 0) return out;
  out[0] = start;
  if (n === 1) return out;
  out[1] = start + step;
  const delta = out[1] - out[0];
  for (let i = 2; i < n; i++) out[i] = start + i * delta;
  return out;
}

function parseOsi(sym: string, hojeMs: number) {
  const m = OSI.exec(sym);
  if (!m) return null;
  const [, , yymmdd, cp, k8] = m;
  const yy = 2000 + Number(yymmdd.slice(0, 2));
  const mm = Number(yymmdd.slice(2, 4));
  const dd = Number(yymmdd.slice(4, 6));
  const dte = Math.round((Date.UTC(yy, mm - 1, dd) - hojeMs) / 86400000);
  return { dte, tipo: (cp === "C" ? "call" : "put") as "call" | "put", strike: Number(k8) / 1000 };
}

// ── preencher_iv ─────────────────────────────────────────────────────────────

function preencherIv(d: Linha[]): void {
  for (const r of d) r.iv = r.ivRaw > 0.03 ? r.ivRaw : NaN;

  // 1) tipo oposto no mesmo strike/vencimento (média dos que têm IV)
  const grupos = new Map<string, Linha[]>();
  for (const r of d) {
    const k = `${r.venc}|${r.strike}`;
    const g = grupos.get(k);
    if (g) g.push(r); else grupos.set(k, [r]);
  }
  for (const g of grupos.values()) {
    const v = g.filter((r) => !Number.isNaN(r.iv));
    if (v.length === 0 || v.length === g.length) continue;
    const media = v.reduce((s, r) => s + r.iv, 0) / v.length;
    for (const r of g) if (Number.isNaN(r.iv)) r.iv = media;
  }

  // 2) interpolação por strike dentro do vencimento
  const porVenc = new Map<number, Linha[]>();
  for (const r of d) {
    const g = porVenc.get(r.venc);
    if (g) g.push(r); else porVenc.set(r.venc, [r]);
  }
  for (const g of porVenc.values()) {
    const falta = g.filter((r) => Number.isNaN(r.iv));
    const ok = g.filter((r) => !Number.isNaN(r.iv));
    if (falta.length === 0 || ok.length < 3) continue;
    const idx = ok.map((r, i) => i).sort((a, b) => ok[a].strike - ok[b].strike || a - b);
    const xp = idx.map((i) => ok[i].strike);
    const fp = idx.map((i) => ok[i].iv);
    for (const r of falta) r.iv = npInterp(r.strike, xp, fp);
  }
}

// ── perfil de gamma e flip ───────────────────────────────────────────────────

function zerosDoPerfil(d: Linha[], spot: number, pct: number): { zeros: number[] } | null {
  const dd = d.filter((r) => !Number.isNaN(r.iv) && r.iv > 0 && r.t > 0);
  if (dd.length < 50) return null;
  const passo = Math.max(spot * 0.001, 0.05);
  const xs = npArange(spot * (1 - pct), spot * (1 + pct), passo);
  const n = dd.length;
  const lnK = new Float64Array(n), drift = new Float64Array(n), den = new Float64Array(n), sg = new Float64Array(n);
  for (let j = 0; j < n; j++) {
    const r = dd[j];
    lnK[j] = Math.log(r.strike);
    drift[j] = (R + 0.5 * r.iv * r.iv) * r.t;
    den[j] = r.iv * Math.sqrt(r.t);
    sg[j] = (r.tipo === "call" ? 1 : -1) * r.oi;
  }
  const c = Math.sqrt(2 * Math.PI);
  const tot = new Float64Array(xs.length);
  for (let i = 0; i < xs.length; i++) {
    const X = xs[i], lnX = Math.log(X);
    let s = 0;
    for (let j = 0; j < n; j++) {
      const d1 = (lnX - lnK[j] + drift[j]) / den[j];
      s += sg[j] * Math.exp(-0.5 * d1 * d1) / (c * X * den[j]);
    }
    tot[i] = s * X * X * 0.01 * 100;
  }
  const zeros: number[] = [];
  for (let i = 0; i < xs.length - 1; i++)
    if (tot[i] * tot[i + 1] < 0)
      zeros.push(xs[i] + (xs[i + 1] - xs[i]) * (-tot[i]) / (tot[i + 1] - tot[i]));
  return { zeros };
}

const maisPerto = (vals: number[], spot: number) =>
  vals.reduce((a, b) => (Math.abs(b - spot) < Math.abs(a - spot) ? b : a));

function flipPerfil(d: Linha[], spot: number, pct = 0.15, pctAmplo = 0.45) {
  const p = zerosDoPerfil(d, spot, pct);
  if (!p) return { flip: null as number | null, zeros: [] as number[], perfilOk: false, distante: false };
  if (p.zeros.length) return { flip: maisPerto(p.zeros, spot), zeros: p.zeros, perfilOk: true, distante: false };
  const a = zerosDoPerfil(d, spot, pctAmplo);
  if (a && a.zeros.length) return { flip: maisPerto(a.zeros, spot), zeros: a.zeros, perfilOk: true, distante: true };
  return { flip: null, zeros: [], perfilOk: true, distante: false };
}

function montarDf(contratos: CboeContrato[], hojeMs: number, diasMax: number): Linha[] | null {
  const linhas: Linha[] = [];
  for (const o of contratos) {
    const p = parseOsi(o.option, hojeMs);
    if (!p) continue;
    const oi = o.open_interest || 0;
    if (p.dte < 0 || p.dte > diasMax || oi <= 0) continue;
    linhas.push({
      strike: p.strike, tipo: p.tipo, oi: Math.trunc(oi), venc: p.dte, t: Math.max(p.dte, 0.5) / 365,
      ivRaw: Number(o.iv || 0), iv: NaN, gammaCboe: 0, gamma: 0, gex: 0,
    });
  }
  if (!linhas.length) return null;
  preencherIv(linhas);
  return linhas;
}

const JANELAS = [7, 14, 30, 45, 75, 120];

function sensibilidadeFlip(contratos: CboeContrato[], hojeMs: number, spot: number) {
  return JANELAS.map((dias) => {
    const dj = montarDf(contratos, hojeMs, dias);
    if (!dj || dj.length < 50) return { dias, flip: null as number | null, contratos: 0, oi: 0 };
    const f = flipPerfil(dj, spot);
    return {
      dias, flip: f.perfilOk ? f.flip : null, contratos: dj.length,
      oi: dj.reduce((s, r) => s + r.oi, 0),
    };
  });
}

// ── main() ───────────────────────────────────────────────────────────────────

export type GexOpcoes = {
  preset: string;
  spot: number;
  contratos: CboeContrato[];
  snapshot: string;
  ref: number | null;
  adv20: number | null;
  dias?: number;
  niveis?: number;
  minOi?: number;
  agora?: Date;
};

export class GexAbortado extends Error {
  constructor(public codigo: number, msg: string, public extra: Record<string, unknown> = {}) {
    super(msg);
  }
}

export function calcularGex(o: GexOpcoes) {
  const cfg = PRESETS[o.preset];
  if (!cfg) throw new Error("preset inválido");
  const dias = o.dias ?? 30;
  const minOi = o.minOi ?? 500;
  const nlv = Math.max(1, Math.min(10, o.niveis ?? 6));
  const { spot, contratos, ref, adv20 } = o;
  const agora = o.agora ?? new Date();
  const hojeMs = Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), agora.getUTCDate());

  let vistos = 0, naJanela = 0, pertoTotal = 0, pertoComOi = 0;
  const d: Linha[] = [];
  for (const c of contratos) {
    const p = parseOsi(c.option, hojeMs);
    if (!p) continue;
    if (p.dte < 0 || p.dte > dias) continue;
    naJanela++;
    const perto = Math.abs(p.strike / spot - 1) <= 0.10;
    if (perto) pertoTotal++;
    const oi = c.open_interest || 0;
    if (oi <= 0) continue;
    vistos++;
    if (perto) pertoComOi++;
    let g = c.gamma || 0;
    if (!g || Number.isNaN(g)) g = 0;
    d.push({
      strike: p.strike, tipo: p.tipo, oi: Math.trunc(oi), venc: p.dte, t: Math.max(p.dte, 0.5) / 365,
      gammaCboe: Math.abs(Number(g)), ivRaw: Number(c.iv || 0), iv: NaN, gamma: 0, gex: 0,
    });
  }

  const cobertura = naJanela ? vistos / naJanela : 0;
  const coberturaPerto = pertoTotal ? pertoComOi / pertoTotal : 0;
  const pctTxt = (x: number) => `${Math.round(x * 100)}%`;
  if (!d.length || cobertura < 0.10)
    throw new GexAbortado(2,
      `Cobertura de OI insuficiente: ${vistos}/${naJanela} contratos na janela têm OI (${pctTxt(cobertura)}). ` +
      "O mapa seria calculado sobre uma amostra aleatória.", { cobertura, coberturaPerto });

  if (o.preset === "nasdaq" && coberturaPerto < 0.60)
    throw new GexAbortado(3,
      `Modo estrito Nasdaq: cobertura de OI a ±10% do spot em ${pctTxt(coberturaPerto)} (mínimo 60%; ` +
      `cadeia inteira ${pctTxt(cobertura)}). Mapa não confiável.`, { cobertura, coberturaPerto });

  const ivValores = contratos.map((c) => c.iv).filter((v): v is number => !!v && v > 0);
  if (ivValores.length < 10)
    throw new GexAbortado(4, `IV da Cboe inválida ou faltando (${ivValores.length} válidas).`);
  const ivMediana = mediana(ivValores);

  preencherIv(d);

  let nFallback = 0, nRecuperados = 0, nPerdidos = 0;
  for (const r of d) {
    const falta = r.gammaCboe <= 0;
    r.gamma = falta ? bsGamma(spot, r.strike, r.t, r.iv) : r.gammaCboe;
    r.gamma = Math.abs(r.gamma);
    if (Number.isNaN(r.gamma)) r.gamma = 0;
    r.gex = (r.tipo === "call" ? 1 : -1) * r.gamma * spot * spot * 0.01 * 100 * r.oi;
    if (falta) { nFallback++; if (r.gamma > 0) nRecuperados++; }
    if (r.gamma <= 0) nPerdidos++;
  }

  // agregados por strike (ordem crescente de strike, como o groupby/pivot)
  type PorStrike = { strike: number; oiCall: number; oiPut: number; gexTotal: number; gexCall: number; gexPut: number; temCall: boolean; temPut: boolean };
  const mapa = new Map<number, PorStrike>();
  for (const r of d) {
    let s = mapa.get(r.strike);
    if (!s) { s = { strike: r.strike, oiCall: 0, oiPut: 0, gexTotal: 0, gexCall: 0, gexPut: 0, temCall: false, temPut: false }; mapa.set(r.strike, s); }
    s.gexTotal += r.gex;
    if (r.tipo === "call") { s.oiCall += r.oi; s.gexCall += r.gex; s.temCall = true; }
    else { s.oiPut += r.oi; s.gexPut += r.gex; s.temPut = true; }
  }
  const per = [...mapa.values()].sort((a, b) => a.strike - b.strike);
  const net = d.reduce((s, r) => s + r.gex, 0);

  // idxmax/idxmin: primeiro strike (crescente) que atinge o extremo
  const argExt = (lista: PorStrike[], val: (s: PorStrike) => number, maior: boolean) => {
    let best: PorStrike | null = null;
    for (const s of lista) if (!best || (maior ? val(s) > val(best) : val(s) < val(best))) best = s;
    return best ? best.strike : null;
  };
  const comCall = per.filter((s) => s.temCall), comPut = per.filter((s) => s.temPut);
  const callWall = argExt(comCall, (s) => s.gexCall, true);
  const putWall = argExt(comPut, (s) => s.gexPut, false);
  const maxGamma = argExt(per, (s) => Math.abs(s.gexTotal), true)!;
  const callWallOi = argExt(comCall, (s) => s.oiCall, true);
  const putWallOi = argExt(comPut, (s) => s.oiPut, true);

  // gamma levels ranqueados por |GEX| do strike
  const niveis = [...per].sort((a, b) => Math.abs(b.gexTotal) - Math.abs(a.gexTotal)).slice(0, nlv)
    .map((s) => ({ strike: s.strike, gex: s.gexTotal }));

  // força da parede = ações a hedgear por 1% no strike ÷ ADV20
  const forca = (k: number | null) => {
    if (adv20 == null || k == null) return null;
    let s = 0;
    for (const r of d) if (r.strike === k) s += r.gamma * r.oi * 100 * 0.01 * spot;
    return s / adv20;
  };

  // flip v3 — só para o campo 6 da linha PINE (não é exibido; ver auditoria 25/09)
  let flipV3: number | null = null;
  const band = per.filter((s) => s.strike >= spot * 0.88 && s.strike <= spot * 1.12);
  if (band.length >= 3) {
    const smooth = band.map((_, i) => band.slice(Math.max(0, i - 1), i + 2).reduce((a, s) => a + s.gexTotal, 0));
    const trans: number[] = [];
    for (let i = 1; i < band.length; i++) if (smooth[i - 1] < 0 && 0 <= smooth[i]) trans.push(band[i].strike);
    if (trans.length) flipV3 = maisPerto(trans, spot);
  }
  if (flipV3 == null) {
    let cum = 0;
    const cums = per.map((s) => (cum += s.gexTotal));
    const cr: number[] = [];
    for (let i = 1; i < per.length; i++)
      if ((cums[i - 1] < 0 && 0 <= cums[i]) || (cums[i - 1] >= 0 && 0 > cums[i])) cr.push(per[i].strike);
    flipV3 = cr.length ? maisPerto(cr, spot) : null;
  }

  // flip v4/v5 — zero do gamma agregado, busca ampliada até ±45%
  const fp = flipPerfil(d, spot);
  const flip = fp.flip;

  const conv = (k: number | null) => (ref == null || k == null ? null : Math.round((k / spot) * ref));

  // health checks
  const alertas: string[] = [];
  if (spot <= 0) alertas.push("Spot inválido (≤0)");
  if (d.length < 50) alertas.push(`Poucos contratos com OI: ${d.length} (ideal >100)`);
  const oiTotal = d.reduce((s, r) => s + r.oi, 0);
  if (oiTotal < 100_000) alertas.push(`OI total baixo: ${oiTotal.toLocaleString("pt-BR")} (ideal >500 mil)`);
  if (ivMediana < 0.08) alertas.push(`IV mediana da Cboe muito baixa (${(ivMediana * 100).toFixed(1)}%): gamma pode estar subestimada`);
  const wallsInvertidas = !!(callWall && putWall && callWall < putWall);
  if (wallsInvertidas) alertas.push("Call wall abaixo do put wall: cadeia suspeita");
  const flipDist = flip != null ? Math.abs(flip - spot) / spot : null;
  if (fp.distante) alertas.push("Nenhum cruzamento em ±15%: o flip veio da busca ampliada (±45%). O regime não é estável, o flip só está longe.");
  else if (flipDist != null && flipDist > 0.15) alertas.push("Flip distante do spot: suspeita de OI degradado nessa região");

  const sens = sensibilidadeFlip(contratos, hojeMs, spot);
  const vals = sens.map((s) => s.flip).filter((v): v is number => v != null);
  const dispersao = vals.length >= 2 ? (Math.max(...vals) - Math.min(...vals)) / spot : null;
  const flipFragil = dispersao != null && dispersao > 0.05;
  if (flipFragil) alertas.push(`Flip frágil: dispersão de ${(dispersao! * 100).toFixed(1)}% do spot entre janelas de vencimento`);

  const checks = [
    { label: "Cobertura OI ±10% ≥ 60%", ok: coberturaPerto >= 0.60 },
    { label: "IV válida (≥8%)", ok: ivMediana >= 0.08 },
    { label: "Perfil de gamma calculado", ok: fp.perfilOk },
    { label: "Flip próximo (±10%) ou regime estável em ±15%", ok: fp.perfilOk && (flip == null || Math.abs(flip - spot) / spot <= 0.10) },
    { label: "Walls coerentes", ok: !!(callWall && putWall && callWall > putWall) },
  ];
  const passados = checks.filter((c) => c.ok).length;
  const veredito = passados >= 4 ? "SEGURO" : passados >= 3 ? "QUESTIONAVEL" : "INSEGURO";

  // tabela: strikes com OI ≥ min-oi, top 12 por |GEX|, em ordem de strike
  const tabela = per.filter((s) => s.oiCall + s.oiPut >= minOi)
    .sort((a, b) => Math.abs(b.gexTotal) - Math.abs(a.gexTotal)).slice(0, 12)
    .sort((a, b) => a.strike - b.strike)
    .map((s) => ({ strike: s.strike, ref: conv(s.strike), oiCall: s.oiCall, oiPut: s.oiPut, gexM: +(s.gexTotal / 1e6).toFixed(1) }));

  // linha PINE (formato v5/v7): 0–11 iguais ao v4, 12–13 walls por OI, 14+ níveis
  const topCalls = comCall.map((s) => ({ k: s.strike, g: s.gexCall })).sort((a, b) => b.g - a.g || a.k - b.k).slice(0, 3).map((x) => x.k);
  while (topCalls.length < 3) topCalls.push(0);
  const f2 = (x: number | null) => pyFixed(x ?? 0, 2);
  const campos = [
    o.preset.toUpperCase(), o.snapshot, f2(spot), f2(ref ?? 0),
    net > 0 ? "POS" : "NEG", f2(flip), f2(flipV3),
    f2(putWall), f2(topCalls[0]), f2(topCalls[1]), f2(topCalls[2]),
    f2(maxGamma), f2(putWallOi), f2(callWallOi),
    ...niveis.map((n) => `${f2(n.strike)}:${pyFixed(n.gex / 1e6, 1)}:${n.gex > 0 ? "C" : "P"}`),
  ];
  const linhaPine = campos.join("|");

  const nivel = (k: number | null) => (k == null ? null : { strike: k, ref: conv(k) });
  const fCw = forca(callWall), fPw = forca(putWall);

  return {
    versao: "v5",
    preset: o.preset, und: cfg.und, refNome: cfg.refNome, spot, refSpot: ref,
    dias, snapshot: o.snapshot,
    gexLiquidoM: +(net / 1e6).toFixed(1),
    regime: (net > 0 ? "positivo" : "negativo") as "positivo" | "negativo",
    callWall: { strike: callWall ?? 0, ref: conv(callWall), forca: fCw, confluenciaOI: callWall === callWallOi },
    putWall: { strike: putWall ?? 0, ref: conv(putWall), forca: fPw, confluenciaOI: putWall === putWallOi },
    callWallOI: nivel(callWallOi),
    putWallOI: nivel(putWallOi),
    maxGamma: nivel(maxGamma)!,
    flip: flip != null
      ? { strike: +flip.toFixed(2), ref: conv(flip), distPct: +(((flip - spot) / spot) * 100).toFixed(1), distante: fp.distante }
      : null,
    outrosZeros: fp.zeros.filter((z) => z !== flip).sort((a, b) => a - b).map((z) => +z.toFixed(2)),
    niveis: niveis.map((n, i) => ({
      n: i + 1, strike: n.strike, ref: conv(n.strike), gexM: +(n.gex / 1e6).toFixed(1),
      lado: (n.gex > 0 ? "C" : "P") as "C" | "P", distPct: +(((n.strike - spot) / spot) * 100).toFixed(1),
    })),
    sensibilidade: sens.map((s) => ({ ...s, flip: s.flip != null ? +s.flip.toFixed(2) : null, ref: conv(s.flip), emUso: s.dias === dias })),
    dispersaoPct: dispersao != null ? +(dispersao * 100).toFixed(1) : null,
    flipFragil,
    saude: {
      veredito, passados, total: checks.length, checks, alertas,
      cobertura: +cobertura.toFixed(3), coberturaPerto: +coberturaPerto.toFixed(3),
      ivMediana: +ivMediana.toFixed(4), oiTotal, contratos: d.length,
      gamma: { cboe: d.length - nFallback, bs: nRecuperados, semGamma: nPerdidos },
      wallsInvertidas,
    },
    tabela,
    linhaPine,
    flipV3,
  };
}
