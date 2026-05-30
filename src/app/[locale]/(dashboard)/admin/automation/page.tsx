'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Play,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Settings2,
  ShieldAlert,
  History,
  Bell,
  ChevronDown,
  RotateCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { cn } from '@/lib/utils';
import { useRole } from '@/hooks/useRole';

// ─── Types ─────────────────────────────────────────────────────────────────

interface AutomationStatus {
  enabled: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
  checkFrequency: string;
  escalationDays: number;
  stats: {
    totalChecks: number;
    notificationsSent: number;
    lastRunStatus: string | null;
  };
}

interface AutomationSettings {
  enabled: boolean;
  checkFrequency: string;
  escalationDays: number;
  notifyExpired: boolean;
  notifyExpiring: boolean;
  notifyInsurance: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
}

interface RunResult {
  licensesExpiring: number;
  licensesExpired: number;
  insuranceExpiring: number;
  insuranceExpired: number;
  escalations: number;
  notificationsCreated: number;
  autoFlagged: number;
}

interface HistoryRun {
  id: string;
  type: string;
  status: string;
  results: RunResult | null;
  startedAt: string;
  completedAt: string | null;
  duration: number | null;
}

interface RecentNotification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

// ─── Animation Variants ────────────────────────────────────────────────────

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35 },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.08 } },
};

const staggerItem = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
};

// ─── Component ─────────────────────────────────────────────────────────────

