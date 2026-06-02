import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  ArrowLeft,
  Pencil,
  RefreshCw,
  Check,
  X,
  Clock,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { Link } from '@/i18n/navigation';
import type { LicenseData } from './types';
import { getStatusColor, getStatusIcon, getStatusText } from './helpers';
import { DeleteDialog } from './DeleteDialog';

interface LicenseHeaderProps {
  license: LicenseData;
  isEditing: boolean;
  saving: boolean;
  daysUntilExpiration: number | null;
  canManageLicenses: boolean;
  onEnterEditMode: () => void;
  onCancelEdit: () => void;
  onSave: () => Promise<void>;
  onDelete: () => Promise<void>;
  onRenewClick: () => void;
}

export function LicenseHeader({
  license,
  isEditing,
  saving,
  daysUntilExpiration,
  canManageLicenses,
  onEnterEditMode,
  onCancelEdit,
  onSave,
  onDelete,
  onRenewClick,
}: LicenseHeaderProps) {
  const t = useTranslations('licenses');
  const tc = useTranslations('common');
  const tR = useTranslations('renewal');
  const router = useRouter();

  return (
    <>
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/licenses">{t('detail.breadcrumbLicenses')}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronRight className="size-3.5" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage className="font-medium truncate max-w-[200px]">
              {license.name}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/licenses')} className="mt-1 shrink-0">
            <ArrowLeft className="size-4" />
          </Button>
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{license.name}</h1>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={`gap-1.5 px-3 py-1 text-sm font-semibold ${getStatusColor(license.status)}`}>
                {getStatusIcon(license.status)}
                {getStatusText(license.status, t)}
              </Badge>
              {daysUntilExpiration !== null && (
                <Badge
                  variant="outline"
                  className={`px-3 py-1 text-sm font-semibold ${
                    daysUntilExpiration < 0
                      ? 'border-red-300 text-red-700 dark:border-red-700 dark:text-red-400'
                      : daysUntilExpiration <= 30
                        ? 'border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400'
                        : 'border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400'
                  }`}
                >
                  <Clock className="size-3.5 me-1" />
                  {daysUntilExpiration < 0
                    ? `${Math.abs(daysUntilExpiration)}d overdue`
                    : `${daysUntilExpiration}d remaining`}
                </Badge>
              )}
              {isEditing && (
                <Badge variant="outline" className="px-3 py-1 text-sm border-teal-400 text-teal-700 dark:border-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/30">
                  <Pencil className="size-3 me-1" />
                  {t('detail.editing')}
                </Badge>
              )}
              {license.isRenewed && !isEditing && (
                <Badge className="px-3 py-1 text-sm font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 gap-1.5">
                  <CheckCircle2 className="size-3.5" />
                  {tR('renewedBadge')}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons - Desktop */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          {!isEditing ? (
            <>
              {canManageLicenses && (
                <Button onClick={onEnterEditMode} variant="outline" className="gap-2">
                  <Pencil className="size-4" />
                  {t('detail.editLicense')}
                </Button>
              )}
              {canManageLicenses && (
                <Button onClick={onRenewClick} className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white">
                  <RefreshCw className="size-4" />
                  {tR('renewButton')}
                </Button>
              )}
              {canManageLicenses && (
                <DeleteDialog licenseName={license.name} onDelete={onDelete} />
              )}
            </>
          ) : (
            <>
              <Button onClick={onCancelEdit} variant="outline" className="gap-2">
                <X className="size-4" />
                {t('detail.cancelEdit')}
              </Button>
              <Button onClick={onSave} disabled={saving} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                {saving ? (
                  <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Check className="size-4" />
                )}
                {t('detail.saveChanges')}
              </Button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
