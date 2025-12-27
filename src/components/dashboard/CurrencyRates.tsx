import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';

export function CurrencyRates() {
  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Cotações de Moedas
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="w-full overflow-hidden rounded-b-lg">
          <iframe 
            src="https://br.widgets.investing.com/live-currency-cross-rates?theme=darkTheme&pairs=1,3,2,4,7,6,2103" 
            width="100%" 
            height="350" 
            frameBorder="0" 
            allowTransparency={true}
            className="border-0"
            title="Cotações de Moedas Investing.com"
          />
        </div>
        <div className="px-4 py-2 text-center border-t border-border/50">
          <span className="text-xs text-muted-foreground">
            Desenvolvido por{' '}
            <a 
              href="https://br.investing.com?utm_source=WMT&utm_medium=referral&utm_campaign=LIVE_CURRENCY_X_RATES&utm_content=Footer%20Link" 
              rel="nofollow noopener noreferrer" 
              target="_blank" 
              className="text-primary font-medium hover:underline"
            >
              Investing.com
            </a>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
