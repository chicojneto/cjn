import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Predefined correlation rules for XAU, WIN, WDO
const CORRELATION_RULES: Record<string, Record<string, { direction: 'positive' | 'negative'; strength: 'high' | 'medium' | 'low'; description: string }>> = {
  'XAU/USD': {
    'CPI': { direction: 'positive', strength: 'high', description: 'Inflação alta = ouro sobe (hedge)' },
    'PCE': { direction: 'positive', strength: 'high', description: 'Inflação alta = ouro sobe (hedge)' },
    'Fed': { direction: 'negative', strength: 'high', description: 'Juros subindo = ouro cai' },
    'FOMC': { direction: 'negative', strength: 'high', description: 'Fed hawkish = ouro cai' },
    'NFP': { direction: 'negative', strength: 'medium', description: 'Emprego forte = USD forte = ouro cai' },
    'Payroll': { direction: 'negative', strength: 'medium', description: 'Emprego forte = USD forte = ouro cai' },
    'GDP': { direction: 'negative', strength: 'medium', description: 'Economia forte = menos demanda por ouro' },
    'PIB': { direction: 'negative', strength: 'medium', description: 'Economia forte = menos demanda por ouro' },
    'Unemployment': { direction: 'positive', strength: 'medium', description: 'Desemprego alto = incerteza = ouro sobe' },
    'Desemprego': { direction: 'positive', strength: 'medium', description: 'Desemprego alto = incerteza = ouro sobe' },
    'Retail Sales': { direction: 'negative', strength: 'low', description: 'Vendas fortes = economia forte = ouro cai' },
    'ISM': { direction: 'negative', strength: 'medium', description: 'Atividade forte = menos demanda por ouro' },
    'PMI': { direction: 'negative', strength: 'medium', description: 'Atividade forte = menos demanda por ouro' },
  },
  'WIN1!': {
    'CPI': { direction: 'negative', strength: 'medium', description: 'Inflação EUA alta = risk-off = WIN cai' },
    'PCE': { direction: 'negative', strength: 'medium', description: 'Inflação EUA alta = risk-off = WIN cai' },
    'Fed': { direction: 'negative', strength: 'high', description: 'Fed hawkish = risk-off = WIN cai' },
    'FOMC': { direction: 'negative', strength: 'high', description: 'Fed hawkish = fuga de emergentes' },
    'NFP': { direction: 'negative', strength: 'medium', description: 'USD forte = pressão em emergentes' },
    'Payroll': { direction: 'negative', strength: 'medium', description: 'USD forte = pressão em emergentes' },
    'Selic': { direction: 'negative', strength: 'high', description: 'Selic subindo demais = ações caem' },
    'COPOM': { direction: 'negative', strength: 'high', description: 'Copom hawkish = pressão nas ações' },
    'IPCA': { direction: 'negative', strength: 'medium', description: 'Inflação BR alta = incerteza fiscal' },
    'PIB Brasil': { direction: 'positive', strength: 'high', description: 'PIB forte = WIN sobe' },
    'Commodities': { direction: 'positive', strength: 'high', description: 'Commodities subindo = WIN sobe' },
    'China': { direction: 'positive', strength: 'high', description: 'China forte = WIN sobe' },
    'PMI China': { direction: 'positive', strength: 'medium', description: 'China ativa = bom para Brasil' },
  },
  'WDO1!': {
    'CPI': { direction: 'positive', strength: 'high', description: 'Inflação EUA alta = USD forte = WDO sobe' },
    'PCE': { direction: 'positive', strength: 'high', description: 'Inflação EUA alta = USD forte = WDO sobe' },
    'Fed': { direction: 'positive', strength: 'high', description: 'Fed hawkish = USD forte = WDO sobe' },
    'FOMC': { direction: 'positive', strength: 'high', description: 'Fed hawkish = USD forte = WDO sobe' },
    'NFP': { direction: 'positive', strength: 'high', description: 'Emprego forte = USD forte = WDO sobe' },
    'Payroll': { direction: 'positive', strength: 'high', description: 'Emprego forte = USD forte = WDO sobe' },
    'Selic': { direction: 'negative', strength: 'high', description: 'Selic subindo = BRL forte = WDO cai' },
    'COPOM': { direction: 'negative', strength: 'high', description: 'Copom hawkish = BRL forte = WDO cai' },
    'IPCA': { direction: 'positive', strength: 'medium', description: 'Inflação BR alta = incerteza = WDO sobe' },
    'Commodities': { direction: 'negative', strength: 'high', description: 'Commodities fortes = BRL forte = WDO cai' },
    'Balança Comercial': { direction: 'negative', strength: 'medium', description: 'Superávit = BRL forte = WDO cai' },
    'Risk': { direction: 'positive', strength: 'high', description: 'Risk-off = fuga para USD = WDO sobe' },
  },
};

interface EconomicEvent {
  title: string;
  description?: string;
  event_date: string;
  impact?: string;
  country?: string;
  forecast_value?: string;
  previous_value?: string;
}

interface AssetCorrelation {
  asset: string;
  assetName: string;
  impact: 'bullish' | 'bearish' | 'neutral';
  strength: 'high' | 'medium' | 'low';
  ruleBasedReason: string;
  events: Array<{
    title: string;
    impact: string;
    time: string;
    direction: 'positive' | 'negative' | 'neutral';
  }>;
}

interface AnalysisResult {
  date: string;
  summary: string;
  correlations: AssetCorrelation[];
  aiAnalysis?: string;
  eventsCount: number;
  highImpactCount: number;
}

