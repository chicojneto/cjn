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

const GREEN = '#3ddc9a';
const RED = '#ff6b74';
const ACCENT = '#0e7c5b';

const num = (v: number | null | undefined, dec = 0) =>
  v == null || !isFinite(v) ? '—' : v.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });

function LevelCard({ titulo, nivel, refNome, cor }: { titulo: string; nivel: Nivel | null; refNome: string; cor: string }) {
  return (
    <div className="border px-4 py-3" style={{ background: '#141b2b', borderColor: '#1f2937' }}>
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
    return <div className="py-10 text-center text-[11px] tracking-widest text-muted-foreground">CARREGANDO MAPA GEX…</div>;
  }
  if (erro) {
    return (
      <div className="flex items-center justify-between border border-destructive/60 bg-destructive/30 px-4 py-3 text-xs text-destructive">
        {erro}
        <button onClick={load} className="flex items-center gap-1 tracking-widest">
          <RefreshCw className="h-3 w-3" /> TENTAR
        </button>
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border px-4 py-3" style={{ background: '#141b2b', borderColor: '#1f2937' }}>
        <div>
          <div className="text-[10px] tracking-widest text-muted-foreground">
            GEX LÍQUIDO · {data.und} · SPOT {num(data.spot, 2)}
          </div>
          <div className="text-2xl font-bold tabular-nums" style={{ color: positivo ? GREEN : RED }}>
            ${num(data.gexLiquidoM, 1)} M/1%
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="border px-3 py-1.5 text-xs font-bold tracking-[0.18em]"
            style={{
              color: positivo ? GREEN : RED,
              borderColor: positivo ? ACCENT : '#be2d37',
              background: positivo ? 'rgba(14,124,91,0.18)' : 'rgba(190,45,55,0.18)',
            }}
          >
            {positivo ? 'COMPRESSÃO' : 'EXPANSÃO'}
          </span>
          <button
            onClick={load}
            disabled={loading}
            className="border px-2.5 py-2 text-muted-foreground disabled:opacity-50"
            style={{ borderColor: '#1f2937' }}
            aria-label="Atualizar"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <LevelCard titulo="GAMMA FLIP" nivel={data.flip} refNome={data.refNome} cor="#e2e8f0" />
        <LevelCard titulo="CALL WALL" nivel={data.callWall} refNome={data.refNome} cor={GREEN} />
        <LevelCard titulo="PUT WALL" nivel={data.putWall} refNome={data.refNome} cor={RED} />
      </div>

      <div className="overflow-x-auto border" style={{ background: '#141b2b', borderColor: '#1f2937' }}>
        <table className="w-full text-xs tabular-nums">
          <thead>
            <tr className="text-[10px] tracking-widest text-muted-foreground">
              <th className="px-3 py-2 text-left">STRIKE</th>
              <th className="px-3 py-2 text-right">~{data.refNome}</th>
              <th className="px-3 py-2 text-right">OI CALL</th>
              <th className="px-3 py-2 text-right">OI PUT</th>
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
                    borderColor: '#1f2937',
                    background: isCall ? 'rgba(14,124,91,0.14)' : isPut ? 'rgba(190,45,55,0.14)' : undefined,
                  }}
                >
                  <td className="px-3 py-2 text-left text-muted-foreground">
                    {num(l.strike, 2)}
                    {isCall && <span className="ml-2 text-[9px] tracking-widest" style={{ color: GREEN }}>CALL WALL</span>}
                    {isPut && <span className="ml-2 text-[9px] tracking-widest" style={{ color: RED }}>PUT WALL</span>}
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
        <div className="border px-4 py-4" style={{ background: '#141b2b', borderColor: ACCENT }}>
          <div className="text-[10px] tracking-widest" style={{ color: GREEN }}>CONVERSÃO PARA O WIN</div>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <label className="text-[10px] tracking-widest text-muted-foreground">
              FECHAMENTO DO WIN D-1
              <input
                type="number"
                value={winClose}
                onChange={(e) => setWinClose(e.target.value)}
                placeholder="140000"
                className="mt-1 block w-44 border bg-[#0f1420] px-3 py-2 font-mono text-sm text-muted-foreground outline-none"
                style={{ borderColor: '#1f2937' }}
              />
            </label>
            {offset != null && (
              <div className="text-[10px] tracking-widest text-muted-foreground">
                OFFSET <span className="text-sm font-bold text-muted-foreground">{offset > 0 ? '+' : ''}{num(offset)}</span>
              </div>
            )}
          </div>

          {offset != null && (
            <>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {[
                  { t: 'PUT WALL WIN', v: conv(data.putWall), c: RED },
                  { t: 'FLIP WIN', v: conv(data.flip), c: '#e2e8f0' },
                  { t: 'CALL WALL WIN', v: conv(data.callWall), c: GREEN },
                ].map((x) => (
                  <div key={x.t} className="border px-3 py-2" style={{ borderColor: '#1f2937' }}>
                    <div className="text-[10px] tracking-widest text-muted-foreground">{x.t}</div>
                    <div className="text-xl font-bold tabular-nums" style={{ color: x.c }}>{x.v != null ? num(x.v) : '—'}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <code className="flex-1 overflow-x-auto whitespace-nowrap border bg-[#0f1420] px-3 py-2 text-xs text-muted-foreground" style={{ borderColor: '#1f2937' }}>
                  {linha}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(linha);
                    toast.success('Linha copiada');
                  }}
                  className="flex items-center gap-2 border px-3 py-2 text-[11px] tracking-widest"
                  style={{ borderColor: ACCENT, color: GREEN, background: 'rgba(14,124,91,0.12)' }}
                >
                  <Copy className="h-3.5 w-3.5" /> COPIAR
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <div className="text-[10px] tracking-widest text-muted-foreground">
        {data.aviso} · GERADO EM {new Date(data.geradoEm).toLocaleString('pt-BR')}
      </div>
    </div>
  );
}
