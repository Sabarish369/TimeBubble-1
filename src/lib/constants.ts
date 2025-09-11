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
  // Additional Pro colors
  emerald: 'hsl(var(--bubble-emerald))',
  sapphire: 'hsl(var(--bubble-sapphire))',
  ruby: 'hsl(var(--bubble-ruby))',
  topaz: 'hsl(var(--bubble-topaz))',
  amethyst: 'hsl(var(--bubble-amethyst))',
  turquoise: 'hsl(var(--bubble-turquoise))',
  magenta: 'hsl(var(--bubble-magenta))',
  chartreuse: 'hsl(var(--bubble-chartreuse))',
  bronze: 'hsl(var(--bubble-bronze))',
  platinum: 'hsl(var(--bubble-platinum))',
  rose: 'hsl(var(--bubble-rose))',
  violet: 'hsl(var(--bubble-violet))',
  gold: 'hsl(var(--bubble-gold))',
  silver: 'hsl(var(--bubble-silver))',
  copper: 'hsl(var(--bubble-copper))',
  jade: 'hsl(var(--bubble-jade))',
  onyx: 'hsl(var(--bubble-onyx))',
  pearl: 'hsl(var(--bubble-pearl))',
  opal: 'hsl(var(--bubble-opal))',
  diamond: 'hsl(var(--bubble-diamond))',
};

export const FREE_COLOR_NAMES = ['mint', 'lavender', 'peach', 'sky-blue', 'rose-gold'] as const;
export const PRO_COLOR_NAMES = [
  'lime', 'coral', 'canary', 'aqua', 'indigo', 'teal', 'crimson', 'amber',
  'emerald', 'sapphire', 'ruby', 'topaz', 'amethyst', 'turquoise', 'magenta', 'chartreuse',
  'bronze', 'platinum', 'rose', 'violet', 'gold', 'silver', 'copper', 'jade',
  'onyx', 'pearl', 'opal', 'diamond'
] as const;

export const DEFAULT_BUBBLE_COLOR = 'lavender';
export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 3;
