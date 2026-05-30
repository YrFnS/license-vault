'use client';

import {
  Building2,
  User,
  Wrench,
  Shield,
  ExternalLink,
  Award,
  Clock,
} from 'lucide-react';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SubcontractorCardProps {
  subcontractor: {
    id: string;
    companyName: string;
    contactName?: string | null;
    email?: string | null;
    tradeType?: string | null;
    complianceStatus: string;
    insuranceStatus: string;
    licenseNumber?: string | null;
    licenseState?: string | null;
    licenseExpiry?: string | null;
    uploadToken?: string | null;
  };
  onClick?: (id: string) => void;
}

function getExpiryColor(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'text-red-600 dark:text-red-400';
  if (diffDays <= 30) return 'text-amber-600 dark:text-amber-400';
  return 'text-emerald-600 dark:text-emerald-400';
}

function formatDate(date: string | null | undefined): string {
  if (!date) return '—';
  try {
    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}

function getInsuranceBadge(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    active: {
      label: 'Insured',
      className: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
    },
    expired: {
      label: 'Uninsured',
      className: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
    },
    pending: {
      label: 'Pending',
      className: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
    },
  };
  const config = map[status.toLowerCase()] ?? {
    label: status,
    className: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/30 dark:text-slate-400 dark:border-slate-700',
  };
  return <Badge variant="outline" className={cn('text-xs', config.className)}>{config.label}</Badge>;
}

export function SubcontractorCard({ subcontractor, onClick }: SubcontractorCardProps) {
  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all duration-300',
        'hover:shadow-lg hover:-translate-y-0.5',
        'cursor-pointer border-border/50',
        onClick && 'hover:border-emerald-200 dark:hover:border-emerald-800/50'
      )}
      onClick={() => onClick?.(subcontractor.id)}
    >
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-base truncate">{subcontractor.companyName}</h3>
                <StatusBadge status={subcontractor.complianceStatus} />
              </div>
              {subcontractor.tradeType && (
                <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                  <Wrench className="size-3.5 shrink-0 text-teal-500" />
                  <span>{subcontractor.tradeType}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {getInsuranceBadge(subcontractor.insuranceStatus)}
            </div>
          </div>

          {/* Contact info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
            {subcontractor.contactName && (
              <div className="flex items-center gap-1.5">
                <User className="size-3.5 shrink-0 text-emerald-500" />
                <span className="truncate">{subcontractor.contactName}</span>
              </div>
            )}
            {subcontractor.licenseNumber && (
              <div className="flex items-center gap-1.5">
                <Award className="size-3.5 shrink-0 text-teal-500" />
                <span className="truncate font-mono text-xs">
                  {subcontractor.licenseNumber}
                  {subcontractor.licenseState && (
                    <span className="ms-1 text-muted-foreground/60">({subcontractor.licenseState})</span>
                  )}
                </span>
              </div>
            )}
            {subcontractor.licenseExpiry && (
              <div className="flex items-center gap-1.5">
                <Clock className="size-3.5 shrink-0 text-muted-foreground/60" />
                <span className={cn('text-xs', getExpiryColor(subcontractor.licenseExpiry))}>
                  Exp: {formatDate(subcontractor.licenseExpiry)}
                </span>
              </div>
            )}
          </div>

          {/* Portal link indicator */}
          {subcontractor.uploadToken && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
              <ExternalLink className="size-3" />
              <span>Portal access enabled</span>
            </div>
          )}
        </div>
      </CardContent>

      {/* Hover accent bar */}
      <div className="absolute bottom-0 inset-x-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-start" />
    </Card>
  );
}
