import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, RefreshCw } from 'lucide-react';
import { useMarketCorrelations } from '@/hooks/useMarketCorrelations';
import { useRegimeDoDia } from '@/hooks/useRegimeDoDia';
import { useGex, useRadar, type GexNivel, type GexPreset } from '@/hooks/useGexApi';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

const ASSETS: { id: GexPreset; label: string }[] = [
  { id: 'win', label: 'WIN' },
  { id: 'gold', label: 'XAU' },
  { id: 'nasdaq', label: 'NAS' },
];

const RADAR_ROWS: { sym: string; label: string }[] = [
  { sym: '6L=F', label: '6L' },
  { sym: 'EWZ', label: 'EWZ' },
  { sym: 'ES=F', label: 'ES' },
  { sym: 'NQ=F', label: 'NQ' },
  { sym: 'DX-Y.NYB', label: 'DXY' },
  { sym: 'GC=F', label: 'Ouro' },
];

const STATUS_MAP: Record<string, { text: string; bg: string; fg: string }> = {
  leilao_alta: { text: 'Leilão de alta — entrada só a favor', bg: 'var(--up-soft)', fg: 'var(--up-hex)' },
  leilao_baixa: { text: 'Leilão de baixa — entrada só a favor', bg: 'var(--down-soft)', fg: 'var(--down-hex)' },
  divergencia: { text: 'Divergência 6L × EWZ — esperar a abertura', bg: 'rgba(217,164,65,0.14)', fg: 'var(--warn-hex)' },
  morno: { text: 'Noite morna — dia neutro', bg: 'var(--surface-2)', fg: 'var(--text-2)' },
  moderado: { text: 'Moderado — hierarquia normal', bg: 'var(--surface-2)', fg: 'var(--text-2)' },
};

const num = (v: number | null | undefined, dec = 0) =>
  v == null || !isFinite(v) ? '—' : v.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });

const pct = (v: number | null | undefined) =>
  typeof v === 'number' && isFinite(v) ? `${v > 0 ? '+' : ''}${v.toFixed(2)}%` : '—';

const varColor = (v: number | null | undefined) =>
  typeof v !== 'number' || !isFinite(v) ? 'text-muted-foreground' : v > 0 ? 'text-success' : v < 0 ? 'text-destructive' : 'text-muted-foreground';

const hora = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York' }) + ' NY' : '—';

function ErrorLine({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
      <span>Dados indisponíveis — tente atualizar</span>
      <button onClick={onRetry} className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[13px] transition-colors hover:bg-secondary/40">
        <RefreshCw className="h-3.5 w-3.5" /> Atualizar
      </button>
    </div>
  );
}

function Rows({ n }: { n: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: n }).map((_, i) => (
        <Skeleton key={i} className="h-6" />
      ))}
    </div>
  );
}

function RegimeCard({ preset }: { preset: GexPreset }) {
  const { regime, isLoading } = useRegimeDoDia();
  const { data: gex } = useGex(preset);
  const { dataUpdatedAt } = useMarketCorrelations();

  const label =
    regime.viesWIN === 'alta' ? 'Viés de alta' : regime.viesWIN === 'baixa' ? 'Viés de baixa' : 'Neutro';
  const cor =
    regime.viesWIN === 'alta' ? 'text-success' : regime.viesWIN === 'baixa' ? 'text-destructive' : 'text-foreground';

  const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

  return (
    <Card className="space-y-3 p-4">
      <div className="text-[13px] text-muted-foreground">
        Regime do dia · {hoje} · {dataUpdatedAt ? hora(new Date(dataUpdatedAt).toISOString()) : '—'}
      </div>

      {isLoading ? (
        <Skeleton className="h-8 w-48" />
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <div className={cn('text-[22px] leading-tight', cor)}>{label}</div>
          {gex && (
            <span
              className="rounded-lg px-2.5 py-1 font-mono text-[13px]"
              style={{
                background: gex.regime === 'positivo' ? 'var(--up-soft)' : 'var(--down-soft)',
                color: gex.regime === 'positivo' ? 'var(--up-hex)' : 'var(--down-hex)',
              }}
            >
              {gex.regime === 'positivo' ? 'GEX positivo' : 'GEX negativo'}
            </span>
          )}
        </div>
      )}

      {regime.motivos.length > 0 && (
        <p className="text-[14px] text-muted-foreground">{regime.motivos.join(' · ')}</p>
      )}
    </Card>
  );
}

