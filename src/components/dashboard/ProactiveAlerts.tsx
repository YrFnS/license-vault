'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertOctagon,
  AlertTriangle,
  Info,
  Sparkles,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ProactiveAlert {
  id: string;
  type: 'expiration' | 'ce_gap' | 'insurance_deficiency' | 'renewal_needed' | 'compliance_risk';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  actionItems: string[];
  relatedItemId?: string;
  relatedItemType?: 'license' | 'insurance' | 'ce';
  dueDate?: string;
}

const severityConfig = {
  critical: {
    icon: AlertOctagon,
    bgClass: 'bg-red-50 dark:bg-red-950/30',
    borderClass: 'border-red-200 dark:border-red-800',
    textClass: 'text-red-700 dark:text-red-400',
    badgeClass: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400',
    iconClass: 'text-red-500 dark:text-red-400',
    hoverClass: 'hover:bg-red-100 dark:hover:bg-red-950/50',
  },
  warning: {
    icon: AlertTriangle,
    bgClass: 'bg-amber-50 dark:bg-amber-950/30',
    borderClass: 'border-amber-200 dark:border-amber-800',
    textClass: 'text-amber-700 dark:text-amber-400',
    badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400',
    iconClass: 'text-amber-500 dark:text-amber-400',
    hoverClass: 'hover:bg-amber-100 dark:hover:bg-amber-950/50',
  },
  info: {
    icon: Info,
    bgClass: 'bg-teal-50 dark:bg-teal-950/30',
    borderClass: 'border-teal-200 dark:border-teal-800',
    textClass: 'text-teal-700 dark:text-teal-400',
    badgeClass: 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-400',
    iconClass: 'text-teal-500 dark:text-teal-400',
    hoverClass: 'hover:bg-teal-100 dark:hover:bg-teal-950/50',
  },
};

function AlertCard({
  alert,
  onAskAI,
}: {
  alert: ProactiveAlert;
  onAskAI: (alert: ProactiveAlert) => void;
}) {
  const t = useTranslations('dashboard');
  const config = severityConfig[alert.severity];
  const Icon = config.icon;

  const daysUntilDue = alert.dueDate
    ? Math.ceil((new Date(alert.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'rounded-xl border p-4 transition-colors duration-200',
        config.bgClass,
        config.borderClass
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn('shrink-0 mt-0.5', config.iconClass)}>
          <Icon className="size-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className={cn('text-sm font-semibold', config.textClass)}>
              {alert.title}
            </h4>
            {alert.dueDate && daysUntilDue !== null && (
              <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', config.badgeClass)}>
                {daysUntilDue <= 0
                  ? t('expired')
                  : `${daysUntilDue}d`}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {alert.description}
          </p>
          {alert.actionItems.length > 0 && (
            <ul className="mt-2 space-y-1">
              {alert.actionItems.map((item, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-current opacity-40" />
                  {item}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-7 gap-1.5 text-xs px-2',
                config.textClass,
                config.hoverClass
              )}
              onClick={() => onAskAI(alert)}
            >
              <Sparkles className="size-3" />
              {t('askAI')}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function SeveritySection({
  severity,
  alerts,
  onAskAI,
  defaultOpen,
}: {
  severity: 'critical' | 'warning' | 'info';
  alerts: ProactiveAlert[];
  onAskAI: (alert: ProactiveAlert) => void;
  defaultOpen: boolean;
}) {
  const t = useTranslations('dashboard');
  const [open, setOpen] = useState(defaultOpen);
  const config = severityConfig[severity];
  const Icon = config.icon;

  const labelKey = severity === 'critical'
    ? 'criticalAlerts'
    : severity === 'warning'
    ? 'warningAlerts'
    : 'infoAlerts';

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full py-2 text-start"
      >
        <Icon className={cn('size-4', config.iconClass)} />
        <span className={cn('text-sm font-semibold', config.textClass)}>
          {t(labelKey)}
        </span>
        <Badge variant="secondary" className={cn('text-[10px] px-1.5', config.badgeClass)}>
          {alerts.length}
        </Badge>
        <span className="ms-auto">
          {open ? (
            <ChevronUp className="size-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground" />
          )}
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-2 pb-2">
              {alerts.map((alert) => (
                <AlertCard key={alert.id} alert={alert} onAskAI={onAskAI} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ProactiveAlerts() {
  const t = useTranslations('dashboard');
  const locale = useLocale();
  const router = useRouter();
  const [alerts, setAlerts] = useState<ProactiveAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    async function fetchAlerts() {
      try {
        const res = await fetch('/api/ai/proactive-alerts');
        if (res.ok) {
          const data = await res.json();
          setAlerts(data.alerts || []);
        }
      } catch (err) {
        console.error('Failed to fetch proactive alerts:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAlerts();
  }, []);

  const handleAskAI = (alert: ProactiveAlert) => {
    const question = encodeURIComponent(
      `I have an alert: "${alert.title}". ${alert.description} What should I do?`
    );
    router.push(`/ai-chat?q=${question}`);
  };

  if (loading) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Skeleton className="size-5 rounded" />
            <Skeleton className="h-5 w-40" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const criticalAlerts = alerts.filter((a) => a.severity === 'critical');
  const warningAlerts = alerts.filter((a) => a.severity === 'warning');
  const infoAlerts = alerts.filter((a) => a.severity === 'info');

  const displayAlerts = showAll ? alerts : alerts.slice(0, 5);
  const displayCritical = showAll ? criticalAlerts : criticalAlerts.slice(0, 3);
  const displayWarning = showAll ? warningAlerts : warningAlerts.slice(0, 3);
  const displayInfo = showAll ? infoAlerts : infoAlerts.slice(0, 2);

  // If no alerts, show all-clear message
  if (alerts.length === 0) {
    return (
      <Card className="shadow-sm border-emerald-200 dark:border-emerald-800">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-emerald-100 dark:bg-emerald-900/50 p-1.5">
              <Sparkles className="size-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <CardTitle className="text-base">{t('aiAlerts')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center py-6 text-center">
            <div className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 p-3 mb-3">
              <CheckCircle2 className="size-8 text-emerald-500" />
            </div>
            <p className="text-sm font-medium text-foreground">{t('noAlerts')}</p>
            <p className="text-xs text-muted-foreground mt-1">{t('allClear')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-emerald-100 dark:bg-emerald-900/50 p-1.5">
              <Sparkles className="size-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <CardTitle className="text-base">{t('aiAlerts')}</CardTitle>
            <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
              {alerts.length}
            </Badge>
          </div>
          {criticalAlerts.length > 0 && (
            <Badge className="bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400 text-[10px]">
              {criticalAlerts.length} {t('critical')}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-1 max-h-96 overflow-y-auto custom-scrollbar">
        {displayCritical.length > 0 && (
          <SeveritySection
            severity="critical"
            alerts={displayCritical}
            onAskAI={handleAskAI}
            defaultOpen={true}
          />
        )}
        {displayWarning.length > 0 && (
          <SeveritySection
            severity="warning"
            alerts={displayWarning}
            onAskAI={handleAskAI}
            defaultOpen={criticalAlerts.length === 0}
          />
        )}
        {displayInfo.length > 0 && (
          <SeveritySection
            severity="info"
            alerts={displayInfo}
            onAskAI={handleAskAI}
            defaultOpen={criticalAlerts.length === 0 && warningAlerts.length === 0}
          />
        )}
        {!showAll && alerts.length > 5 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setShowAll(true)}
          >
            {t('viewAll')} ({alerts.length} {t('totalLabel')})
            <ArrowRight className="size-3" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
