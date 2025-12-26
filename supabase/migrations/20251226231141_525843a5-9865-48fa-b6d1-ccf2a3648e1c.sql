-- Assets table
CREATE TABLE public.assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default assets
INSERT INTO public.assets (symbol, name, category) VALUES
  ('XAU/USD', 'Ouro', 'Commodity'),
  ('EUR/USD', 'Euro/Dólar', 'Forex'),
  ('GBP/USD', 'Libra/Dólar', 'Forex'),
  ('USD/JPY', 'Dólar/Iene', 'Forex'),
  ('USD/CAD', 'Dólar/Canadense', 'Forex'),
  ('WIN1!', 'Mini Índice Ibovespa', 'Índice'),
  ('WDO1!', 'Mini Dólar', 'Índice');

-- Indicators/Factors table
CREATE TABLE public.indicators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default indicators
INSERT INTO public.indicators (name, category, description) VALUES
  ('CPI', 'Inflação', 'Consumer Price Index - Índice de Preços ao Consumidor'),
  ('PCE', 'Inflação', 'Personal Consumption Expenditures'),
  ('NFP', 'Emprego', 'Non-Farm Payrolls - Folha de pagamento não-agrícola'),
  ('Fed Rate', 'Juros', 'Taxa de juros do Federal Reserve'),
  ('ECB Rate', 'Juros', 'Taxa de juros do Banco Central Europeu'),
  ('BOJ Rate', 'Juros', 'Taxa de juros do Banco do Japão'),
  ('BOC Rate', 'Juros', 'Taxa de juros do Banco do Canadá'),
  ('Selic', 'Juros', 'Taxa básica de juros do Brasil'),
  ('US 10Y Yield', 'Títulos', 'Rendimento do Tesouro EUA 10 anos'),
  ('PMI', 'Atividade', 'Purchasing Managers Index'),
  ('GDP', 'PIB', 'Gross Domestic Product'),
  ('Petróleo', 'Commodities', 'Preço do petróleo WTI/Brent'),
  ('HK50', 'Índices', 'Hang Seng Index - China'),
  ('S&P 500', 'Índices', 'Índice S&P 500'),
  ('DXY', 'Moedas', 'Dollar Index'),
  ('VIX', 'Volatilidade', 'Índice de Volatilidade');

-- Asset-Indicator correlations table
CREATE TABLE public.asset_correlations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  indicator_id UUID NOT NULL REFERENCES public.indicators(id) ON DELETE CASCADE,
  correlation_type TEXT NOT NULL CHECK (correlation_type IN ('positive', 'negative', 'neutral')),
  strength TEXT NOT NULL CHECK (strength IN ('low', 'medium', 'high', 'very_high')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(asset_id, indicator_id)
);

-- Economic events/calendar table
CREATE TABLE public.economic_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  indicator_id UUID REFERENCES public.indicators(id) ON DELETE SET NULL,
  country TEXT,
  impact TEXT CHECK (impact IN ('low', 'medium', 'high')),
  previous_value TEXT,
  forecast_value TEXT,
  actual_value TEXT,
  source_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- News table
CREATE TABLE public.news (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT,
  source TEXT NOT NULL,
  source_url TEXT,
  published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sentiment TEXT CHECK (sentiment IN ('bullish', 'bearish', 'neutral')),
  impact TEXT CHECK (impact IN ('low', 'medium', 'high')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- News-Asset relationship table
CREATE TABLE public.news_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  news_id UUID NOT NULL REFERENCES public.news(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  expected_impact TEXT CHECK (expected_impact IN ('bullish', 'bearish', 'neutral')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(news_id, asset_id)
);

-- Alerts table
CREATE TABLE public.alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('news', 'event', 'indicator', 'custom')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Event history (historical impact tracking)
CREATE TABLE public.event_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.economic_events(id) ON DELETE SET NULL,
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  actual_impact TEXT CHECK (actual_impact IN ('bullish', 'bearish', 'neutral')),
  price_change_percent DECIMAL(10,4),
  notes TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables (public read for this trading dashboard)
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_correlations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.economic_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_history ENABLE ROW LEVEL SECURITY;

-- Public read policies for all tables
CREATE POLICY "Public read access" ON public.assets FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.indicators FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.asset_correlations FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.economic_events FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.news FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.news_assets FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.alerts FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.event_history FOR SELECT USING (true);

-- Public insert policies (for edge functions to insert data)
CREATE POLICY "Public insert access" ON public.economic_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert access" ON public.news FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert access" ON public.news_assets FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert access" ON public.alerts FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert access" ON public.event_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert access" ON public.asset_correlations FOR INSERT WITH CHECK (true);

-- Public update policies
CREATE POLICY "Public update access" ON public.economic_events FOR UPDATE USING (true);
CREATE POLICY "Public update access" ON public.alerts FOR UPDATE USING (true);

-- Enable realtime for alerts and news
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.news;