import { Sunrise, BarChart3, NotebookPen, type LucideIcon } from 'lucide-react';

export interface NavDestination {
  title: string;
  url: string;
  icon: LucideIcon;
}

export const navDestinations: NavDestination[] = [
  { title: 'Manhã', url: '/manha', icon: Sunrise },
  { title: 'Mercados', url: '/mercados', icon: BarChart3 },
  { title: 'Playbook', url: '/playbook', icon: NotebookPen },
];