export default function AutomationPage() {
  const t = useTranslations('automation');
  const tNav = useTranslations('nav');
  const locale = useLocale();
  const { canAccessAdmin } = useRole();

  const [status, setStatus] = useState<AutomationStatus | null>(null);
  const [settings, setSettings] = useState<AutomationSettings | null>(null);
  const [history, setHistory] = useState<HistoryRun[]>([]);
  const [notifications, setNotifications] = useState<RecentNotification[]>([]);
  const [lastRunResult, setLastRunResult] = useState<RunResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Local settings state for form
  const [localSettings, setLocalSettings] = useState<AutomationSettings>({
    enabled: true,
    checkFrequency: 'daily',
    escalationDays: 7,
    notifyExpired: true,
    notifyExpiring: true,
    notifyInsurance: true,
    lastRunAt: null,
    nextRunAt: null,
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [statusRes, settingsRes, historyRes, notifsRes] = await Promise.all([
        fetch('/api/automation/status'),
        fetch('/api/automation/settings'),
        fetch('/api/automation/history'),
        fetch('/api/notifications'),
      ]);

      if (statusRes.ok) {
        const data = await statusRes.json();
        setStatus(data);
      }

      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setSettings(data);
        setLocalSettings(data);
      }

      if (historyRes.ok) {
        const data = await historyRes.json();
        setHistory(data.runs || []);
      }

      if (notifsRes.ok) {
        const data = await notifsRes.json();
        // Filter for automation-generated notifications
        const autoNotifs = (data.notifications || data || [])
          .filter((n: RecentNotification) =>
            n.title?.startsWith('EXPIRING_') ||
            n.title?.startsWith('EXPIRED_') ||
            n.title?.startsWith('INS_EXPIRING_') ||
            n.title?.startsWith('INS_EXPIRED_') ||
            n.title?.startsWith('ESCALATION_')
          )
          .slice(0, 10);
        setNotifications(autoNotifs);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRunNow = async () => {
    try {
      setRunning(true);
      const res = await fetch('/api/automation/run', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setLastRunResult(data.results);
        // Refresh data
        await fetchData();
      }
    } catch {
      // error
    } finally {
      setRunning(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setSaved(false);
      const res = await fetch('/api/automation/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: localSettings.enabled,
          checkFrequency: localSettings.checkFrequency,
          escalationDays: localSettings.escalationDays,
          notifyExpired: localSettings.notifyExpired,
          notifyExpiring: localSettings.notifyExpiring,
          notifyInsurance: localSettings.notifyInsurance,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        setLocalSettings(data);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        // Refresh status
        const statusRes = await fetch('/api/automation/status');
        if (statusRes.ok) setStatus(await statusRes.json());
      }
    } catch {
      // error
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return t('status.never');
    try {
      return new Date(dateStr).toLocaleDateString(
        locale === 'ar' ? 'ar-SA' : 'en-US',
        { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
      );
    } catch {
      return t('status.never');
    }
  };

  const formatDuration = (ms: number | null) => {
    if (ms === null) return '—';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'full_check': return t('history.fullCheck');
      case 'expiration': return t('history.expiration');
      case 'insurance': return t('history.insurance');
      case 'escalation': return t('history.escalation');
      default: return type;
    }
  };

  const getStatusBadge = (runStatus: string) => {
    switch (runStatus) {
      case 'completed':
        return (
          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="size-3 me-1" />
            {t('history.completed')}
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border-red-200 dark:border-red-800">
            <XCircle className="size-3 me-1" />
            {t('history.failed')}
          </Badge>
        );
      case 'running':
        return (
          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-amber-200 dark:border-amber-800">
            <Loader2 className="size-3 me-1 animate-spin" />
            {t('history.running')}
          </Badge>
        );
      default:
        return <Badge variant="outline">{runStatus}</Badge>;
    }
  };

  // ─── Loading State ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
        <Skeleton className="h-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  // ─── Access Check ────────────────────────────────────────────────────────

  if (!canAccessAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <ShieldAlert className="size-12 text-destructive mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">{t('status.title')}</h2>
            <p className="text-sm text-muted-foreground">
              Only owners and admins can access this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Result Cards Data ───────────────────────────────────────────────────

  const resultCards = lastRunResult
    ? [
        { key: 'licensesExpiring', value: lastRunResult.licensesExpiring, color: 'amber', icon: AlertTriangle },
        { key: 'licensesExpired', value: lastRunResult.licensesExpired, color: 'red', icon: XCircle },
        { key: 'insuranceExpiring', value: lastRunResult.insuranceExpiring, color: 'amber', icon: AlertTriangle },
        { key: 'escalations', value: lastRunResult.escalations, color: 'red', icon: ShieldAlert },
        { key: 'notificationsSent', value: lastRunResult.notificationsCreated, color: 'teal', icon: Bell },
      ]
    : [];

  const colorMap: Record<string, { bg: string; text: string; darkBg: string; darkText: string }> = {
    amber: { bg: 'bg-amber-100', text: 'text-amber-700', darkBg: 'dark:bg-amber-900/40', darkText: 'dark:text-amber-400' },
    red: { bg: 'bg-red-100', text: 'text-red-700', darkBg: 'dark:bg-red-900/40', darkText: 'dark:text-red-400' },
    teal: { bg: 'bg-teal-100', text: 'text-teal-700', darkBg: 'dark:bg-teal-900/40', darkText: 'dark:text-teal-400' },
    emerald: { bg: 'bg-emerald-100', text: 'text-emerald-700', darkBg: 'dark:bg-emerald-900/40', darkText: 'dark:text-emerald-400' },
  };

  return (
    <motion.div className="space-y-6" variants={staggerContainer} initial="initial" animate="animate">
      {/* Header */}
      <motion.div variants={staggerItem} className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25">
          <Zap className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('description')}</p>
        </div>
      </motion.div>

      {/* Status + Toggle + Quick Actions Row */}
      <motion.div variants={staggerItem} className="grid gap-6 lg:grid-cols-3">
        {/* Engine Status Card */}
        <Card className="lg:col-span-2 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <RotateCw className="size-5 text-emerald-600 dark:text-emerald-400" />
                {t('status.title')}
              </CardTitle>
              <AnimatePresence mode="wait">
                {status?.enabled ? (
                  <motion.div
                    key="running"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                  >
                    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
                      <span className="size-2 rounded-full bg-emerald-500 me-1.5 animate-pulse" />
                      {t('status.running')}
                    </Badge>
                  </motion.div>
                ) : (
                  <motion.div
                    key="stopped"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                  >
                    <Badge variant="outline" className="text-muted-foreground">
                      {t('status.stopped')}
                    </Badge>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{t('status.lastRun')}</p>
                <p className="text-sm font-medium">{formatDate(status?.lastRunAt || null)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{t('status.nextRun')}</p>
                <p className="text-sm font-medium">{formatDate(status?.nextRunAt || null)}</p>
              </div>
            </div>

            <Separator className="my-4" />

            {/* Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  {localSettings.enabled ? t('status.enabled') : t('status.disabled')}
                </p>
              </div>
              <Switch
                checked={localSettings.enabled}
                onCheckedChange={(checked) =>
                  setLocalSettings((prev) => ({ ...prev, enabled: checked }))
                }
                aria-label={t('status.enabled')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Manual Run Card */}
        <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Play className="size-5 text-teal-600 dark:text-teal-400" />
              {t('run.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Manually trigger a full compliance check across all licenses, insurance, and escalation rules.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-sm hover:shadow-md transition-all duration-200"
                  disabled={running}
                >
                  {running ? (
                    <>
                      <Loader2 className="size-4 me-2 animate-spin" />
                      {t('run.running')}
                    </>
                  ) : (
                    <>
                      <Zap className="size-4 me-2" />
                      {t('run.runNow')}
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('run.confirm')}</AlertDialogTitle>
                  <AlertDialogDescription>{t('run.confirmDesc')}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('run.cancel') || 'Cancel'}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleRunNow}>
                    <Zap className="size-4 me-2" />
                    {t('run.runNow')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Last Run Status */}
            {status?.stats.lastRunStatus && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Last:</span>
                {getStatusBadge(status.stats.lastRunStatus)}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Settings Section */}
      <motion.div variants={staggerItem}>
        <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="size-5 text-emerald-600 dark:text-emerald-400" />
              {t('settings.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* Check Frequency */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t('settings.checkFrequency')}</Label>
                <Select
                  value={localSettings.checkFrequency}
                  onValueChange={(value) =>
                    setLocalSettings((prev) => ({ ...prev, checkFrequency: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">{t('settings.hourly')}</SelectItem>
                    <SelectItem value="daily">{t('settings.daily')}</SelectItem>
                    <SelectItem value="weekly">{t('settings.weekly')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Escalation Days */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t('settings.escalationDays')}</Label>
                <Input
                  type="number"
                  min={1}
                  max={90}
                  value={localSettings.escalationDays}
                  onChange={(e) =>
                    setLocalSettings((prev) => ({
                      ...prev,
                      escalationDays: parseInt(e.target.value) || 7,
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground">{t('settings.escalationDesc')}</p>
              </div>

              {/* Notification Toggles */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">{t('settings.notifyExpired')}</Label>
                  <Switch
                    checked={localSettings.notifyExpired}
                    onCheckedChange={(checked) =>
                      setLocalSettings((prev) => ({ ...prev, notifyExpired: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">{t('settings.notifyExpiring')}</Label>
                  <Switch
                    checked={localSettings.notifyExpiring}
                    onCheckedChange={(checked) =>
                      setLocalSettings((prev) => ({ ...prev, notifyExpiring: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">{t('settings.notifyInsurance')}</Label>
                  <Switch
                    checked={localSettings.notifyInsurance}
                    onCheckedChange={(checked) =>
                      setLocalSettings((prev) => ({ ...prev, notifyInsurance: checked }))
                    }
                  />
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="flex items-center gap-3">
              <Button
                onClick={handleSaveSettings}
                disabled={saving}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-sm hover:shadow-md transition-all duration-200"
              >
                {saving ? (
                  <>
                    <Loader2 className="size-4 me-2 animate-spin" />
                    {t('settings.saving')}
                  </>
                ) : (
                  t('settings.save')
                )}
              </Button>
              {saved && (
                <motion.span
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1"
                >
                  <CheckCircle2 className="size-4" />
                  {t('settings.saved')}
                </motion.span>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Last Run Results */}
      <AnimatePresence>
        {lastRunResult && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="shadow-sm border-emerald-200 dark:border-emerald-800/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
                  {t('run.results')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
                  {resultCards.map((card) => {
                    const c = colorMap[card.color] || colorMap.teal;
                    const Icon = card.icon;
                    return (
                      <motion.div
                        key={card.key}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className={cn(
                          'rounded-xl p-4 text-center',
                          c.bg, c.darkBg
                        )}
                      >
                        <Icon className={cn('size-5 mx-auto mb-2', c.text, c.darkText)} />
                        <p className={cn('text-2xl font-bold', c.text, c.darkText)}>{card.value}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t(`run.${card.key}` as Parameters<typeof t>[0])}
                        </p>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Run History + Activity Log */}
      <motion.div variants={staggerItem} className="grid gap-6 lg:grid-cols-5">
        {/* Run History Table */}
        <Card className="lg:col-span-3 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="size-5 text-emerald-600 dark:text-emerald-400" />
              {t('history.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <div className="text-center py-8">
                <History className="size-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">{t('history.noHistory')}</p>
              </div>
            ) : (
              <ScrollArea className="max-h-96">
                <div className="space-y-2">
                  {/* Table Header */}
                  <div className="grid grid-cols-5 gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground/60">
                    <span>{t('history.type')}</span>
                    <span>{t('history.status')}</span>
                    <span>{t('history.startedAt')}</span>
                    <span>{t('history.completedAt')}</span>
                    <span>{t('history.duration')}</span>
                  </div>
                  <Separator />
                  {history.map((run) => (
                    <motion.div
                      key={run.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="grid grid-cols-5 gap-2 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors text-sm"
                    >
                      <span className="font-medium">{getTypeLabel(run.type)}</span>
                      <span>{getStatusBadge(run.status)}</span>
                      <span className="text-muted-foreground text-xs">
                        {new Date(run.startedAt).toLocaleTimeString(
                          locale === 'ar' ? 'ar-SA' : 'en-US',
                          { hour: '2-digit', minute: '2-digit' }
                        )}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {run.completedAt
                          ? new Date(run.completedAt).toLocaleTimeString(
                              locale === 'ar' ? 'ar-SA' : 'en-US',
                              { hour: '2-digit', minute: '2-digit' }
                            )
                          : '—'}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {formatDuration(run.duration)}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Activity Log (Recent Automation Notifications) */}
        <Card className="lg:col-span-2 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="size-5 text-teal-600 dark:text-teal-400" />
              Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="size-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No automation notifications yet</p>
              </div>
            ) : (
              <ScrollArea className="max-h-96">
                <div className="space-y-3">
                  {notifications.map((notif) => (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        'rounded-lg p-3 border transition-colors',
                        notif.read
                          ? 'bg-muted/30 border-border/50'
                          : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-800/30'
                      )}
                    >
                      <p className="text-xs font-medium truncate">{notif.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(notif.createdAt).toLocaleString(
                          locale === 'ar' ? 'ar-SA' : 'en-US',
                          { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
                        )}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
