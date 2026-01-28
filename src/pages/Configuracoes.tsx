import { motion } from 'framer-motion';
import { Settings, Bell, Palette, Clock, Shield } from 'lucide-react';
import { ModernCard, ModernCardHeader, ModernCardTitle, ModernCardContent } from '@/components/ui/modern-card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

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

export default function Configuracoes() {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6 max-w-3xl"
    >
      {/* Page Header */}
      <motion.div variants={item}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Settings className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Configurações
            </h1>
            <p className="text-sm text-muted-foreground">
              Personalize sua experiência no portal
            </p>
          </div>
        </div>
      </motion.div>

      {/* Notifications */}
      <motion.section variants={item}>
        <ModernCard variant="elevated">
          <ModernCardHeader icon={<Bell className="h-4 w-4" />}>
            <ModernCardTitle>Notificações</ModernCardTitle>
          </ModernCardHeader>
          <ModernCardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Alertas de eventos econômicos</Label>
                <p className="text-xs text-muted-foreground">Receba notificações de eventos de alto impacto</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Alertas de preço</Label>
                <p className="text-xs text-muted-foreground">Notificações quando ativos atingem níveis definidos</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Resumo diário</Label>
                <p className="text-xs text-muted-foreground">Receba um resumo do mercado por email</p>
              </div>
              <Switch />
            </div>
          </ModernCardContent>
        </ModernCard>
      </motion.section>

      {/* Appearance */}
      <motion.section variants={item}>
        <ModernCard variant="elevated">
          <ModernCardHeader icon={<Palette className="h-4 w-4" />}>
            <ModernCardTitle>Aparência</ModernCardTitle>
          </ModernCardHeader>
          <ModernCardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Tema escuro</Label>
                <p className="text-xs text-muted-foreground">Otimizado para longas sessões</p>
              </div>
              <Switch defaultChecked disabled />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Animações</Label>
                <p className="text-xs text-muted-foreground">Transições suaves entre elementos</p>
              </div>
              <Switch defaultChecked />
            </div>
          </ModernCardContent>
        </ModernCard>
      </motion.section>

      {/* Auto Refresh */}
      <motion.section variants={item}>
        <ModernCard variant="elevated">
          <ModernCardHeader icon={<Clock className="h-4 w-4" />}>
            <ModernCardTitle>Atualização Automática</ModernCardTitle>
          </ModernCardHeader>
          <ModernCardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Cotações em tempo real</Label>
                <p className="text-xs text-muted-foreground">Atualização a cada 30 segundos</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Notícias automáticas</Label>
                <p className="text-xs text-muted-foreground">Buscar notícias a cada 5 minutos</p>
              </div>
              <Switch defaultChecked />
            </div>
          </ModernCardContent>
        </ModernCard>
      </motion.section>
    </motion.div>
  );
}
