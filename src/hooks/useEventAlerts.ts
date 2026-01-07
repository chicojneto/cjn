import { useEffect, useRef, useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface HighImpactEvent {
  id: string;
  title: string;
  event_date: string;
  country: string | null;
  impact: string | null;
}

const ALERT_BEFORE_MINUTES = 5;
const CHECK_INTERVAL_MS = 30000; // Check every 30 seconds

// Audio context for alarm sound
let audioContext: AudioContext | null = null;

function playAlertSound() {
  try {
    // Create audio context on first use (requires user interaction first)
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    // Create oscillator for alarm sound
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Alarm pattern: two-tone beep
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.3);
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.4);

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (error) {
    console.error('Error playing alert sound:', error);
  }
}

export function useEventAlerts(enabled = true) {
  const alertedEventsRef = useRef<Set<string>>(new Set());
  const [lastAlert, setLastAlert] = useState<HighImpactEvent | null>(null);

  // Fetch high impact events for today
  const { data: events } = useQuery({
    queryKey: ['high-impact-events-today'],
    queryFn: async () => {
      const now = new Date();
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(now);
      todayEnd.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('economic_events')
        .select('id, title, event_date, country, impact')
        .gte('event_date', todayStart.toISOString())
        .lte('event_date', todayEnd.toISOString())
        .eq('impact', 'high') // Only high impact events (3 stars)
        .in('country', ['US', 'USA', 'United States']) // Only USA events
        .order('event_date', { ascending: true });

      if (error) throw error;
      return data as HighImpactEvent[];
    },
    refetchInterval: 60000, // Refresh events list every minute
    enabled,
  });

  const checkForUpcomingEvents = useCallback(() => {
    if (!events || events.length === 0) return;

    const now = new Date();
    const alertThreshold = ALERT_BEFORE_MINUTES * 60 * 1000; // 5 minutes in ms

    events.forEach((event) => {
      const eventTime = new Date(event.event_date);
      const timeUntilEvent = eventTime.getTime() - now.getTime();

      // Check if event is within alert window and hasn't been alerted yet
      if (
        timeUntilEvent > 0 &&
        timeUntilEvent <= alertThreshold &&
        !alertedEventsRef.current.has(event.id)
      ) {
        // Mark as alerted
        alertedEventsRef.current.add(event.id);
        setLastAlert(event);

        // Play sound
        playAlertSound();

        // Show toast
        const minutesLeft = Math.ceil(timeUntilEvent / 60000);
        const countryFlag = getCountryFlag(event.country);

        toast.warning(
          `⚠️ ALERTA: Evento de Alto Impacto em ${minutesLeft} min!`,
          {
            description: `${countryFlag} ${event.title}`,
            duration: 10000, // Show for 10 seconds
          }
        );

        console.log(`🔔 Alert triggered for: ${event.title} in ${minutesLeft} minutes`);
      }
    });
  }, [events]);

  // Check for upcoming events periodically
  useEffect(() => {
    if (!enabled) return;

    // Initial check
    checkForUpcomingEvents();

    // Set up interval
    const intervalId = setInterval(checkForUpcomingEvents, CHECK_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [enabled, checkForUpcomingEvents]);

  // Clean up old alerted events (from previous days)
  useEffect(() => {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    // This runs once per day to clean up the set
    alertedEventsRef.current.clear();
  }, []);

  return {
    upcomingHighImpactEvents: events || [],
    lastAlert,
    alertedCount: alertedEventsRef.current.size,
  };
}

function getCountryFlag(country: string | null): string {
  if (!country) return '🌍';
  
  const flags: Record<string, string> = {
    'US': '🇺🇸',
    'USA': '🇺🇸',
    'United States': '🇺🇸',
    'BR': '🇧🇷',
    'Brazil': '🇧🇷',
    'Brasil': '🇧🇷',
    'EU': '🇪🇺',
    'EUR': '🇪🇺',
    'Eurozone': '🇪🇺',
    'DE': '🇩🇪',
    'Germany': '🇩🇪',
    'GB': '🇬🇧',
    'UK': '🇬🇧',
    'United Kingdom': '🇬🇧',
    'JP': '🇯🇵',
    'Japan': '🇯🇵',
    'CN': '🇨🇳',
    'China': '🇨🇳',
  };

  return flags[country] || '🌍';
}
