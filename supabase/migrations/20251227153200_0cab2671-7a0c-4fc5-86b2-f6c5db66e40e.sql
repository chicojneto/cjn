-- Create table for global indices quotes history
CREATE TABLE public.global_indices_quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  change_value NUMERIC,
  change_percent NUMERIC,
  quote_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(symbol, quote_date)
);

-- Enable RLS
ALTER TABLE public.global_indices_quotes ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read access" 
ON public.global_indices_quotes 
FOR SELECT 
USING (true);

-- Create index for faster queries
CREATE INDEX idx_global_indices_symbol_date ON public.global_indices_quotes(symbol, quote_date DESC);