function findMatchingRule(eventTitle: string, asset: string): { direction: 'positive' | 'negative'; strength: 'high' | 'medium' | 'low'; description: string } | null {
  const rules = CORRELATION_RULES[asset];
  if (!rules) return null;
  
  const titleLower = eventTitle.toLowerCase();
  
  for (const [keyword, rule] of Object.entries(rules)) {
    if (titleLower.includes(keyword.toLowerCase())) {
      return rule;
    }
  }
  
  return null;
}

function analyzeWithRules(events: EconomicEvent[]): Omit<AnalysisResult, 'aiAnalysis'> {
  const assets = ['XAU/USD', 'WIN1!', 'WDO1!'];
  const assetNames: Record<string, string> = {
    'XAU/USD': 'Ouro',
    'WIN1!': 'Mini Índice',
    'WDO1!': 'Mini Dólar',
  };
  
  const correlations: AssetCorrelation[] = assets.map(asset => {
    const assetEvents: AssetCorrelation['events'] = [];
    let bullishScore = 0;
    let bearishScore = 0;
    let maxStrength: 'high' | 'medium' | 'low' = 'low';
    const reasons: string[] = [];
    
    for (const event of events) {
      const rule = findMatchingRule(event.title, asset);
      
      if (rule) {
        const strengthValue = { high: 3, medium: 2, low: 1 }[rule.strength];
        
        if (rule.direction === 'positive') {
          bullishScore += strengthValue;
        } else {
          bearishScore += strengthValue;
        }
        
        if (strengthValue > { high: 3, medium: 2, low: 1 }[maxStrength]) {
          maxStrength = rule.strength;
        }
        
        reasons.push(rule.description);
        
        assetEvents.push({
          title: event.title,
          impact: event.impact || 'medium',
          time: new Date(event.event_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          direction: rule.direction === 'positive' ? 'positive' : 'negative',
        });
      }
    }
    
    let impact: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    if (bullishScore > bearishScore + 2) {
      impact = 'bullish';
    } else if (bearishScore > bullishScore + 2) {
      impact = 'bearish';
    }
    
    return {
      asset,
      assetName: assetNames[asset],
      impact,
      strength: maxStrength,
      ruleBasedReason: reasons.length > 0 ? reasons.slice(0, 3).join('. ') : 'Sem eventos relevantes identificados',
      events: assetEvents,
    };
  });
  
  const highImpactCount = events.filter(e => e.impact === 'high').length;
  
  return {
    date: new Date().toISOString().split('T')[0],
    summary: `${events.length} eventos econômicos hoje, ${highImpactCount} de alto impacto`,
    correlations,
    eventsCount: events.length,
    highImpactCount,
  };
}

async function enhanceWithAI(analysis: Omit<AnalysisResult, 'aiAnalysis'>, events: EconomicEvent[]): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  
  if (!LOVABLE_API_KEY) {
    console.log('LOVABLE_API_KEY not available, skipping AI enhancement');
    return '';
  }
  
  const eventsList = events
    .map(e => `- ${e.title} (${e.impact || 'médio'} impacto) às ${new Date(e.event_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`)
    .join('\n');
  
  const correlationsSummary = analysis.correlations
    .map(c => `${c.assetName} (${c.asset}): Viés ${c.impact === 'bullish' ? 'ALTA' : c.impact === 'bearish' ? 'BAIXA' : 'NEUTRO'}`)
    .join('\n');
  
  const prompt = `Você é um analista de day trade brasileiro especializado em XAU/USD (Ouro), WIN (Mini Índice Ibovespa) e WDO (Mini Dólar).

Eventos econômicos de hoje:
${eventsList}

Análise prévia baseada em regras:
${correlationsSummary}

Com base nos eventos acima, forneça uma análise CURTA e PRÁTICA (máximo 3-4 frases) sobre:
1. Qual o cenário mais provável para cada ativo
2. Horários de maior volatilidade esperada
3. Alertas de risco se aplicável

Seja direto, objetivo e focado em day trade. Use linguagem de trader brasileiro.`;

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: 'Você é um analista de mercado financeiro brasileiro focado em day trade. Seja conciso e prático.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 500,
      }),
    });
    
    if (!response.ok) {
      console.error('AI API error:', response.status);
      return '';
    }
    
    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (error) {
    console.error('AI analysis error:', error);
    return '';
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // For demo purposes, create sample events since we may not have real data
    // In production, this would fetch from the economic_events table
    const sampleEvents: EconomicEvent[] = [
      {
        title: 'FOMC Meeting Minutes',
        description: 'Federal Reserve meeting minutes release',
        event_date: new Date(today.getTime() + 14 * 60 * 60 * 1000).toISOString(),
        impact: 'high',
        country: 'US',
      },
      {
        title: 'US CPI (YoY)',
        description: 'Consumer Price Index year-over-year',
        event_date: new Date(today.getTime() + 9 * 60 * 60 * 1000).toISOString(),
        impact: 'high',
        country: 'US',
        forecast_value: '3.1%',
        previous_value: '3.2%',
      },
      {
        title: 'Initial Jobless Claims',
        description: 'Weekly unemployment claims',
        event_date: new Date(today.getTime() + 9.5 * 60 * 60 * 1000).toISOString(),
        impact: 'medium',
        country: 'US',
      },
      {
        title: 'China PMI Manufacturing',
        description: 'Purchasing Managers Index',
        event_date: new Date(today.getTime() + 22 * 60 * 60 * 1000).toISOString(),
        impact: 'medium',
        country: 'CN',
      },
    ];
    
    // Analyze with predefined rules
    const ruleBasedAnalysis = analyzeWithRules(sampleEvents);
    
    // Enhance with AI if available
    const aiAnalysis = await enhanceWithAI(ruleBasedAnalysis, sampleEvents);
    
    const result: AnalysisResult = {
      ...ruleBasedAnalysis,
      aiAnalysis,
    };
    
    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
