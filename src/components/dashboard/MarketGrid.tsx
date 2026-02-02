import { useQuery } from '@tanstack/react-query';
import { MarketTable } from './MarketTable';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Quote {
  symbol: string;
  name: string;
  price: number;
  priceFormatted: string;
  changeValue: number;
  changePercent: string;
  changePercentValue: number;
  isPositive: boolean;
  isNegative: boolean;
  category?: string;
  market?: 'B3' | 'DOW';
}

// Helper to handle rate limited responses gracefully
function isRateLimited(data: any): boolean {
  return data?.success === false && data?.error === 'Rate limit exceeded';
}

// Fetch global indices
async function fetchGlobalIndices(): Promise<Quote[]> {
  try {
    const { data, error } = await supabase.functions.invoke('fetch-global-indices');
    if (error) {
      console.warn('fetch-global-indices error:', error.message);
      return [];
    }
    if (isRateLimited(data)) {
      console.log('fetch-global-indices rate limited, using cached data');
      return [];
    }
    return data?.quotes || [];
  } catch (err) {
    console.warn('fetch-global-indices exception:', err);
    return [];
  }
}

// Fetch currency rates
async function fetchCurrencyRates(): Promise<Quote[]> {
  try {
    const { data, error } = await supabase.functions.invoke('fetch-currency-rates');
    if (error) {
      console.warn('fetch-currency-rates error:', error.message);
      return [];
    }
    if (isRateLimited(data)) {
      console.log('fetch-currency-rates rate limited, using cached data');
      return [];
    }
    return data?.quotes || [];
  } catch (err) {
    console.warn('fetch-currency-rates exception:', err);
    return [];
  }
}

// Fetch asset quotes
async function fetchAssetQuotes(): Promise<Quote[]> {
  try {
    const { data, error } = await supabase.functions.invoke('fetch-asset-quotes');
    if (error) {
      console.warn('fetch-asset-quotes error:', error.message);
      return [];
    }
    if (isRateLimited(data)) {
      console.log('fetch-asset-quotes rate limited, using cached data');
      return [];
    }
    return data?.quotes || [];
  } catch (err) {
    console.warn('fetch-asset-quotes exception:', err);
    return [];
  }
}

// Fetch stocks (B3 and DOW)
async function fetchStocks(): Promise<{ b3Quotes: Quote[], dowQuotes: Quote[] }> {
  try {
    const { data, error } = await supabase.functions.invoke('fetch-stocks');
    if (error) {
      console.warn('fetch-stocks error:', error.message);
      return { b3Quotes: [], dowQuotes: [] };
    }
    if (isRateLimited(data)) {
      console.log('fetch-stocks rate limited, using cached data');
      return { b3Quotes: [], dowQuotes: [] };
    }
    return { b3Quotes: data?.b3Quotes || [], dowQuotes: data?.dowQuotes || [] };
  } catch (err) {
    console.warn('fetch-stocks exception:', err);
    return { b3Quotes: [], dowQuotes: [] };
  }
}

// Mappings for categories
const INDICES_MAPPING: Record<string, string> = {
  'DXY': 'currencies',
  'VIX': 'yields', // VIX now goes to yields panel
  'NASDAQ': 'yields', // US indices go to yields panel
  'S&P 500': 'yields',
  'DOW': 'yields',
  'NIKKEI': 'indices',
  'HK50': 'indices',
  'US2Y': 'yields',
  'US10Y': 'yields',
  'US30Y': 'yields',
};

// Flag mappings
const FLAG_MAP: Record<string, string> = {
  'USD': '🇺🇸',
  'EUR': '🇪🇺',
  'GBP': '🇬🇧',
  'JPY': '🇯🇵',
  'CAD': '🇨🇦',
  'AUD': '🇦🇺',
  'NZD': '🇳🇿',
  'CHF': '🇨🇭',
  'XAU': '🥇',
  'WTI': '🛢️',
  'BRENT': '🛢️',
  'BTC': '₿',
  'WIN': '🇧🇷',
  'WDO': '🇧🇷',
  'DOW': '🇺🇸',
  'NASDAQ': '🇺🇸',
  'S&P': '🇺🇸',
  'NIKKEI': '🇯🇵',
  'HK50': '🇭🇰',
  'VIX': '📊',
  'DXY': '💵',
  'BRL': '🇧🇷',
};

function getFlag(symbol: string, market?: 'B3' | 'DOW'): string {
  // If market is specified, use appropriate flag
  if (market === 'B3') return '🇧🇷';
  if (market === 'DOW') return '🇺🇸';
  
  // Check direct match
  if (FLAG_MAP[symbol]) return FLAG_MAP[symbol];
  
  // Check if symbol starts with known currency
  for (const [key, flag] of Object.entries(FLAG_MAP)) {
    if (symbol.startsWith(key) || symbol.includes(key)) {
      return flag;
    }
  }
  
  return '📈';
}

interface MarketGridProps {
  onAssetSelect?: (symbol: string | null) => void;
  selectedAsset?: string | null;
}

