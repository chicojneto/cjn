import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { DEFAULT_TZ, TZ_PRESETS, type TzPreset } from '@/lib/timezones';

interface TimezoneCtx {
  tz: TzPreset;
  setTz: (tz: TzPreset) => void;
}

const Ctx = createContext<TimezoneCtx>({ tz: DEFAULT_TZ, setTz: () => {} });

const STORAGE_KEY = 'pbcc.tz';

export function TimezoneProvider({ children }: { children: ReactNode }) {
  const [tz, setTzState] = useState<TzPreset>(() => {
    if (typeof window === 'undefined') return DEFAULT_TZ;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return TZ_PRESETS.find((t) => t.id === saved) ?? DEFAULT_TZ;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, tz.id);
    }
  }, [tz]);

  const setTz = (next: TzPreset) => setTzState(next);

  return <Ctx.Provider value={{ tz, setTz }}>{children}</Ctx.Provider>;
}

export function useTimezone() {
  return useContext(Ctx);
}
