'use client';

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, CheckCircle2, AlertTriangle, XCircle, ShieldAlert } from 'lucide-react';
import type { InsuranceSummary } from './types';

interface InsuranceSummaryCardsProps {
  summary: InsuranceSummary;
  t: (key: string) => string;
}

export default function InsuranceSummaryCards({ summary, t }: InsuranceSummaryCardsProps) {
  return (
    <motion.div variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } }} className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 lg:gap-4">
      <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
        <Card className="border-s-4 border-s-teal-500 shadow-sm hover:shadow-md transition-shadow duration-300 bg-gradient-to-br from-teal-50/90 via-teal-50/60 to-emerald-100/40 dark:from-teal-950/30 dark:via-teal-950/20 dark:to-emerald-950/10">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 rounded-lg bg-background/50 shadow-sm">
                <Shield className="size-4 text-teal-600 dark:text-teal-400" />
              </div>
              <span className="text-xs uppercase tracking-wider text-muted-foreground/70 font-bold">{t('totalPolicies')}</span>
            </div>
            <p className="text-2xl lg:text-3xl font-extrabold tabular-nums">{summary.total}</p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
        <Card className="border-s-4 border-s-emerald-500 shadow-sm hover:shadow-md transition-shadow duration-300 bg-gradient-to-br from-emerald-50/90 via-emerald-50/60 to-teal-100/40 dark:from-emerald-950/30 dark:via-emerald-950/20 dark:to-teal-950/10">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 rounded-lg bg-background/50 shadow-sm">
                <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-xs uppercase tracking-wider text-muted-foreground/70 font-bold">{t('activePolicies')}</span>
            </div>
            <p className="text-2xl lg:text-3xl font-extrabold tabular-nums text-emerald-600 dark:text-emerald-400">{summary.active}</p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
        <Card className="border-s-4 border-s-amber-500 shadow-sm hover:shadow-md transition-shadow duration-300 bg-gradient-to-br from-amber-50/90 via-amber-50/60 to-amber-100/40 dark:from-amber-950/30 dark:via-amber-950/20 dark:to-amber-950/10">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 rounded-lg bg-background/50 shadow-sm">
                <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="text-xs uppercase tracking-wider text-muted-foreground/70 font-bold">{t('expiringPolicies')}</span>
            </div>
            <p className="text-2xl lg:text-3xl font-extrabold tabular-nums text-amber-600 dark:text-amber-400">{summary.expiring}</p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
        <Card className="border-s-4 border-s-red-500 shadow-sm hover:shadow-md transition-shadow duration-300 bg-gradient-to-br from-red-50/90 via-red-50/60 to-amber-100/40 dark:from-red-950/30 dark:via-red-950/20 dark:to-amber-950/10">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 rounded-lg bg-background/50 shadow-sm">
                <XCircle className="size-4 text-red-600 dark:text-red-400" />
              </div>
              <span className="text-xs uppercase tracking-wider text-muted-foreground/70 font-bold">{t('expiredPolicies')}</span>
            </div>
            <p className="text-2xl lg:text-3xl font-extrabold tabular-nums text-red-600 dark:text-red-400">{summary.expired}</p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
        <Card className="border-s-4 border-s-amber-600 shadow-sm hover:shadow-md transition-shadow duration-300 bg-gradient-to-br from-amber-50/90 via-amber-50/60 to-red-100/40 dark:from-amber-950/30 dark:via-amber-950/20 dark:to-red-950/10">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 rounded-lg bg-background/50 shadow-sm">
                <ShieldAlert className="size-4 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="text-xs uppercase tracking-wider text-muted-foreground/70 font-bold">{t('deficient')}</span>
            </div>
            <p className="text-2xl lg:text-3xl font-extrabold tabular-nums text-amber-600 dark:text-amber-400">{summary.deficient}</p>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
