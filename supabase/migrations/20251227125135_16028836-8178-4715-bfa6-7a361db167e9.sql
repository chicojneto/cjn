-- Remove public write access from alerts table (security fix)
-- Only Edge Functions with service role will be able to insert alerts
-- Users can still read alerts but cannot modify them

DROP POLICY IF EXISTS "Public insert access" ON public.alerts;
DROP POLICY IF EXISTS "Public update access" ON public.alerts;