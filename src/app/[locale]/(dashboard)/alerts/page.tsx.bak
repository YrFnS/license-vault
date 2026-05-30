'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2, Bell, Clock, Mail, Monitor,
  MessageSquare, Hash, Moon, Settings2,
  CalendarClock, CalendarDays, CalendarX,
} from 'lucide-react';
import { toast } from 'sonner';

interface AlertPreferences {
  alert60Days: boolean;
  alert30Days: boolean;
  alert5Days: boolean;
  alertEmail: boolean;
  alertInApp: boolean;
}

export default function AlertsPage() {
  const t = useTranslations('alerts');
  const tCommon = useTranslations('common');

  const [preferences, setPreferences] = useState<AlertPreferences>({
    alert60Days: true,
    alert30Days: true,
    alert5Days: true,
    alertEmail: true,
    alertInApp: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalPrefs, setOriginalPrefs] = useState<AlertPreferences>(preferences);

  // Notification Preferences section state
  const [notifPrefs, setNotifPrefs] = useState<AlertPreferences>({
    alert60Days: true,
    alert30Days: true,
    alert5Days: true,
    alertEmail: true,
    alertInApp: true,
  });
  const [notifLoading, setNotifLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  // UI-only notification channels state
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [slackEnabled, setSlackEnabled] = useState(false);

  // Quiet hours state
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietHoursStart, setQuietHoursStart] = useState('22:00');
  const [quietHoursEnd, setQuietHoursEnd] = useState('07:00');

  const fetchPreferences = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/alerts');
      if (res.ok) {
        const data = await res.json();
        const prefs = data.preferences;
        setPreferences({
          alert60Days: prefs.alert60Days,
          alert30Days: prefs.alert30Days,
          alert5Days: prefs.alert5Days,
          alertEmail: prefs.alertEmail,
          alertInApp: prefs.alertInApp,
        });
        setOriginalPrefs({
          alert60Days: prefs.alert60Days,
          alert30Days: prefs.alert30Days,
          alert5Days: prefs.alert5Days,
          alertEmail: prefs.alertEmail,
          alertInApp: prefs.alertInApp,
        });
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchNotifPreferences = useCallback(async () => {
    try {
      setNotifLoading(true);
      const res = await fetch('/api/alerts/preferences');
      if (res.ok) {
        const data = await res.json();
        const prefs = data.preferences;
        setNotifPrefs({
          alert60Days: prefs.alert60Days,
          alert30Days: prefs.alert30Days,
          alert5Days: prefs.alert5Days,
          alertEmail: prefs.alertEmail,
          alertInApp: prefs.alertInApp,
        });
      }
    } catch {
      // silently fail
    } finally {
      setNotifLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPreferences();
    fetchNotifPreferences();
  }, [fetchPreferences, fetchNotifPreferences]);

  useEffect(() => {
    setHasChanges(
      preferences.alert60Days !== originalPrefs.alert60Days ||
      preferences.alert30Days !== originalPrefs.alert30Days ||
      preferences.alert5Days !== originalPrefs.alert5Days ||
      preferences.alertEmail !== originalPrefs.alertEmail ||
      preferences.alertInApp !== originalPrefs.alertInApp
    );
  }, [preferences, originalPrefs]);

  const handleToggle = (key: keyof AlertPreferences) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/alerts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });

      if (res.ok) {
        const data = await res.json();
        const prefs = data.preferences;
        setOriginalPrefs({
          alert60Days: prefs.alert60Days,
          alert30Days: prefs.alert30Days,
          alert5Days: prefs.alert5Days,
          alertEmail: prefs.alertEmail,
          alertInApp: prefs.alertInApp,
        });
        setHasChanges(false);
        toast.success(t('preferencesSaved'));
      } else {
        toast.error(t('saveError'));
      }
    } catch {
      toast.error(t('saveError'));
    } finally {
      setSaving(false);
    }
  };

  // Optimistic save for Notification Preferences toggles
  const handleNotifToggle = async (key: keyof AlertPreferences) => {
    const newValue = !notifPrefs[key];
    // Optimistic update
    setNotifPrefs((prev) => ({ ...prev, [key]: newValue }));
    setSavingKey(key);

    try {
      const res = await fetch('/api/alerts/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: newValue }),
      });

      if (res.ok) {
        const data = await res.json();
        const prefs = data.preferences;
        setNotifPrefs({
          alert60Days: prefs.alert60Days,
          alert30Days: prefs.alert30Days,
          alert5Days: prefs.alert5Days,
          alertEmail: prefs.alertEmail,
          alertInApp: prefs.alertInApp,
        });
        toast.success(t('saved'));
      } else {
        // Revert on error
        setNotifPrefs((prev) => ({ ...prev, [key]: !newValue }));
        toast.error(t('saveError'));
      }
    } catch {
      // Revert on error
      setNotifPrefs((prev) => ({ ...prev, [key]: !newValue }));
      toast.error(t('saveError'));
    } finally {
      setSavingKey(null);
    }
  };

  const quietHoursOptions = {
    start: [
      { value: '20:00', label: '8:00 PM' },
      { value: '21:00', label: '9:00 PM' },
      { value: '22:00', label: '10:00 PM' },
      { value: '23:00', label: '11:00 PM' },
    ],
    end: [
      { value: '06:00', label: '6:00 AM' },
      { value: '07:00', label: '7:00 AM' },
      { value: '08:00', label: '8:00 AM' },
      { value: '09:00', label: '9:00 AM' },
    ],
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Card>
          <CardContent className="p-6 space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-6 w-10" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      {/* Timing Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="size-5 text-emerald-600" />
            <CardTitle>{t('timing')}</CardTitle>
          </div>
          <CardDescription>{t('timingDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="alert60" className="text-sm cursor-pointer">
              {t('days60')}
            </Label>
            <Switch
              id="alert60"
              checked={preferences.alert60Days}
              onCheckedChange={() => handleToggle('alert60Days')}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <Label htmlFor="alert30" className="text-sm cursor-pointer">
              {t('days30')}
            </Label>
            <Switch
              id="alert30"
              checked={preferences.alert30Days}
              onCheckedChange={() => handleToggle('alert30Days')}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <Label htmlFor="alert5" className="text-sm cursor-pointer">
              {t('days5')}
            </Label>
            <Switch
              id="alert5"
              checked={preferences.alert5Days}
              onCheckedChange={() => handleToggle('alert5Days')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Channels Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="size-5 text-emerald-600" />
            <CardTitle>{t('channels')}</CardTitle>
          </div>
          <CardDescription>{t('channelsDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email */}
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-emerald-100 dark:bg-emerald-900/50 p-2 mt-0.5">
                <Mail className="size-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <Label htmlFor="alertEmail" className="text-sm font-medium cursor-pointer">
                  {t('emailNotifs')}
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">{t('emailNotifsDesc')}</p>
              </div>
            </div>
            <Switch
              id="alertEmail"
              checked={preferences.alertEmail}
              onCheckedChange={() => handleToggle('alertEmail')}
            />
          </div>
          <Separator />
          {/* In-App */}
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-teal-100 dark:bg-teal-900/50 p-2 mt-0.5">
                <Monitor className="size-4 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <Label htmlFor="alertInApp" className="text-sm font-medium cursor-pointer">
                  {t('inAppNotifs')}
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">{t('inAppNotifsDesc')}</p>
              </div>
            </div>
            <Switch
              id="alertInApp"
              checked={preferences.alertInApp}
              onCheckedChange={() => handleToggle('alertInApp')}
            />
          </div>
          <Separator />
          {/* SMS - Coming Soon */}
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-muted p-2 mt-0.5">
                <MessageSquare className="size-4 text-muted-foreground" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium">{t('smsNotifs')}</Label>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400 border-0">
                    {t('comingSoon')}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{t('smsNotifsDesc')}</p>
              </div>
            </div>
            <Switch
              checked={smsEnabled}
              onCheckedChange={setSmsEnabled}
              disabled
              aria-label={t('smsNotifs')}
            />
          </div>
          <Separator />
          {/* Slack - Coming Soon */}
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-muted p-2 mt-0.5">
                <Hash className="size-4 text-muted-foreground" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium">{t('slackNotifs')}</Label>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400 border-0">
                    {t('comingSoon')}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{t('slackNotifsDesc')}</p>
              </div>
            </div>
            <Switch
              checked={slackEnabled}
              onCheckedChange={setSlackEnabled}
              disabled
              aria-label={t('slackNotifs')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Quiet Hours Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Moon className="size-5 text-emerald-600" />
            <CardTitle>{t('quietHours')}</CardTitle>
          </div>
          <CardDescription>{t('quietHoursDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="quietHours" className="text-sm font-medium cursor-pointer">
                {t('enableQuietHours')}
              </Label>
            </div>
            <Switch
              id="quietHours"
              checked={quietHoursEnabled}
              onCheckedChange={setQuietHoursEnabled}
            />
          </div>
          {quietHoursEnabled && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t('startTime')}</Label>
                  <Select value={quietHoursStart} onValueChange={setQuietHoursStart}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {quietHoursOptions.start.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t('endTime')}</Label>
                  <Select value={quietHoursEnd} onValueChange={setQuietHoursEnd}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {quietHoursOptions.end.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={!hasChanges || saving}
        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 min-w-[160px] shadow-sm"
      >
        {saving ? (
          <>
            <Loader2 className="size-4 animate-spin me-2" />
            {tCommon('loading')}
          </>
        ) : (
          t('savePreferences')
        )}
      </Button>

      {/* Notification Preferences Section */}
      {notifLoading ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-emerald-100 dark:bg-emerald-900/50 p-2">
                <Settings2 className="size-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="space-y-1.5">
                <Skeleton className="h-5 w-44" />
                <Skeleton className="h-3.5 w-60" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i}>
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <Skeleton className="size-9 rounded-lg mt-0.5" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-52" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-9 rounded-full" />
                </div>
                {i < 5 && <Separator className="mt-5" />}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-emerald-200/50 dark:border-emerald-800/30">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/50 dark:to-teal-900/50 p-2">
                <Settings2 className="size-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <CardTitle>{t('preferences')}</CardTitle>
                <CardDescription>{t('preferencesDesc')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* 60-day alert */}
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <div className={`rounded-lg p-2 mt-0.5 transition-colors ${
                  notifPrefs.alert60Days
                    ? 'bg-emerald-100 dark:bg-emerald-900/50'
                    : 'bg-muted'
                }`}>
                  <CalendarClock className={`size-4 transition-colors ${
                    notifPrefs.alert60Days
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-muted-foreground'
                  }`} />
                </div>
                <div>
                  <Label className="text-sm font-medium">{t('alert60Days')}</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">{t('alert60DaysDesc')}</p>
                </div>
              </div>
              <Switch
                checked={notifPrefs.alert60Days}
                onCheckedChange={() => handleNotifToggle('alert60Days')}
                disabled={savingKey === 'alert60Days'}
                className={notifPrefs.alert60Days ? 'data-[state=checked]:bg-emerald-600' : ''}
              />
            </div>
            <Separator />

            {/* 30-day alert */}
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <div className={`rounded-lg p-2 mt-0.5 transition-colors ${
                  notifPrefs.alert30Days
                    ? 'bg-emerald-100 dark:bg-emerald-900/50'
                    : 'bg-muted'
                }`}>
                  <CalendarDays className={`size-4 transition-colors ${
                    notifPrefs.alert30Days
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-muted-foreground'
                  }`} />
                </div>
                <div>
                  <Label className="text-sm font-medium">{t('alert30Days')}</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">{t('alert30DaysDesc')}</p>
                </div>
              </div>
              <Switch
                checked={notifPrefs.alert30Days}
                onCheckedChange={() => handleNotifToggle('alert30Days')}
                disabled={savingKey === 'alert30Days'}
                className={notifPrefs.alert30Days ? 'data-[state=checked]:bg-emerald-600' : ''}
              />
            </div>
            <Separator />

            {/* 5-day alert */}
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <div className={`rounded-lg p-2 mt-0.5 transition-colors ${
                  notifPrefs.alert5Days
                    ? 'bg-teal-100 dark:bg-teal-900/50'
                    : 'bg-muted'
                }`}>
                  <CalendarX className={`size-4 transition-colors ${
                    notifPrefs.alert5Days
                      ? 'text-teal-600 dark:text-teal-400'
                      : 'text-muted-foreground'
                  }`} />
                </div>
                <div>
                  <Label className="text-sm font-medium">{t('alert5Days')}</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">{t('alert5DaysDesc')}</p>
                </div>
              </div>
              <Switch
                checked={notifPrefs.alert5Days}
                onCheckedChange={() => handleNotifToggle('alert5Days')}
                disabled={savingKey === 'alert5Days'}
                className={notifPrefs.alert5Days ? 'data-[state=checked]:bg-teal-600' : ''}
              />
            </div>
            <Separator />

            {/* Email notifications */}
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <div className={`rounded-lg p-2 mt-0.5 transition-colors ${
                  notifPrefs.alertEmail
                    ? 'bg-emerald-100 dark:bg-emerald-900/50'
                    : 'bg-muted'
                }`}>
                  <Mail className={`size-4 transition-colors ${
                    notifPrefs.alertEmail
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-muted-foreground'
                  }`} />
                </div>
                <div>
                  <Label className="text-sm font-medium">{t('emailNotif')}</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">{t('emailNotifDesc')}</p>
                </div>
              </div>
              <Switch
                checked={notifPrefs.alertEmail}
                onCheckedChange={() => handleNotifToggle('alertEmail')}
                disabled={savingKey === 'alertEmail'}
                className={notifPrefs.alertEmail ? 'data-[state=checked]:bg-emerald-600' : ''}
              />
            </div>
            <Separator />

            {/* In-app notifications */}
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <div className={`rounded-lg p-2 mt-0.5 transition-colors ${
                  notifPrefs.alertInApp
                    ? 'bg-teal-100 dark:bg-teal-900/50'
                    : 'bg-muted'
                }`}>
                  <Monitor className={`size-4 transition-colors ${
                    notifPrefs.alertInApp
                      ? 'text-teal-600 dark:text-teal-400'
                      : 'text-muted-foreground'
                  }`} />
                </div>
                <div>
                  <Label className="text-sm font-medium">{t('inAppNotif')}</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">{t('inAppNotifDesc')}</p>
                </div>
              </div>
              <Switch
                checked={notifPrefs.alertInApp}
                onCheckedChange={() => handleNotifToggle('alertInApp')}
                disabled={savingKey === 'alertInApp'}
                className={notifPrefs.alertInApp ? 'data-[state=checked]:bg-teal-600' : ''}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
