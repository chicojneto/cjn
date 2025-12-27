import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// RSS feeds from financial news sites
const RSS_FEEDS = [
  // Google News - Business/Finance (Brazil)
  { url: 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx6TVdZU0FuQjBHZ0pDVWlnQVAB?hl=pt-BR&gl=BR&ceid=BR:pt-419', source: 'Google News' },
  { url: 'https://news.google.com/rss/search?q=mercado+financeiro+OR+bolsa+OR+bitcoin+OR+dolar&hl=pt-BR&gl=BR&ceid=BR:pt-419', source: 'Google News' },
  
  // Yahoo Finance
  { url: 'https://finance.yahoo.com/news/rssindex', source: 'Yahoo Finance' },
  { url: 'https://finance.yahoo.com/rss/topstories', source: 'Yahoo Finance' },
  
  // Investing.com BR
  { url: 'https://br.investing.com/rss/news.rss', source: 'Investing.com BR' },
  { url: 'https://br.investing.com/rss/news_301.rss', source: 'Investing.com BR' },
  
  // Investing.com International
  { url: 'https://www.investing.com/rss/news.rss', source: 'Investing.com' },
  
  // Seeking Alpha
  { url: 'https://seekingalpha.com/market_currents.xml', source: 'Seeking Alpha' },
  { url: 'https://seekingalpha.com/tag/forex.xml', source: 'Seeking Alpha' },
  { url: 'https://seekingalpha.com/feed.xml', source: 'Seeking Alpha' },
  
  // Bloomberg (Markets RSS)
  { url: 'https://feeds.bloomberg.com/markets/news.rss', source: 'Bloomberg' },
  
  // CNBC
  { url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html', source: 'CNBC' },
  { url: 'https://www.cnbc.com/id/10001147/device/rss/rss.html', source: 'CNBC' },
  
  // Reuters
  { url: 'https://www.reutersagency.com/feed/?best-topics=business-finance&post_type=best', source: 'Reuters' },
  
  // MarketWatch
  { url: 'https://feeds.marketwatch.com/marketwatch/topstories/', source: 'MarketWatch' },
  { url: 'https://feeds.marketwatch.com/marketwatch/marketpulse/', source: 'MarketWatch' },
]

// Keywords to detect sentiment
const BULLISH_KEYWORDS = ['surge', 'rally', 'gain', 'rise', 'jump', 'soar', 'high', 'growth', 'bullish', 'positive', 'up', 'record', 'profit', 'beat']
const BEARISH_KEYWORDS = ['fall', 'drop', 'crash', 'decline', 'plunge', 'low', 'loss', 'bearish', 'negative', 'down', 'slump', 'miss', 'fear', 'concern']

// Asset keywords for matching - aligned with database assets
const ASSET_KEYWORDS: Record<string, string[]> = {
  // Forex pairs
  'EUR/USD': ['euro', 'eur/usd', 'eurusd', 'ecb', 'europa', 'zona do euro', 'eurozone', 'lagarde', 'banco central europeu'],
  'GBP/USD': ['libra', 'gbp/usd', 'gbpusd', 'pound', 'sterling', 'bank of england', 'boe', 'reino unido', 'uk economy'],
  'USD/CAD': ['dólar canadense', 'usd/cad', 'usdcad', 'loonie', 'bank of canada', 'boc', 'canada', 'canadá', 'petróleo canadense'],
  'USD/JPY': ['iene', 'yen', 'usd/jpy', 'usdjpy', 'japão', 'japan', 'boj', 'bank of japan', 'nikkei'],
  // Brazilian indices
  'WDO1!': ['dólar futuro', 'mini dólar', 'wdo', 'dólar comercial', 'dollar', 'dólar', 'usd', 'dxy', 'fed', 'fomc', 'powell', 'treasury', 'tesouro americano'],
  'WIN1!': ['ibovespa', 'bovespa', 'b3', 'bolsa brasileira', 'mini índice', 'win', 'brasil', 'brazil', 'selic', 'bacen', 'copom', 'lula', 'haddad'],
  // Commodities
  'XAU/USD': ['ouro', 'gold', 'xau', 'precious metal', 'metal precioso', 'safe haven', 'refúgio'],
}

// Indicator keywords for correlation-based linking
const INDICATOR_KEYWORDS: Record<string, string[]> = {
  'Fed Rate': ['fed', 'fomc', 'powell', 'federal reserve', 'fed rate', 'taxa de juros eua'],
  'ECB Rate': ['ecb', 'lagarde', 'banco central europeu', 'european central bank', 'taxa europa'],
  'BOJ Rate': ['boj', 'bank of japan', 'banco do japão', 'kuroda', 'ueda'],
  'BOC Rate': ['boc', 'bank of canada', 'banco do canadá'],
  'Selic': ['selic', 'copom', 'bacen', 'banco central do brasil', 'roberto campos neto'],
  'CPI': ['cpi', 'inflação', 'inflation', 'consumer price', 'índice de preços'],
  'PCE': ['pce', 'personal consumption', 'consumo pessoal'],
  'NFP': ['nfp', 'non-farm', 'payrolls', 'emprego eua', 'desemprego eua', 'jobs report'],
  'GDP': ['gdp', 'pib', 'gross domestic', 'produto interno bruto', 'crescimento econômico'],
  'PMI': ['pmi', 'purchasing managers', 'índice gerente de compras', 'ism'],
  'S&P 500': ['s&p 500', 's&p500', 'sp500', 'spx', 'wall street'],
  'VIX': ['vix', 'volatilidade', 'volatility', 'medo', 'fear index'],
  'DXY': ['dxy', 'dollar index', 'índice do dólar'],
  'US 10Y Yield': ['treasury yield', 'rendimento tesouro', 'us 10y', 'bond yield', 'títulos americanos'],
  'Petróleo': ['oil', 'crude', 'petróleo', 'wti', 'brent', 'opec', 'opep'],
}

// Input sanitization and validation functions
function sanitizeText(text: string, maxLength: number): string {
  if (!text || typeof text !== 'string') return ''
  
  // Remove HTML tags more thoroughly - handle nested tags and encoded entities
  let cleaned = text
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove script tags and content
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remove style tags and content
    .replace(/<[^>]*>/g, '') // Remove all remaining HTML tags
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
  
  // Remove potential XSS patterns
  cleaned = cleaned
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/data:/gi, '')
  
  // Normalize whitespace and trim
  cleaned = cleaned.replace(/\s+/g, ' ').trim()
  
  // Limit length
  return cleaned.slice(0, maxLength)
}

function validateUrl(url: string): string | null {
  if (!url || typeof url !== 'string') return null
  
  try {
    const parsed = new URL(url.trim())
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null
    }
    // Basic check for suspicious patterns
    if (parsed.href.includes('javascript:') || parsed.href.includes('data:')) {
      return null
    }
    return parsed.href.slice(0, 2000) // Limit URL length
  } catch {
    return null
  }
}

