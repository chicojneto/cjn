// ============================================================================
// Supabase Edge Function: gex-api
// Endpoints:
//   GET /gex-api?fn=gex&preset=win|gold|nasdaq&dias=75
//   GET /gex-api?fn=radar
// ============================================================================

const R = 0.045;
const UA = { headers: { "User-Agent": "Mozilla/5.0 (Macintosh) AppleWebKit/537.36" } };

const PRESETS: Record<string, { und: string; ref: string; refNome: string }> = {
  win: { und: "EWZ", ref: "^BVSP", refNome: "IBOV" },
  gold: { und: "GLD", ref: "GC=F", refNome: "XAU/USD" },
  nasdaq: { und: "QQQ", ref: "NQ=F", refNome: "NQ/US100" },
};

const RADAR = ["6L=F", "EWZ", "ES=F", "NQ=F", "DX-Y.NYB", "GC=F"];

function bsGamma(spot: number, strike: number, t: number, iv: number): number {
  if (t <= 0 || !iv || iv <= 0) return 0;
  const d1 = (Math.log(spot / strike) + (R + 0.5 * iv * iv) * t) / (iv * Math.sqrt(t));
  return Math.exp(-0.5 * d1 * d1) / (Math.sqrt(2 * Math.PI) * spot * iv * Math.sqrt(t));
}

async function yahooJson(url: string) {
  const r = await fetch(url, UA);
  if (!r.ok) throw new Error(`Yahoo ${r.status}: ${url}`);
  return await r.json();
}

async function quote(sym: string): Promise<{ last: number; prev: number }> {
  const j = await yahooJson(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=5d&interval=1d`);
  const res = j.chart.result[0];
  const closes: number[] = res.indicators.quote[0].close.filter((x: number) => x != null);
  return { last: res.meta.regularMarketPrice ?? closes[closes.length - 1], prev: closes[closes.length - 2] };
}

async function gex(preset: string, dias: number) {
  const cfg = PRESETS[preset];
  if (!cfg) throw new Error("preset inválido");

  const base = `https://query2.finance.yahoo.com/v7/finance/options/${cfg.und}`;
  const first = await yahooJson(base);
  const root = first.optionChain.result[0];
  const spot: number = root.quote.regularMarketPrice;
  const now = Date.now() / 1000;
  const exps: number[] = root.expirationDates.filter(
    (e: number) => e > now && (e - now) / 86400 <= dias);

  const porStrike = new Map<number, { gex: number; oiC: number; oiP: number }>();
  let net = 0;

  for (const exp of exps) {
    const j = exp === root.expirationDates[0] && first.optionChain.result[0].options?.length
      ? first : await yahooJson(`${base}?date=${exp}`);
    const opt = j.optionChain.result[0].options[0];
    const t = Math.max((exp - now) / 86400, 0.5) / 365;

    for (const [tipo, lista] of [["call", opt.calls], ["put", opt.puts]] as const) {
      for (const o of lista ?? []) {
        const oi = o.openInterest ?? 0;
        if (oi <= 0) continue;
        const g = bsGamma(spot, o.strike, t, o.impliedVolatility);
        const dg = g * spot * spot * 0.01 * 100 * oi * (tipo === "call" ? 1 : -1);
        const cur = porStrike.get(o.strike) ?? { gex: 0, oiC: 0, oiP: 0 };
        cur.gex += dg;
        if (tipo === "call") cur.oiC += oi; else cur.oiP += oi;
        porStrike.set(o.strike, cur);
        net += dg;
      }
    }
  }

  const strikes = [...porStrike.entries()].sort((a, b) => a[0] - b[0]);

  let callWall = 0, cwMax = -Infinity, putWall = 0, pwMin = Infinity;
  for (const [k, v] of strikes) {
    if (v.oiC > 0 && v.gex > cwMax) { cwMax = v.gex; callWall = k; }
    if (v.oiP > 0 && v.gex < pwMin) { pwMin = v.gex; putWall = k; }
  }

  // flip: transição de sinal do GEX suavizado (janela 3) na banda ±12% do spot
  const band = strikes.filter(([k]) => k >= spot * 0.88 && k <= spot * 1.12);
  let flip: number | null = null;
  const smooth = band.map((_, i) =>
    band.slice(Math.max(0, i - 1), i + 2).reduce((s, [, v]) => s + v.gex, 0));
  const trans: number[] = [];
  for (let i = 1; i < band.length; i++)
    if (smooth[i - 1] < 0 && smooth[i] >= 0) trans.push(band[i][0]);
  if (trans.length) flip = trans.reduce((a, b) =>
    Math.abs(a - spot) < Math.abs(b - spot) ? a : b);

  let refSpot: number | null = null;
  try { refSpot = (await quote(cfg.ref)).last; } catch (_) { /* segue sem ref */ }
  const conv = (k: number) => refSpot ? Math.round((k / spot) * refSpot) : null;

  const tabela = strikes
    .filter(([, v]) => v.oiC + v.oiP >= 500)
    .sort((a, b) => Math.abs(b[1].gex) - Math.abs(a[1].gex))
    .slice(0, 12)
    .sort((a, b) => a[0] - b[0])
    .map(([k, v]) => ({
      strike: k, ref: conv(k), oiCall: v.oiC, oiPut: v.oiP,
      gexM: +(v.gex / 1e6).toFixed(1),
    }));

  return {
    preset, und: cfg.und, refNome: cfg.refNome, spot, refSpot,
    gexLiquidoM: +(net / 1e6).toFixed(1),
    regime: net > 0 ? "positivo" : "negativo",
    callWall: { strike: callWall, ref: conv(callWall) },
    putWall: { strike: putWall, ref: conv(putWall) },
    flip: flip ? { strike: flip, ref: conv(flip) } : null,
    tabela, geradoEm: new Date().toISOString(),
    aviso: "OI de D-1 · convenção naive · proxy (EWZ/GLD/QQQ)",
  };
}

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
    "Access-Control-Allow-Headers": "authorization, content-type",
  };
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const u = new URL(req.url);
    const fn = u.searchParams.get("fn") ?? "gex";
    const body = fn === "radar"
      ? await radar(Number(u.searchParams.get("gatilho") ?? 0.35))
      : await gex(u.searchParams.get("preset") ?? "win",
                  Number(u.searchParams.get("dias") ?? 75));
    return new Response(JSON.stringify(body),
      { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ erro: String(e) }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
