import { useEffect, useState } from 'react';
import type { Transition, Variants } from 'framer-motion';

/**
 * Motion tokens — one source of truth for the whole app.
 * Mirrors the CSS custom properties in index.css (--ease-out etc.).
 */
export const EASE_OUT = [0.23, 1, 0.32, 1] as const;
export const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const;
export const EASE_DRAWER = [0.32, 0.72, 0, 1] as const;

/** Default for every framer-motion animation (wired in <MotionConfig>). */
export const defaultTransition: Transition = { duration: 0.2, ease: EASE_OUT };

/**
 * Page entrance: short, crisp stagger.
 * Uses full transform strings (not x/y shorthands) so the animation stays
 * on the compositor while the page is also fetching market data.
 */
export const pageContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.15, ease: EASE_OUT, staggerChildren: 0.035 },
  },
};

export const pageItem: Variants = {
  hidden: { opacity: 0, transform: 'translateY(6px)' },
  show: {
    opacity: 1,
    transform: 'translateY(0px)',
    transition: { duration: 0.22, ease: EASE_OUT },
  },
};

/**
 * The portal is opened many times a day. The stagger plays on the first page
 * of the session only; after that, navigating between pages is instant —
 * same idea as tooltips skipping their delay once one has been shown.
 */
let hasEnteredOnce = false;

export function usePageEntrance(): 'hidden' | false {
  const [initial] = useState<'hidden' | false>(() => (hasEnteredOnce ? false : 'hidden'));
  useEffect(() => {
    hasEnteredOnce = true;
  }, []);
  return initial;
}
