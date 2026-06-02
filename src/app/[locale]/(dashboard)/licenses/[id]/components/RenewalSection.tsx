import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ToggleLeft, Clock, User } from 'lucide-react';
import type { LicenseData } from './types';
import { formatDate } from './helpers';

interface RenewalSectionProps {
  license: LicenseData;
  autoRenew: boolean;
  setAutoRenew: React.Dispatch<React.SetStateAction<boolean>>;
  daysUntilExpiration: number | null;
}

export function RenewalSection({
  license,
  autoRenew,
  setAutoRenew,
  daysUntilExpiration,
}: RenewalSectionProps) {
  const tR = useTranslations('renewal');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Auto-Renew Toggle */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-2">
                <ToggleLeft className="size-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{tR('autoRenew')}</p>
                <p className="text-xs text-muted-foreground">{tR('autoRenewDesc')}</p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={autoRenew}
              onClick={() => setAutoRenew(!autoRenew)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
                autoRenew ? 'bg-emerald-600' : 'bg-muted'
              }`}
            >
              <span
                className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  autoRenew ? 'translate-x-5 rtl:-translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Renewal History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
            <Clock className="size-4 text-emerald-600 dark:text-emerald-400" />
            {tR('history')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {license.renewalHistory ? (
            (() => {
              let history: Array<{ date: string; notes: string; renewedBy: string }> = [];
              try { history = JSON.parse(license.renewalHistory); } catch { history = []; }
              return history.length > 0 ? (
                <div className="max-h-48 overflow-y-auto space-y-3">
                  {history.map((entry, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="mt-1 flex flex-col items-center">
                        <div className="size-2.5 rounded-full bg-emerald-500" />
                        {index < history.length - 1 && (
                          <div className="w-px h-full min-h-[1.5rem] bg-border mt-1" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">
                          {tR('renewedOn', { date: formatDate(entry.date) })}
                        </p>
                        {entry.renewedBy && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <User className="size-3" />
                            {entry.renewedBy}
                          </p>
                        )}
                        {entry.notes && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {entry.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{tR('noHistory')}</p>
              );
            })()
          ) : (
            <p className="text-sm text-muted-foreground">{tR('noHistory')}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
