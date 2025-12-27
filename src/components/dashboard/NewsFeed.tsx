import { useNewsWithAssets } from '@/hooks/useNews';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ExternalLink, TrendingUp, TrendingDown, Minus, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NewsFeedProps {
  limit?: number;
  compact?: boolean;
  selectedAssetId?: string | null;
}

const sentimentIcons = {
  bullish: TrendingUp,
  bearish: TrendingDown,
  neutral: Minus,
};

const sentimentColors = {
  bullish: 'text-success',
  bearish: 'text-destructive',
  neutral: 'text-muted-foreground',
};

const impactColors = {
  high: 'bg-destructive/20 text-destructive border-destructive/30',
  medium: 'bg-warning/20 text-warning border-warning/30',
  low: 'bg-muted text-muted-foreground',
};

export function NewsFeed({ limit = 20, compact = false, selectedAssetId }: NewsFeedProps) {
  const { data: news, isLoading } = useNewsWithAssets(limit);

  // Filter news by selected asset if one is selected
  const filteredNews = selectedAssetId 
    ? news?.filter(item => 
        item.news_assets?.some((na: any) => na.asset_id === selectedAssetId)
      )
    : news;

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">Notícias</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!filteredNews?.length) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">Notícias</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>{selectedAssetId ? 'Nenhuma notícia para este ativo' : 'Nenhuma notícia disponível'}</p>
            <p className="text-sm mt-1">
              {selectedAssetId 
                ? 'Clique em outro ativo ou desselecione para ver todas' 
                : 'As notícias aparecerão aqui quando forem capturadas'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <span>Notícias</span>
          {selectedAssetId && (
            <Badge variant="outline" className="text-xs font-mono border-primary/50 text-primary">
              Filtrado
            </Badge>
          )}
          <Badge variant="secondary" className="text-xs font-mono">
            {filteredNews.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className={compact ? 'h-[400px]' : 'h-[600px]'}>
          <div className="space-y-4 pr-4">
            {filteredNews.map((item) => {
              const SentimentIcon = item.sentiment ? sentimentIcons[item.sentiment] : Minus;
              
              return (
                <article 
                  key={item.id} 
                  className="p-4 rounded-lg bg-secondary/30 border border-border/50 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {item.sentiment && (
                          <SentimentIcon 
                            className={cn('h-4 w-4 shrink-0', sentimentColors[item.sentiment])} 
                          />
                        )}
                        {item.impact && (
                          <Badge 
                            variant="outline" 
                            className={cn('text-[10px]', impactColors[item.impact])}
                          >
                            {item.impact.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                      
                      <h3 className="font-medium text-sm leading-tight mb-2 line-clamp-2">
                        {item.title}
                      </h3>
                      
                      {!compact && item.summary && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                          {item.summary}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="font-mono">{item.source}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(item.published_at), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </span>
                        {item.source_url && (
                          <a 
                            href={item.source_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:text-primary transition-colors"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      
                      {item.news_assets && item.news_assets.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {item.news_assets.map((na: any) => (
                            <Badge 
                              key={na.id} 
                              variant="outline" 
                              className={cn(
                                'text-[10px] font-mono',
                                na.expected_impact === 'bullish' && 'border-success/50 text-success',
                                na.expected_impact === 'bearish' && 'border-destructive/50 text-destructive',
                                na.expected_impact === 'neutral' && 'border-muted'
                              )}
                            >
                              {na.assets?.symbol}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}