export function MarketGrid({ onAssetSelect, selectedAsset }: MarketGridProps) {
  const { data: assetQuotes, isLoading: assetsLoading, refetch: refetchAssets, isFetching: assetsFetching } = useQuery({
    queryKey: ['asset-quotes'],
    queryFn: fetchAssetQuotes,
    refetchInterval: 60000,
    staleTime: 30000,
    retry: false,
  });
  
  const { data: globalIndices, isLoading: indicesLoading, refetch: refetchIndices, isFetching: indicesFetching } = useQuery({
    queryKey: ['global-indices'],
    queryFn: fetchGlobalIndices,
    refetchInterval: 60000,
    staleTime: 30000,
    retry: false,
  });

  const { data: currencyRates, isLoading: currencyLoading, refetch: refetchCurrency, isFetching: currencyFetching } = useQuery({
    queryKey: ['currency-rates'],
    queryFn: fetchCurrencyRates,
    refetchInterval: 60000,
    staleTime: 30000,
    retry: false,
  });

  const { data: stocksData, isLoading: stocksLoading, refetch: refetchStocks, isFetching: stocksFetching } = useQuery({
    queryKey: ['stocks'],
    queryFn: fetchStocks,
    refetchInterval: 60000,
    staleTime: 30000,
    retry: false,
  });

  const isLoading = assetsLoading || indicesLoading || currencyLoading || stocksLoading;
  const isFetching = assetsFetching || indicesFetching || currencyFetching || stocksFetching;

  const refetchAll = () => {
    refetchAssets();
    refetchIndices();
    refetchCurrency();
    refetchStocks();
  };

  // Organize quotes by category
  const organizedQuotes: Record<string, Quote[]> = {
    myAssets: [],
    indices: [],
    yields: [],
    crypto: [],
    currencies: [],
    commodities: [],
    b3Stocks: [],
    dowStocks: [],
  };

  // Add assets
  assetQuotes?.forEach(quote => {
    organizedQuotes.myAssets.push({
      ...quote,
      flag: getFlag(quote.symbol),
    } as any);
  });

  // Distribute global indices
  globalIndices?.forEach(quote => {
    const category = INDICES_MAPPING[quote.symbol] || 'indices';
    organizedQuotes[category].push({
      ...quote,
      flag: getFlag(quote.symbol),
    } as any);
  });

  // Distribute currency rates
  currencyRates?.forEach(quote => {
    if (quote.category === 'commodity') {
      organizedQuotes.commodities.push({
        ...quote,
        flag: getFlag(quote.symbol),
      } as any);
    } else if (quote.category === 'crypto') {
      organizedQuotes.crypto.push({
        ...quote,
        flag: getFlag(quote.symbol),
      } as any);
    } else {
      organizedQuotes.currencies.push({
        ...quote,
        flag: getFlag(quote.symbol),
      } as any);
    }
  });

  // Add B3 stocks
  stocksData?.b3Quotes?.forEach(quote => {
    organizedQuotes.b3Stocks.push({
      ...quote,
      flag: getFlag(quote.symbol, 'B3'),
    } as any);
  });

  // Add DOW stocks
  stocksData?.dowQuotes?.forEach(quote => {
    organizedQuotes.dowStocks.push({
      ...quote,
      flag: getFlag(quote.symbol, 'DOW'),
    } as any);
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-8 w-full" />
            {[...Array(5)].map((_, j) => (
              <Skeleton key={j} className="h-10 w-full" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={refetchAll}
          disabled={isFetching}
          className="h-8 gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          <span className="text-xs">Atualizar</span>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* 1. Meus Ativos */}
        {organizedQuotes.myAssets.length > 0 && (
          <MarketTable
            title="Meus Ativos"
            quotes={organizedQuotes.myAssets.map(q => ({
              ...q,
              flag: (q as any).flag,
            }))}
            onSelect={(symbol) => onAssetSelect?.(selectedAsset === symbol ? null : symbol)}
            selectedSymbol={selectedAsset}
            showTime={true}
            compact
          />
        )}

        {/* 2. Moedas DXY */}
        {organizedQuotes.currencies.length > 0 && (
          <MarketTable
            title="Moedas DXY"
            quotes={organizedQuotes.currencies.map(q => ({
              ...q,
              flag: (q as any).flag,
            }))}
            showTime={true}
            compact
          />
        )}

        {/* 3. Índices Globais */}
        {organizedQuotes.indices.length > 0 && (
          <MarketTable
            title="Índices Globais"
            quotes={organizedQuotes.indices.map(q => ({
              ...q,
              flag: (q as any).flag,
            }))}
            showTime={true}
            compact
          />
        )}

        {/* 4. Commodities */}
        {organizedQuotes.commodities.length > 0 && (
          <MarketTable
            title="Commodities"
            quotes={organizedQuotes.commodities.map(q => ({
              ...q,
              flag: (q as any).flag,
            }))}
            showTime={true}
            compact
          />
        )}

        {/* 5. Juros EUA / Índices / VIX */}
        {organizedQuotes.yields.length > 0 && (
          <MarketTable
            title="Juros / Índices EUA"
            quotes={organizedQuotes.yields.map(q => ({
              ...q,
              priceFormatted: ['US2Y', 'US10Y', 'US30Y'].includes(q.symbol) 
                ? `${q.priceFormatted}%` 
                : q.priceFormatted,
              flag: (q as any).flag,
            }))}
            showTime={true}
            compact
          />
        )}

        {/* 6. Cripto */}
        {organizedQuotes.crypto.length > 0 && (
          <MarketTable
            title="Cripto"
            quotes={organizedQuotes.crypto.map(q => ({
              ...q,
              flag: (q as any).flag,
            }))}
            showTime={true}
            compact
          />
        )}

        {/* 7. Ações EUA */}
        {organizedQuotes.dowStocks.length > 0 && (
          <MarketTable
            title="Ações EUA"
            quotes={organizedQuotes.dowStocks.map(q => ({
              ...q,
              flag: (q as any).flag,
            }))}
            showTime={true}
            compact
          />
        )}

        {/* 8. Ações B3 */}
        {organizedQuotes.b3Stocks.length > 0 && (
          <MarketTable
            title="Ações B3"
            quotes={organizedQuotes.b3Stocks.map(q => ({
              ...q,
              flag: (q as any).flag,
            }))}
            showTime={true}
            compact
          />
        )}
      </div>
    </div>
  );
}
