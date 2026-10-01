import { useEffect, useState } from 'react';
import { Copy, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useGex, type GexData, type GexNivel, type GexPreset, type GexVeredito } from '@/hooks/useGexApi';

const GREEN = 'var(--up-hex)';
const RED = 'var(--down-hex)';
const ACCENT = 'var(--brand-hex)';
const BOX = { background: 'var(--surface)', borderColor: 'var(--hairline)' };

const num = (v: number | null | undefined, dec = 0) =>
  v == null || !isFinite(v) ? '—' : v.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
const sinal = (v: number, dec = 1) => `${v > 0 ? '+' : ''}${num(v, dec)}`;

const VEREDITO: Record<GexVeredito, { txt: string; fg: string; bg: string }> = {
  SEGURO: { txt: 'Mapa seguro', fg: GREEN, bg: 'var(--up-soft)' },
  QUESTIONAVEL: { txt: 'Mapa questionável', fg: ACCENT, bg: 'var(--brand-soft)' },
  INSEGURO: { txt: 'Mapa inseguro', fg: RED, bg: 'var(--down-soft)' },
};

function Rotulo({ children }: { children: React.ReactNode }) {
  return <div className="text-[10px] tracking-widest text-muted-foreground">{children}</div>;
}

function LevelCard({ titulo, nivel, refNome, cor, nota }: {
  titulo: string; nivel: GexNivel | null; refNome: string; cor: string; nota?: string;
}) {
  return (
    <div className="border px-4 py-3" style={BOX}>
      <Rotulo>{titulo}</Rotulo>
      <div className="mt-1 text-2xl font-bold tabular-nums" style={{ color: cor }}>
        {nivel?.ref != null ? num(nivel.ref) : nivel ? num(nivel.strike, 2) : '—'}
      </div>
      <Rotulo>{nivel?.ref != null ? `${refNome} · strike ${num(nivel.strike, 2)}` : refNome}</Rotulo>
      {nota && <div className="mt-1 text-[11px]" style={{ color: ACCENT }}>{nota}</div>}
    </div>
  );
}

function Saude({ data }: { data: GexData }) {
  const s = data.saude;
  const v = VEREDITO[s.veredito];
  const [aberto, setAberto] = useState(false);
  return (
    <div className="border px-4 py-3" style={{ ...BOX, borderColor: v.fg }}>
      <button onClick={() => setAberto((x) => !x)} className="flex w-full flex-wrap items-center justify-between gap-2 text-left">
        <span className="px-2.5 py-1 text-xs font-bold" style={{ color: v.fg, background: v.bg }}>
          {v.txt} · {s.passados}/{s.total}
        </span>
        <span className="text-[10px] tracking-widest text-muted-foreground">
          OI ±10% {num(s.coberturaPerto * 100)}% · IV mediana {num(s.ivMediana * 100, 1)}% · {aberto ? 'ocultar' : 'detalhes'}
        </span>
      </button>
      {s.alertas.length > 0 && (
        <ul className="mt-2 space-y-1 text-[12px]" style={{ color: ACCENT }}>
          {s.alertas.map((a) => <li key={a}>⚠ {a}</li>)}
        </ul>
      )}
      {aberto && (
        <div className="mt-3 space-y-1 text-[12px] text-muted-foreground">
          {s.checks.map((c) => (
            <div key={c.label} style={{ color: c.ok ? undefined : RED }}>{c.ok ? '✓' : '✗'} {c.label}</div>
          ))}
          <div className="pt-1">
            Cobertura da cadeia {num(s.cobertura * 100)}% · {num(s.contratos)} contratos · OI {num(s.oiTotal)} ·
            gamma Cboe {num(s.gamma.cboe)} / Black-Scholes {num(s.gamma.bs)} / sem gamma {num(s.gamma.semGamma)}
          </div>
        </div>
      )}
    </div>
  );
}

function CopiarLinha({ titulo, linha, nota }: { titulo: string; linha: string; nota?: string }) {
  return (
    <div className="border px-4 py-3" style={BOX}>
      <Rotulo>{titulo}</Rotulo>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <code className="flex-1 overflow-x-auto whitespace-nowrap border bg-[var(--bg)] px-3 py-2 text-xs text-muted-foreground" style={{ borderColor: 'var(--hairline)' }}>
          {linha}
        </code>
        <button
          onClick={() => { navigator.clipboard.writeText(linha); toast.success('Linha copiada'); }}
          className="flex items-center gap-2 border px-3 py-2 text-[11px] tracking-widest"
          style={{ borderColor: ACCENT, color: GREEN, background: 'var(--brand-soft)' }}
        >
          <Copy className="h-3.5 w-3.5" /> Copiar
        </button>
      </div>
      {nota && <div className="mt-2 text-[11px] text-muted-foreground">{nota}</div>}
    </div>
  );
}

