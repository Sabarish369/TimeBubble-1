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
  // Pro colors
  lime: 'hsl(var(--bubble-lime))',
  coral: 'hsl(var(--bubble-coral))',
  canary: 'hsl(var(--bubble-canary))',
  aqua: 'hsl(var(--bubble-aqua))',
  indigo: 'hsl(var(--bubble-indigo))',
  teal: 'hsl(var(--bubble-teal))',
  crimson: 'hsl(var(--bubble-crimson))',
  amber: 'hsl(var(--bubble-amber))',
};

export const FREE_COLOR_NAMES = ['mint', 'lavender', 'peach', 'sky-blue', 'rose-gold'] as const;
export const PRO_COLOR_NAMES = ['lime', 'coral', 'canary', 'aqua', 'indigo', 'teal', 'crimson', 'amber'] as const;

export const DEFAULT_BUBBLE_COLOR = 'lavender';
export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 3;
