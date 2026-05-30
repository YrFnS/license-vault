'use client';

import { useTranslations } from 'next-intl';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/licenses/StatusBadge';
import { Link } from '@/i18n/navigation';
import {
  FileText,
  Calendar,
  Building2,
  Hash,
  ArrowRight,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { type License } from '@/components/licenses/LicenseTable';

interface LicenseQuickViewProps {
  license: License | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRenew?: (id: string) => void;
}

function getDaysUntil(dateStr: string): number {
  const now = new Date();
  const target = new Date(dateStr);
  const diffMs = target.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function LicenseQuickView({ license, open, onOpenChange, onRenew }: LicenseQuickViewProps) {
  const t = useTranslations('licenses');
  const tc = useTranslations('common');
  const tq = useTranslations('quickView');

  if (!license) return null;

  const daysUntil = getDaysUntil(license.expirationDate);
  const isExpiredOrExpiring = license.status === 'expired' || license.status === 'expiring_soon';

  const detailItems = [
    {
      icon: Building2,
      label: t('form.issuedBy'),
      value: license.issuedBy,
    },
    {
      icon: Hash,
      label: t('form.licenseNumber'),
      value: license.licenseNumber,
    },
    {
      icon: Calendar,
      label: t('form.issueDate'),
      value: format(new Date(license.issueDate), 'MMM d, yyyy'),
    },
    {
      icon: Calendar,
      label: t('form.expirationDate'),
      value: format(new Date(license.expirationDate), 'MMM d, yyyy'),
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 shrink-0">
              <FileText className="size-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="block truncate">{license.name}</span>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="secondary" className="text-[10px] bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  {license.type}
                </Badge>
                <StatusBadge
                  status={license.status}
                  daysUntil={license.status === 'expiring_soon' ? daysUntil : undefined}
                  className="text-[10px]"
                />
              </div>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">
            {tq('description', { name: license.name })}
          </DialogDescription>
        </DialogHeader>

        {/* Key details grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
          {detailItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="flex items-start gap-2.5 rounded-lg border border-border/50 bg-muted/20 px-3 py-2.5"
              >
                <Icon className="size-4 text-muted-foreground/60 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">
                    {item.label}
                  </p>
                  <p className="text-sm font-medium text-foreground truncate">
                    {item.value}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Notes */}
        {license.notes && (
          <div className="rounded-lg border border-border/50 bg-muted/20 px-3 py-2.5 mt-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium mb-1">
              {tc('notes')}
            </p>
            <p className="text-sm text-foreground line-clamp-3">{license.notes}</p>
          </div>
        )}

        {/* Expiration warning */}
        {isExpiredOrExpiring && (
          <div className={`rounded-lg px-3 py-2.5 flex items-center gap-2 ${
            license.status === 'expired'
              ? 'bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-800/50'
              : 'bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/50'
          }`}>
            <Calendar className={`size-4 shrink-0 ${
              license.status === 'expired' ? 'text-red-500' : 'text-amber-500'
            }`} />
            <p className={`text-sm font-medium ${
              license.status === 'expired' ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'
            }`}>
              {license.status === 'expired'
                ? tq('expiredAgo', { days: Math.abs(daysUntil) })
                : tq('expiresIn', { days: daysUntil })
              }
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
          {isExpiredOrExpiring && onRenew && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onOpenChange(false);
                onRenew(license.id);
              }}
              className="gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/30 transition-colors duration-200"
            >
              <RefreshCw className="size-3.5" />
              {tq('renewButton')}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            asChild
            className="gap-1.5 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 dark:hover:bg-emerald-950/30 dark:hover:border-emerald-700 dark:hover:text-emerald-400 transition-colors duration-200"
          >
            <Link href={`/licenses/${license.id}`} onClick={() => onOpenChange(false)}>
              <ExternalLink className="size-3.5" />
              {tq('viewFullDetails')}
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
