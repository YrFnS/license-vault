'use client';

import {
  User,
  Mail,
  Phone,
  Award,
  Clock,
  BookOpen,
} from 'lucide-react';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface QualifierCardProps {
  qualifier: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string | null;
    phone?: string | null;
    licenseNumber?: string | null;
    licenseState?: string | null;
    licenseType?: string | null;
    licenseExpiry?: string | null;
    ceHoursEarned: number;
    ceHoursRequired: number;
    status: string;
    _count?: { licenseLinks: number };
  };
  onClick?: (id: string) => void;
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

function getProgressColor(ratio: number): string {
  if (ratio >= 0.8) return '[&>div]:bg-emerald-500';
  if (ratio >= 0.5) return '[&>div]:bg-amber-500';
  return '[&>div]:bg-red-500';
}

export function QualifierCard({ qualifier, onClick }: QualifierCardProps) {
  const ceRatio = qualifier.ceHoursRequired > 0
    ? qualifier.ceHoursEarned / qualifier.ceHoursRequired
    : 0;
  const cePercent = Math.min(Math.round(ceRatio * 100), 100);

  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all duration-300',
        'hover:shadow-lg hover:-translate-y-0.5',
        'cursor-pointer border-border/50',
        onClick && 'hover:border-emerald-200 dark:hover:border-emerald-800/50'
      )}
      onClick={() => onClick?.(qualifier.id)}
    >
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-base">
                  {qualifier.firstName} {qualifier.lastName}
                </h3>
                <StatusBadge status={qualifier.status} />
              </div>
              {qualifier.licenseType && (
                <p className="text-sm text-muted-foreground mt-0.5">{qualifier.licenseType}</p>
              )}
            </div>
            {qualifier._count && (
              <span className="text-xs text-muted-foreground shrink-0">
                {qualifier._count.licenseLinks} {qualifier._count.licenseLinks === 1 ? 'license' : 'licenses'}
              </span>
            )}
          </div>

          {/* Contact + License info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
            {qualifier.email && (
              <div className="flex items-center gap-1.5">
                <Mail className="size-3.5 shrink-0 text-emerald-500" />
                <span className="truncate">{qualifier.email}</span>
              </div>
            )}
            {qualifier.phone && (
              <div className="flex items-center gap-1.5">
                <Phone className="size-3.5 shrink-0 text-teal-500" />
                <span className="truncate">{qualifier.phone}</span>
              </div>
            )}
            {qualifier.licenseNumber && (
              <div className="flex items-center gap-1.5">
                <Award className="size-3.5 shrink-0 text-teal-500" />
                <span className="truncate font-mono text-xs">
                  {qualifier.licenseNumber}
                  {qualifier.licenseState && (
                    <span className="ms-1 text-muted-foreground/60">({qualifier.licenseState})</span>
                  )}
                </span>
              </div>
            )}
            {qualifier.licenseExpiry && (
              <div className="flex items-center gap-1.5">
                <Clock className="size-3.5 shrink-0 text-muted-foreground/60" />
                <span className={cn('text-xs', getExpiryColor(qualifier.licenseExpiry))}>
                  Exp: {formatDate(qualifier.licenseExpiry)}
                </span>
              </div>
            )}
          </div>

          {/* CE Progress */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <BookOpen className="size-3.5 text-emerald-500" />
                <span className="text-xs">CE Hours</span>
              </div>
              <span className={cn(
                'text-xs font-medium tabular-nums',
                ceRatio >= 1 ? 'text-emerald-600 dark:text-emerald-400' :
                ceRatio >= 0.8 ? 'text-amber-600 dark:text-amber-400' :
                'text-red-600 dark:text-red-400'
              )}>
                {qualifier.ceHoursEarned}/{qualifier.ceHoursRequired}
              </span>
            </div>
            <Progress
              value={cePercent}
              className={cn('h-2', getProgressColor(ceRatio))}
            />
          </div>
        </div>
      </CardContent>

      {/* Hover accent bar */}
      <div className="absolute bottom-0 inset-x-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-start" />
    </Card>
  );
}
