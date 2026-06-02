export const RISK_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f59e0b',
  medium: '#14b8a6',
  low: '#10b981',
};

export const SCORE_RANGES = [
  { name: '0-25', color: '#ef4444' },
  { name: '25-50', color: '#f59e0b' },
  { name: '50-75', color: '#14b8a6' },
  { name: '75-100', color: '#10b981' },
] as const;

export const RISK_BADGE_CONFIG: Record<string, { bg: string; text: string }> = {
  critical: { bg: 'bg-red-100 dark:bg-red-950/30', text: 'text-red-700 dark:text-red-400' },
  high: { bg: 'bg-amber-100 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-400' },
  medium: { bg: 'bg-teal-100 dark:bg-teal-950/30', text: 'text-teal-700 dark:text-teal-400' },
  low: { bg: 'bg-emerald-100 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-400' },
};
