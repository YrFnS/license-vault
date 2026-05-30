'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  Bell,
  BellOff,
  Eye,
  EyeOff,
  X,
  Search,
  ExternalLink,
  RefreshCw,
  CheckCheck,
  Plus,
  Trash2,
  MapPin,
  Clock,
  AlertTriangle,
  Info,
  ChevronDown,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS',
  'KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY',
  'NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV',
  'WI','WY','DC',
];

const LICENSE_TYPES = [
  'General Contractor',
  'Electrical',
  'Plumbing',
  'HVAC',
  'Roofing',
  'Concrete',
  'Carpentry',
  'Painting',
  'Masonry',
  'Excavation',
];

interface AlertData {
  id: string;
  state: string;
  licenseType: string | null;
  title: string;
  description: string;
  changeType: string;
  severity: string;
  sourceUrl: string | null;
  effectiveDate: string | null;
  isRead: boolean;
  isDismissed: boolean;
  createdAt: string;
}

interface WatchData {
  id: string;
  state: string;
  licenseType: string | null;
  isActive: boolean;
  lastChecked: string | null;
  createdAt: string;
}

interface AlertStats {
  total: number;
  unread: number;
  critical: number;
  watchedStates: number;
}

function getSeverityColor(severity: string) {
  switch (severity) {
    case 'critical': return 'bg-red-500';
    case 'warning': return 'bg-amber-500';
    case 'info': return 'bg-teal-500';
    default: return 'bg-teal-500';
  }
}

function getSeverityBg(severity: string) {
  switch (severity) {
    case 'critical': return 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50';
    case 'warning': return 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50';
    case 'info': return 'bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-900/50';
    default: return 'bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-900/50';
  }
}

