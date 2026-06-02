'use client';

import { ShieldCheck, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35 },
};

export function getComplianceColor(score: number) {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#f59e0b';
  return '#ef4444';
}

export function getComplianceIcon(score: number) {
  if (score >= 80) return <ShieldCheck className="size-4 text-emerald-500" />;
  if (score >= 60) return <ShieldAlert className="size-4 text-amber-500" />;
  return <ShieldAlert className="size-4 text-red-500" />;
}

export function getPlanBadge(plan: string, labelPro: string, labelEnterprise: string, labelFree: string) {
  switch (plan) {
    case 'pro':
      return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">{labelPro}</Badge>;
    case 'enterprise':
      return <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 border-teal-200 dark:border-teal-800">{labelEnterprise}</Badge>;
    default:
      return <Badge variant="secondary">{labelFree}</Badge>;
  }
}
