import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-500';
  if (score >= 60) return 'text-amber-500';
  return 'text-red-500';
}

export function getScoreLabel(score: number, t: (key: string) => string): string {
  if (score >= 90) return t('scoreExcellent');
  if (score >= 80) return t('scoreGood');
  if (score >= 60) return t('scoreFair');
  if (score > 0) return t('scorePoor');
  return t('scoreNoData');
}

export function getScoreGradient(score: number): string {
  if (score >= 80) return 'from-emerald-500 to-teal-500';
  if (score >= 60) return 'from-amber-500 to-orange-500';
  return 'from-red-500 to-rose-500';
}

export function getScoreStrokeGradient(score: number): string {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#f59e0b';
  return '#ef4444';
}

export function getScoreTrackColor(score: number): string {
  if (score >= 80) return 'stroke-emerald-200 dark:stroke-emerald-900/50';
  if (score >= 60) return 'stroke-amber-200 dark:stroke-amber-900/50';
  return 'stroke-red-200 dark:stroke-red-900/50';
}

export function getScoreBgGradient(score: number): string {
  if (score >= 80) return 'from-emerald-50/80 to-teal-50/50 dark:from-emerald-950/30 dark:to-teal-900/20';
  if (score >= 60) return 'from-amber-50/80 to-orange-50/50 dark:from-amber-950/30 dark:to-orange-900/20';
  return 'from-red-50/80 to-rose-50/50 dark:from-red-950/30 dark:to-rose-900/20';
}

export function getScoreBorderColor(score: number): string {
  if (score >= 80) return 'border-emerald-200 dark:border-emerald-800';
  if (score >= 60) return 'border-amber-200 dark:border-amber-800';
  return 'border-red-200 dark:border-red-800';
}

export function getPriorityColor(priority: string): string {
  if (priority === 'high') return 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400';
  if (priority === 'medium') return 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400';
  return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400';
}

export function getPriorityLabel(priority: string): string {
  if (priority === 'high') return 'High';
  if (priority === 'medium') return 'Medium';
  return 'Low';
}

export function getScoreColorValue(score: number): string {
  if (score >= 80) return 'rgba(16,185,129,0.1)';
  if (score >= 60) return 'rgba(245,158,11,0.1)';
  return 'rgba(239,68,68,0.1)';
}
