'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Eye, RefreshCw, Flag, Trash2, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, ShieldCheck, FileCheck, Award, TrendingUp, Clock } from 'lucide-react';
import type { VendorScoreData } from '../types';
import { CircularScore } from './CircularScore';
import { ScoreBar } from './ScoreBar';
import { RISK_BADGE_CONFIG } from '../constants';

interface VendorCardProps {
  vendor: VendorScoreData;
  index: number;
  assessing: boolean;
  selectedVendorId: string | null;
  onAssess: (vendor: VendorScoreData) => void;
  onViewDetails: (vendor: VendorScoreData) => void;
  onFlag: (vendor: VendorScoreData) => void;
  onDelete: (id: string) => void;
}

export function VendorCard({ vendor, index, assessing, selectedVendorId, onAssess, onViewDetails, onFlag, onDelete }: VendorCardProps) {
  const t = useTranslations('vendorScores');

  const catScores = [
    { key: 'licenseScore', label: t('licenseScore'), icon: Shield, weight: '25%' },
    { key: 'insuranceScore', label: t('insuranceScore'), icon: ShieldCheck, weight: '25%' },
    { key: 'documentScore', label: t('documentScore'), icon: FileCheck, weight: '15%' },
    { key: 'complianceScore', label: t('complianceScore'), icon: Award, weight: '15%' },
    { key: 'experienceScore', label: t('experienceScore'), icon: TrendingUp, weight: '10%' },
    { key: 'responsivenessScore', label: t('responsivenessScore'), icon: Clock, weight: '10%' },
  ];

  const riskConfig = RISK_BADGE_CONFIG[vendor.riskLevel] || RISK_BADGE_CONFIG.medium;

  return (
    <motion.div key={vendor.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <CircularScore score={vendor.overallScore} size={64} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-sm truncate">{vendor.vendorName}</h3>
                <Badge className={`${riskConfig.bg} ${riskConfig.text} border-0 font-semibold`}>
                  {t(vendor.riskLevel as 'critical' | 'high' | 'medium' | 'low')}
                </Badge>
                {vendor.isFlagged && (
                  <Badge className="bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-0 gap-1">
                    <Flag className="size-3" /> {t('flagged')}
                  </Badge>
                )}
              </div>
              {vendor.vendorEmail && <p className="text-xs text-muted-foreground mt-0.5">{vendor.vendorEmail}</p>}
              <div className="mt-3 space-y-0.5">
                {catScores.map(cat => (
                  <ScoreBar key={cat.key} label={cat.label} score={vendor[cat.key as keyof VendorScoreData] as number} icon={cat.icon} weight={cat.weight} />
                ))}
              </div>
              <div className="flex items-center gap-3 mt-3 text-[10px] text-muted-foreground/70">
                {vendor.lastAssessment && (
                  <span>{t('lastAssessment')}: {new Date(vendor.lastAssessment).toLocaleDateString()}</span>
                )}
                {vendor.flagReason && (
                  <span className="text-red-500/80 truncate">⚠ {vendor.flagReason}</span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-3">
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => onViewDetails(vendor)}>
                  {assessing && selectedVendorId === vendor.id ? <Loader2 className="size-3 animate-spin" /> : <Eye className="size-3" />}
                  {t('viewDetails')}
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => onAssess(vendor)} disabled={assessing}>
                  <RefreshCw className="size-3" /> {t('assess')}
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => onFlag(vendor)}>
                  <Flag className="size-3" /> {vendor.isFlagged ? t('unflag') : t('flag')}
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={() => onDelete(vendor.id)}>
                  <Trash2 className="size-3" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
