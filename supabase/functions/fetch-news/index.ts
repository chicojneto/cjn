import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// RSS feeds from financial news sites
const RSS_FEEDS = [
  { url: 'https://www.investing.com/rss/news.rss', source: 'Investing.com' },
  { url: 'https://feeds.bloomberg.com/markets/news.rss', source: 'Bloomberg' },
  { url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html', source: 'CNBC' },
  { url: 'https://feeds.reuters.com/reuters/businessNews', source: 'Reuters' },
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
        const fullText = `${title} ${description}`
        items.push({
          title: title.trim(),
          summary: description.trim().slice(0, 500),
          source_url: link.trim(),
          source,
          published_at: pubDate.toISOString(),
          sentiment: detectSentiment(fullText),
          impact: detectImpact(fullText),
          assets: detectAssets(fullText),
        })
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