export function GexPanel({ preset }: { preset: GexPreset }) {
  const { data, isLoading, isFetching, error, refetch } = useGex(preset);
  const [winClose, setWinClose] = useState<string>(() => localStorage.getItem('premarket:winD1') ?? '');

  useEffect(() => {
    localStorage.setItem('premarket:winD1', winClose);
  }, [winClose]);

  if (isLoading && !data) {
    return <div className="py-10 text-center text-[11px] tracking-widest text-muted-foreground">Carregando mapa GEX…</div>;
  }
  if (error || !data) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 border border-destructive/60 bg-destructive/30 px-4 py-3 text-xs text-destructive">
        <span>{error instanceof Error && error.message ? error.message : 'Não foi possível carregar o mapa GEX agora.'}</span>
        <button onClick={() => refetch()} className="flex items-center gap-1 tracking-widest">
          <RefreshCw className="h-3 w-3" /> Tentar de novo
        </button>
      </div>
    );
  }

  const positivo = data.regime === 'positivo';
  const winNum = parseFloat(winClose.replace(',', '.'));
  const offset = data.refSpot != null && isFinite(winNum) ? winNum - data.refSpot : null;
  const conv = (n: GexNivel | null | undefined) => (n?.ref != null && offset != null ? Math.round(n.ref + offset) : null);
  const linhaWin = offset != null
    ? [data.spot.toFixed(2), data.refSpot?.toFixed(0), Math.round(winNum), conv(data.putWall), conv(data.flip) ?? '', conv(data.callWall)].join(';')
    : '';

  const notaFlip = data.flip?.distante
    ? 'Veio da busca ampliada (±45%): o flip existe, só está longe'
    : data.flipFragil ? `Frágil: muda ${num(data.dispersaoPct, 1)}% entre janelas` : undefined;
  const conf = (w: GexData['callWall']) => (w.confluenciaOI ? 'Confluência com o OI' : undefined);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border px-4 py-3" style={BOX}>
        <div>
          <Rotulo>GEX líquido · {data.und} · spot {num(data.spot, 2)} · janela {data.dias}d</Rotulo>
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
            onClick={() => refetch()}
            disabled={isFetching}
            className="border px-2.5 py-2 text-muted-foreground disabled:opacity-50"
            style={{ borderColor: 'var(--hairline)' }}
            aria-label="Atualizar"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <Saude data={data} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <LevelCard titulo="Gamma flip" nivel={data.flip} refNome={data.refNome} cor="var(--text)" nota={notaFlip} />
        <LevelCard titulo="Call wall (GEX)" nivel={data.callWall} refNome={data.refNome} cor={GREEN} nota={conf(data.callWall)} />
        <LevelCard titulo="Put wall (GEX)" nivel={data.putWall} refNome={data.refNome} cor={RED} nota={conf(data.putWall)} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <LevelCard titulo="Call wall (OI)" nivel={data.callWallOI} refNome={data.refNome} cor="var(--text-3)" />
        <LevelCard titulo="Put wall (OI)" nivel={data.putWallOI} refNome={data.refNome} cor="var(--text-3)" />
        <LevelCard titulo="Max gamma" nivel={data.maxGamma} refNome={data.refNome} cor={ACCENT} />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="overflow-x-auto border" style={BOX}>
          <div className="px-3 pt-3"><Rotulo>Gamma levels (top {data.niveis.length} por |GEX|)</Rotulo></div>
          <table className="w-full text-xs tabular-nums">
            <tbody>
              {data.niveis.map((l) => (
                <tr key={l.n} className="border-t" style={{ borderColor: 'var(--hairline)' }}>
                  <td className="px-3 py-2 font-bold" style={{ color: l.lado === 'C' ? GREEN : RED }}>G{l.n}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{num(l.strike, 2)}</td>
                  <td className="px-3 py-2 text-right">{l.ref != null ? num(l.ref) : '—'}</td>
                  <td className="px-3 py-2 text-right" style={{ color: l.gexM >= 0 ? GREEN : RED }}>{sinal(l.gexM)}M</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{sinal(l.distPct)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="overflow-x-auto border" style={BOX}>
          <div className="px-3 pt-3">
            <Rotulo>
              Flip por janela de vencimento · dispersão {data.dispersaoPct != null ? `${num(data.dispersaoPct, 1)}%` : '—'}
              {data.flipFragil ? ' · frágil' : ' · robusto'}
            </Rotulo>
          </div>
          <table className="w-full text-xs tabular-nums">
            <tbody>
              {data.sensibilidade.map((s) => (
                <tr key={s.dias} className="border-t" style={{ borderColor: 'var(--hairline)', background: s.emUso ? 'var(--brand-soft)' : undefined }}>
                  <td className="px-3 py-2 text-muted-foreground">{s.dias}d{s.emUso ? ' · em uso' : ''}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{s.flip != null ? num(s.flip, 2) : '—'}</td>
                  <td className="px-3 py-2 text-right">{s.ref != null ? num(s.ref) : '—'}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{num(s.contratos)} ctr</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="overflow-x-auto border" style={BOX}>
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
                  style={{ borderColor: 'var(--hairline)', background: isCall ? 'var(--up-soft)' : isPut ? 'var(--down-soft)' : undefined }}
                >
                  <td className="px-3 py-2 text-left text-muted-foreground">
                    {num(l.strike, 2)}
                    {isCall && <span className="ml-2 text-[9px] tracking-widest" style={{ color: GREEN }}>call wall</span>}
                    {isPut && <span className="ml-2 text-[9px] tracking-widest" style={{ color: RED }}>put wall</span>}
                  </td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{l.ref != null ? num(l.ref) : '—'}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{num(l.oiCall)}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{num(l.oiPut)}</td>
                  <td className="px-3 py-2 text-right font-bold" style={{ color: l.gexM >= 0 ? GREEN : RED }}>{sinal(l.gexM)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <CopiarLinha
        titulo="Linha PINE · indicador CN - GEX Zones v7"
        linha={data.linhaPine}
        nota="Cole no campo “Linha PINE do gex_map v5”. É a mesma linha que o script imprime."
      />

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
              <div className="mt-3">
                <CopiarLinha titulo="Linha WIN (formato antigo)" linha={linhaWin} />
              </div>
            </>
          )}
        </div>
      )}

      <div className="text-[10px] tracking-widest text-muted-foreground">
        {data.aviso} · snapshot Cboe {data.snapshot} UTC · gerado em{' '}
        {new Date(data.geradoEm).toLocaleString('pt-BR', { timeZone: 'America/New_York' })} NY
      </div>
    </div>
  );
}
