/** Shared brand color tokens — single source of truth for the design system. */

export const BRAND = {
  /** Primary violet used in banners, active states, and buttons */
  violet: '#7C3AED',
  /** Lighter violet for banner gradients */
  violetLight: '#A78BFA',
  /** Darkest violet for gradient endpoints */
  violetDark: '#6D28D9',

  /** Teal accent for badges and completed-state borders */
  teal: '#4DD9C0',
  /** Completed / mint stat color */
  mint: '#56C9A0',
  /** Success green */
  green: '#22C55E',

  /** Cyan for naesin-related highlights */
  cyan: '#06B6D4',
  /** Amber for warnings and secondary stats */
  amber: '#F59E0B',
  /** Sky for supplementary stats */
  sky: '#0EA5E9',

  /** Step card backgrounds and borders */
  step: {
    defaultBg: '#D9F7FC',
    defaultBorder: '#CCFAF4',
    activeBorder: '#7C3AED',
    doneBorder: '#4DD9C0',
  },

  /** Wrong-word section styling */
  wrong: {
    bg: '#FFF0F3',
    border3: '#F43F5E',
    border2: '#FB7185',
    border1: '#FCA5A5',
    badge: '#FFE4E6',
  },

  /** Progress bar colors */
  progress: {
    done: '#56C9A0',
    doneEnd: '#4DD9C0',
    active: '#7C3AED',
  },
} as const;

/** Stat card color presets used across dashboards */
export const STAT_COLORS = {
  violet: BRAND.violet,
  cyan: BRAND.cyan,
  mint: BRAND.mint,
  amber: BRAND.amber,
} as const;

/** Activity calendar dot colors */
export const DOT_COLORS = {
  voca: BRAND.violet,
  naesin: BRAND.cyan,
  mixed: BRAND.amber,
} as const;
