import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardCheck, TrendingUp, TrendingDown, Minus, RefreshCw, Loader2 } from 'lucide-react';
import { useMarketCorrelations, CorrelationAnalysis, BrazilRatesData } from '@/hooks/useMarketCorrelations';
import { Button } from '@/components/ui/button';

interface MarketIndicator {
  label: string;
  value: string;
  change: string;
  isPositive: boolean | null;
}

function formatIndicator(data: CorrelationAnalysis['dxy'], decimals = 2): MarketIndicator | null {
  if (!data) return null;
  return {
    label: data.name,
    value: data.price.toFixed(decimals),
    change: `${data.isPositive ? '+' : ''}${data.changePercent.toFixed(2)}%`,
    isPositive: data.isPositive,
  };
}

function BiasIndicator({ bias, label }: { bias: 'bullish' | 'bearish' | 'neutral'; label: string }) {
  const biasConfig = {
    bullish: { icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/20 border-emerald-500/50', text: 'COMPRA' },
    bearish: { icon: TrendingDown, color: 'text-red-400', bg: 'bg-red-500/20 border-red-500/50', text: 'VENDA' },
    neutral: { icon: Minus, color: 'text-yellow-400', bg: 'bg-yellow-500/20 border-yellow-500/50', text: 'NEUTRO' },
  };
  
  const config = biasConfig[bias];
  const Icon = config.icon;
  
  return (
    <div className={`flex items-center gap-2 px-3 py-2 border ${config.bg}`}>
      <Icon className={`h-4 w-4 ${config.color}`} />
      <span className={`text-sm font-bold font-mono ${config.color}`}>{label}</span>
      <span className={`text-xs font-mono ${config.color}`}>{config.text}</span>
    </div>
  );
}

function TerminalRow({ indicator }: { indicator: MarketIndicator }) {
  return (
    <div className="flex items-center justify-between py-1.5 px-2 border-b border-border/30 hover:bg-muted/20 transition-colors">
      <span className="text-xs font-medium text-muted-foreground truncate">{indicator.label}</span>
      <div className="flex items-center gap-3 font-mono">
        <span className="text-sm font-semibold text-foreground">{indicator.value}</span>
        <span className={`text-xs font-bold min-w-[60px] text-right ${
          indicator.isPositive === null ? 'text-muted-foreground' :
          indicator.isPositive ? 'text-emerald-400' : 'text-red-400'
        }`}>
          {indicator.change}
        </span>
      </div>
    </div>
  );
}

function TerminalPanel({ 
  title, 
  indicators, 
  variant = 'default' 
}: { 
  title: string; 
  indicators: MarketIndicator[]; 
  variant?: 'default' | 'highlight-blue' | 'highlight-amber' | 'highlight-green';
}) {
  const headerStyles = {
    default: 'bg-muted/50 text-muted-foreground border-border/50',
    'highlight-blue': 'bg-blue-500/20 text-blue-400 border-blue-500/50',
    'highlight-amber': 'bg-amber-500/20 text-amber-400 border-amber-500/50',
    'highlight-green': 'bg-green-500/20 text-green-400 border-green-500/50',
  };

  return (
    <div className="border border-border/50 bg-card/30 h-full flex flex-col">
      <div className={`px-3 py-2 border-b ${headerStyles[variant]}`}>
        <h4 className="text-xs font-bold uppercase tracking-wider">{title}</h4>
      </div>
      <div className="flex-1 overflow-auto">
        {indicators.map((ind, idx) => (
          <TerminalRow key={idx} indicator={ind} />
        ))}
      </div>
    </div>
  );
}

function BrazilRatesPanel({ brazilRates }: { brazilRates: BrazilRatesData }) {
  return (
    <div className="border border-border/50 bg-card/30 h-full flex flex-col">
      <div className="px-3 py-2 border-b bg-green-500/20 text-green-400 border-green-500/50">
        <h4 className="text-xs font-bold uppercase tracking-wider">🇧🇷 JUROS BRASIL</h4>
      </div>
      <div className="flex-1 overflow-auto">
        {brazilRates.cdi && (
          <div className="flex items-center justify-between py-1.5 px-2 border-b border-border/30 hover:bg-muted/20">
            <span className="text-xs font-medium text-muted-foreground">Taxa CDI</span>
            <div className="flex items-center gap-2 font-mono">
              <span className="text-sm font-semibold text-foreground">{brazilRates.cdi.value.toFixed(2)}%</span>
              <span className="text-[10px] text-muted-foreground">a.a.</span>
            </div>
          </div>
        )}
        
        {brazilRates.cdsBrazil && (
          <div className="flex items-center justify-between py-1.5 px-2 border-b border-border/30 hover:bg-muted/20">
            <span className="text-xs font-medium text-muted-foreground">CDS Brasil 5Y</span>
            <div className="flex items-center gap-3 font-mono">
              <span className="text-sm font-semibold text-foreground">{brazilRates.cdsBrazil.value.toFixed(0)} bps</span>
              <span className={`text-xs font-bold min-w-[50px] text-right ${
                brazilRates.cdsBrazil.changePercent > 0 ? 'text-red-400' : 'text-emerald-400'
              }`}>
                {brazilRates.cdsBrazil.changePercent > 0 ? '+' : ''}{brazilRates.cdsBrazil.changePercent.toFixed(2)}%
              </span>
            </div>
          </div>
        )}
        
        {brazilRates.diFutures && brazilRates.diFutures.length > 0 && (
          <>
            <div className="px-2 py-1 bg-muted/30 border-b border-border/30">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">DI Futuro B3</span>
            </div>
            {brazilRates.diFutures.map((di, idx) => (
              <div key={idx} className="flex items-center justify-between py-1 px-2 border-b border-border/30 hover:bg-muted/20">
                <span className="text-[11px] text-muted-foreground font-mono">{di.contract}</span>
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-xs font-semibold text-foreground">{di.rate.toFixed(2)}%</span>
                  <span className={`text-[10px] font-bold ${
                    di.change > 0 ? 'text-red-400' : di.change < 0 ? 'text-emerald-400' : 'text-muted-foreground'
                  }`}>
                    {di.change > 0 ? '+' : ''}{di.change.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function SignalsPanel({ 
  winSignals, 
  wdoSignals, 
  goldSignals,
  winBias,
  wdoBias,
  goldBias
}: { 
  winSignals: string[]; 
  wdoSignals: string[]; 
  goldSignals: string[];
  winBias: 'bullish' | 'bearish' | 'neutral';
  wdoBias: 'bullish' | 'bearish' | 'neutral';
  goldBias: 'bullish' | 'bearish' | 'neutral';
}) {
  const getColor = (bias: 'bullish' | 'bearish' | 'neutral') => {
    return bias === 'bullish' ? 'text-emerald-400' : bias === 'bearish' ? 'text-red-400' : 'text-yellow-400';
  };

  return (
    <div className="border border-border/50 bg-card/30 h-full flex flex-col">
      <div className="px-3 py-2 border-b bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
        <h4 className="text-xs font-bold uppercase tracking-wider">📊 ANÁLISE DE CORRELAÇÕES</h4>
      </div>
      <div className="flex-1 overflow-auto p-2 space-y-3">
        {winSignals.length > 0 && (
          <div>
            <h5 className="text-[10px] font-bold text-red-400 mb-1 font-mono">WIN:</h5>
            {winSignals.map((signal, idx) => (
              <p key={idx} className={`text-[11px] leading-relaxed ${getColor(winBias)}`}>• {signal}</p>
            ))}
          </div>
        )}
        
        {wdoSignals.length > 0 && (
          <div>
            <h5 className="text-[10px] font-bold text-red-400 mb-1 font-mono">WDO:</h5>
            {wdoSignals.map((signal, idx) => (
              <p key={idx} className={`text-[11px] leading-relaxed ${getColor(wdoBias)}`}>• {signal}</p>
            ))}
          </div>
        )}
        
        {goldSignals.length > 0 && (
          <div>
            <h5 className="text-[10px] font-bold text-red-400 mb-1 font-mono">XAU/USD:</h5>
            {goldSignals.map((signal, idx) => (
              <p key={idx} className={`text-[11px] leading-relaxed ${getColor(goldBias)}`}>• {signal}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function DailyChecklist() {
  const { data, isLoading, error, refetch, isFetching } = useMarketCorrelations();

  if (isLoading) {
    return (
      <Card className="border-border/50 bg-background">
        <CardHeader className="py-2 px-3 border-b border-border/50">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4" />
            CHECK LIST DIÁRIO
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground font-mono">Carregando dados...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-border/50 bg-background">
        <CardHeader className="py-2 px-3 border-b border-border/50">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4" />
            CHECK LIST DIÁRIO
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-2 font-mono">Erro ao carregar dados</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Format indicators
  const indicators = {
    asianMarkets: [
      formatIndicator(data.hangSeng),
      formatIndicator(data.nikkei),
      formatIndicator(data.szseComp),
    ].filter(Boolean) as MarketIndicator[],
    europeanMarkets: [
      formatIndicator(data.dax),
      formatIndicator(data.ftse),
      formatIndicator(data.stoxx50),
    ].filter(Boolean) as MarketIndicator[],
    futures: [
      formatIndicator(data.sp500Futures),
      formatIndicator(data.nasdaqFutures),
      formatIndicator(data.dowFutures),
    ].filter(Boolean) as MarketIndicator[],
    currencies: [
      formatIndicator(data.dxy),
      formatIndicator(data.eurUsd, 4),
      formatIndicator(data.usdJpy, 2),
      formatIndicator(data.usdBrl, 4),
    ].filter(Boolean) as MarketIndicator[],
    commodities: [
      formatIndicator(data.gold),
      formatIndicator(data.oil),
      formatIndicator(data.copper),
    ].filter(Boolean) as MarketIndicator[],
    rates: [
      formatIndicator(data.us10y),
      formatIndicator(data.vix),
    ].filter(Boolean) as MarketIndicator[],
  };

  return (
    <Card className="border-border/50 bg-background">
      {/* Terminal Header */}
      <CardHeader className="py-2 px-3 border-b border-border/50 bg-muted/30">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-mono font-bold flex items-center gap-2 text-foreground">
            <ClipboardCheck className="h-4 w-4" />
            CHECK LIST DIÁRIO
          </CardTitle>
          <div className="flex items-center gap-3">
            {/* Bias Summary in Header */}
            <div className="hidden lg:flex items-center gap-1">
              <BiasIndicator bias={data.winBias} label="WIN" />
              <BiasIndicator bias={data.wdoBias} label="WDO" />
              <BiasIndicator bias={data.goldBias} label="OURO" />
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => refetch()}
              disabled={isFetching}
              className="h-7 px-2 font-mono text-xs"
            >
              <RefreshCw className={`h-3 w-3 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-2">
        {/* Mobile Bias */}
        <div className="lg:hidden flex flex-wrap gap-1 mb-2">
          <BiasIndicator bias={data.winBias} label="WIN" />
          <BiasIndicator bias={data.wdoBias} label="WDO" />
          <BiasIndicator bias={data.goldBias} label="OURO" />
        </div>

        {/* Main Grid - Bloomberg Style */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-2">
          {/* Row 1: Global Markets */}
          <TerminalPanel 
            title="🌏 ÁSIA" 
            indicators={indicators.asianMarkets} 
          />
          
          <TerminalPanel 
            title="🇪🇺 EUROPA" 
            indicators={indicators.europeanMarkets} 
          />
          
          <TerminalPanel 
            title="🇺🇸 FUTUROS EUA" 
            indicators={indicators.futures} 
          />

          {/* Row 2: Currencies, Commodities, Rates */}
          <TerminalPanel 
            title="💱 MOEDAS" 
            indicators={indicators.currencies}
            variant="highlight-blue"
          />
          
          <TerminalPanel 
            title="🛢️ COMMODITIES" 
            indicators={indicators.commodities}
            variant="highlight-amber"
          />
          
          <TerminalPanel 
            title="📈 JUROS & VIX" 
            indicators={indicators.rates} 
          />

          {/* Row 3: Brazil Rates & Signals */}
          {data.brazilRates && (
            <BrazilRatesPanel brazilRates={data.brazilRates} />
          )}
          
          <div className="sm:col-span-2 lg:col-span-2 xl:col-span-3 2xl:col-span-3">
            <SignalsPanel 
              winSignals={data.winSignals}
              wdoSignals={data.wdoSignals}
              goldSignals={data.goldSignals}
              winBias={data.winBias}
              wdoBias={data.wdoBias}
              goldBias={data.goldBias}
            />
          </div>
        </div>

        {/* Footer Tips */}
        <div className="mt-2 border border-border/50 bg-muted/20 p-2">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-4 gap-y-0.5 text-[10px] text-muted-foreground font-mono">
            <span>• DXY ↑ = WDO ↑, WIN ↓</span>
            <span>• VIX &gt; 20 = Alta volatilidade</span>
            <span>• T10Y &gt; 4.5% = Estresse</span>
            <span>• Ouro ↑↑ = Risk-off</span>
            <span>• CDS &gt; 200 bps = Risco alto</span>
            <span>• CDI alto = Pressão ações BR</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
