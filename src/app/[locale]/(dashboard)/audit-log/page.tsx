'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Pencil, Trash2, Search, ClipboardList, Loader2, FileText } from 'lucide-react';

interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  entityName: string | null;
  details: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string } | null;
}

export default function AuditLogPage() {
  const t = useTranslations('auditLog');
  const tCommon = useTranslations('common');

  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [actionFilter, setActionFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const PAGE_SIZE = 20;

  const fetchLogs = useCallback(async (pageNum: number, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: PAGE_SIZE.toString(),
      });

      if (actionFilter && actionFilter !== 'all') {
        params.set('action', actionFilter);
      }

      if (search) {
        params.set('search', search);
      }

      const res = await fetch(`/api/audit-log?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (append) {
          setLogs((prev) => [...prev, ...data.logs]);
        } else {
          setLogs(data.logs);
        }
        setTotal(data.total);
        setHasMore(pageNum * PAGE_SIZE < data.total);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [actionFilter, search]);

  useEffect(() => {
    setPage(1);
    fetchLogs(1, false);
  }, [fetchLogs]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchLogs(nextPage, true);
  };

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
        return <Plus className="size-3.5" />;
      case 'update':
        return <Pencil className="size-3.5" />;
      case 'delete':
        return <Trash2 className="size-3.5" />;
      default:
        return <FileText className="size-3.5" />;
    }
  };

  const getActionBadgeVariant = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      case 'update':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      case 'delete':
        return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border-red-200 dark:border-red-800';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700';
    }
  };

  const getActionLabel = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
        return t('filterCreate');
      case 'update':
        return t('filterUpdate');
      case 'delete':
        return t('filterDelete');
      default:
        return action;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 flex-1" />
        </div>
        <Card>
          <CardContent className="p-0">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3 border-b last:border-b-0">
                <Skeleton className="size-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900 shrink-0">
          <ClipboardList className="size-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={actionFilter} onValueChange={(val) => setActionFilter(val)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filterAll')}</SelectItem>
            <SelectItem value="create">{t('filterCreate')}</SelectItem>
            <SelectItem value="update">{t('filterUpdate')}</SelectItem>
            <SelectItem value="delete">{t('filterDelete')}</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder={t('searchPlaceholder')}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="ps-9"
            />
          </div>
          <Button onClick={handleSearch} variant="outline" className="shrink-0">
            <Search className="size-4 me-2" />
            {tCommon('search')}
          </Button>
        </div>
      </div>

      {/* Results count */}
      {total > 0 && (
        <p className="text-sm text-muted-foreground">
          {t('showing', { count: logs.length, total })}
        </p>
      )}

      {/* Table - Desktop */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-start px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t('date')}
                  </th>
                  <th className="text-start px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t('action')}
                  </th>
                  <th className="text-start px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t('entity')}
                  </th>
                  <th className="text-start px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t('details')}
                  </th>
                  <th className="text-start px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t('user')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b last:border-b-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={`gap-1 text-xs font-medium ${getActionBadgeVariant(log.action)}`}
                      >
                        {getActionIcon(log.action)}
                        {getActionLabel(log.action)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium capitalize">{log.entityType}</p>
                        {log.entityName && (
                          <p className="text-xs text-muted-foreground truncate max-w-48">
                            {log.entityName}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs truncate">
                      {log.details || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      {log.user ? log.user.name : t('system')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {logs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ClipboardList className="size-12 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">{t('noLogs')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cards - Mobile */}
      <div className="md:hidden space-y-3">
        {logs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ClipboardList className="size-12 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">{t('noLogs')}</p>
          </div>
        )}
        {logs.map((log) => (
          <Card key={log.id}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Badge
                  variant="outline"
                  className={`gap-1 text-xs font-medium ${getActionBadgeVariant(log.action)}`}
                >
                  {getActionIcon(log.action)}
                  {getActionLabel(log.action)}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDate(log.createdAt)}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium capitalize">{log.entityType}</p>
                {log.entityName && (
                  <p className="text-xs text-muted-foreground">{log.entityName}</p>
                )}
              </div>
              {log.details && (
                <p className="text-sm text-muted-foreground">{log.details}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {log.user ? log.user.name : t('system')}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="min-w-[160px]"
          >
            {loadingMore ? (
              <>
                <Loader2 className="size-4 animate-spin me-2" />
                {tCommon('loading')}
              </>
            ) : (
              t('loadMore')
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
