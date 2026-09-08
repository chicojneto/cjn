import { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { GexPanel } from '@/components/premarket/GexPanel';

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gex-api`;

type RadarData = {
  variacoes: Record<string, number | null>;
  status: string;
  gatilho: number;
  geradoEm: string;
};

const CARDS: { sym: string; label: string; destaque?: boolean }[] = [
  { sym: '6L=F', label: '6L (BRL fut.)', destaque: true },
  { sym: 'EWZ', label: 'EWZ', destaque: true },
  { sym: 'ES=F', label: 'ES (S&P)' },
  { sym: 'NQ=F', label: 'NQ (Nasdaq)' },
  { sym: 'DX-Y.NYB', label: 'DXY' },
  { sym: 'GC=F', label: 'Ouro' },
];

const STATUS_MAP: Record<string, { text: string; bg: string; border: string; fg: string }> = {
  leilao_alta: {
    text: 'PADRÃO DE LEILÃO (ALTA) — gap real, entrada só a favor',
    bg: 'var(--brand-soft)',
    border: 'var(--brand-hex)',
    fg: 'var(--up-hex)',
  },
  leilao_baixa: {
    text: 'PADRÃO DE LEILÃO (BAIXA) — gap real, entrada só a favor',
    bg: 'var(--down-soft)',
    border: 'var(--down-hex)',
    fg: 'var(--down-hex)',
  },
  divergencia: {
    text: 'DIVERGÊNCIA 6L×EWZ — esperar a abertura',
    bg: 'var(--brand-soft)',
    border: 'var(--warn-hex)',
    fg: 'var(--warn-hex)',
  },
  morno: {
    text: 'NOITE MORNA — dia neutro, 1º sigma',
    bg: 'var(--surface-2)',
    border: 'var(--hairline)',
    fg: 'var(--text-2)',
  },
  moderado: {
    text: 'MODERADO — hierarquia normal',
    bg: 'var(--surface-2)',
    border: 'var(--hairline)',
    fg: 'var(--text-2)',
  },
};

type TabId = 'win' | 'gold' | 'nasdaq';
const TABS: { id: TabId; label: string }[] = [
  { id: 'win', label: 'WIN' },
  { id: 'gold', label: 'Ouro' },
  { id: 'nasdaq', label: 'Nasdaq' },
];

export default function PreMarket() {
  const [tab, setTab] = useState<TabId>('win');
  const [data, setData] = useState<RadarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const r = await fetch(`${FN_URL}?fn=radar`);
      const j = await r.json();
      if (j.erro) throw new Error(j.erro);
      setData(j);
    } catch (e) {
      setErro('Não foi possível carregar o radar agora.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const status = data ? STATUS_MAP[data.status] ?? STATUS_MAP.moderado : null;

  return (
    <div style={{ background: 'var(--bg)' }} className="min-h-full -m-4 p-6 font-mono text-muted-foreground md:-m-6 md:p-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-normal text-muted-foreground">Pré-market</h1>
          <p className="text-[11px] tracking-widest text-muted-foreground">
            Radar 6L · variação overnight
            {data ? ` · ${new Date(data.geradoEm).toLocaleTimeString('pt-BR')}` : ''}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 border px-3 py-2 text-[11px] tracking-widest transition-colors disabled:opacity-50"
          style={{ borderColor: 'var(--brand-hex)', color: 'var(--up-hex)', background: 'var(--brand-soft)' }}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </header>

      {erro && (
        <div className="mb-4 border border-destructive/60 bg-destructive/30 px-4 py-3 text-xs text-destructive">{erro}</div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {CARDS.map((c) => {
          const v = data?.variacoes?.[c.sym];
          const has = typeof v === 'number';
          const pos = has && (v as number) >= 0;
          const color = !has ? 'var(--text-3)' : pos ? 'var(--up-hex)' : 'var(--down-hex)';
          return (
            <div
              key={c.sym}
              className="border px-3 py-3"
              style={{
                background: 'var(--surface)',
                borderColor: c.destaque ? 'var(--brand-hex)' : 'var(--hairline)',
                boxShadow: c.destaque ? '0 0 0 1px transparent' : undefined,
              }}
            >
              <div className="text-[10px] tracking-widest text-muted-foreground">{c.label}</div>
              <div className="mt-1 flex items-baseline gap-1 text-lg font-bold tabular-nums" style={{ color }}>
                {has ? (
                  <>
                    <span className="text-sm">{pos ? '▲' : '▼'}</span>
                    {(v as number) > 0 ? '+' : ''}
                    {(v as number).toFixed(2)}%
                  </>
                ) : (
                  '—'
                )}
              </div>
            </div>
          );
        })}
      </div>

      {status && (
        <div
          className="mt-5 border px-5 py-4 text-sm font-bold tracking-normal"
          style={{ background: status.bg, borderColor: status.border, color: status.fg }}
        >
          {status.text}
        </div>
      )}

      {loading && !data && (
        <div className="mt-5 text-[11px] tracking-widest text-muted-foreground">Carregando radar…</div>
      )}

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-bold tracking-normal text-muted-foreground">Mapa GEX</h2>
        <div className="mb-4 flex gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="border px-4 py-2 text-[11px] font-bold tracking-normal transition-colors"
              style={
                tab === t.id
                  ? { borderColor: 'var(--brand-hex)', color: 'var(--up-hex)', background: 'var(--brand-soft)' }
                  : { borderColor: 'var(--hairline)', color: 'var(--text-3)', background: 'var(--surface)' }
              }
            >
              {t.label}
            </button>
          ))}
        </div>
        <GexPanel key={tab} preset={tab} />
      </section>
    </div>
  );
}
