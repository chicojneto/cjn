REVOKE INSERT, UPDATE ON TABLE public.di_curve_manual FROM anon, authenticated;

DROP POLICY IF EXISTS "Public insert di curve" ON public.di_curve_manual;
DROP POLICY IF EXISTS "Public update di curve" ON public.di_curve_manual;

GRANT ALL ON TABLE public.di_curve_manual TO service_role;