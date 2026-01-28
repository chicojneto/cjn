import { useNewsWithAssets } from '@/hooks/useNews';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ExternalLink, TrendingUp, TrendingDown, Minus, Clock, Newspaper } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { ModernCard, ModernCardHeader, ModernCardTitle, ModernCardContent } from '@/components/ui/modern-card';

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

const impactBadgeStyles = {
  high: 'bg-destructive/15 text-destructive border-destructive/30',
  medium: 'bg-warning/15 text-warning border-warning/30',
  low: 'bg-muted/50 text-muted-foreground border-muted',
};

export function NewsFeed({ limit = 20, compact = false, selectedAssetId }: NewsFeedProps) {
  const { data: news, isLoading } = useNewsWithAssets(limit);

  const filteredNews = selectedAssetId 
    ? news?.filter(item => 
        item.news_assets?.some((na: any) => na.asset_id === selectedAssetId)
      )
    : news;

  if (isLoading) {
    return (
      <ModernCard variant="elevated">
        <ModernCardHeader icon={<Newspaper className="h-4 w-4" />}>
          <ModernCardTitle>Notícias</ModernCardTitle>
        </ModernCardHeader>
        <ModernCardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        </ModernCardContent>
      </ModernCard>
    );
  }

  if (!filteredNews?.length) {
    return (
      <ModernCard variant="elevated">
        <ModernCardHeader icon={<Newspaper className="h-4 w-4" />}>
          <ModernCardTitle>Notícias</ModernCardTitle>
        </ModernCardHeader>
        <ModernCardContent>
          <div className="text-center py-12">
            <div className="w-12 h-12 mx-auto rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <Newspaper className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">
              {selectedAssetId ? 'Nenhuma notícia para este ativo' : 'Nenhuma notícia disponível'}
            </p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              {selectedAssetId 
                ? 'Clique em outro ativo ou desselecione para ver todas' 
                : 'As notícias aparecerão aqui quando forem capturadas'}
            </p>
          </div>
        </ModernCardContent>
      </ModernCard>
    );
  }

  return (
    <ModernCard variant="elevated">
      <ModernCardHeader 
        icon={<Newspaper className="h-4 w-4" />}
        badge={
          <div className="flex items-center gap-2">
            {selectedAssetId && (
              <Badge variant="outline" className="text-[10px] font-mono border-primary/50 text-primary">
                Filtrado
              </Badge>
            )}
            <Badge variant="secondary" className="text-[10px] font-mono">
              {filteredNews.length}
            </Badge>
          </div>
        }
      >
        <ModernCardTitle>Notícias</ModernCardTitle>
      </ModernCardHeader>
      <ModernCardContent className="p-0">
        <ScrollArea className={compact ? 'h-[400px]' : 'h-[500px]'}>
          <div className="space-y-1 p-4">
            {filteredNews.map((item, idx) => {
              const SentimentIcon = item.sentiment ? sentimentIcons[item.sentiment] : Minus;
              
              return (
                <motion.article 
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: idx * 0.03 }}
                  className="group p-4 rounded-xl bg-secondary/20 border border-border/30 hover:border-primary/30 hover:bg-secondary/40 transition-all duration-300"
                >
                  <div className="flex items-start gap-3">
                    {/* Sentiment Icon */}
                    {item.sentiment && (
                      <div className={cn(
                        "shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
                        item.sentiment === 'bullish' && "bg-success/10",
                        item.sentiment === 'bearish' && "bg-destructive/10",
                        item.sentiment === 'neutral' && "bg-muted/50"
                      )}>
                        <SentimentIcon 
                          className={cn('h-4 w-4', sentimentColors[item.sentiment])} 
                        />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      {/* Impact Badge */}
                      {item.impact && (
                        <Badge 
                          variant="outline" 
                          className={cn('text-[10px] mb-2', impactBadgeStyles[item.impact])}
                        >
                          {item.impact.toUpperCase()}
                        </Badge>
                      )}
                      
                      {/* Title */}
                      <h3 className="font-medium text-sm leading-snug mb-2 text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {item.title}
                      </h3>
                      
                      {/* Summary */}
                      {!compact && item.summary && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
                          {item.summary}
                        </p>
                      )}
                      
                      {/* Meta */}
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="font-mono font-medium">{item.source}</span>
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
                            className="hover:text-primary transition-colors ml-auto"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                      
                      {/* Asset Tags */}
                      {item.news_assets && item.news_assets.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {item.news_assets.map((na: any) => (
                            <Badge 
                              key={na.id} 
                              variant="outline" 
                              className={cn(
                                'text-[10px] font-mono',
                                na.expected_impact === 'bullish' && 'border-success/50 text-success bg-success/5',
                                na.expected_impact === 'bearish' && 'border-destructive/50 text-destructive bg-destructive/5',
                                na.expected_impact === 'neutral' && 'border-muted bg-muted/20'
                              )}
                            >
                              {na.assets?.symbol}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </ScrollArea>
      </ModernCardContent>
    </ModernCard>
  );
}
