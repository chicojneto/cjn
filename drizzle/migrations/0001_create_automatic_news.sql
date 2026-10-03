CREATE TABLE public.noticias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fonte text NOT NULL,
  titulo_original text NOT NULL,
  titulo_pt text NOT NULL,
  resumo text NOT NULL,
  ativos text[] NOT NULL DEFAULT '{}',
  relevancia integer NOT NULL CHECK (relevancia BETWEEN 0 AND 3),
  url text NOT NULL UNIQUE,
  publicado_em timestamptz NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.noticias TO anon, authenticated;
GRANT ALL ON public.noticias TO service_role;

ALTER TABLE public.noticias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read news"
ON public.noticias
FOR SELECT
TO anon, authenticated
USING (true);

CREATE INDEX noticias_publicado_em_idx
ON public.noticias (publicado_em DESC);

CREATE TABLE public.news_collector_state (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  status text NOT NULL DEFAULT 'ready' CHECK (status IN ('ready', 'running', 'paused')),
  locked_until timestamptz,
  pause_reason text,
  last_started_at timestamptz,
  last_finished_at timestamptz,
  last_success_at timestamptz,
  processed_count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.news_collector_state TO service_role;
ALTER TABLE public.news_collector_state ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.acquire_news_collector(_force_resume boolean DEFAULT false)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  acquired boolean := false;
BEGIN
  INSERT INTO public.news_collector_state (id) VALUES (true)
  ON CONFLICT (id) DO NOTHING;

  UPDATE public.news_collector_state
  SET status = 'running',
      locked_until = now() + interval '15 minutes',
      pause_reason = CASE WHEN _force_resume THEN NULL ELSE pause_reason END,
      last_started_at = now(),
      updated_at = now()
  WHERE id = true
    AND (status <> 'paused' OR _force_resume)
    AND (status <> 'running' OR locked_until IS NULL OR locked_until < now());

  GET DIAGNOSTICS acquired = ROW_COUNT;
  RETURN acquired;
END;
$$;

REVOKE ALL ON FUNCTION public.acquire_news_collector(boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.acquire_news_collector(boolean) TO service_role;