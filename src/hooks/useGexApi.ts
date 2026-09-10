import { useQuery } from '@tanstack/react-query';

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gex-api`;

export type GexPreset = 'win' | 'gold' | 'nasdaq';

export type RadarData = {
  variacoes: Record<string, number | null>;
  status: string;
  gatilho: number;
  geradoEm: string;
};

export type GexNivel = { strike: number; ref: number | null };

export type GexData = {
  preset: string;
  und: string;
  refNome: string;
  spot: number;
  refSpot: number | null;
  gexLiquidoM: number;
  regime: 'positivo' | 'negativo';
  callWall: GexNivel;
  putWall: GexNivel;
  flip: GexNivel | null;
  tabela: { strike: number; ref: number | null; oiCall: number; oiPut: number; gexM: number }[];
  geradoEm: string;
  aviso: string;
};

const REFRESH_MS = 15 * 60 * 1000;

async function getJson<T>(url: string): Promise<T> {
  const r = await fetch(url);
  const j = await r.json();
  if (j?.erro) throw new Error(j.erro);
  return j as T;
}

export function useRadar() {
  return useQuery({
    queryKey: ['gex-api', 'radar'],
    queryFn: () => getJson<RadarData>(`${FN_URL}?fn=radar`),
    refetchInterval: REFRESH_MS,
    staleTime: REFRESH_MS,
    retry: false,
    throwOnError: false,
  });
}

export function useGex(preset: GexPreset) {
  return useQuery({
    queryKey: ['gex-api', 'gex', preset],
    queryFn: () => getJson<GexData>(`${FN_URL}?fn=gex&preset=${preset}&dias=75`),
    refetchInterval: REFRESH_MS,
    staleTime: REFRESH_MS,
    retry: false,
    throwOnError: false,
  });
}
