import { useDiCurve, analyzeManualCurve, DI_FIELDS } from '@/hooks/useDiCurve';
import { ManualStamp } from '@/components/shared/ManualStamp';

export function DiCurvePanel() {
  const { data: curve } = useDiCurve();
  const analysis = analyzeManualCurve(curve ?? null);

  const rows: { label: string; value: number }[] = [];
  if (curve) {
    if (typeof curve.cdi === 'number') rows.push({ label: 'CDI', value: curve.cdi });
    DI_FIELDS.forEach((f) => {
      const v = curve[f.key] as number | null;
      if (typeof v === 'number' && isFinite(v)) rows.push({ label: f.label, value: v });
    });
  }

  return (
    <div className="border border-border/50 bg-card/30 h-full flex flex-col">
      <div className="px-3 py-2 border-b border-border/50 bg-muted/40 flex items-center justify-between gap-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Curva DI Brasil</h4>
        <ManualStamp updatedAt={curve?.updated_at} />
      </div>
      <div className="flex-1">
        {rows.length === 0 ? (
          <div className="px-3 py-4 text-[11px] text-muted-foreground">
            Sem dados. Preencha a Curva DI em Configurações.
          </div>
        ) : (
          rows.map((r) => (
            <div
              key={r.label}
              className="flex items-center justify-between py-1.5 px-3 border-b border-border/30 hover:bg-muted/20"
            >
              <span className="text-[11px] font-mono font-semibold text-foreground">{r.label}</span>
              <span className="text-xs font-mono font-semibold text-foreground">{r.value.toFixed(2)}%</span>
            </div>
          ))
        )}
        {analysis && (
          <div className="px-3 py-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground uppercase">Inclinação</span>
              <span
                className={`text-xs font-mono font-bold ${
                  analysis.inclination === 'positive'
                    ? 'text-amber-400'
                    : analysis.inclination === 'negative'
                    ? 'text-emerald-400'
                    : 'text-muted-foreground'
                }`}
              >
                {analysis.spread > 0 ? '+' : ''}
                {(analysis.spread * 100).toFixed(0)} bps
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground/80 leading-relaxed mt-1">{analysis.signal}</p>
          </div>
        )}
      </div>
    </div>
  );
}
