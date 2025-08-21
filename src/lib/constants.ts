export const HOUR_HEIGHT = 100; // pixels
export const TOTAL_HOURS = 24;
export const SIDEBAR_WIDTH = 288; // w-72
export const BUBBLE_COLORS = {
  // Free colors
  mint: 'hsl(var(--bubble-mint))',
  lavender: 'hsl(var(--bubble-lavender))',
  peach: 'hsl(var(--bubble-peach))',
  'sky-blue': 'hsl(var(--bubble-sky-blue))',
  'rose-gold': 'hsl(var(--bubble-rose-gold))',
  lime: 'hsl(var(--bubble-lime))',
  coral: 'hsl(var(--bubble-coral))',
  canary: 'hsl(var(--bubble-canary))',
  aqua: 'hsl(var(--bubble-aqua))',
  // Pro colors
  indigo: 'hsl(var(--bubble-indigo))',
  teal: 'hsl(var(--bubble-teal))',
  crimson: 'hsl(var(--bubble-crimson))',
  amber: 'hsl(var(--bubble-amber))',
};

export const FREE_COLOR_NAMES = ['mint', 'lavender', 'peach', 'sky-blue', 'rose-gold', 'lime', 'coral', 'canary', 'aqua'] as const;
export const PRO_COLOR_NAMES = ['indigo', 'teal', 'crimson', 'amber'] as const;

export const DEFAULT_BUBBLE_COLOR = 'lavender';
export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 3;
