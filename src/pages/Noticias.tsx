import { motion } from 'framer-motion';
import { NewsFeed } from '@/components/dashboard/NewsFeed';
import { Newspaper, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAutoFetchNews } from '@/hooks/useAutoFetchNews';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function Noticias() {
  useAutoFetchNews();

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Page Header */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Newspaper className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Notícias
            </h1>
            <p className="text-sm text-muted-foreground">
              Últimas notícias do mercado financeiro
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="h-4 w-4" />
          Filtrar
        </Button>
      </motion.div>

      {/* News Feed */}
      <motion.section variants={item}>
        <NewsFeed limit={50} />
      </motion.section>
    </motion.div>
  );
}
