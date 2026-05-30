'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  List,
  Calendar as CalendarIcon,
  ShieldAlert,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from '@/i18n/navigation';

interface License {
  id: string;
  name: string;
  type: string;
  expirationDate: string;
  status: 'active' | 'expiring' | 'expired';
}

function getLicenseStatus(expirationDate: string): 'active' | 'expiring' | 'expired' {
  const now = new Date();
  const exp = new Date(expirationDate);
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  if (exp < now) return 'expired';
  if (exp <= thirtyDaysFromNow) return 'expiring';
  return 'active';
}

function daysBetween(date1: Date, date2: Date): number {
  const diffTime = date2.getTime() - date1.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export default function LicenseCalendarPage() {
  const t = useTranslations('calendar');
  const tLic = useTranslations('licenses');
  const locale = useLocale();
  const isRTL = locale === 'ar';

  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  const fetchLicenses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/licenses');
      if (res.ok) {
        const data = await res.json();
        const mapped = (data.licenses || []).map((lic: any) => ({
          id: lic.id,
          name: lic.name,
          type: lic.type,
          expirationDate: lic.expirationDate,
          status: getLicenseStatus(lic.expirationDate),
        }));
        setLicenses(mapped);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLicenses();
  }, [fetchLicenses]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDay = firstDay.getDay(); // 0 = Sunday

  // Map expiration dates to license lists
  const expirationMap = useMemo(() => {
    const map: Record<string, License[]> = {};
    licenses.forEach((lic) => {
      const expDate = new Date(lic.expirationDate);
      const key = `${expDate.getFullYear()}-${expDate.getMonth()}-${expDate.getDate()}`;
      if (!map[key]) map[key] = [];
      map[key].push(lic);
    });
    return map;
  }, [licenses]);

  // Upcoming expirations (sorted by date)
  const upcomingExpirations = useMemo(() => {
    const now = new Date();
    return licenses
      .filter((l) => new Date(l.expirationDate) >= now || l.status === 'expiring')
      .sort((a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime())
      .slice(0, 10);
  }, [licenses]);

  // Selected date licenses
  const selectedDateLicenses = useMemo(() => {
    if (!selectedDate) return [];
    const key = `${selectedDate.getFullYear()}-${selectedDate.getMonth()}-${selectedDate.getDate()}`;
    return expirationMap[key] || [];
  }, [selectedDate, expirationMap]);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDate(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDate(null);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const monthName = currentDate.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
    month: 'long',
    year: 'numeric',
  });

  const dayNames = [t('sun'), t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat')];

  // Calendar cells
  const calendarCells = useMemo(() => {
    const cells: { date: Date; day: number; isCurrentMonth: boolean }[] = [];
    // Previous month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
      cells.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        day: prevMonthLastDay - i,
        isCurrentMonth: false,
      });
    }
    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({
        date: new Date(year, month, d),
        day: d,
        isCurrentMonth: true,
      });
    }
    // Next month padding
    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
      cells.push({
        date: new Date(year, month + 1, d),
        day: d,
        isCurrentMonth: false,
      });
    }
    return cells;
  }, [year, month, startDay, daysInMonth]);

  const getDateKey = (date: Date) =>
    `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

  const isToday = (date: Date) => {
    const now = new Date();
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    );
  };

  const isSelected = (date: Date) => {
    if (!selectedDate) return false;
    return (
      date.getFullYear() === selectedDate.getFullYear() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getDate() === selectedDate.getDate()
    );
  };

  const getStatusColor = (status: 'active' | 'expiring' | 'expired') => {
    switch (status) {
      case 'active': return 'bg-emerald-500';
      case 'expiring': return 'bg-amber-500';
      case 'expired': return 'bg-red-500';
    }
  };

  const getStatusIcon = (status: 'active' | 'expiring' | 'expired') => {
    switch (status) {
      case 'active': return <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />;
      case 'expiring': return <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />;
      case 'expired': return <XCircle className="size-4 text-red-600 dark:text-red-400" />;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaysText = (expirationDate: string) => {
    const now = new Date();
    const exp = new Date(expirationDate);
    const days = daysBetween(now, exp);
    if (days < 0) {
      return t('expiredDays', { days: Math.abs(days) });
    }
    return t('daysUntil', { days });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Skeleton className="h-96 w-full" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  // Mobile: show list view by default
  const effectiveView = viewMode;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle - visible on sm+ */}
          <div className="hidden sm:flex items-center border rounded-lg overflow-hidden">
            <Button
              variant={effectiveView === 'calendar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('calendar')}
              className={cn(
                'rounded-none gap-1',
                effectiveView === 'calendar' && 'bg-emerald-600 hover:bg-emerald-700'
              )}
            >
              <CalendarIcon className="size-4" />
              {t('calendarView')}
            </Button>
            <Button
              variant={effectiveView === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className={cn(
                'rounded-none gap-1',
                effectiveView === 'list' && 'bg-emerald-600 hover:bg-emerald-700'
              )}
            >
              <List className="size-4" />
              {t('listView')}
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="gap-1"
          >
            <CalendarDays className="size-4" />
            {t('today')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar / List */}
        <div className="lg:col-span-2">
          {/* Mobile: always list view */}
          <div className="sm:hidden">
            <LicenseListView
              licenses={licenses}
              formatDate={formatDate}
              getStatusIcon={getStatusIcon}
              getStatusColor={getStatusColor}
              getDaysText={getDaysText}
              t={t}
              tLic={tLic}
            />
          </div>

          {/* Desktop: toggleable */}
          <div className="hidden sm:block">
            {effectiveView === 'calendar' ? (
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Button variant="ghost" size="icon" onClick={isRTL ? nextMonth : prevMonth}>
                      <ChevronLeft className="size-5" />
                    </Button>
                    <CardTitle className="text-lg">{monthName}</CardTitle>
                    <Button variant="ghost" size="icon" onClick={isRTL ? prevMonth : nextMonth}>
                      <ChevronRight className="size-5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Day names */}
                  <div className="grid grid-cols-7 mb-2">
                    {dayNames.map((day, idx) => (
                      <div key={idx} className="text-center text-xs font-medium text-muted-foreground py-2">
                        {day}
                      </div>
                    ))}
                  </div>
                  {/* Calendar grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {calendarCells.map((cell, idx) => {
                      const dateKey = getDateKey(cell.date);
                      const dayLicenses = expirationMap[dateKey] || [];
                      const hasExpired = dayLicenses.some((l) => l.status === 'expired');
                      const hasExpiring = dayLicenses.some((l) => l.status === 'expiring');
                      const hasActive = dayLicenses.some((l) => l.status === 'active');

                      return (
                        <button
                          key={idx}
                          onClick={() => setSelectedDate(cell.date)}
                          className={cn(
                            'relative flex flex-col items-center justify-center p-1.5 min-h-[60px] rounded-lg transition-colors text-sm',
                            cell.isCurrentMonth ? 'text-foreground' : 'text-muted-foreground/40',
                            isSelected(cell.date) && 'bg-emerald-100 dark:bg-emerald-900/30 ring-2 ring-emerald-500',
                            isToday(cell.date) && !isSelected(cell.date) && 'bg-emerald-50 dark:bg-emerald-900/10',
                            !isSelected(cell.date) && 'hover:bg-muted/50',
                          )}
                        >
                          <span className={cn(
                            'text-sm font-medium',
                            isToday(cell.date) && 'text-emerald-600 dark:text-emerald-400 font-bold',
                          )}>
                            {cell.day}
                          </span>
                          {dayLicenses.length > 0 && (
                            <div className="flex gap-0.5 mt-1">
                              {hasActive && <div className="size-1.5 rounded-full bg-emerald-500" />}
                              {hasExpiring && <div className="size-1.5 rounded-full bg-amber-500" />}
                              {hasExpired && <div className="size-1.5 rounded-full bg-red-500" />}
                            </div>
                          )}
                          {dayLicenses.length > 1 && (
                            <span className="text-[10px] text-muted-foreground mt-0.5">
                              {dayLicenses.length}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected Date Details */}
                  {selectedDate && (
                    <div className="mt-4 pt-4 border-t">
                      <h3 className="font-medium mb-3">
                        {t('expiringOn', {
                          date: selectedDate.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
                            month: 'long',
                            day: 'numeric',
                          }),
                        })}
                      </h3>
                      {selectedDateLicenses.length === 0 ? (
                        <p className="text-sm text-muted-foreground">{t('noExpirations')}</p>
                      ) : (
                        <div className="space-y-2">
                          {selectedDateLicenses.map((lic) => (
                            <Link
                              key={lic.id}
                              href={`/licenses/${lic.id}`}
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                            >
                              {getStatusIcon(lic.status)}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{lic.name}</p>
                                <p className="text-xs text-muted-foreground">{lic.type}</p>
                              </div>
                              <Badge
                                variant="outline"
                                className={cn(
                                  'text-xs',
                                  lic.status === 'active' && 'border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400',
                                  lic.status === 'expiring' && 'border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400',
                                  lic.status === 'expired' && 'border-red-300 text-red-700 dark:border-red-700 dark:text-red-400',
                                )}
                              >
                                {tLic(`status.${lic.status}`)}
                              </Badge>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <LicenseListView
                licenses={licenses}
                formatDate={formatDate}
                getStatusIcon={getStatusIcon}
                getStatusColor={getStatusColor}
                getDaysText={getDaysText}
                t={t}
                tLic={tLic}
              />
            )}
          </div>
        </div>

        {/* Upcoming Expirations Sidebar */}
        <Card className="hidden sm:block">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldAlert className="size-5 text-amber-600 dark:text-amber-400" />
              <CardTitle className="text-base">{t('upcoming')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {upcomingExpirations.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t('noExpirations')}
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {upcomingExpirations.map((lic) => (
                  <Link
                    key={lic.id}
                    href={`/licenses/${lic.id}`}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className={cn('size-2 rounded-full mt-2 shrink-0', getStatusColor(lic.status))} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{lic.name}</p>
                      <p className="text-xs text-muted-foreground">{lic.type}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(lic.expirationDate)}
                      </p>
                      <p className={cn(
                        'text-xs font-medium mt-0.5',
                        lic.status === 'active' && 'text-emerald-600 dark:text-emerald-400',
                        lic.status === 'expiring' && 'text-amber-600 dark:text-amber-400',
                        lic.status === 'expired' && 'text-red-600 dark:text-red-400',
                      )}>
                        {getDaysText(lic.expirationDate)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// List view component
function LicenseListView({
  licenses,
  formatDate,
  getStatusIcon,
  getStatusColor,
  getDaysText,
  t,
  tLic,
}: {
  licenses: License[];
  formatDate: (d: string) => string;
  getStatusIcon: (s: 'active' | 'expiring' | 'expired') => React.ReactNode;
  getStatusColor: (s: 'active' | 'expiring' | 'expired') => string;
  getDaysText: (d: string) => string;
  t: any;
  tLic: any;
}) {
  const sortedLicenses = [...licenses].sort(
    (a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime()
  );

  // Group by status
  const expired = sortedLicenses.filter((l) => l.status === 'expired');
  const expiring = sortedLicenses.filter((l) => l.status === 'expiring');
  const active = sortedLicenses.filter((l) => l.status === 'active');

  return (
    <Card>
      <CardContent className="p-4 space-y-6">
        {expired.length > 0 && (
          <div>
            <h3 className="font-medium text-red-600 dark:text-red-400 mb-3 flex items-center gap-2">
              <XCircle className="size-4" />
              {tLic('expired')} ({expired.length})
            </h3>
            <div className="space-y-2">
              {expired.map((lic) => (
                <Link
                  key={lic.id}
                  href={`/licenses/${lic.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg border border-red-200 dark:border-red-800/50 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                >
                  {getStatusIcon(lic.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{lic.name}</p>
                    <p className="text-xs text-muted-foreground">{lic.type}</p>
                  </div>
                  <div className="text-end shrink-0">
                    <p className="text-xs text-muted-foreground">{formatDate(lic.expirationDate)}</p>
                    <p className="text-xs font-medium text-red-600 dark:text-red-400">
                      {getDaysText(lic.expirationDate)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {expiring.length > 0 && (
          <div>
            <h3 className="font-medium text-amber-600 dark:text-amber-400 mb-3 flex items-center gap-2">
              <AlertTriangle className="size-4" />
              {tLic('expiringSoon')} ({expiring.length})
            </h3>
            <div className="space-y-2">
              {expiring.map((lic) => (
                <Link
                  key={lic.id}
                  href={`/licenses/${lic.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg border border-amber-200 dark:border-amber-800/50 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors"
                >
                  {getStatusIcon(lic.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{lic.name}</p>
                    <p className="text-xs text-muted-foreground">{lic.type}</p>
                  </div>
                  <div className="text-end shrink-0">
                    <p className="text-xs text-muted-foreground">{formatDate(lic.expirationDate)}</p>
                    <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                      {getDaysText(lic.expirationDate)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {active.length > 0 && (
          <div>
            <h3 className="font-medium text-emerald-600 dark:text-emerald-400 mb-3 flex items-center gap-2">
              <CheckCircle2 className="size-4" />
              {tLic('active')} ({active.length})
            </h3>
            <div className="space-y-2">
              {active.map((lic) => (
                <Link
                  key={lic.id}
                  href={`/licenses/${lic.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-colors"
                >
                  {getStatusIcon(lic.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{lic.name}</p>
                    <p className="text-xs text-muted-foreground">{lic.type}</p>
                  </div>
                  <div className="text-end shrink-0">
                    <p className="text-xs text-muted-foreground">{formatDate(lic.expirationDate)}</p>
                    <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      {getDaysText(lic.expirationDate)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {licenses.length === 0 && (
          <p className="text-center text-muted-foreground py-8">{t('noExpirations')}</p>
        )}
      </CardContent>
    </Card>
  );
}
