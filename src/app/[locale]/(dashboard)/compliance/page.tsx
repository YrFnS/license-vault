'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Shield, Globe2, Zap } from 'lucide-react';
import { usePageTitle } from '@/hooks/use-page-title';
import MultiStateSection from '@/components/compliance/MultiStateSection';
import ForecastSection from '@/components/compliance/ForecastSection';
import { useComplianceData } from './components/useComplianceData';
import CompliancePageSkeleton from './components/CompliancePageSkeleton';
import ComplianceError from './components/ComplianceError';
import ComplianceHero from './components/ComplianceHero';
import ScoreBreakdown from './components/ScoreBreakdown';
import QuickActions from './components/QuickActions';
import AtRiskItems from './components/AtRiskItems';
import Recommendations from './components/Recommendations';
import ComplianceHistory from './components/ComplianceHistory';
import { containerVariants } from './components/constants';

export default function CompliancePage() {
  const t = useTranslations('compliance');
  const tPt = useTranslations('pageTitles');
  usePageTitle(tPt('compliance'));

  const { data, loading, error, refreshing, handleRefresh } = useComplianceData();

  if (loading) return <CompliancePageSkeleton />;

  if (error) return <ComplianceError error={error} onRetry={handleRefresh} />;

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
        <div className="absolute -top-8 -start-8 size-52 rounded-full bg-gradient-to-br from-emerald-200/40 to-teal-200/30 dark:from-emerald-900/30 dark:to-teal-900/20 blur-3xl pointer-events-none" />
        <div className="absolute -top-4 start-12 size-20 rounded-full bg-emerald-300/20 dark:bg-emerald-700/10 blur-2xl pointer-events-none" />
        <div className="relative">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-emerald-600 dark:to-emerald-400 bg-clip-text text-transparent">
            {t('scoreTitle')}
          </h1>
          <p className="text-muted-foreground/80 mt-1.5 text-sm md:text-base">{t('scoreSubtitle')}</p>
        </div>
        <div className="relative flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="size-9 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors duration-200"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`size-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="overview" className="gap-1.5 text-xs sm:text-sm">
            <Shield className="size-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="multi-state" className="gap-1.5 text-xs sm:text-sm">
            <Globe2 className="size-4" />
            <span className="hidden sm:inline">Multi-State</span>
          </TabsTrigger>
          <TabsTrigger value="forecast" className="gap-1.5 text-xs sm:text-sm">
            <Zap className="size-4" />
            <span className="hidden sm:inline">Forecast</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <AnimatePresence>
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
              <ComplianceHero score={data.overallScore} trend={data.trend} trendDelta={data.trendDelta} />
              <ScoreBreakdown breakdown={data.breakdown} />
              <QuickActions />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AtRiskItems items={data.atRiskItems} />
                <Recommendations recommendations={data.recommendations} />
              </div>
              <ComplianceHistory history={data.history} />
            </motion.div>
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="multi-state">
          <AnimatePresence>
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
              <MultiStateSection />
            </motion.div>
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="forecast">
          <AnimatePresence>
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
              <ForecastSection />
            </motion.div>
          </AnimatePresence>
        </TabsContent>
      </Tabs>
    </div>
  );
}
