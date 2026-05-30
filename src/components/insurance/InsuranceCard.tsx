'use client';

import {
  Shield,
  FileText,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface InsuranceCardProps {
  insurance: {
    id: string;
    name: string;
    type: string;
    policyNumber: string;
    provider: string;
    coverageAmount: number;
    premiumAmount: number;
    status: string;
    complianceStatus: string;
    expirationDate: string;
    additionalInsured: boolean;
    primaryNoncontrib: boolean;
    waiverSubrogation: boolean;
    endorsementTypes?: string | null;
    perOccurrenceLimit: number;
    aggregateLimit: number;
  };
  onClick?: (id: string) => void;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
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

function getExpiryColor(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'text-red-600 dark:text-red-400';
  if (diffDays <= 30) return 'text-amber-600 dark:text-amber-400';
  return 'text-emerald-600 dark:text-emerald-400';
}

function getTypeBadge(type: string) {
  const isBond = type.toLowerCase() === 'bond';
  return (
    <Badge
      variant="outline"
      className={cn(
        'text-xs',
        isBond
          ? 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-800'
          : 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'
      )}
    >
      {isBond ? 'Bond' : 'Insurance'}
    </Badge>
  );
}

function EndorsementCheck({ active, label }: { active: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      {active ? (
        <CheckCircle2 className="size-3.5 text-emerald-500" />
      ) : (
        <XCircle className="size-3.5 text-muted-foreground/30" />
      )}
      <span className={active ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground/50'}>
        {label}
      </span>
    </div>
  );
}

export function InsuranceCard({ insurance, onClick }: InsuranceCardProps) {
  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all duration-300',
        'hover:shadow-lg hover:-translate-y-0.5',
        'cursor-pointer border-border/50',
        onClick && 'hover:border-emerald-200 dark:hover:border-emerald-800/50'
      )}
      onClick={() => onClick?.(insurance.id)}
    >
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-base truncate">{insurance.name}</h3>
                {getTypeBadge(insurance.type)}
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                <Shield className="size-3.5 shrink-0 text-teal-500" />
                <span className="truncate">{insurance.provider}</span>
                <span className="text-muted-foreground/40 mx-1">•</span>
                <span className="font-mono text-xs">{insurance.policyNumber}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <StatusBadge status={insurance.complianceStatus} />
              <div className={cn('text-xs', getExpiryColor(insurance.expirationDate))}>
                Exp: {formatDate(insurance.expirationDate)}
              </div>
            </div>
          </div>

          {/* Amounts */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Coverage</span>
              <p className="text-sm font-semibold tabular-nums">{formatCurrency(insurance.coverageAmount)}</p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Premium</span>
              <p className="text-sm font-semibold tabular-nums">{formatCurrency(insurance.premiumAmount)}</p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Per Occurrence</span>
              <p className="text-sm font-medium tabular-nums text-muted-foreground">{formatCurrency(insurance.perOccurrenceLimit)}</p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Aggregate</span>
              <p className="text-sm font-medium tabular-nums text-muted-foreground">{formatCurrency(insurance.aggregateLimit)}</p>
            </div>
          </div>

          {/* COI Endorsements */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 border-t border-border/50">
            <EndorsementCheck active={insurance.additionalInsured} label="Additional Insured" />
            <EndorsementCheck active={insurance.primaryNoncontrib} label="Primary Non-Contrib" />
            <EndorsementCheck active={insurance.waiverSubrogation} label="Waiver of Subrogation" />
          </div>

          {/* Endorsement types */}
          {insurance.endorsementTypes && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <FileText className="size-3 shrink-0" />
              <span className="truncate">{insurance.endorsementTypes}</span>
            </div>
          )}
        </div>
      </CardContent>

      {/* Hover accent bar */}
      <div className="absolute bottom-0 inset-x-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-start" />
    </Card>
  );
}
