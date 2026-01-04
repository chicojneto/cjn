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
    bullish: { icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10', text: 'COMPRADOR' },
    bearish: { icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-500/10', text: 'VENDEDOR' },
    neutral: { icon: Minus, color: 'text-yellow-500', bg: 'bg-yellow-500/10', text: 'NEUTRO' },
  };
  
  const config = biasConfig[bias];
  const Icon = config.icon;
  
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md ${config.bg}`}>
      <Icon className={`h-4 w-4 ${config.color}`} />
      <span className={`text-xs font-bold ${config.color}`}>{label}: {config.text}</span>
    </div>
  );
}

function IndicatorRow({ indicator }: { indicator: MarketIndicator }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-border/10 last:border-0">
      <span className="text-xs text-muted-foreground">{indicator.label}</span>
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium">{indicator.value}</span>
        <span className={`text-[10px] font-medium ${
          indicator.isPositive === null ? 'text-muted-foreground' :
          indicator.isPositive ? 'text-emerald-500' : 'text-red-500'
        }`}>
          {indicator.change}
        </span>
      </div>
    </div>
  );
}

function SignalsList({ signals, color }: { signals: string[]; color: 'green' | 'red' | 'yellow' }) {
  const colorClasses = {
    green: 'text-emerald-500',
    red: 'text-red-500',
    yellow: 'text-yellow-500',
  };
  
  return (
    <div className="space-y-0.5">
      {signals.map((signal, idx) => (
        <p key={idx} className={`text-[11px] leading-relaxed ${colorClasses[color]}`}>
          • {signal}
        </p>
      ))}
    </div>
  );
}

function BrazilRatesSection({ brazilRates }: { brazilRates: BrazilRatesData }) {
  return (
    <div className="space-y-1">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Juros Brasil</h4>
      
      {/* CDI */}
      {brazilRates.cdi && (
        <div className="flex items-center justify-between py-1 border-b border-border/10">
          <span className="text-xs text-muted-foreground">Taxa CDI</span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium">{brazilRates.cdi.value.toFixed(2)}%</span>
            <span className="text-[10px] text-muted-foreground">a.a.</span>
          </div>
        </div>
      )}
      
      {/* CDS Brazil */}
      {brazilRates.cdsBrazil && (
        <div className="flex items-center justify-between py-1 border-b border-border/10">
          <span className="text-xs text-muted-foreground">CDS Brasil 5Y</span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium">{brazilRates.cdsBrazil.value.toFixed(0)} bps</span>
            <span className={`text-[10px] font-medium ${
              brazilRates.cdsBrazil.changePercent > 0 ? 'text-red-500' : 'text-emerald-500'
            }`}>
              {brazilRates.cdsBrazil.changePercent > 0 ? '+' : ''}{brazilRates.cdsBrazil.changePercent.toFixed(2)}%
            </span>
          </div>
        </div>
      )}
      
      {/* DI Futures */}
      {brazilRates.diFutures && brazilRates.diFutures.length > 0 && (
        <>
          <div className="pt-1">
            <span className="text-[10px] font-semibold text-muted-foreground">DI Futuro B3:</span>
          </div>
          {brazilRates.diFutures.map((di, idx) => (
            <div key={idx} className="flex items-center justify-between py-0.5 border-b border-border/10 last:border-0">
              <span className="text-[10px] text-muted-foreground">{di.contract}</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium">{di.rate.toFixed(2)}%</span>
                <span className={`text-[9px] font-medium ${
                  di.change > 0 ? 'text-red-500' : di.change < 0 ? 'text-emerald-500' : 'text-muted-foreground'
                }`}>
                  {di.change > 0 ? '+' : ''}{di.change.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export function DailyChecklist() {
  const { data, isLoading, error, refetch, isFetching } = useMarketCorrelations();

  if (isLoading) {
    return (
      <Card className="border-border/30 bg-card/50">
        <CardHeader className="py-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Check List Diário
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Carregando dados de mercado...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-border/30 bg-card/50">
        <CardHeader className="py-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Check List Diário
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-2">Erro ao carregar dados</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Format indicators
  const indicators = {
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
    <Card className="border-border/30 bg-card/50">
      <CardHeader className="py-3 flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5" />
          Check List Diário
        </CardTitle>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => refetch()}
          disabled={isFetching}
          className="h-8 px-2"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="space-y-4">
          {/* Bias Summary */}
          <div className="flex flex-wrap gap-2">
            <BiasIndicator bias={data.winBias} label="WIN" />
            <BiasIndicator bias={data.wdoBias} label="WDO" />
            <BiasIndicator bias={data.goldBias} label="OURO" />
          </div>

          {/* Market Indicators Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Futures */}
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Futuros EUA</h4>
              {indicators.futures.map((ind, idx) => (
                <IndicatorRow key={idx} indicator={ind} />
              ))}
            </div>

            {/* Currencies */}
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Moedas</h4>
              {indicators.currencies.map((ind, idx) => (
                <IndicatorRow key={idx} indicator={ind} />
              ))}
            </div>

            {/* Commodities */}
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Commodities</h4>
              {indicators.commodities.map((ind, idx) => (
                <IndicatorRow key={idx} indicator={ind} />
              ))}
            </div>

            {/* Rates & Volatility */}
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Juros & Volatilidade EUA</h4>
              {indicators.rates.map((ind, idx) => (
                <IndicatorRow key={idx} indicator={ind} />
              ))}
            </div>

            {/* Brazil Rates Section */}
            {data.brazilRates && (
              <BrazilRatesSection brazilRates={data.brazilRates} />
            )}
          </div>

          {/* Correlation Signals */}
          <div className="border-t border-border/20 pt-3 space-y-3">
            <h3 className="text-sm font-bold text-yellow-500">ANÁLISE DE CORRELAÇÕES</h3>
            
            {/* WIN Signals */}
            {data.winSignals.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-red-500 mb-1">PARA WIN:</h4>
                <SignalsList 
                  signals={data.winSignals} 
                  color={data.winBias === 'bullish' ? 'green' : data.winBias === 'bearish' ? 'red' : 'yellow'} 
                />
              </div>
            )}
            
            {/* WDO Signals */}
            {data.wdoSignals.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-red-500 mb-1">PARA WDO:</h4>
                <SignalsList 
                  signals={data.wdoSignals} 
                  color={data.wdoBias === 'bullish' ? 'green' : data.wdoBias === 'bearish' ? 'red' : 'yellow'} 
                />
              </div>
            )}
            
            {/* Gold Signals */}
            {data.goldSignals.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-red-500 mb-1">PARA XAU/USD:</h4>
                <SignalsList 
                  signals={data.goldSignals} 
                  color={data.goldBias === 'bullish' ? 'green' : data.goldBias === 'bearish' ? 'red' : 'yellow'} 
                />
              </div>
            )}
          </div>

          {/* Static Tips */}
          <div className="border-t border-border/20 pt-3 space-y-2">
            <h3 className="text-xs font-bold text-muted-foreground">DICAS RÁPIDAS</h3>
            <div className="space-y-0.5 text-[10px] text-muted-foreground">
              <p>• DXY subindo → pressão de alta no dólar/real (WDO ↑, WIN ↓)</p>
              <p>• VIX &gt; 20 = medo no mercado = cautela com posições</p>
              <p>• Treasury 10Y &gt; 4.5% = estresse, emergentes sofrem</p>
              <p>• Ouro disparando = busca por proteção = risco global</p>
              <p>• CDI alto = juros elevados = pressão em ações brasileiras</p>
              <p>• CDS Brasil &gt; 200 bps = risco país elevado = pressão no real</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
