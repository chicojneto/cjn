-- Remove public write access from data tables (security fix)
-- Edge Functions use SERVICE_ROLE_KEY, so writes from them will continue to work
-- This prevents malicious actors from inserting fake data via client-side access

-- News system
DROP POLICY IF EXISTS "Public insert access" ON public.news;
DROP POLICY IF EXISTS "Public insert access" ON public.news_assets;

-- Economic data
DROP POLICY IF EXISTS "Public insert access" ON public.economic_events;
DROP POLICY IF EXISTS "Public update access" ON public.economic_events;
DROP POLICY IF EXISTS "Public insert access" ON public.event_history;

-- Correlations
DROP POLICY IF EXISTS "Public insert access" ON public.asset_correlations;