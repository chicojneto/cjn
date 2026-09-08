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
  { sym: '6L=F', label: '6L (BRL FUT)', destaque: true },
  { sym: 'EWZ', label: 'EWZ', destaque: true },
  { sym: 'ES=F', label: 'ES (S&P)' },
  { sym: 'NQ=F', label: 'NQ (NASDAQ)' },
  { sym: 'DX-Y.NYB', label: 'DXY' },
  { sym: 'GC=F', label: 'OURO' },
];

const STATUS_MAP: Record<string, { text: string; bg: string; border: string; fg: string }> = {
  leilao_alta: {
    text: 'PADRÃO DE LEILÃO (ALTA) — gap real, entrada só a favor',
    bg: 'rgba(14,124,91,0.18)',
    border: '#0e7c5b',
    fg: '#3ddc9a',
  },
  leilao_baixa: {
    text: 'PADRÃO DE LEILÃO (BAIXA) — gap real, entrada só a favor',
    bg: 'rgba(190,45,55,0.18)',
    border: '#be2d37',
    fg: '#ff6b74',
  },
  divergencia: {
    text: 'DIVERGÊNCIA 6L×EWZ — esperar a abertura',
    bg: 'rgba(214,124,26,0.18)',
    border: '#d67c1a',
    fg: '#f0a44a',
  },
  morno: {
    text: 'NOITE MORNA — dia neutro, 1º sigma',
    bg: 'rgba(148,163,184,0.12)',
    border: '#475569',
    fg: '#94a3b8',
  },
  moderado: {
    text: 'MODERADO — hierarquia normal',
    bg: 'rgba(148,163,184,0.12)',
    border: '#475569',
    fg: '#94a3b8',
  },
};

type TabId = 'win' | 'gold' | 'nasdaq';
const TABS: { id: TabId; label: string }[] = [
  { id: 'win', label: 'WIN' },
  { id: 'gold', label: 'OURO' },
  { id: 'nasdaq', label: 'NASDAQ' },
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
    <div style={{ background: '#0f1420' }} className="min-h-full -m-4 p-6 font-mono text-slate-200 md:-m-6 md:p-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-[0.18em] text-slate-100">PRÉ-MARKET</h1>
          <p className="text-[11px] tracking-widest text-slate-500">
            RADAR 6L · VARIAÇÃO OVERNIGHT
            {data ? ` · ${new Date(data.geradoEm).toLocaleTimeString('pt-BR')}` : ''}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 border px-3 py-2 text-[11px] tracking-widest transition-colors disabled:opacity-50"
          style={{ borderColor: '#0e7c5b', color: '#3ddc9a', background: 'rgba(14,124,91,0.12)' }}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          ATUALIZAR
        </button>
      </header>

      {erro && (
        <div className="mb-4 border border-red-900/60 bg-red-950/30 px-4 py-3 text-xs text-red-300">{erro}</div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {CARDS.map((c) => {
          const v = data?.variacoes?.[c.sym];
          const has = typeof v === 'number';
          const pos = has && (v as number) >= 0;
          const color = !has ? '#64748b' : pos ? '#3ddc9a' : '#ff6b74';
          return (
            <div
              key={c.sym}
              className="border px-3 py-3"
              style={{
                background: '#141b2b',
                borderColor: c.destaque ? '#0e7c5b' : '#1f2937',
                boxShadow: c.destaque ? '0 0 0 1px rgba(14,124,91,0.35)' : undefined,
              }}
            >
              <div className="text-[10px] tracking-widest text-slate-500">{c.label}</div>
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
          className="mt-5 border px-5 py-4 text-sm font-bold tracking-[0.12em]"
          style={{ background: status.bg, borderColor: status.border, color: status.fg }}
        >
          {status.text}
        </div>
      )}

      {loading && !data && (
        <div className="mt-5 text-[11px] tracking-widest text-slate-500">CARREGANDO RADAR…</div>
      )}

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-bold tracking-[0.18em] text-slate-100">MAPA GEX</h2>
        <div className="mb-4 flex gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="border px-4 py-2 text-[11px] font-bold tracking-[0.14em] transition-colors"
              style={
                tab === t.id
                  ? { borderColor: '#0e7c5b', color: '#3ddc9a', background: 'rgba(14,124,91,0.16)' }
                  : { borderColor: '#1f2937', color: '#64748b', background: '#141b2b' }
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
