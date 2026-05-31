import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  compliant: { label: 'Compliant', className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' },
  active: { label: 'Active', className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' },
  expiring_soon: { label: 'Expiring Soon', className: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800' },
  expiring: { label: 'Expiring', className: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800' },
  expired: { label: 'Expired', className: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-800' },
  non_compliant: { label: 'Non-Compliant', className: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-800' },
  pending: { label: 'Pending', className: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800' },
  pending_review: { label: 'Pending Review', className: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800' },
  completed: { label: 'Completed', className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700' },
  on_hold: { label: 'On Hold', className: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800' },
  unknown: { label: 'Unknown', className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700' },
  low: { label: 'Low Risk', className: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-800' },
  medium: { label: 'Medium Risk', className: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800' },
  high: { label: 'High Risk', className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' },
};

export function StatusDot({ status }: { status: string }) {
  const color =
    status === 'compliant' || status === 'active' ? 'bg-emerald-500' :
    status === 'expired' || status === 'non_compliant' ? 'bg-red-500' :
    status === 'pending' || status === 'pending_review' || status === 'expiring' || status === 'expiring_soon' ? 'bg-amber-500' :
    'bg-slate-400';
  return <span className={cn('size-2 rounded-full shrink-0', color)} />;
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.unknown;
  return <Badge variant="outline" className={cn('text-xs font-medium', config.className, className)}>{config.label}</Badge>;
}

export function ComplianceBadge({ className }: { className?: string }) {
  return <Badge variant="outline" className={cn('text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800', className)}>Compliant</Badge>;
}
