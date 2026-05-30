'use client';

import { useTranslations } from 'next-intl';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { StatusBadge } from '@/components/licenses/StatusBadge';
import { Eye, Trash2, FileText, RefreshCw } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

export interface License {
  id: string;
  name: string;
  type: string;
  licenseNumber: string;
  issuedBy: string;
  issueDate: string;
  expirationDate: string;
  notes: string | null;
  status: 'active' | 'expiring_soon' | 'expired';
}

interface LicenseTableProps {
  licenses: License[];
  onDelete: (id: string) => void;
  onRenew?: (id: string) => void;
  onQuickView?: (license: License) => void;
  compact?: boolean;
  selectMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  allSelected?: boolean;
  someSelected?: boolean;
  canManage?: boolean;
}

function getDaysUntil(dateStr: string): number {
  const now = new Date();
  const target = new Date(dateStr);
  const diffMs = target.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

interface LicenseRowProps {
  license: License;
  onDelete: (id: string) => void;
  onRenew?: (id: string) => void;
  onQuickView?: (license: License) => void;
  t: ReturnType<typeof useTranslations<'licenses'>>;
  tc: ReturnType<typeof useTranslations<'common'>>;
  selectMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
  canManage?: boolean;
}

function LicenseRow({ license, onDelete, onRenew, onQuickView, t, tc, selectMode, selected, onToggleSelect, canManage = true }: LicenseRowProps) {
  const daysUntil = getDaysUntil(license.expirationDate);

  return (
    <TableRow className={cn(
      'transition-colors duration-150 hover:bg-muted/50',
      selected ? 'bg-emerald-50 dark:bg-emerald-950/30' : ''
    )}>
      {selectMode && (
        <TableCell className="w-12">
          <Checkbox
            checked={selected}
            onCheckedChange={onToggleSelect}
            aria-label={`Select ${license.name}`}
          />
        </TableCell>
      )}
      <TableCell className="font-medium">
        {onQuickView ? (
          <button
            onClick={() => onQuickView(license)}
            className="text-left hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors duration-150 cursor-pointer"
          >
            {license.name}
          </button>
        ) : (
          license.name
        )}
      </TableCell>
      <TableCell>
        <Badge variant="secondary" className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors duration-150">{license.type}</Badge>
      </TableCell>
      <TableCell className="font-mono text-sm">
        {license.licenseNumber}
      </TableCell>
      <TableCell>
        <StatusBadge
          status={license.status}
          daysUntil={license.status === 'expiring_soon' ? daysUntil : undefined}
        />
      </TableCell>
      <TableCell>
        {format(new Date(license.expirationDate), 'MMM d, yyyy')}
      </TableCell>
      {!selectMode && (
        <TableCell className="text-end">
          <div className="flex items-center justify-end gap-1">
            {canManage && (license.status === 'expired' || license.status === 'expiring_soon') && onRenew && (
              <Button variant="ghost" size="icon" onClick={() => onRenew(license.id)} className="hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-400 transition-colors duration-200">
                <RefreshCw className="size-4" />
                <span className="sr-only">Renew</span>
              </Button>
            )}
            <Button variant="ghost" size="icon" asChild className="hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-400 transition-colors duration-200">
              <Link href={`/licenses/${license.id}`}>
                <Eye className="size-4" />
                <span className="sr-only">{tc('viewDetails')}</span>
              </Link>
            </Button>
            {canManage && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors duration-200">
                  <Trash2 className="size-4" />
                  <span className="sr-only">{tc('delete')}</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{tc('confirm')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('detail.deleteConfirm')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{tc('cancel')}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(license.id)}
                    className="bg-destructive text-white hover:bg-destructive/90"
                  >
                    {tc('delete')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            )}
          </div>
        </TableCell>
      )}
    </TableRow>
  );
}

interface LicenseCardProps {
  license: License;
  onDelete: (id: string) => void;
  onRenew?: (id: string) => void;
  onQuickView?: (license: License) => void;
  t: ReturnType<typeof useTranslations<'licenses'>>;
  tc: ReturnType<typeof useTranslations<'common'>>;
  selectMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
  canManage?: boolean;
}

function LicenseCard({ license, onDelete, onRenew, onQuickView, t, tc, selectMode, selected, onToggleSelect, canManage = true }: LicenseCardProps) {
  const daysUntil = getDaysUntil(license.expirationDate);

  return (
    <Card className={cn(
      'overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300',
      selected ? 'ring-2 ring-emerald-500' : ''
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 min-w-0">
            {selectMode && (
              <Checkbox
                checked={selected}
                onCheckedChange={onToggleSelect}
                aria-label={`Select ${license.name}`}
                className="mt-1"
              />
            )}
            <div className="mt-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 p-2">
              <FileText className="size-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="min-w-0">
              <p
                className="font-medium truncate cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors duration-150"
                onClick={() => onQuickView?.(license)}
              >
                {license.name}
              </p>
              <p className="text-sm text-muted-foreground font-mono">
                {license.licenseNumber}
              </p>
            </div>
          </div>
          <StatusBadge
            status={license.status}
            daysUntil={license.status === 'expiring_soon' ? daysUntil : undefined}
          />
        </div>
        {!selectMode && (
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {license.type}
              </Badge>
              <span>
                {format(new Date(license.expirationDate), 'MMM d, yyyy')}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {canManage && (license.status === 'expired' || license.status === 'expiring_soon') && onRenew && (
                <Button variant="ghost" size="sm" onClick={() => onRenew(license.id)} className="hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-400">
                  <RefreshCw className="size-3.5 me-1" />
                  Renew
                </Button>
              )}
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/licenses/${license.id}`}>
                  <Eye className="size-3.5 me-1" />
                  {tc('viewDetails')}
                </Link>
              </Button>
              {canManage && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-destructive">
                    <Trash2 className="size-3.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{tc('confirm')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('detail.deleteConfirm')}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{tc('cancel')}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete(license.id)}
                      className="bg-destructive text-white hover:bg-destructive/90"
                    >
                      {tc('delete')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function LicenseTable({
  licenses,
  onDelete,
  onRenew,
  onQuickView,
  compact = false,
  selectMode = false,
  selectedIds = new Set(),
  onToggleSelect,
  onSelectAll,
  onDeselectAll,
  allSelected = false,
  someSelected = false,
  canManage = true,
}: LicenseTableProps) {
  const t = useTranslations('licenses');
  const tc = useTranslations('common');
  const tb = useTranslations('bulkActions');

  return (
    <>
      {/* Desktop: table view */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              {selectMode && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        onSelectAll?.();
                      } else {
                        onDeselectAll?.();
                      }
                    }}
                    aria-label={tb('selectAll')}
                  />
                </TableHead>
              )}
              <TableHead>{tc('name')}</TableHead>
              <TableHead>{tc('type')}</TableHead>
              <TableHead>{t('form.licenseNumber')}</TableHead>
              <TableHead>{tc('status')}</TableHead>
              <TableHead>{t('form.expirationDate')}</TableHead>
              {!selectMode && <TableHead className="text-end">{tc('actions')}</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {licenses.map((license) => (
              <LicenseRow
                key={license.id}
                license={license}
                onDelete={onDelete}
                onRenew={onRenew}
                onQuickView={onQuickView}
                t={t}
                tc={tc}
                selectMode={selectMode}
                selected={selectedIds.has(license.id)}
                onToggleSelect={() => onToggleSelect?.(license.id)}
                canManage={canManage}
              />
            ))}
          </TableBody>
        </Table>
      </div>
      {/* Mobile: card view */}
      <div className="md:hidden space-y-3 p-4">
        {selectMode && (
          <div className="flex items-center gap-2 pb-2 border-b">
            <Checkbox
              checked={allSelected ? true : someSelected ? 'indeterminate' : false}
              onCheckedChange={(checked) => {
                if (checked) {
                  onSelectAll?.();
                } else {
                  onDeselectAll?.();
                }
              }}
              aria-label={tb('selectAll')}
            />
            <span className="text-sm font-medium">
              {allSelected ? tb('deselectAll') : tb('selectAll')}
            </span>
          </div>
        )}
        {licenses.map((license) => (
          <LicenseCard
            key={license.id}
            license={license}
            onDelete={onDelete}
            onRenew={onRenew}
            onQuickView={onQuickView}
            t={t}
            tc={tc}
            selectMode={selectMode}
            selected={selectedIds.has(license.id)}
            onToggleSelect={() => onToggleSelect?.(license.id)}
            canManage={canManage}
          />
        ))}
      </div>
    </>
  );
}
