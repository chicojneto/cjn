import { useCallback, useEffect, useState } from 'react';
import { Copy, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gex-api`;

type Nivel = { strike: number; ref: number | null };
type GexData = {
  preset: string;
  und: string;
  refNome: string;
  spot: number;
  refSpot: number | null;
  gexLiquidoM: number;
  regime: 'positivo' | 'negativo';
  callWall: Nivel;
  putWall: Nivel;
  flip: Nivel | null;
  tabela: { strike: number; ref: number | null; oiCall: number; oiPut: number; gexM: number }[];
  geradoEm: string;
  aviso: string;
};

const GREEN = 'var(--up-hex)';
const RED = 'var(--down-hex)';
const ACCENT = 'var(--brand-hex)';

const num = (v: number | null | undefined, dec = 0) =>
  v == null || !isFinite(v) ? '—' : v.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });

function LevelCard({ titulo, nivel, refNome, cor }: { titulo: string; nivel: Nivel | null; refNome: string; cor: string }) {
  return (
    <div className="border px-4 py-3" style={{ background: 'var(--surface)', borderColor: 'var(--hairline)' }}>
      <div className="text-[10px] tracking-widest text-muted-foreground">{titulo}</div>
      <div className="mt-1 text-2xl font-bold tabular-nums" style={{ color: cor }}>
        {nivel?.ref != null ? num(nivel.ref) : nivel ? num(nivel.strike, 2) : '—'}
      </div>
      <div className="text-[10px] tracking-widest text-muted-foreground">
        {nivel?.ref != null ? `${refNome} · strike ${num(nivel.strike, 2)}` : refNome}
      </div>
    </div>
  );
}

export function GexPanel({ preset }: { preset: 'win' | 'gold' | 'nasdaq' }) {
  const [data, setData] = useState<GexData | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [winClose, setWinClose] = useState<string>(() => localStorage.getItem('premarket:winD1') ?? '');

  const load = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const r = await fetch(`${FN_URL}?fn=gex&preset=${preset}&dias=75`);
      const j = await r.json();
      if (j.erro) throw new Error(j.erro);
      setData(j);
    } catch {
      setErro('Não foi possível carregar o mapa GEX agora.');
    } finally {
      setLoading(false);
    }
  }, [preset]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    localStorage.setItem('premarket:winD1', winClose);
  }, [winClose]);

  const positivo = data?.regime === 'positivo';
  const winNum = parseFloat(winClose.replace(',', '.'));
  const offset = data?.refSpot != null && isFinite(winNum) ? winNum - data.refSpot : null;
  const conv = (n: Nivel | null | undefined) =>
    n?.ref != null && offset != null ? Math.round(n.ref + offset) : null;

  const linha =
    data && offset != null
      ? [
          data.spot.toFixed(2),
          data.refSpot?.toFixed(0),
          Math.round(winNum),
          conv(data.putWall),
          conv(data.flip) ?? '',
          conv(data.callWall),
        ].join(';')
      : '';

  if (loading && !data) {
    return <div className="py-10 text-center text-[11px] tracking-widest text-muted-foreground">Carregando mapa GEX…</div>;
  }
  if (erro) {
    return (
      <div className="flex items-center justify-between border border-destructive/60 bg-destructive/30 px-4 py-3 text-xs text-destructive">
        {erro}
        <button onClick={load} className="flex items-center gap-1 tracking-widest">
          <RefreshCw className="h-3 w-3" /> Tentar de novo
        </button>
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border px-4 py-3" style={{ background: 'var(--surface)', borderColor: 'var(--hairline)' }}>
        <div>
          <div className="text-[10px] tracking-widest text-muted-foreground">
            GEX líquido · {data.und} · spot {num(data.spot, 2)}
          </div>
          <div className="text-2xl font-bold tabular-nums" style={{ color: positivo ? GREEN : RED }}>
            ${num(data.gexLiquidoM, 1)} M/1%
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="border px-3 py-1.5 text-xs font-bold tracking-normal"
            style={{
              color: positivo ? GREEN : RED,
              borderColor: positivo ? ACCENT : 'var(--down-hex)',
              background: positivo ? 'var(--brand-soft)' : 'var(--down-soft)',
            }}
          >
            {positivo ? 'Compressão' : 'Expansão'}
          </span>
          <button
            onClick={load}
            disabled={loading}
            className="border px-2.5 py-2 text-muted-foreground disabled:opacity-50"
            style={{ borderColor: 'var(--hairline)' }}
            aria-label="Atualizar"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <LevelCard titulo="Gamma flip" nivel={data.flip} refNome={data.refNome} cor="var(--text)" />
        <LevelCard titulo="Call wall" nivel={data.callWall} refNome={data.refNome} cor={GREEN} />
        <LevelCard titulo="Put wall" nivel={data.putWall} refNome={data.refNome} cor={RED} />
      </div>

      <div className="overflow-x-auto border" style={{ background: 'var(--surface)', borderColor: 'var(--hairline)' }}>
        <table className="w-full text-xs tabular-nums">
          <thead>
            <tr className="text-[10px] tracking-widest text-muted-foreground">
              <th className="px-3 py-2 text-left">Strike</th>
              <th className="px-3 py-2 text-right">~{data.refNome}</th>
              <th className="px-3 py-2 text-right">OI call</th>
              <th className="px-3 py-2 text-right">OI put</th>
              <th className="px-3 py-2 text-right">GEX $M/1%</th>
            </tr>
          </thead>
          <tbody>
            {data.tabela.map((l) => {
              const isCall = l.strike === data.callWall.strike;
              const isPut = l.strike === data.putWall.strike;
              return (
                <tr
                  key={l.strike}
                  className="border-t"
                  style={{
                    borderColor: 'var(--hairline)',
                    background: isCall ? 'var(--up-soft)' : isPut ? 'var(--down-soft)' : undefined,
                  }}
                >
                  <td className="px-3 py-2 text-left text-muted-foreground">
                    {num(l.strike, 2)}
                    {isCall && <span className="ml-2 text-[9px] tracking-widest" style={{ color: GREEN }}>call wall</span>}
                    {isPut && <span className="ml-2 text-[9px] tracking-widest" style={{ color: RED }}>put wall</span>}
                  </td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{l.ref != null ? num(l.ref) : '—'}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{num(l.oiCall)}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{num(l.oiPut)}</td>
                  <td className="px-3 py-2 text-right font-bold" style={{ color: l.gexM >= 0 ? GREEN : RED }}>
                    {l.gexM > 0 ? '+' : ''}
                    {num(l.gexM, 1)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {preset === 'win' && (
        <div className="border px-4 py-4" style={{ background: 'var(--surface)', borderColor: ACCENT }}>
          <div className="text-[10px] tracking-widest" style={{ color: GREEN }}>Conversão para o WIN</div>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <label className="text-[10px] tracking-widest text-muted-foreground">
              Fechamento do WIN D-1
              <input
                type="number"
                value={winClose}
                onChange={(e) => setWinClose(e.target.value)}
                placeholder="140000"
                className="mt-1 block w-44 border bg-[var(--bg)] px-3 py-2 font-mono text-sm text-muted-foreground outline-none"
                style={{ borderColor: 'var(--hairline)' }}
              />
            </label>
            {offset != null && (
              <div className="text-[10px] tracking-widest text-muted-foreground">
                Offset <span className="text-sm font-bold text-muted-foreground">{offset > 0 ? '+' : ''}{num(offset)}</span>
              </div>
            )}
          </div>

          {offset != null && (
            <>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {[
                  { t: 'Put wall WIN', v: conv(data.putWall), c: RED },
                  { t: 'Flip WIN', v: conv(data.flip), c: 'var(--text)' },
                  { t: 'Call wall WIN', v: conv(data.callWall), c: GREEN },
                ].map((x) => (
                  <div key={x.t} className="border px-3 py-2" style={{ borderColor: 'var(--hairline)' }}>
                    <div className="text-[10px] tracking-widest text-muted-foreground">{x.t}</div>
                    <div className="text-xl font-bold tabular-nums" style={{ color: x.c }}>{x.v != null ? num(x.v) : '—'}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <code className="flex-1 overflow-x-auto whitespace-nowrap border bg-[var(--bg)] px-3 py-2 text-xs text-muted-foreground" style={{ borderColor: 'var(--hairline)' }}>
                  {linha}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(linha);
                    toast.success('Linha copiada');
                  }}
                  className="flex items-center gap-2 border px-3 py-2 text-[11px] tracking-widest"
                  style={{ borderColor: ACCENT, color: GREEN, background: 'var(--brand-soft)' }}
                >
                  <Copy className="h-3.5 w-3.5" /> Copiar
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <div className="text-[10px] tracking-widest text-muted-foreground">
        {data.aviso}  · gerado em {new Date(data.geradoEm).toLocaleString('pt-BR')}
      </div>
    </div>
  );
}
