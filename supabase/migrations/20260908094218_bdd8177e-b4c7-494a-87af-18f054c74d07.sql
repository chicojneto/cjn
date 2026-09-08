CREATE TABLE public.di_curve_manual (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cdi numeric,
  di_jan27 numeric,
  di_jan28 numeric,
  di_jan29 numeric,
  di_jan30 numeric,
  di_jan31 numeric,
  di_jan33 numeric,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.di_curve_manual TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.di_curve_manual TO authenticated;
GRANT ALL ON public.di_curve_manual TO service_role;
ALTER TABLE public.di_curve_manual ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read di curve" ON public.di_curve_manual FOR SELECT USING (true);
CREATE POLICY "Public insert di curve" ON public.di_curve_manual FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update di curve" ON public.di_curve_manual FOR UPDATE USING (true) WITH CHECK (true);