function RadarCard() {
  const { data, isLoading, isError, refetch } = useRadar();
  const status = data ? STATUS_MAP[data.status] ?? STATUS_MAP.moderado : null;

  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-baseline justify-between">
        <div className="text-[13px] text-muted-foreground">Radar 6L</div>
        <div className="font-mono text-[13px] text-muted-foreground">{hora(data?.geradoEm)}</div>
      </div>

      {isLoading ? (
        <Rows n={6} />
      ) : isError || !data ? (
        <ErrorLine onRetry={() => refetch()} />
      ) : (
        <>
          <div className="space-y-1.5">
            {RADAR_ROWS.map((r) => {
              const v = data.variacoes?.[r.sym];
              return (
                <div key={r.sym} className="flex items-center justify-between font-mono text-[14px] tabular-nums">
                  <span className="text-muted-foreground">{r.label}</span>
                  <span className={varColor(v)}>{pct(v)}</span>
                </div>
              );
            })}
          </div>
          {status && (
            <div className="rounded-xl px-3 py-2.5 text-[13px]" style={{ background: status.bg, color: status.fg }}>
              {status.text}
            </div>
          )}
        </>
      )}
    </Card>
  );
}

function GexLine({ titulo, nivel, offset, cor }: { titulo: string; nivel: GexNivel | null; offset: number | null; cor: string }) {
  const base = nivel?.ref ?? null;
  const valor = base != null ? Math.round(base + (offset ?? 0)) : null;
  return (
    <div className="flex items-baseline justify-between font-mono text-[14px] tabular-nums">
      <span className="text-muted-foreground">{titulo}</span>
      <span className="flex items-baseline gap-2">
        <span className="text-[20px]" style={{ color: cor }}>{valor != null ? num(valor) : nivel ? num(nivel.strike, 2) : '—'}</span>
        {nivel && <span className="text-[13px] text-muted-foreground">{num(nivel.strike, 2)}</span>}
      </span>
    </div>
  );
}

