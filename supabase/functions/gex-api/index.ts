// ============================================================================
// Supabase Edge Function: gex-api
// Endpoints:
//   GET /gex-api?fn=gex&preset=win|gold|nasdaq[&dias=30][&niveis=6][&ref=NNNN]
//   GET /gex-api?fn=radar[&gatilho=0.35]
//
// fn=gex roda o gex_map v5 (ver gex_v5.ts): cadeia da Cboe (OI real, D-1),
// gamma da Cboe com fallback Black-Scholes, flip = zero do gamma agregado,
// walls por GEX e por OI, gamma levels, sensibilidade do flip e health checks.
// Quando um health check bloqueante falha, responde 422 com { erro, codigo }
// (2 = cobertura de OI, 3 = modo estrito Nasdaq, 4 = IV da Cboe), em vez de
// devolver um mapa ruim com cara de bom.
// ============================================================================

import { calcularGex, GexAbortado, PRESETS, type CboeContrato } from "./gex_v5.ts";

const UA = { headers: { "User-Agent": "Mozilla/5.0 (Macintosh) AppleWebKit/537.36" } };
const CBOE = (t: string) => `https://cdn.cboe.com/api/global/delayed_quotes/options/${t}.json`;
const RADAR = ["6L=F", "EWZ", "ES=F", "NQ=F", "DX-Y.NYB", "GC=F"];
const CACHE_MS = 5 * 60 * 1000;

// ── Yahoo (só referência, volume e radar) ───────────────────────────────────
let auth: { cookie: string; crumb: string } | null = null;
async function yahooAuth() {
  if (auth) return auth;
  const r = await fetch("https://fc.yahoo.com", UA);
  const cookie = (r.headers.get("set-cookie") ?? "").split(";")[0];
  const cr = await fetch("https://query1.finance.yahoo.com/v1/test/getcrumb", {
    headers: { ...UA.headers, cookie },
  });
  auth = { cookie, crumb: (await cr.text()).trim() };
  return auth;
}

async function yahooJson(url: string) {
  let r = await fetch(url, UA);
  if (r.status === 401 || r.status === 403) {
    auth = null;
    const a = await yahooAuth();
    const sep = url.includes("?") ? "&" : "?";
    r = await fetch(`${url}${sep}crumb=${encodeURIComponent(a.crumb)}`, {
      headers: { ...UA.headers, cookie: a.cookie },
    });
  }
  if (!r.ok) throw new Error(`Yahoo ${r.status}: ${url}`);
  return await r.json();
}

async function chart(sym: string, range: string) {
  const j = await yahooJson(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=${range}&interval=1d`);
  const res = j.chart.result[0];
  const q = res.indicators.quote[0];
  return {
    meta: res.meta,
    closes: (q.close as (number | null)[]).filter((x): x is number => x != null),
    volumes: ((q.volume ?? []) as (number | null)[]).filter((x): x is number => x != null),
  };
}

async function quote(sym: string): Promise<{ last: number; prev: number }> {
  const c = await chart(sym, "5d");
  return { last: c.meta.regularMarketPrice ?? c.closes[c.closes.length - 1], prev: c.closes[c.closes.length - 2] };
}

// ── GEX v5 ───────────────────────────────────────────────────────────────────
const cache = new Map<string, { em: number; body: unknown }>();

async function gex(preset: string, dias: number, niveis: number, refManual: number | null) {
  const cfg = PRESETS[preset];
  if (!cfg) throw new Error("preset inválido");

  const chave = `${preset}|${dias}|${niveis}|${refManual ?? ""}`;
  const hit = cache.get(chave);
  if (hit && Date.now() - hit.em < CACHE_MS) return hit.body;

  const r = await fetch(CBOE(cfg.und), { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!r.ok) throw new Error(`Falha ao buscar a cadeia da Cboe para ${cfg.und}: HTTP ${r.status}`);
  const j = await r.json();
  const spot = Number(j.data.current_price);
  const contratos = j.data.options as CboeContrato[];
  const snapshot = String(j.timestamp ?? "");

  // referência: fechamento mais recente (= history(period="5d").Close[-1] do yfinance)
  let ref = refManual;
  if (ref == null) {
    try {
      const c = await chart(cfg.ref, "5d");
      ref = c.closes.length ? c.closes[c.closes.length - 1] : null;
    } catch (_) { ref = null; }
  }
  // ADV20 do subjacente, para a força das paredes
  let adv20: number | null = null;
  try {
    const c = await chart(cfg.und, "2mo");
    const v = c.volumes.slice(-20);
    adv20 = c.volumes.length >= 5 ? v.reduce((s, x) => s + x, 0) / v.length : null;
  } catch (_) { adv20 = null; }

  const mapa = calcularGex({ preset, spot, contratos, snapshot, ref, adv20, dias, niveis });
  const body = {
    ...mapa,
    geradoEm: new Date().toISOString(),
    aviso: "OI da Cboe (D-1) · convenção naive · proxy (EWZ/GLD/QQQ)",
  };
  cache.set(chave, { em: Date.now(), body });
  return body;
}

// ── Radar 6L (inalterado) ───────────────────────────────────────────────────
async function radar(gatilho = 0.35) {
  const out: Record<string, number | null> = {};
  await Promise.all(RADAR.map(async (s) => {
    try { const q = await quote(s); out[s] = +(((q.last / q.prev) - 1) * 100).toFixed(2); }
    catch (_) { out[s] = null; }
  }));

  const l6 = out["6L=F"], ewz = out["EWZ"];
  let status = "moderado";
  if (l6 != null && ewz != null) {
    const juntos = l6 * ewz > 0, fortes = Math.abs(l6) >= gatilho && Math.abs(ewz) >= gatilho;
    if (juntos && fortes) status = l6 > 0 ? "leilao_alta" : "leilao_baixa";
    else if (fortes) status = "divergencia";
    else if (Math.abs(l6) < 0.15 && Math.abs(ewz) < 0.15) status = "morno";
  }
  return { variacoes: out, status, gatilho, geradoEm: new Date().toISOString() };
}

Deno.serve(async (req) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info",
  };
  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const u = new URL(req.url);
    const fn = u.searchParams.get("fn") ?? "gex";
    if (fn === "radar") return json(await radar(Number(u.searchParams.get("gatilho") ?? 0.35)));
    const refParam = u.searchParams.get("ref");
    return json(await gex(
      u.searchParams.get("preset") ?? "win",
      Number(u.searchParams.get("dias") ?? 30),
      Number(u.searchParams.get("niveis") ?? 6),
      refParam ? Number(refParam) : null,
    ));
  } catch (e) {
    if (e instanceof GexAbortado)
      return json({ erro: e.message, codigo: e.codigo, ...e.extra, geradoEm: new Date().toISOString() }, 422);
    return json({ erro: String(e) }, 500);
  }
});
