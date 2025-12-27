import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar as CalendarIcon } from 'lucide-react';

export function EconomicCalendar() {
  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Calendário Econômico
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="w-full overflow-hidden rounded-b-lg">
          <iframe 
            src="https://sslecal2.investing.com?columns=exc_flags,exc_currency,exc_importance,exc_actual,exc_forecast,exc_previous&category=_employment,_economicActivity,_inflation,_credit,_centralBanks,_confidenceIndex,_balance,_Bonds&importance=2&features=datepicker,timezone,timeselector,filters&countries=17,25,32,6,37,5,35,43,4,12,72&calType=week&timeZone=12&lang=12" 
            width="100%" 
            height="500" 
            frameBorder="0" 
            allowTransparency={true}
            className="border-0"
            title="Calendário Econômico Investing.com"
          />
        </div>
        <div className="px-4 py-2 text-center border-t border-border/50">
          <span className="text-xs text-muted-foreground">
            Calendário Econômico fornecido por{' '}
            <a 
              href="https://br.investing.com/" 
              rel="nofollow noopener noreferrer" 
              target="_blank" 
              className="text-primary font-medium hover:underline"
            >
              Investing.com Brasil
            </a>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
