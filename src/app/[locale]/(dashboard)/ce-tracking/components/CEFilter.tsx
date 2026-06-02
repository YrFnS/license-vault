'use client';

import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslations } from 'next-intl';
import type { License } from './types';

interface CEFilterProps {
  filterLicenseId: string;
  setFilterLicenseId: (value: string) => void;
  licenses: License[];
}

export function CEFilter({ filterLicenseId, setFilterLicenseId, licenses }: CEFilterProps) {
  const t = useTranslations('ceTracking');

  return (
    <div className="flex items-center gap-3">
      <Label className="text-sm font-medium whitespace-nowrap">{t('filterByLicense')}</Label>
      <Select value={filterLicenseId} onValueChange={setFilterLicenseId}>
        <SelectTrigger className="w-full max-w-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('allLicenses')}</SelectItem>
          {licenses.map((lic) => (
            <SelectItem key={lic.id} value={lic.id}>
              {lic.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
