'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Link } from '@/i18n/navigation';
import {
  RefreshCw,
  ShieldAlert,
  GraduationCap,
  Upload,
  CheckCircle2,
  Lightbulb,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import type { Recommendation } from './types';
import { itemVariants } from './constants';
import { getPriorityColor, getPriorityLabel } from './helpers';

interface RecommendationsProps {
  recommendations: Recommendation[];
}

function getActionHref(actionType: string) {
  switch (actionType) {
    case 'renew': return '/licenses';
    case 'insurance': return '/insurance';
    case 'ce': return '/ce-tracking';
    case 'documents': return '/licenses';
    case 'auto-renew': return '/licenses';
    default: return '/licenses';
  }
}

function getActionIcon(actionType: string) {
  switch (actionType) {
    case 'renew': return RefreshCw;
    case 'insurance': return ShieldAlert;
    case 'ce': return GraduationCap;
    case 'documents': return Upload;
    case 'auto-renew': return CheckCircle2;
    default: return Lightbulb;
  }
}

export default function Recommendations({ recommendations }: RecommendationsProps) {
  const t = useTranslations('compliance');

  return (
    <motion.div variants={itemVariants}>
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="size-5 text-emerald-500" />
        <h2 className="text-lg font-bold text-foreground">{t('recommendationsTitle')}</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">{t('recommendationsSubtitle')}</p>
      <div className="space-y-3">
        {recommendations.map((rec, idx) => {
          const ActionIcon = getActionIcon(rec.actionType);
          return (
            <motion.div
              key={rec.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              whileHover={{ scale: 1.01, y: -1 }}
            >
              <Card className="shadow-sm hover:shadow-md transition-all duration-300 border-border/60">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 rounded-xl p-2.5 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-900/20">
                      <ActionIcon className="size-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-foreground">{t(rec.titleKey)}</p>
                        <Badge className={`text-[10px] px-1.5 py-0 ${getPriorityColor(rec.priority)} border-0`}>
                          {getPriorityLabel(rec.priority)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{t(rec.descKey)}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 h-7 text-xs gap-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                        asChild
                      >
                        <Link href={getActionHref(rec.actionType)}>
                          {t('viewAll')}
                          <ChevronRight className="size-3" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
        {recommendations.length === 0 && (
          <Card className="shadow-sm">
            <CardContent className="p-6 text-center">
              <CheckCircle2 className="size-10 text-emerald-500 mx-auto mb-3" />
              <p className="font-medium text-foreground">All clear!</p>
              <p className="text-sm text-muted-foreground mt-1">No recommendations at this time. Your compliance is in great shape.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </motion.div>
  );
}
