import { motion } from 'framer-motion';
import { Puzzle, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslations } from 'next-intl';
import { IntegrationStats, fadeIn } from './types';
import { formatTime } from './helpers';

interface StatsCardsProps {
  stats: IntegrationStats | null;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const t = useTranslations('integrations');

  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.4, delay: 0.1 }}
      className="grid grid-cols-2 lg:grid-cols-4 gap-4"
    >
      <Card className="shadow-sm hover:shadow-md transition-all duration-300 border-s-4 border-s-emerald-500">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400">
              <Puzzle className="size-5" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{t('totalIntegrations')}</p>
          <p className="text-2xl md:text-3xl font-extrabold tabular-nums mt-1">{stats?.total ?? 0}</p>
        </CardContent>
      </Card>
      <Card className="shadow-sm hover:shadow-md transition-all duration-300 border-s-4 border-s-teal-500">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 text-teal-600 dark:text-teal-400">
              <CheckCircle2 className="size-5" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{t('connectedCount')}</p>
          <p className="text-2xl md:text-3xl font-extrabold tabular-nums mt-1">{stats?.connected ?? 0}</p>
        </CardContent>
      </Card>
      <Card className="shadow-sm hover:shadow-md transition-all duration-300 border-s-4 border-s-amber-500">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400">
              <Clock className="size-5" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{t('lastSyncTime')}</p>
          <p className="text-lg md:text-xl font-bold mt-1">{formatTime(stats?.lastSyncAt ?? null, t)}</p>
        </CardContent>
      </Card>
      <Card className="shadow-sm hover:shadow-md transition-all duration-300 border-s-4 border-s-red-500">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-red-500/20 to-rose-500/20 text-red-600 dark:text-red-400">
              <AlertCircle className="size-5" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{t('syncErrors')}</p>
          <p className="text-2xl md:text-3xl font-extrabold tabular-nums mt-1">{stats?.totalSyncErrors ?? 0}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
