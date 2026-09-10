import { Sunrise, BarChart3, Globe2, NotebookPen, type LucideIcon } from 'lucide-react';

export interface NavDestination {
  title: string;
  url: string;
  icon: LucideIcon;
}

export const navDestinations: NavDestination[] = [
  { title: 'Sessões', url: '/', icon: Globe2 },
  { title: 'Manhã', url: '/manha', icon: Sunrise },
  { title: 'Mercados', url: '/mercados', icon: BarChart3 },
  { title: 'Playbook', url: '/playbook', icon: NotebookPen },
];
