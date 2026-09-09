import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { navDestinations } from './navDestinations';
import { Settings, CalendarDays } from 'lucide-react';

interface SearchCommandProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const extras = [
  { title: 'Calendário econômico', url: '/calendario', icon: CalendarDays },
  { title: 'Configurações', url: '/configuracoes', icon: Settings },
];

export function SearchCommand({ open, onOpenChange }: SearchCommandProps) {
  const navigate = useNavigate();

  const go = (url: string) => {
    onOpenChange(false);
    navigate(url);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Buscar páginas..." />
      <CommandList>
        <CommandEmpty>Nada encontrado.</CommandEmpty>
        <CommandGroup heading="Ir para">
          {navDestinations.map((d) => (
            <CommandItem key={d.url} value={d.title} onSelect={() => go(d.url)}>
              <d.icon className="mr-2 h-4 w-4" />
              {d.title}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Outros">
          {extras.map((d) => (
            <CommandItem key={d.url} value={d.title} onSelect={() => go(d.url)}>
              <d.icon className="mr-2 h-4 w-4" />
              {d.title}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
