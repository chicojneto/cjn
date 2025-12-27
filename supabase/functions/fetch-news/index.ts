import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || 'https://lovable.dev',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// RSS feeds from financial news sites
const RSS_FEEDS = [
  // Google News - Business/Finance
  { url: 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx6TVdZU0FuQjBHZ0pDVWlnQVAB?hl=pt-BR&gl=BR&ceid=BR:pt-419', source: 'Google News' },
  { url: 'https://news.google.com/rss/search?q=mercado+financeiro+OR+bolsa+OR+bitcoin+OR+dolar&hl=pt-BR&gl=BR&ceid=BR:pt-419', source: 'Google News' },
  // Yahoo Finance
  { url: 'https://finance.yahoo.com/news/rssindex', source: 'Yahoo Finance' },
  { url: 'https://finance.yahoo.com/rss/topstories', source: 'Yahoo Finance' },
  // Investing.com BR
  { url: 'https://br.investing.com/rss/news.rss', source: 'Investing.com BR' },
  { url: 'https://br.investing.com/rss/news_301.rss', source: 'Investing.com BR' },
  // Fallback international sources
  { url: 'https://www.investing.com/rss/news.rss', source: 'Investing.com' },
]

// Keywords to detect sentiment
const BULLISH_KEYWORDS = ['surge', 'rally', 'gain', 'rise', 'jump', 'soar', 'high', 'growth', 'bullish', 'positive', 'up', 'record', 'profit', 'beat']
const BEARISH_KEYWORDS = ['fall', 'drop', 'crash', 'decline', 'plunge', 'low', 'loss', 'bearish', 'negative', 'down', 'slump', 'miss', 'fear', 'concern']

// Asset keywords for matching
const ASSET_KEYWORDS: Record<string, string[]> = {
  'BTC': ['bitcoin', 'btc', 'crypto'],
  'ETH': ['ethereum', 'eth'],
  'GOLD': ['gold', 'ouro', 'xau'],
  'SILVER': ['silver', 'prata', 'xag'],
  'USD': ['dollar', 'dólar', 'usd', 'dxy'],
  'EUR': ['euro', 'eur'],
  'SP500': ['s&p 500', 's&p500', 'sp500', 'spx'],
  'NASDAQ': ['nasdaq', 'ndx', 'tech stocks'],
  'OIL': ['oil', 'crude', 'petróleo', 'wti', 'brent'],
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
          items.push({
            title: sanitizedTitle,
            summary: sanitizedDescription.slice(0, 500),
            source_url: validatedUrl,
            source: sanitizeText(source, 100),
            published_at: pubDate.toISOString(),
            sentiment: detectSentiment(fullText),
            impact: detectImpact(fullText),
            assets: detectAssets(fullText),
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
      for (const assetSymbol of newsItem.assets) {
        const assetId = assetMap.get(assetSymbol)
        if (assetId) {
          await supabase.from('news_assets').insert({
            news_id: insertedNews.id,
            asset_id: assetId,
            expected_impact: newsItem.sentiment,
          })
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
