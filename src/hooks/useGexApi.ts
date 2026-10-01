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
export type GexWall = GexNivel & { forca: number | null; confluenciaOI: boolean };
export type GexVeredito = 'SEGURO' | 'QUESTIONAVEL' | 'INSEGURO';

/** Resposta da função gex-api (gex_map v5). */
export type GexData = {
  versao: string;
  preset: string;
  und: string;
  refNome: string;
  spot: number;
  refSpot: number | null;
  dias: number;
  snapshot: string;
  gexLiquidoM: number;
  regime: 'positivo' | 'negativo';
  callWall: GexWall;
  putWall: GexWall;
  callWallOI: GexNivel | null;
  putWallOI: GexNivel | null;
  maxGamma: GexNivel;
  flip: (GexNivel & { distPct: number; distante: boolean }) | null;
  outrosZeros: number[];
  niveis: { n: number; strike: number; ref: number | null; gexM: number; lado: 'C' | 'P'; distPct: number }[];
  sensibilidade: { dias: number; flip: number | null; ref: number | null; contratos: number; oi: number; emUso: boolean }[];
  dispersaoPct: number | null;
  flipFragil: boolean;
  saude: {
    veredito: GexVeredito;
    passados: number;
    total: number;
    checks: { label: string; ok: boolean }[];
    alertas: string[];
    cobertura: number;
    coberturaPerto: number;
    ivMediana: number;
    oiTotal: number;
    contratos: number;
    gamma: { cboe: number; bs: number; semGamma: number };
    wallsInvertidas: boolean;
  };
  tabela: { strike: number; ref: number | null; oiCall: number; oiPut: number; gexM: number }[];
  linhaPine: string;
  geradoEm: string;
  aviso: string;
};

const REFRESH_MS = 15 * 60 * 1000;

async function getJson<T>(url: string): Promise<T> {
  const r = await fetch(url);
  const j = await r.json();
  // 422 = health check bloqueante do gex_map (mapa não confiável); a mensagem vai para a tela
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

/** Janela padrão de 30 dias (auditoria de 25/09 contra o Barchart; era 75). */
export function useGex(preset: GexPreset) {
  return useQuery({
    queryKey: ['gex-api', 'gex', preset],
    queryFn: () => getJson<GexData>(`${FN_URL}?fn=gex&preset=${preset}&dias=30`),
    refetchInterval: REFRESH_MS,
    staleTime: REFRESH_MS,
    retry: false,
    throwOnError: false,
  });
}
