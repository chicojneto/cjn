import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Percent, Save } from 'lucide-react';
import { ModernCard, ModernCardHeader, ModernCardTitle, ModernCardContent } from '@/components/ui/modern-card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useDiCurve, DI_FIELDS, DiCurveRow } from '@/hooks/useDiCurve';
import { ManualStamp } from '@/components/shared/ManualStamp';

type FormState = Record<string, string>;

const FIELDS = [{ key: 'cdi', label: 'CDI' }, ...DI_FIELDS.map((f) => ({ key: f.key as string, label: f.label }))];

export function DiCurveEditor() {
  const { data: row } = useDiCurve();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!row) return;
    const next: FormState = {};
    FIELDS.forEach(({ key }) => {
      const v = (row as unknown as Record<string, number | null>)[key];
      next[key] = v === null || v === undefined ? '' : String(v);
    });
    setForm(next);
  }, [row]);

  const handleSave = async () => {
    setSaving(true);
    const payload: Record<string, number | null | string> = { updated_at: new Date().toISOString() };
    for (const { key, label } of FIELDS) {
      const raw = (form[key] ?? '').replace(',', '.').trim();
      if (raw === '') {
        payload[key] = null;
        continue;
      }
      const num = Number(raw);
      if (!isFinite(num)) {
        toast.error(`Valor inválido em ${label}`);
        setSaving(false);
        return;
      }
      payload[key] = num;
    }

    const query = row?.id
      ? supabase.from('di_curve_manual').update(payload).eq('id', row.id)
      : supabase.from('di_curve_manual').insert(payload as never);

    const { error } = await query;
    setSaving(false);
    if (error) {
      toast.error('Não foi possível salvar: ' + error.message);
      return;
    }
    toast.success('Curva DI atualizada');
    queryClient.invalidateQueries({ queryKey: ['di-curve-manual'] });
  };

  return (
    <ModernCard variant="elevated">
      <ModernCardHeader icon={<Percent className="h-4 w-4" />}>
        <ModernCardTitle>Curva DI (atualização manual)</ModernCardTitle>
      </ModernCardHeader>
      <ModernCardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Informe as taxas em % ao ano. Esses valores aparecem em Juros Brasil e na aba Mercados.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {FIELDS.map(({ key, label }) => (
            <div key={key} className="space-y-1">
              <Label className="text-[11px] font-mono uppercase text-muted-foreground">{label}</Label>
              <Input
                inputMode="decimal"
                placeholder="—"
                value={form[key] ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                className="font-mono text-sm"
              />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between pt-1">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase text-muted-foreground">Atualizado em</span>
            <ManualStamp updatedAt={row?.updated_at} />
          </div>
          <Button onClick={handleSave} disabled={saving} size="sm">
            <Save className="h-4 w-4 mr-1" />
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </ModernCardContent>
    </ModernCard>
  );
}

export type { DiCurveRow };
