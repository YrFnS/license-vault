import type { Variants } from 'framer-motion';

export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
};

export const categoryColors: Record<string, string> = {
  safety: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border-red-200 dark:border-red-800',
  technical: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400 border-teal-200 dark:border-teal-800',
  business: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  ethics: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  general: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
};

export const CATEGORIES = ['safety', 'technical', 'business', 'ethics', 'general'] as const;

export function getCardGradient(color: string): string {
  switch (color) {
    case 'teal': return 'from-teal-50/90 via-teal-50/60 to-teal-100/40 dark:from-teal-950/40 dark:via-teal-950/20 dark:to-teal-900/10';
    case 'emerald': return 'from-emerald-50/90 via-emerald-50/60 to-emerald-100/40 dark:from-emerald-950/40 dark:via-emerald-950/20 dark:to-emerald-900/10';
    case 'amber': return 'from-amber-50/90 via-amber-50/60 to-amber-100/40 dark:from-amber-950/40 dark:via-amber-950/20 dark:to-amber-900/10';
    default: return 'from-emerald-50/90 via-emerald-50/60 to-emerald-100/40 dark:from-emerald-950/40 dark:via-emerald-950/20 dark:to-emerald-900/10';
  }
}

export function getCardBorder(color: string): string {
  switch (color) {
    case 'teal': return 'border-s-teal-400 dark:border-s-teal-600';
    case 'emerald': return 'border-s-emerald-400 dark:border-s-emerald-600';
    case 'amber': return 'border-s-amber-400 dark:border-s-amber-600';
    default: return 'border-s-emerald-400 dark:border-s-emerald-600';
  }
}

export function getCardIconBg(color: string): string {
  switch (color) {
    case 'teal': return 'bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400';
    case 'emerald': return 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400';
    case 'amber': return 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400';
    default: return 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400';
  }
}