function detectSentiment(text: string): 'bullish' | 'bearish' | 'neutral' {
  const lowerText = text.toLowerCase()
  let bullishScore = 0
  let bearishScore = 0

  BULLISH_KEYWORDS.forEach(keyword => {
    if (lowerText.includes(keyword)) bullishScore++
  })

  BEARISH_KEYWORDS.forEach(keyword => {
    if (lowerText.includes(keyword)) bearishScore++
  })

  if (bullishScore > bearishScore) return 'bullish'
  if (bearishScore > bullishScore) return 'bearish'
  return 'neutral'
}

function detectImpact(text: string): 'high' | 'medium' | 'low' {
  const lowerText = text.toLowerCase()
  const highImpactWords = ['crash', 'surge', 'record', 'historic', 'breaking', 'major', 'crisis', 'emergency']
  const hasHighImpact = highImpactWords.some(word => lowerText.includes(word))
  
  if (hasHighImpact) return 'high'
  
  const mediumImpactWords = ['report', 'data', 'announce', 'decision', 'meeting', 'fed', 'bank']
  const hasMediumImpact = mediumImpactWords.some(word => lowerText.includes(word))
  
  return hasMediumImpact ? 'medium' : 'low'
}

function detectAssets(text: string): string[] {
  const lowerText = text.toLowerCase()
  const detectedAssets: string[] = []

  for (const [symbol, keywords] of Object.entries(ASSET_KEYWORDS)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      detectedAssets.push(symbol)
    }
  }

  return detectedAssets
}

function detectIndicators(text: string): string[] {
  const lowerText = text.toLowerCase()
  const detectedIndicators: string[] = []

  for (const [name, keywords] of Object.entries(INDICATOR_KEYWORDS)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      detectedIndicators.push(name)
    }
  }

  return detectedIndicators
}

// Map indicators to related assets based on correlations
function getCorrelatedAssets(indicators: string[]): string[] {
  const correlations: Record<string, string[]> = {
    'Fed Rate': ['WDO1!', 'USD/JPY', 'EUR/USD', 'GBP/USD', 'XAU/USD'],
    'ECB Rate': ['EUR/USD'],
    'BOJ Rate': ['USD/JPY'],
    'BOC Rate': ['USD/CAD'],
    'Selic': ['WIN1!', 'WDO1!'],
    'CPI': ['WDO1!', 'XAU/USD', 'WIN1!'],
    'PCE': ['WDO1!', 'XAU/USD'],
    'NFP': ['WDO1!', 'EUR/USD', 'XAU/USD'],
    'GDP': ['WIN1!', 'WDO1!'],
    'PMI': ['WIN1!', 'EUR/USD'],
    'S&P 500': ['WIN1!', 'WDO1!'],
    'VIX': ['WIN1!', 'XAU/USD'],
    'DXY': ['WDO1!', 'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CAD'],
    'US 10Y Yield': ['WDO1!', 'XAU/USD', 'USD/JPY'],
    'Petróleo': ['USD/CAD', 'WDO1!'],
  }

  const assets = new Set<string>()
  for (const indicator of indicators) {
    const related = correlations[indicator] || []
    related.forEach(asset => assets.add(asset))
  }
  return Array.from(assets)
}

