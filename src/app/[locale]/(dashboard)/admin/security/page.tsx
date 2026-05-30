'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ShieldAlert,
  ShieldCheck,
  Fingerprint,
  Database,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Plus,
  Activity,
  Loader2,
  Bug,
  Code,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRole } from '@/hooks/useRole';

interface SecurityStats {
  rateLimiting: {
    apiLimiter: { windowMs: number; maxRequests: number; label: string };
    authLimiter: { windowMs: number; maxRequests: number; label: string };
    publicApiLimiter: { windowMs: number; maxRequests: number; label: string };
    totalHits: number;
  };
  csrf: {
    tokensGenerated: number;
    tokensValidated: number;
    validationFailures: number;
    activeTokens: number;
  };
  sanitization: {
    inputsSanitized: number;
    xssBlocked: number;
    sqlInjectionBlocked: number;
  };
  securityHeaders: Array<{
    name: string;
    value: string;
    enabled: boolean;
  }>;
  failedAuthCount: number;
  recentSecurityEvents: Array<{
    id: string;
    action: string;
    entityType: string;
    entityName: string | null;
    details: string | null;
    userId: string | null;
    createdAt: string;
  }>;
}

interface BackupInfo {
  fileName: string;
  size: number;
  createdAt: string;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatWindowMs(ms: number): string {
  if (ms >= 60000) return `${Math.round(ms / 60000)} min`;
  return `${ms}ms`;
}

export default function SecurityPage() {
  const t = useTranslations('security');
  const tNav = useTranslations('nav');
  const locale = useLocale();
  const { canAccessAdmin } = useRole();

  const [securityStats, setSecurityStats] = useState<SecurityStats | null>(null);
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [autoBackupSchedule, setAutoBackupSchedule] = useState<'disabled' | 'daily' | 'weekly'>('disabled');

  const fetchSecurityStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/security/stats');
      if (res.ok) {
        const data = await res.json();
        setSecurityStats(data);
      }
    } catch {
      // silently fail
    }
  }, []);

  const fetchBackups = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/backup');
      if (res.ok) {
        const data = await res.json();
        setBackups(data.backups || []);
      }
    } catch {
      // silently fail
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchSecurityStats(), fetchBackups()]);
    setLoading(false);
  }, [fetchSecurityStats, fetchBackups]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateBackup = async () => {
    setCreatingBackup(true);
    try {
      const res = await fetch('/api/admin/backup', { method: 'POST' });
      if (res.ok) {
        await fetchBackups();
      }
    } catch {
      // silently fail
    } finally {
      setCreatingBackup(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(
      locale === 'ar' ? 'ar-SA' : 'en-US',
      {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }
    );
  };

  const getEventIcon = (action: string) => {
    if (action.includes('login_failed') || action.includes('auth'))
      return <AlertTriangle className="size-4 text-red-500" />;
    if (action.includes('rate_limit'))
      return <Fingerprint className="size-4 text-amber-500" />;
    if (action.includes('csrf'))
      return <ShieldAlert className="size-4 text-orange-500" />;
    if (action.includes('xss') || action.includes('sanitiz'))
      return <Bug className="size-4 text-purple-500" />;
    if (action.includes('delete'))
      return <AlertTriangle className="size-4 text-red-500" />;
    return <Activity className="size-4 text-muted-foreground" />;
  };

  const getEventLabel = (action: string) => {
    if (action.includes('login_failed')) return t('audit.failedAuth');
    if (action.includes('rate_limit')) return t('audit.rateLimitHit');
    if (action.includes('csrf')) return t('audit.csrfFailure');
    if (action.includes('xss')) return t('audit.xssAttempt');
    if (action.includes('delete')) return t('audit.failedAuth');
    return action;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-56" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!canAccessAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <ShieldAlert className="size-12 text-destructive mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">
              Access Denied
            </h2>
            <p className="text-sm text-muted-foreground">
              Only owners and admins can access this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const limiters = securityStats?.rateLimiting
    ? [
        {
          ...securityStats.rateLimiting.apiLimiter,
          key: 'api',
          current: 0,
          max: securityStats.rateLimiting.apiLimiter.maxRequests,
        },
        {
          ...securityStats.rateLimiting.authLimiter,
          key: 'auth',
          current: 0,
          max: securityStats.rateLimiting.authLimiter.maxRequests,
        },
        {
          ...securityStats.rateLimiting.publicApiLimiter,
          key: 'public',
          current: 0,
          max: securityStats.rateLimiting.publicApiLimiter.maxRequests,
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-emerald-600 bg-clip-text text-transparent">
          {t('title')}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t('description')}</p>
      </div>

      {/* Row 1: Rate Limiting + Security Headers */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Rate Limiting Card */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900 dark:to-teal-900">
                <Fingerprint className="size-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <CardTitle>{t('rateLimiting.title')}</CardTitle>
                <CardDescription>{t('rateLimiting.description')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {limiters.map((limiter) => (
              <div key={limiter.key} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    {limiter.key === 'api' && t('rateLimiting.apiLimit')}
                    {limiter.key === 'auth' && t('rateLimiting.authLimit')}
                    {limiter.key === 'public' && t('rateLimiting.publicApiLimit')}
                  </span>
                  <span className="text-muted-foreground">
                    {limiter.max} {t('rateLimiting.requestsPerMinute')}
                  </span>
                </div>
                <Progress
                  value={0}
                  className="h-2"
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {t('rateLimiting.windowMs')}: {formatWindowMs(limiter.windowMs)}
                  </span>
                  <Badge
                    variant="outline"
                    className="text-emerald-600 border-emerald-300 dark:text-emerald-400 dark:border-emerald-700 text-[10px]"
                  >
                    {t('rateLimiting.active')}
                  </Badge>
                </div>
              </div>
            ))}
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Rate Limit Hits</span>
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                {securityStats?.rateLimiting.totalHits || 0}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Security Headers Card */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900 dark:to-teal-900">
                <ShieldCheck className="size-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <CardTitle>{t('headers.title')}</CardTitle>
                <CardDescription>{t('headers.description')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {securityStats?.securityHeaders.map((header) => (
              <div
                key={header.name}
                className="flex items-center justify-between gap-3 py-2"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {header.enabled ? (
                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                  ) : (
                    <XCircle className="size-4 text-red-500 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{header.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {header.value}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    'shrink-0 text-[10px]',
                    header.enabled
                      ? 'text-emerald-600 border-emerald-300 dark:text-emerald-400 dark:border-emerald-700'
                      : 'text-red-600 border-red-300 dark:text-red-400 dark:border-red-700'
                  )}
                >
                  {header.enabled ? t('headers.enabled') : t('headers.disabled')}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Row 2: CSRF + Sanitization */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* CSRF Protection Card */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900 dark:to-teal-900">
                <ShieldAlert className="size-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <CardTitle>{t('csrf.title')}</CardTitle>
                <CardDescription>{t('csrf.description')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-border/50 p-3 text-center">
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {securityStats?.csrf.tokensGenerated || 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('csrf.tokensGenerated')}
                </p>
              </div>
              <div className="rounded-lg border border-border/50 p-3 text-center">
                <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                  {securityStats?.csrf.tokensValidated || 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('csrf.tokensValidated')}
                </p>
              </div>
              <div className="rounded-lg border border-border/50 p-3 text-center">
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {securityStats?.csrf.validationFailures || 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('csrf.failures')}
                </p>
              </div>
              <div className="rounded-lg border border-border/50 p-3 text-center">
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {securityStats?.csrf.activeTokens || 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Active Tokens
                </p>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('csrf.status')}</span>
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
                {t('headers.enabled')}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Input Sanitization Card */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900 dark:to-teal-900">
                <Code className="size-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <CardTitle>{t('sanitization.title')}</CardTitle>
                <CardDescription>{t('sanitization.description')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border/50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                    <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-sm font-medium">{t('sanitization.inputsSanitized')}</span>
                </div>
                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {securityStats?.sanitization.inputsSanitized || 0}
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-border/50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-red-100 dark:bg-red-900 flex items-center justify-center">
                    <Bug className="size-4 text-red-600 dark:text-red-400" />
                  </div>
                  <span className="text-sm font-medium">{t('sanitization.xssBlocked')}</span>
                </div>
                <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {securityStats?.sanitization.xssBlocked || 0}
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-border/50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                    <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <span className="text-sm font-medium">{t('sanitization.sqlInjectionBlocked')}</span>
                </div>
                <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {securityStats?.sanitization.sqlInjectionBlocked || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Database Backups */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900 dark:to-teal-900">
                <Database className="size-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <CardTitle>{t('backups.title')}</CardTitle>
                <CardDescription>{t('backups.description')}</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Auto Backup Schedule */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{t('backups.autoBackup')}:</span>
                <select
                  value={autoBackupSchedule}
                  onChange={(e) => setAutoBackupSchedule(e.target.value as 'disabled' | 'daily' | 'weekly')}
                  className="text-xs rounded-md border border-border bg-background px-2 py-1 text-foreground"
                >
                  <option value="disabled">{t('backups.disabled')}</option>
                  <option value="daily">{t('backups.daily')}</option>
                  <option value="weekly">{t('backups.weekly')}</option>
                </select>
              </div>
              <Button
                onClick={handleCreateBackup}
                disabled={creatingBackup}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-sm hover:shadow-md transition-all"
              >
                {creatingBackup ? (
                  <>
                    <Loader2 className="size-4 me-2 animate-spin" />
                    {t('backups.creating')}
                  </>
                ) : (
                  <>
                    <Plus className="size-4 me-2" />
                    {t('backups.createBackup')}
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {backups.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('backups.fileName')}</TableHead>
                  <TableHead>{t('backups.size')}</TableHead>
                  <TableHead>{t('backups.created')}</TableHead>
                  <TableHead className="text-end">{t('backups.createBackup').replace('Now', '')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {backups.map((backup) => (
                  <TableRow key={backup.fileName}>
                    <TableCell className="font-medium text-sm">
                      <div className="flex items-center gap-2">
                        <Database className="size-4 text-emerald-500" />
                        {backup.fileName}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatFileSize(backup.size)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(backup.createdAt)}
                    </TableCell>
                    <TableCell className="text-end">
                      <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950">
                        <Download className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Database className="size-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground font-medium">{t('backups.noBackups')}</p>
              <p className="text-xs text-muted-foreground/70 mt-1">{t('backups.createFirst')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Row 4: Security Audit Log */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900 dark:to-teal-900">
              <Activity className="size-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <CardTitle>{t('audit.title')}</CardTitle>
              <CardDescription>{t('audit.description')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {securityStats?.recentSecurityEvents &&
          securityStats.recentSecurityEvents.length > 0 ? (
            <ScrollArea className="max-h-96">
              <div className="space-y-2">
                {securityStats.recentSecurityEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <div className="shrink-0">
                      {getEventIcon(event.action)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">
                          {getEventLabel(event.action)}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {event.entityName || event.details || event.action}
                      </p>
                    </div>
                    <div className="shrink-0 flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="size-3" />
                      {formatDate(event.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8">
              <ShieldCheck className="size-12 text-emerald-500/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground font-medium">{t('audit.noEvents')}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
