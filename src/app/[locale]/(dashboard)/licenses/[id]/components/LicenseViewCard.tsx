import { useTranslations } from 'next-intl';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Hash, Calendar, Building2, FileText } from 'lucide-react';
import type { LicenseData } from './types';
import { formatDate } from './helpers';
import { DetailRow } from './DetailRow';

interface LicenseViewCardProps {
  license: LicenseData;
}

export function LicenseViewCard({ license }: LicenseViewCardProps) {
  const t = useTranslations('licenses');

  return (
    <div className="space-y-6">
      {/* Identification Group */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
          <Hash className="size-4" />
          {t('detail.identification')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
          <DetailRow
            label={t('form.name')}
            value={license.name}
            icon={<FileText className="size-4 text-muted-foreground" />}
          />
          <DetailRow
            label={t('form.type')}
            value={license.type}
            icon={<Badge variant="secondary" className="text-xs px-1.5 py-0 me-0">{license.type}</Badge>}
            hideValue
          />
          <DetailRow
            label={t('form.licenseNumber')}
            value={license.licenseNumber}
            icon={<Hash className="size-4 text-muted-foreground" />}
            mono
          />
          <DetailRow
            label={t('form.issuedBy')}
            value={license.issuedBy}
            icon={<Building2 className="size-4 text-muted-foreground" />}
          />
        </div>
      </div>

      <Separator />

      {/* Dates Group */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
          <Calendar className="size-4" />
          {t('detail.dates')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
          <DetailRow
            label={t('form.issueDate')}
            value={formatDate(license.issueDate)}
            icon={<Calendar className="size-4 text-emerald-600 dark:text-emerald-400" />}
          />
          <DetailRow
            label={t('form.expirationDate')}
            value={formatDate(license.expirationDate)}
            icon={
              <Calendar className={`size-4 ${
                license.status === 'expired'
                  ? 'text-red-600 dark:text-red-400'
                  : license.status === 'expiring_soon'
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-emerald-600 dark:text-emerald-400'
              }`} />
            }
          />
        </div>
      </div>

      {license.notes && (
        <>
          <Separator />
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <FileText className="size-4" />
              {t('form.notes')}
            </h3>
            <div className="bg-muted/50 rounded-lg p-4 border">
              <p className="text-sm whitespace-pre-wrap">{license.notes}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