function getChangeTypeBadge(changeType: string, t: any) {
  const config: Record<string, { color: string; key: string }> = {
    new_requirement: { color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', key: 'newRequirement' },
    fee_change: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300', key: 'feeChange' },
    deadline_change: { color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300', key: 'deadlineChange' },
    form_update: { color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', key: 'formUpdate' },
    regulatory_update: { color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300', key: 'regulatoryUpdate' },
    update: { color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300', key: 'regulatoryUpdate' },
  };
  const c = config[changeType] || config.update;
  return (
    <Badge className={cn('text-[10px] px-1.5 py-0 font-medium border-0', c.color)}>
      {t(c.key)}
    </Badge>
  );
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch {
    return null;
  }
}

function formatRelative(dateStr: string) {
  try {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    return formatDate(dateStr) || '';
  } catch {
    return '';
  }
}

export default function RegulatoryAlertsPage() {
  const t = useTranslations('regulatoryAlerts');
  const tc = useTranslations('common');

  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [stats, setStats] = useState<AlertStats>({ total: 0, unread: 0, critical: 0, watchedStates: 0 });
  const [watches, setWatches] = useState<WatchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [changeTypeFilter, setChangeTypeFilter] = useState<string>('all');
  const [addWatchOpen, setAddWatchOpen] = useState(false);
  const [newWatchState, setNewWatchState] = useState('');
  const [newWatchLicenseType, setNewWatchLicenseType] = useState('');
  const [addingWatch, setAddingWatch] = useState(false);

  const fetchAlerts = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (severityFilter !== 'all') params.set('severity', severityFilter);
      if (changeTypeFilter !== 'all') params.set('changeType', changeTypeFilter);
      const res = await fetch(`/api/regulatory-alerts?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts);
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Fetch alerts error:', err);
    }
  }, [severityFilter, changeTypeFilter]);

  const fetchWatches = useCallback(async () => {
    try {
      const res = await fetch('/api/regulatory-watches');
      if (res.ok) {
        const data = await res.json();
        setWatches(data.watches);
      }
    } catch (err) {
      console.error('Fetch watches error:', err);
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchAlerts(), fetchWatches()]).finally(() => setLoading(false));
  }, [fetchAlerts, fetchWatches]);

  const handleCheckForUpdates = async () => {
    setChecking(true);
    try {
      const res = await fetch('/api/regulatory-alerts/feeds');
      if (res.ok) {
        const data = await res.json();
        if (data.newAlerts > 0) {
          toast.success(t('foundNewAlerts', { count: data.newAlerts }));
        } else {
          toast.info(t('noNewAlerts'));
        }
        fetchAlerts();
        fetchWatches();
      }
    } catch {
      toast.error(tc('retry'));
    } finally {
      setChecking(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/regulatory-alerts/mark-read', { method: 'PUT' });
      if (res.ok) {
        toast.success(t('markAllRead'));
        fetchAlerts();
      }
    } catch {
      toast.error(tc('retry'));
    }
  };

  const handleToggleRead = async (alert: AlertData) => {
    try {
      const res = await fetch(`/api/regulatory-alerts/${alert.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: !alert.isRead }),
      });
      if (res.ok) fetchAlerts();
    } catch {
      toast.error(tc('retry'));
    }
  };

  const handleDismiss = async (alert: AlertData) => {
    try {
      const res = await fetch(`/api/regulatory-alerts/${alert.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDismissed: true }),
      });
      if (res.ok) {
        toast.success(t('dismissed'));
        fetchAlerts();
      }
    } catch {
      toast.error(tc('retry'));
    }
  };

  const handleAddWatch = async () => {
    if (!newWatchState) return;
    setAddingWatch(true);
    try {
      const res = await fetch('/api/regulatory-watches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: newWatchState, licenseType: newWatchLicenseType || undefined }),
      });
      if (res.ok) {
        toast.success(t('addWatch'));
        setAddWatchOpen(false);
        setNewWatchState('');
        setNewWatchLicenseType('');
        fetchWatches();
      } else if (res.status === 409) {
        toast.error('Watch already exists');
      }
    } catch {
      toast.error(tc('retry'));
    } finally {
      setAddingWatch(false);
    }
  };

  const handleRemoveWatch = async (id: string) => {
    try {
      const res = await fetch(`/api/regulatory-watches?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(t('removeWatch'));
        fetchWatches();
      }
    } catch {
      toast.error(tc('retry'));
    }
  };

  const statCards = [
    { label: t('title'), value: stats.total, icon: ShieldAlert, color: 'text-teal-600 dark:text-teal-400', bg: 'from-teal-50/90 via-teal-50/60 to-teal-100/40 dark:from-teal-950/40 dark:via-teal-950/20 dark:to-teal-900/10' },
    { label: t('critical'), value: stats.critical, icon: AlertTriangle, color: 'text-red-600 dark:text-red-400', bg: 'from-red-50/90 via-red-50/60 to-red-100/40 dark:from-red-950/40 dark:via-red-950/20 dark:to-red-900/10' },
    { label: t('unreadAlerts'), value: stats.unread, icon: Bell, color: 'text-amber-600 dark:text-amber-400', bg: 'from-amber-50/90 via-amber-50/60 to-amber-100/40 dark:from-amber-950/40 dark:via-amber-950/20 dark:to-amber-900/10' },
    { label: t('watchedStates'), value: stats.watchedStates, icon: MapPin, color: 'text-emerald-600 dark:text-emerald-400', bg: 'from-emerald-50/90 via-emerald-50/60 to-emerald-100/40 dark:from-emerald-950/40 dark:via-emerald-950/20 dark:to-emerald-900/10' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="size-8 text-emerald-500 animate-spin" />
          <p className="text-sm text-muted-foreground">{tc('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-emerald-600 dark:to-emerald-400 bg-clip-text text-transparent">
            {t('title')}
          </h1>
          <p className="text-muted-foreground mt-1">{t('description')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={stats.unread === 0}
            className="gap-1.5"
          >
            <CheckCheck className="size-3.5" />
            <span className="hidden sm:inline">{t('markAllRead')}</span>
          </Button>
          <Button
            size="sm"
            onClick={handleCheckForUpdates}
            disabled={checking}
            className="gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
          >
            <RefreshCw className={cn('size-3.5', checking && 'animate-spin')} />
            {checking ? t('checkingForUpdates') : t('checkForUpdates')}
          </Button>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className={cn(
              'bg-gradient-to-br border-s-4 border-s-teal-400 hover:shadow-md transition-shadow',
              card.bg
            )}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{card.label}</p>
                    <p className="text-2xl md:text-3xl font-extrabold tabular-nums mt-1">{card.value}</p>
                  </div>
                  <card.icon className={cn('size-8 opacity-60', card.color)} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="alerts" className="gap-1.5">
            <Bell className="size-3.5" />
            {t('alerts')}
            {stats.unread > 0 && (
              <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] px-1.5 py-0 ml-1">
                {stats.unread}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="watches" className="gap-1.5">
            <MapPin className="size-3.5" />
            {t('watchSettings')}
          </TabsTrigger>
        </TabsList>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder={t('severity')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="critical">{t('critical')}</SelectItem>
                <SelectItem value="warning">{t('warning')}</SelectItem>
                <SelectItem value="info">{t('info')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={changeTypeFilter} onValueChange={setChangeTypeFilter}>
              <SelectTrigger className="w-full sm:w-52">
                <SelectValue placeholder={t('changeType')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="new_requirement">{t('newRequirement')}</SelectItem>
                <SelectItem value="fee_change">{t('feeChange')}</SelectItem>
                <SelectItem value="deadline_change">{t('deadlineChange')}</SelectItem>
                <SelectItem value="form_update">{t('formUpdate')}</SelectItem>
                <SelectItem value="regulatory_update">{t('regulatoryUpdate')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Alert List */}
          <ScrollArea className="max-h-[calc(100vh-400px)]">
            <AnimatePresence>
              {alerts.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-16 text-center"
                >
                  <ShieldAlert className="size-12 text-muted-foreground/30 mb-3" />
                  <h3 className="text-lg font-medium text-muted-foreground">{t('noAlerts')}</h3>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    {t('checkForUpdates')} to find regulatory changes
                  </p>
                </motion.div>
              ) : (
                <div className="space-y-2">
                  {alerts.map((alert, i) => (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: i * 0.05 }}
                      className={cn(
                        'relative rounded-lg border p-3 md:p-4 transition-all hover:shadow-sm',
                        !alert.isRead ? getSeverityBg(alert.severity) : 'bg-card border-border',
                      )}
                    >
                      <div className="flex items-start gap-3">
                        {/* Severity dot */}
                        <div className={cn(
                          'mt-1.5 size-2.5 rounded-full shrink-0',
                          getSeverityColor(alert.severity),
                          !alert.isRead && 'animate-pulse',
                        )} />

                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className={cn(
                              'text-sm font-medium leading-tight',
                              !alert.isRead ? 'text-foreground' : 'text-muted-foreground',
                            )}>
                              {alert.title}
                            </h4>
                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7"
                                onClick={() => handleToggleRead(alert)}
                              >
                                {alert.isRead ? (
                                  <EyeOff className="size-3.5 text-muted-foreground" />
                                ) : (
                                  <Eye className="size-3.5 text-emerald-600" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 hover:text-destructive"
                                onClick={() => handleDismiss(alert)}
                              >
                                <X className="size-3.5" />
                              </Button>
                            </div>
                          </div>

                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {alert.description}
                          </p>

                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300">
                              <MapPin className="size-2.5 me-1" />
                              {alert.state}
                            </Badge>
                            {alert.licenseType && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                {alert.licenseType}
                              </Badge>
                            )}
                            {getChangeTypeBadge(alert.changeType, t)}
                            {alert.effectiveDate && (
                              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                <Clock className="size-2.5" />
                                {t('effectiveDate')}: {formatDate(alert.effectiveDate)}
                              </span>
                            )}
                            {alert.sourceUrl && (
                              <a
                                href={alert.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
                              >
                                <ExternalLink className="size-2.5" />
                                Source
                              </a>
                            )}
                            <span className="text-[10px] text-muted-foreground ms-auto">
                              {formatRelative(alert.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </ScrollArea>
        </TabsContent>

        {/* Watch Settings Tab */}
        <TabsContent value="watches" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">{t('watchedStates')}</h3>
            <Dialog open={addWatchOpen} onOpenChange={setAddWatchOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white">
                  <Plus className="size-3.5" />
                  {t('addWatch')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('addWatch')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label>{t('state')}</Label>
                    <Select value={newWatchState} onValueChange={setNewWatchState}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('state')} />
                      </SelectTrigger>
                      <SelectContent>
                        {US_STATES.map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('licenseType')} (optional)</Label>
                    <Select value={newWatchLicenseType} onValueChange={setNewWatchLicenseType}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('licenseType')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {LICENSE_TYPES.map(lt => (
                          <SelectItem key={lt} value={lt}>{lt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={handleAddWatch}
                    disabled={!newWatchState || addingWatch}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                  >
                    {addingWatch ? tc('loading') : t('addWatch')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {watches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <MapPin className="size-12 text-muted-foreground/30 mb-3" />
              <h3 className="text-lg font-medium text-muted-foreground">{t('noWatches')}</h3>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Add states to watch for regulatory changes
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {watches.map((watch, i) => (
                <motion.div
                  key={watch.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-3 md:p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                          <MapPin className="size-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{watch.state}</span>
                            {watch.licenseType && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                {watch.licenseType}
                              </Badge>
                            )}
                            <Badge className={cn(
                              'text-[10px] px-1.5 py-0 border-0',
                              watch.isActive
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
                            )}>
                              {watch.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {t('lastChecked')}: {watch.lastChecked ? formatRelative(watch.lastChecked) : 'Never'}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleRemoveWatch(watch.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
