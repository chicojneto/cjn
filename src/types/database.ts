export interface Asset {
  id: string;
  symbol: string;
  name: string;
  category: string;
  created_at: string;
}

export interface Indicator {
  id: string;
  name: string;
  category: string;
  description: string | null;
  created_at: string;
}

export interface AssetCorrelation {
  id: string;
  asset_id: string;
  indicator_id: string;
  correlation_type: 'positive' | 'negative' | 'neutral';
  strength: 'low' | 'medium' | 'high' | 'very_high';
  description: string | null;
  created_at: string;
  assets?: Asset;
  indicators?: Indicator;
}

export interface EconomicEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  indicator_id: string | null;
  country: string | null;
  impact: 'low' | 'medium' | 'high' | null;
  previous_value: string | null;
  forecast_value: string | null;
  actual_value: string | null;
  source_url: string | null;
  created_at: string;
  indicators?: Indicator;
}

export interface News {
  id: string;
  title: string;
  summary: string | null;
  content: string | null;
  source: string;
  source_url: string | null;
  published_at: string;
  sentiment: 'bullish' | 'bearish' | 'neutral' | null;
  impact: 'low' | 'medium' | 'high' | null;
  created_at: string;
}

export interface NewsAsset {
  id: string;
  news_id: string;
  asset_id: string;
  expected_impact: 'bullish' | 'bearish' | 'neutral' | null;
  created_at: string;
  news?: News;
  assets?: Asset;
}

export interface Alert {
  id: string;
  title: string;
  message: string;
  alert_type: 'news' | 'event' | 'indicator' | 'custom';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  asset_id: string | null;
  is_read: boolean;
  created_at: string;
  assets?: Asset;
}

export interface EventHistory {
  id: string;
  event_id: string | null;
  asset_id: string;
  actual_impact: 'bullish' | 'bearish' | 'neutral' | null;
  price_change_percent: number | null;
  notes: string | null;
  recorded_at: string;
  created_at: string;
}