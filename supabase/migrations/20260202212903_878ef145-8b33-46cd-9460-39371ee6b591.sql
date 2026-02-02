-- Enable RLS on system_config table
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- Block all public access - only service role (edge functions) can access this table
-- No policies needed since we want to deny all access from anon/authenticated users
-- Edge functions using service role bypass RLS automatically