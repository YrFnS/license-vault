'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { usePageTitle } from '@/hooks/use-page-title';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Mail, MailX, RefreshCw, Filter, Inbox, ArrowRight, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface EmailLogEntry {
  id: string;
  orgId: string | null;
  to: string;
  subject: string;
  type: string;
  status: string;
  error: string | null;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const EMAIL_TYPES = [
  { value: 'expiration_alert', label: 'Expiration Alert', labelAr: 'تنبيه الانتهاء' },
  { value: 'renewal_reminder', label: 'Renewal Reminder', labelAr: 'تذكير التجديد' },
  { value: 'team_invite', label: 'Team Invite', labelAr: 'دعوة الفريق' },
  { value: 'password_reset', label: 'Password Reset', labelAr: 'إعادة تعيين كلمة المرور' },
  { value: 'welcome', label: 'Welcome', labelAr: 'ترحيب' },
];

const STATUS_OPTIONS = [
  { value: 'sent', label: 'Sent', labelAr: 'تم الإرسال' },
  { value: 'failed', label: 'Failed', labelAr: 'فشل' },
];

export default function EmailLogsPage() {
  const t = useTranslations('emailLogs');
  const tPt = useTranslations('pageTitles');
  const locale = useLocale();
  const isRtl = locale === 'ar';
  usePageTitle(t('title'));

  const [logs, setLogs] = useState<EmailLogEntry[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLogs = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      if (typeFilter && typeFilter !== 'all') params.set('type', typeFilter);
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`/api/email-logs?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
        setPagination(data.pagination);
      } else if (res.status === 403) {
        setLogs([]);
        setPagination({ page: 1, limit: 20, total: 0, totalPages: 0 });
      }
    } catch {
      toast.error('Failed to load email logs');
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter]);

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.to.toLowerCase().includes(q) ||
      log.subject.toLowerCase().includes(q) ||
      log.type.toLowerCase().includes(q)
    );
  });

  const getTypeLabel = (type: string) => {
    const found = EMAIL_TYPES.find((t) => t.value === type);
    return found ? (isRtl ? found.labelAr : found.label) : type;
  };

  const getStatusBadge = (status: string) => {
    if (status === 'sent') {
      return (
        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
          <Mail className="size-3 me-1" />
          {t('statusSent')}
        </Badge>
      );
    }
    return (
      <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800">
        <MailX className="size-3 me-1" />
        {t('statusFailed')}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const colorMap: Record<string, string> = {
      expiration_alert: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
      renewal_reminder: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 border-teal-200 dark:border-teal-800',
      team_invite: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 border-violet-200 dark:border-violet-800',
      password_reset: 'bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-400 border-slate-200 dark:border-slate-700',
      welcome: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    };
    const colorClass = colorMap[type] || 'bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    return (
      <Badge className={colorClass}>
        {getTypeLabel(type)}
      </Badge>
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(isRtl ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">{t('description')}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchLogs(pagination.page)}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
          {t('refresh')}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Filter className="size-4" />
              {t('filters')}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full sm:w-auto">
              <Input
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="sm:max-w-[240px]"
              />
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="sm:w-[180px]">
                  <SelectValue placeholder={t('allTypes')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allTypes')}</SelectItem>
                  {EMAIL_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {isRtl ? type.labelAr : type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="sm:w-[150px]">
                  <SelectValue placeholder={t('allStatuses')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allStatuses')}</SelectItem>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {isRtl ? status.labelAr : status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table / List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="size-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              ))}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-16 text-center">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex justify-center mb-4">
                  <div className="size-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <Inbox className="size-8 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">{t('noEmails')}</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">{t('noEmailsDesc')}</p>
              </motion.div>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-start p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('recipient')}</th>
                      <th className="text-start p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('subject')}</th>
                      <th className="text-start p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('type')}</th>
                      <th className="text-start p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('status')}</th>
                      <th className="text-start p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('date')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {filteredLogs.map((log, index) => (
                        <motion.tr
                          key={log.id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03, duration: 0.2 }}
                          className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                        >
                          <td className="p-4">
                            <span className="text-sm font-medium text-foreground">{log.to}</span>
                          </td>
                          <td className="p-4">
                            <span className="text-sm text-muted-foreground line-clamp-1 max-w-[300px]">{log.subject}</span>
                            {log.error && (
                              <p className="text-xs text-red-500 mt-0.5 line-clamp-1">{log.error}</p>
                            )}
                          </td>
                          <td className="p-4">
                            {getTypeBadge(log.type)}
                          </td>
                          <td className="p-4">
                            {getStatusBadge(log.status)}
                          </td>
                          <td className="p-4">
                            <span className="text-sm text-muted-foreground">{formatDate(log.createdAt)}</span>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-border">
                <AnimatePresence>
                  {filteredLogs.map((log, index) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03, duration: 0.2 }}
                      className="p-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">{log.to}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{log.subject}</p>
                        </div>
                        {getStatusBadge(log.status)}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {getTypeBadge(log.type)}
                        <span className="text-xs text-muted-foreground">{formatDate(log.createdAt)}</span>
                      </div>
                      {log.error && (
                        <p className="text-xs text-red-500 mt-1.5 line-clamp-2 bg-red-50 dark:bg-red-950/20 rounded p-2">{log.error}</p>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t('showing')} {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} {t('of')} {pagination.total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchLogs(pagination.page - 1)}
              disabled={pagination.page <= 1 || loading}
              className="gap-1"
            >
              {isRtl ? <ArrowRight className="size-4" /> : <ArrowLeft className="size-4" />}
              {t('previous')}
            </Button>
            <span className="text-sm text-muted-foreground px-2">
              {pagination.page} / {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchLogs(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || loading}
              className="gap-1"
            >
              {t('next')}
              {isRtl ? <ArrowLeft className="size-4" /> : <ArrowRight className="size-4" />}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