function GexCard({ preset }: { preset: GexPreset }) {
  const { data, isLoading, isError, refetch } = useGex(preset);
  const [aberta, setAberta] = useState(false);
  const winD1 = typeof window !== 'undefined' ? localStorage.getItem('premarket:winD1') : null;

  const offset = useMemo(() => {
    if (preset !== 'win' || !data?.refSpot || !winD1) return null;
    const n = parseFloat(winD1.replace(',', '.'));
    return isFinite(n) ? n - data.refSpot : null;
  }, [preset, data?.refSpot, winD1]);

  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-baseline justify-between">
        <div className="text-[13px] text-muted-foreground">Mapa GEX</div>
        <div className="font-mono text-[13px] text-muted-foreground">{hora(data?.geradoEm)}</div>
      </div>

      {isLoading ? (
        <Rows n={3} />
      ) : isError || !data ? (
        <ErrorLine onRetry={() => refetch()} />
      ) : (
        <>
          <div className="space-y-2">
            <GexLine titulo="Call wall" nivel={data.callWall} offset={offset} cor="var(--up-hex)" />
            <GexLine titulo="Gamma flip" nivel={data.flip} offset={offset} cor="var(--text)" />
            <GexLine titulo="Put wall" nivel={data.putWall} offset={offset} cor="var(--down-hex)" />
          </div>

          <div className="text-[13px] text-muted-foreground">
            OI de {new Date(data.geradoEm).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} · offset{' '}
            {offset != null ? `${offset > 0 ? '+' : ''}${num(offset)}` : '—'}
          </div>

          <button
            onClick={() => setAberta((v) => !v)}
            className="flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', aberta && 'rotate-180')} />
            {aberta ? 'Ocultar tabela' : 'Ver tabela completa'}
          </button>

          {aberta && (
            <div className="overflow-x-auto">
              <table className="w-full font-mono text-[13px] tabular-nums">
                <thead>
                  <tr className="text-muted-foreground">
                    <th className="py-1.5 text-left">Strike</th>
                    <th className="py-1.5 text-right">{data.refNome}</th>
                    <th className="py-1.5 text-right">OI call</th>
                    <th className="py-1.5 text-right">OI put</th>
                    <th className="py-1.5 text-right">GEX</th>
                  </tr>
                </thead>
                <tbody>
                  {data.tabela.map((l) => (
                    <tr key={l.strike} className="border-t border-border">
                      <td className="py-1.5 text-left text-muted-foreground">{num(l.strike, 2)}</td>
                      <td className="py-1.5 text-right text-muted-foreground">{l.ref != null ? num(l.ref) : '—'}</td>
                      <td className="py-1.5 text-right text-muted-foreground">{num(l.oiCall)}</td>
                      <td className="py-1.5 text-right text-muted-foreground">{num(l.oiPut)}</td>
                      <td className={cn('py-1.5 text-right', varColor(l.gexM))}>{num(l.gexM, 1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </Card>
  );
}

function MercadosAgora() {
  const { data, isLoading, isError, refetch, dataUpdatedAt } = useMarketCorrelations();

  const rows = [
    { label: 'IBOV', m: data?.ibovFutures },
    { label: 'S&P', m: data?.sp500Futures },
    { label: 'Nasdaq', m: data?.nasdaqFutures },
    { label: 'DXY', m: data?.dxy },
    { label: 'VIX', m: data?.vix },
    { label: 'US10Y', m: data?.us10y },
  ];

  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-baseline justify-between">
        <div className="text-[13px] text-muted-foreground">Mercados agora</div>
        <div className="font-mono text-[13px] text-muted-foreground">
          {dataUpdatedAt ? hora(new Date(dataUpdatedAt).toISOString()) : '—'}
        </div>
      </div>

      {isLoading ? (
        <Rows n={6} />
      ) : isError || !data ? (
        <ErrorLine onRetry={() => refetch()} />
      ) : (
        <>
          <div className="space-y-1.5">
            {rows.map((r) => (
              <div key={r.label} className="flex items-center justify-between font-mono text-[14px] tabular-nums">
                <span className="text-muted-foreground">{r.label}</span>
                <span className="flex items-baseline gap-3">
                  <span>{r.m ? num(r.m.price, 2) : '—'}</span>
                  <span className={cn('w-16 text-right', varColor(r.m?.changePercent))}>{pct(r.m?.changePercent)}</span>
                </span>
              </div>
            ))}
          </div>
          <Link to="/mercados" className="inline-block text-[13px] text-brand transition-colors hover:opacity-80">
            Ver todos
          </Link>
        </>
      )}
    </Card>
  );
}

export default function Manha() {
  const [preset, setPreset] = useState<GexPreset>(
    () => (localStorage.getItem('manha:ativo') as GexPreset) || 'win'
  );

  useEffect(() => {
    localStorage.setItem('manha:ativo', preset);
  }, [preset]);

  return (
    <div className="space-y-4">
      <RegimeCard preset={preset} />

      <div className="flex gap-2">
        {ASSETS.map((a) => (
          <button
            key={a.id}
            onClick={() => setPreset(a.id)}
            className={cn(
              'rounded-full border px-4 py-1.5 font-mono text-[13px] transition-colors',
              preset === a.id
                ? 'border-transparent bg-brand text-background'
                : 'border-border text-muted-foreground hover:bg-secondary/40'
            )}
          >
            {a.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <RadarCard />
        <GexCard preset={preset} />
      </div>

      <MercadosAgora />
    </div>
  );
}
