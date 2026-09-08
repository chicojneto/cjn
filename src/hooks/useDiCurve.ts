import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DiCurveRow {
  id: string;
  cdi: number | null;
  di_jan27: number | null;
  di_jan28: number | null;
  di_jan29: number | null;
  di_jan30: number | null;
  di_jan31: number | null;
  di_jan33: number | null;
  updated_at: string;
}

export const DI_FIELDS: { key: keyof DiCurveRow; label: string; year: number }[] = [
  { key: 'di_jan27', label: 'DI Jan/27', year: 2027 },
  { key: 'di_jan28', label: 'DI Jan/28', year: 2028 },
  { key: 'di_jan29', label: 'DI Jan/29', year: 2029 },
  { key: 'di_jan30', label: 'DI Jan/30', year: 2030 },
  { key: 'di_jan31', label: 'DI Jan/31', year: 2031 },
  { key: 'di_jan33', label: 'DI Jan/33', year: 2033 },
];

export async function fetchDiCurve(): Promise<DiCurveRow | null> {
  const { data, error } = await supabase
    .from('di_curve_manual')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.warn('di_curve_manual error:', error.message);
    return null;
  }
  return (data as DiCurveRow) || null;
}

export function useDiCurve() {
  return useQuery({
    queryKey: ['di-curve-manual'],
    queryFn: fetchDiCurve,
    staleTime: 60_000,
    retry: false,
    throwOnError: false,
  });
}

/** Business days elapsed since a date (excludes Sat/Sun). */
export function businessDaysSince(iso: string): number {
  const start = new Date(iso);
  const now = new Date();
  if (isNaN(start.getTime()) || now < start) return 0;
  let count = 0;
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(0, 0, 0, 0);
  while (cursor < end) {
    cursor.setDate(cursor.getDate() + 1);
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) count++;
  }
  return count;
}

export function formatManualStamp(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `manual · ${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function isStale(iso: string): boolean {
  return businessDaysSince(iso) > 2;
}

export interface ManualCurveAnalysis {
  shortLabel: string;
  longLabel: string;
  spread: number; // in percentage points
  inclination: 'positive' | 'negative' | 'flat';
  signal: string;
}

export function analyzeManualCurve(row: DiCurveRow | null): ManualCurveAnalysis | null {
  if (!row) return null;
  const points = DI_FIELDS
    .map((f) => ({ label: f.label, value: row[f.key] as number | null }))
    .filter((p) => typeof p.value === 'number' && isFinite(p.value as number)) as {
      label: string; value: number;
    }[];
  if (points.length < 2) return null;

  const short = points[0];
  const long = points[points.length - 1];
  const spread = long.value - short.value;
  const bps = (spread * 100).toFixed(0);

  let inclination: ManualCurveAnalysis['inclination'];
  let signal: string;
  if (spread > 0.5) {
    inclination = 'positive';
    signal = `Curva inclinada positiva (+${bps} bps) → mercado precifica juros altos por mais tempo`;
  } else if (spread < -0.2) {
    inclination = 'negative';
    signal = `Curva invertida (${bps} bps) → expectativa de queda de juros no longo prazo`;
  } else {
    inclination = 'flat';
    signal = `Curva flat (${spread > 0 ? '+' : ''}${bps} bps) → incerteza sobre a trajetória dos juros`;
  }

  return { shortLabel: short.label, longLabel: long.label, spread, inclination, signal };
}
