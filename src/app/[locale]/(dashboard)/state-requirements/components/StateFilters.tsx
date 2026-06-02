import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MapPin, Shield } from 'lucide-react';
import { ALL_STATES, LICENSE_TYPES } from '../constants';

interface StateFiltersProps {
  stateFilter: string;
  setStateFilter: (v: string) => void;
  licenseTypeFilter: string;
  setLicenseTypeFilter: (v: string) => void;
}

export default function StateFilters({
  stateFilter,
  setStateFilter,
  licenseTypeFilter,
  setLicenseTypeFilter,
}: StateFiltersProps) {
  const t = useTranslations('stateRequirements');
  const tCommon = useTranslations('common');

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={stateFilter} onValueChange={setStateFilter}>
          <SelectTrigger className="w-full sm:w-52">
            <MapPin className="size-4 me-2 text-muted-foreground" />
            <SelectValue placeholder={t('searchState')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('searchState')}</SelectItem>
            {ALL_STATES.map((state) => (
              <SelectItem key={state} value={state}>
                {t(`states.${state}` as any) !== `states.${state}` ? t(`states.${state}` as any) : state}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={licenseTypeFilter} onValueChange={setLicenseTypeFilter}>
          <SelectTrigger className="w-full sm:w-52">
            <Shield className="size-4 me-2 text-muted-foreground" />
            <SelectValue placeholder={t('searchType')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('searchType')}</SelectItem>
            {LICENSE_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {t(`licenseTypes.${type}` as any)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(stateFilter !== 'all' || licenseTypeFilter !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStateFilter('all');
              setLicenseTypeFilter('all');
            }}
            className="text-muted-foreground"
          >
            ✕ {tCommon('cancel')}
          </Button>
        )}
      </div>

      {/* Results count */}
      {/* Note: results count rendered by parent to access requirements.length */}
    </>
  );
}