async function parseRSSFeed(feedUrl: string, source: string): Promise<any[]> {
  try {
    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)',
      },
    })

    if (!response.ok) {
      console.error(`Failed to fetch ${feedUrl}: ${response.status}`)
      return []
    }

    const xml = await response.text()
    const items: any[] = []

    // Simple XML parsing for RSS items
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi
    let match

    while ((match = itemRegex.exec(xml)) !== null) {
      const itemContent = match[1]
      
      const titleMatch = /<title><!\[CDATA\[(.*?)\]\]>|<title>(.*?)<\/title>/i.exec(itemContent)
      const linkMatch = /<link>(.*?)<\/link>/i.exec(itemContent)
      const descMatch = /<description><!\[CDATA\[(.*?)\]\]>|<description>(.*?)<\/description>/i.exec(itemContent)
      const pubDateMatch = /<pubDate>(.*?)<\/pubDate>/i.exec(itemContent)

      const title = titleMatch ? (titleMatch[1] || titleMatch[2]) : ''
      const link = linkMatch ? linkMatch[1] : ''
      const description = descMatch ? (descMatch[1] || descMatch[2] || '').replace(/<[^>]*>/g, '') : ''
      const pubDate = pubDateMatch ? new Date(pubDateMatch[1]) : new Date()

      if (title) {
        // Sanitize all extracted content
        const sanitizedTitle = sanitizeText(title, 500)
        const sanitizedDescription = sanitizeText(description, 1000)
        const validatedUrl = validateUrl(link)
        
        // Only include if we have valid essential data
        if (sanitizedTitle && sanitizedTitle.length > 3) {
          const fullText = `${sanitizedTitle} ${sanitizedDescription}`
          
          // Detect direct asset mentions
          const directAssets = detectAssets(fullText)
          
          // Detect indicators and get correlated assets
          const indicators = detectIndicators(fullText)
          const correlatedAssets = getCorrelatedAssets(indicators)
          
          // Combine and deduplicate assets
          const allAssets = [...new Set([...directAssets, ...correlatedAssets])]
          
          items.push({
            title: sanitizedTitle,
            summary: sanitizedDescription.slice(0, 500),
            source_url: validatedUrl,
            source: sanitizeText(source, 100),
            published_at: pubDate.toISOString(),
            sentiment: detectSentiment(fullText),
            impact: detectImpact(fullText),
            assets: allAssets,
            indicators: indicators, // Store detected indicators
          })
        }
      }
    }

    return items.slice(0, 10) // Limit to 10 items per feed
  } catch (error) {
    console.error(`Error parsing feed ${feedUrl}:`, error)
    return []
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('Starting news fetch...')

    // Fetch from all RSS feeds in parallel
    const feedPromises = RSS_FEEDS.map(feed => parseRSSFeed(feed.url, feed.source))
    const feedResults = await Promise.all(feedPromises)
    const allNews = feedResults.flat()

    console.log(`Fetched ${allNews.length} news items`)

    // Get existing assets from database
    const { data: assets } = await supabase
      .from('assets')
      .select('id, symbol')

    const assetMap = new Map(assets?.map(a => [a.symbol, a.id]) || [])

    let insertedCount = 0
    let skippedCount = 0

    for (const newsItem of allNews) {
      // Check if news already exists (by title and source)
      const { data: existing } = await supabase
        .from('news')
        .select('id')
        .eq('title', newsItem.title)
        .eq('source', newsItem.source)
        .single()

      if (existing) {
        skippedCount++
        continue
      }

      // Insert news
      const { data: insertedNews, error: newsError } = await supabase
        .from('news')
        .insert({
          title: newsItem.title,
          summary: newsItem.summary,
          source_url: newsItem.source_url,
          source: newsItem.source,
          published_at: newsItem.published_at,
          sentiment: newsItem.sentiment,
          impact: newsItem.impact,
        })
        .select()
        .single()

      if (newsError) {
        console.error('Error inserting news:', newsError)
        continue
      }

      // Link news to assets
      if (newsItem.assets.length > 0) {
        console.log(`Linking news "${newsItem.title.slice(0, 50)}" to assets: ${newsItem.assets.join(', ')}`)
      }
      
      for (const assetSymbol of newsItem.assets) {
        const assetId = assetMap.get(assetSymbol)
        if (assetId) {
          const { error: linkError } = await supabase.from('news_assets').insert({
            news_id: insertedNews.id,
            asset_id: assetId,
            expected_impact: newsItem.sentiment,
          })
          if (linkError) {
            console.error(`Error linking news to ${assetSymbol}:`, linkError)
          }
        } else {
          console.log(`Asset not found in DB: ${assetSymbol}`)
        }
      }

      insertedCount++
    }

    console.log(`Inserted ${insertedCount} new items, skipped ${skippedCount} duplicates`)

    return new Response(
      JSON.stringify({
        success: true,
        fetched: allNews.length,
        inserted: insertedCount,
        skipped: skippedCount,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error fetching news:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
