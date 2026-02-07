import { useEffect, useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardCheck, TrendingUp, TrendingDown, Minus, RefreshCw, Loader2, Maximize2, Minimize2 } from 'lucide-react';
import { useMarketCorrelations, CorrelationAnalysis, BrazilRatesData, DIFutureContract } from '@/hooks/useMarketCorrelations';
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

function DIContractRow({ di }: { di: DIFutureContract }) {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'short_term': return 'text-blue-400';
      case 'one_year': return 'text-amber-400';
      case 'macro': return 'text-purple-400';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="flex items-center justify-between py-1.5 px-2 border-b border-border/30 hover:bg-muted/20">
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-mono font-semibold ${getCategoryColor(di.category)}`}>
            {di.contract}
          </span>
          <span className="text-[10px] text-muted-foreground">({di.label})</span>
        </div>
        <span className="text-[9px] text-muted-foreground/70">{di.description}</span>
      </div>
      <div className="flex items-center gap-2 font-mono">
        <span className="text-xs font-semibold text-foreground">{di.rate.toFixed(2)}%</span>
        <span className={`text-[10px] font-bold min-w-[40px] text-right ${
          di.change > 0 ? 'text-red-400' : di.change < 0 ? 'text-emerald-400' : 'text-muted-foreground'
        }`}>
          {di.change > 0 ? '+' : ''}{(di.change * 100).toFixed(0)} bps
        </span>
      </div>
    </div>
  );
}

function BrazilRatesPanel({ brazilRates }: { brazilRates: BrazilRatesData }) {
  const shortTermDI = brazilRates.diFutures?.filter(di => di.category === 'short_term') || [];
  const oneYearDI = brazilRates.diFutures?.filter(di => di.category === 'one_year') || [];
  const macroDI = brazilRates.diFutures?.filter(di => di.category === 'macro') || [];

  return (
    <div className="border border-border/50 bg-card/30 h-full flex flex-col">
      <div className="px-3 py-2 border-b bg-green-500/20 text-green-400 border-green-500/50">
        <h4 className="text-xs font-bold uppercase tracking-wider">🇧🇷 JUROS BRASIL</h4>
      </div>
      <div className="flex-1 overflow-auto">
        {/* CDI */}
        {brazilRates.cdi && (
          <div className="flex items-center justify-between py-1.5 px-2 border-b border-border/30 hover:bg-muted/20">
            <span className="text-xs font-medium text-muted-foreground">Taxa CDI</span>
            <div className="flex items-center gap-2 font-mono">
              <span className="text-sm font-semibold text-foreground">{brazilRates.cdi.value.toFixed(2)}%</span>
              <span className="text-[10px] text-muted-foreground">a.a.</span>
            </div>
          </div>
        )}
        
        {/* CDS Brasil */}
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
        
        {/* DI Curto Prazo - Day Trade */}
        {shortTermDI.length > 0 && (
          <>
            <div className="px-2 py-1 bg-blue-500/10 border-b border-border/30">
              <span className="text-[10px] font-bold text-blue-400 uppercase">📈 DI CURTO PRAZO (Day Trade)</span>
            </div>
            {shortTermDI.map((di, idx) => (
              <DIContractRow key={idx} di={di} />
            ))}
          </>
        )}
        
        {/* DI 1 Ano - Copom */}
        {oneYearDI.length > 0 && (
          <>
            <div className="px-2 py-1 bg-amber-500/10 border-b border-border/30">
              <span className="text-[10px] font-bold text-amber-400 uppercase">📊 DI 1 ANO (Expectativas Copom)</span>
            </div>
            {oneYearDI.map((di, idx) => (
              <DIContractRow key={idx} di={di} />
            ))}
          </>
        )}
        
        {/* Vértices Macro */}
        {macroDI.length > 0 && (
          <>
            <div className="px-2 py-1 bg-purple-500/10 border-b border-border/30">
              <span className="text-[10px] font-bold text-purple-400 uppercase">🏛️ VÉRTICES MACRO (Risco Fiscal)</span>
            </div>
            {macroDI.map((di, idx) => (
              <DIContractRow key={idx} di={di} />
            ))}
          </>
        )}
        
        {/* Análise da Curva */}
        {brazilRates.curveAnalysis && (
          <>
            <div className="px-2 py-1 bg-muted/30 border-b border-border/30">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">📐 INCLINAÇÃO DA CURVA</span>
            </div>
            <div className="px-2 py-2 border-b border-border/30">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-muted-foreground">Spread (Longo - Curto)</span>
                <span className={`text-xs font-mono font-bold ${
                  brazilRates.curveAnalysis.inclination === 'positive' ? 'text-amber-400' :
                  brazilRates.curveAnalysis.inclination === 'negative' ? 'text-emerald-400' :
                  'text-muted-foreground'
                }`}>
                  {brazilRates.curveAnalysis.spread > 0 ? '+' : ''}{(brazilRates.curveAnalysis.spread * 100).toFixed(0)} bps
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground/80 leading-relaxed">
                {brazilRates.curveAnalysis.signal}
              </p>
            </div>
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
  sp500Signals,
  nasdaqSignals,
  eurUsdSignals,
  gbpUsdSignals,
  winBias,
  wdoBias,
  goldBias,
  sp500Bias,
  nasdaqBias,
  eurUsdBias,
  gbpUsdBias,
}: { 
  winSignals: string[]; 
  wdoSignals: string[]; 
  goldSignals: string[];
  sp500Signals: string[];
  nasdaqSignals: string[];
  eurUsdSignals: string[];
  gbpUsdSignals: string[];
  winBias: 'bullish' | 'bearish' | 'neutral';
  wdoBias: 'bullish' | 'bearish' | 'neutral';
  goldBias: 'bullish' | 'bearish' | 'neutral';
  sp500Bias: 'bullish' | 'bearish' | 'neutral';
  nasdaqBias: 'bullish' | 'bearish' | 'neutral';
  eurUsdBias: 'bullish' | 'bearish' | 'neutral';
  gbpUsdBias: 'bullish' | 'bearish' | 'neutral';
}) {
  const getColor = (bias: 'bullish' | 'bearish' | 'neutral') => {
    return bias === 'bullish' ? 'text-emerald-400' : bias === 'bearish' ? 'text-red-400' : 'text-yellow-400';
  };

  const getBiasLabel = (bias: 'bullish' | 'bearish' | 'neutral') => {
    return bias === 'bullish' ? 'LONG' : bias === 'bearish' ? 'SHORT' : 'NEUTRO';
  };

  return (
    <div className="border border-border/50 bg-card/30 h-full flex flex-col">
      <div className="px-3 py-2 border-b bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
        <h4 className="text-xs font-bold uppercase tracking-wider">📊 ANÁLISE DE CORRELAÇÕES</h4>
      </div>
      <div className="flex-1 overflow-auto p-2 space-y-3">
        {/* Brasil */}
        {winSignals.length > 0 && (
          <div>
            <h5 className={`text-[10px] font-bold mb-1 font-mono ${getColor(winBias)}`}>
              WIN ({getBiasLabel(winBias)}):
            </h5>
            {winSignals.map((signal, idx) => (
              <p key={idx} className={`text-[11px] leading-relaxed ${getColor(winBias)}`}>• {signal}</p>
            ))}
          </div>
        )}
        
        {wdoSignals.length > 0 && (
          <div>
            <h5 className={`text-[10px] font-bold mb-1 font-mono ${getColor(wdoBias)}`}>
              WDO ({getBiasLabel(wdoBias)}):
            </h5>
            {wdoSignals.map((signal, idx) => (
              <p key={idx} className={`text-[11px] leading-relaxed ${getColor(wdoBias)}`}>• {signal}</p>
            ))}
          </div>
        )}
        
        {goldSignals.length > 0 && (
          <div>
            <h5 className={`text-[10px] font-bold mb-1 font-mono ${getColor(goldBias)}`}>
              XAU/USD ({getBiasLabel(goldBias)}):
            </h5>
            {goldSignals.map((signal, idx) => (
              <p key={idx} className={`text-[11px] leading-relaxed ${getColor(goldBias)}`}>• {signal}</p>
            ))}
          </div>
        )}

        {/* US Indices */}
        {sp500Signals.length > 0 && (
          <div>
            <h5 className={`text-[10px] font-bold mb-1 font-mono ${getColor(sp500Bias)}`}>
              S&P 500 ({getBiasLabel(sp500Bias)}):
            </h5>
            {sp500Signals.map((signal, idx) => (
              <p key={idx} className={`text-[11px] leading-relaxed ${getColor(sp500Bias)}`}>• {signal}</p>
            ))}
          </div>
        )}

        {nasdaqSignals.length > 0 && (
          <div>
            <h5 className={`text-[10px] font-bold mb-1 font-mono ${getColor(nasdaqBias)}`}>
              NASDAQ ({getBiasLabel(nasdaqBias)}):
            </h5>
            {nasdaqSignals.map((signal, idx) => (
              <p key={idx} className={`text-[11px] leading-relaxed ${getColor(nasdaqBias)}`}>• {signal}</p>
            ))}
          </div>
        )}

        {/* Forex */}
        {eurUsdSignals.length > 0 && (
          <div>
            <h5 className={`text-[10px] font-bold mb-1 font-mono ${getColor(eurUsdBias)}`}>
              EUR/USD ({getBiasLabel(eurUsdBias)}):
            </h5>
            {eurUsdSignals.map((signal, idx) => (
              <p key={idx} className={`text-[11px] leading-relaxed ${getColor(eurUsdBias)}`}>• {signal}</p>
            ))}
          </div>
        )}

        {gbpUsdSignals.length > 0 && (
          <div>
            <h5 className={`text-[10px] font-bold mb-1 font-mono ${getColor(gbpUsdBias)}`}>
              GBP/USD ({getBiasLabel(gbpUsdBias)}):
            </h5>
            {gbpUsdSignals.map((signal, idx) => (
              <p key={idx} className={`text-[11px] leading-relaxed ${getColor(gbpUsdBias)}`}>• {signal}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const AUTO_REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes

export function DailyChecklist() {
  const { data, isLoading, error, refetch, isFetching } = useMarketCorrelations();
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [countdown, setCountdown] = useState(15 * 60); // 15 minutes in seconds
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Toggle fullscreen mode
  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  }, []);

  // Listen for fullscreen changes (e.g., ESC key)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Auto-refresh every 15 minutes
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      refetch();
      setLastUpdate(new Date());
      setCountdown(15 * 60);
    }, AUTO_REFRESH_INTERVAL);

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 15 * 60));
    }, 1000);

    return () => {
      clearInterval(refreshInterval);
      clearInterval(countdownInterval);
    };
  }, [refetch]);

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
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-3">
              <RefreshCw className="h-6 w-6 text-amber-400" />
            </div>
            <p className="text-sm text-muted-foreground mb-1 font-mono">Aguardando dados do mercado...</p>
            <p className="text-xs text-muted-foreground/70 mb-4">Rate limit ativo. Tentando novamente em breve.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              {isFetching ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Tentar Novamente
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
      formatIndicator(data.gbpUsd, 4),
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
      formatIndicator(data.sp500Futures),
      formatIndicator(data.nasdaqFutures),
      formatIndicator(data.dowFutures),
    ].filter(Boolean) as MarketIndicator[],
  };

  return (
    <div 
      ref={containerRef} 
      className={`${isFullscreen ? 'bg-background p-4 overflow-auto' : ''}`}
    >
      <Card className={`border-border/50 bg-background ${isFullscreen ? 'h-full flex flex-col' : ''}`}>
        {/* Terminal Header */}
        <CardHeader className="py-2 px-3 border-b border-border/50 bg-muted/30">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <CardTitle className={`font-mono font-bold flex items-center gap-2 text-foreground ${isFullscreen ? 'text-lg' : 'text-sm'}`}>
                <ClipboardCheck className={isFullscreen ? 'h-5 w-5' : 'h-4 w-4'} />
                CHECK LIST DIÁRIO
              </CardTitle>
              {/* Auto-refresh indicator */}
              <div className={`flex items-center gap-2 font-mono text-muted-foreground ${isFullscreen ? 'text-xs' : 'text-[10px]'}`}>
                <span className="hidden sm:inline">Atualizado: {lastUpdate.toLocaleTimeString('pt-BR')}</span>
                <span className={`px-2 py-1 rounded-md flex items-center gap-1.5 ${
                  countdown <= 60 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-muted/50 border border-border/50'
                }`}>
                  {isFetching ? (
                    <span className="flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Atualizando...</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <RefreshCw className="h-3 w-3" />
                      <span>{Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}</span>
                    </span>
                  )}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Bias Summary in Header */}
              <div className="hidden lg:flex items-center gap-1 flex-wrap">
                <BiasIndicator bias={data.winBias} label="WIN" />
                <BiasIndicator bias={data.wdoBias} label="WDO" />
                <BiasIndicator bias={data.goldBias} label="OURO" />
                <BiasIndicator bias={data.sp500Bias || 'neutral'} label="S&P" />
                <BiasIndicator bias={data.nasdaqBias || 'neutral'} label="NDX" />
                <BiasIndicator bias={data.eurUsdBias || 'neutral'} label="EUR" />
                <BiasIndicator bias={data.gbpUsdBias || 'neutral'} label="GBP" />
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  refetch();
                  setLastUpdate(new Date());
                  setCountdown(15 * 60);
                }}
                disabled={isFetching}
                className="h-7 px-2 font-mono text-xs"
                title="Atualizar agora"
              >
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={toggleFullscreen}
                className="h-7 px-2 font-mono text-xs"
                title={isFullscreen ? 'Sair do modo TV' : 'Modo TV (Fullscreen)'}
              >
                {isFullscreen ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className={`p-2 ${isFullscreen ? 'flex-1 overflow-auto' : ''}`}>
          {/* Mobile Bias */}
          <div className="lg:hidden flex flex-wrap gap-1 mb-2">
            <BiasIndicator bias={data.winBias} label="WIN" />
            <BiasIndicator bias={data.wdoBias} label="WDO" />
            <BiasIndicator bias={data.goldBias} label="OURO" />
            <BiasIndicator bias={data.sp500Bias || 'neutral'} label="S&P" />
            <BiasIndicator bias={data.nasdaqBias || 'neutral'} label="NDX" />
            <BiasIndicator bias={data.eurUsdBias || 'neutral'} label="EUR" />
            <BiasIndicator bias={data.gbpUsdBias || 'neutral'} label="GBP" />
          </div>

          {/* Main Grid - Bloomberg Style */}
          <div className={`grid gap-2 ${
            isFullscreen 
              ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8' 
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6'
          }`}>
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
        </div>

          {/* Row 3: Brazil Rates & Signals - Separate flex container for alignment */}
          <div className={`mt-2 flex gap-2 ${
            isFullscreen 
              ? 'flex-col xl:flex-row' 
              : 'flex-col lg:flex-row'
          }`}>
            {data.brazilRates && (
              <div className={`${isFullscreen ? 'xl:w-1/4' : 'lg:w-1/4'} min-w-0`}>
                <BrazilRatesPanel brazilRates={data.brazilRates} />
              </div>
            )}
            
            <div className={`${isFullscreen ? 'xl:flex-1' : 'lg:flex-1'} min-w-0`}>
              <SignalsPanel 
                winSignals={data.winSignals}
                wdoSignals={data.wdoSignals}
                goldSignals={data.goldSignals}
                sp500Signals={data.sp500Signals || []}
                nasdaqSignals={data.nasdaqSignals || []}
                eurUsdSignals={data.eurUsdSignals || []}
                gbpUsdSignals={data.gbpUsdSignals || []}
                winBias={data.winBias}
                wdoBias={data.wdoBias}
                goldBias={data.goldBias}
                sp500Bias={data.sp500Bias || 'neutral'}
                nasdaqBias={data.nasdaqBias || 'neutral'}
                eurUsdBias={data.eurUsdBias || 'neutral'}
                gbpUsdBias={data.gbpUsdBias || 'neutral'}
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
    </div>
  );
}
