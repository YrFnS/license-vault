'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { ShieldAlert, ShieldCheck, Shield, ShieldOff } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface RiskScoreGaugeProps {
  score: number;
  totalItems?: number;
  itemsNeedingAction?: number;
}

function getRiskConfig(score: number) {
  if (score >= 75) {
    return {
      label: 'critical',
      color: '#ef4444',
      gradientStart: '#ef4444',
      gradientEnd: '#dc2626',
      bgClass: 'bg-red-50 dark:bg-red-950/20',
      borderClass: 'border-red-200 dark:border-red-800',
      icon: ShieldOff,
      iconColor: 'text-red-600 dark:text-red-400',
      descriptionKey: 'immediateActionRequired',
    };
  }
  if (score >= 50) {
    return {
      label: 'highRisk',
      color: '#f59e0b',
      gradientStart: '#f59e0b',
      gradientEnd: '#d97706',
      bgClass: 'bg-amber-50 dark:bg-amber-950/20',
      borderClass: 'border-amber-200 dark:border-amber-800',
      icon: ShieldAlert,
      iconColor: 'text-amber-600 dark:text-amber-400',
      descriptionKey: 'multipleItemsNeedAttention',
    };
  }
  if (score >= 25) {
    return {
      label: 'moderateRisk',
      color: '#eab308',
      gradientStart: '#eab308',
      gradientEnd: '#ca8a04',
      bgClass: 'bg-yellow-50 dark:bg-yellow-950/20',
      borderClass: 'border-yellow-200 dark:border-yellow-800',
      icon: Shield,
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      descriptionKey: 'someItemsNeedMonitoring',
    };
  }
  return {
    label: 'lowRisk',
    color: '#10b981',
    gradientStart: '#10b981',
    gradientEnd: '#059669',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/20',
    borderClass: 'border-emerald-200 dark:border-emerald-800',
    icon: ShieldCheck,
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    descriptionKey: 'allItemsGoodStanding',
  };
}

export function RiskScoreGauge({ score, totalItems = 0, itemsNeedingAction = 0 }: RiskScoreGaugeProps) {
  const t = useTranslations('dashboard');
  const config = getRiskConfig(score);
  const Icon = config.icon;

  // Gauge calculations
  const gaugeRadius = 50;
  const gaugeStrokeWidth = 10;
  const gaugeCenterX = 60;
  const gaugeCenterY = 60;
  const gaugeStartAngle = 135; // degrees (bottom-left)
  const gaugeEndAngle = 405; // degrees (bottom-right) - 270 degrees total sweep

  // Calculate the arc path
  const describeArc = (cx: number, cy: number, r: number, startAngle: number, endAngle: number): string => {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
  };

  const polarToCartesian = (cx: number, cy: number, r: number, angleDeg: number) => {
    const angleRad = ((angleDeg - 90) * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(angleRad),
      y: cy + r * Math.sin(angleRad),
    };
  };

  // Needle angle based on score (0-100 maps to startAngle-endAngle)
  const needleAngle = gaugeStartAngle + (score / 100) * (gaugeEndAngle - gaugeStartAngle);
  const needleLength = gaugeRadius - gaugeStrokeWidth - 5;
  const needleTip = polarToCartesian(gaugeCenterX, gaugeCenterY, needleLength, needleAngle);

  // Score fill arc
  const scoreAngle = gaugeStartAngle + (score / 100) * (gaugeEndAngle - gaugeStartAngle);

  // Background arc
  const bgArcPath = describeArc(gaugeCenterX, gaugeCenterY, gaugeRadius, gaugeStartAngle, gaugeEndAngle);
  // Fill arc
  const fillArcPath = describeArc(gaugeCenterX, gaugeCenterY, gaugeRadius, gaugeStartAngle, scoreAngle);

  return (
    <TooltipProvider>
      <Card className={`relative overflow-hidden ${config.borderClass} border shadow-md hover:shadow-xl transition-all duration-300 ${config.bgClass}`}>
        {/* Decorative glow */}
        <div className="absolute -top-8 -end-8 size-28 rounded-full opacity-20 blur-2xl pointer-events-none" style={{ backgroundColor: config.color }} />
        <CardContent className="relative p-4 md:p-6 flex items-center gap-5">
          {/* Gauge SVG */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative shrink-0 cursor-help">
                <svg width="120" height="120" viewBox="0 0 120 120">
                  {/* Gradient definition */}
                  <defs>
                    <linearGradient id="riskGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="50%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#ef4444" />
                    </linearGradient>
                    <linearGradient id="riskFillGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor={config.gradientStart} />
                      <stop offset="100%" stopColor={config.gradientEnd} />
                    </linearGradient>
                  </defs>

                  {/* Background track */}
                  <path
                    d={bgArcPath}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={gaugeStrokeWidth}
                    strokeLinecap="round"
                    className="text-muted-foreground/15"
                  />

                  {/* Full gradient background for visual reference */}
                  <path
                    d={bgArcPath}
                    fill="none"
                    stroke="url(#riskGradient)"
                    strokeWidth={gaugeStrokeWidth}
                    strokeLinecap="round"
                    opacity="0.2"
                  />

                  {/* Score fill */}
                  <motion.path
                    d={fillArcPath}
                    fill="none"
                    stroke="url(#riskFillGradient)"
                    strokeWidth={gaugeStrokeWidth}
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                  />

                  {/* Needle */}
                  <motion.line
                    x1={gaugeCenterX}
                    y1={gaugeCenterY}
                    x2={needleTip.x}
                    y2={needleTip.y}
                    stroke={config.color}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                  />

                  {/* Center dot */}
                  <circle
                    cx={gaugeCenterX}
                    cy={gaugeCenterY}
                    r={4}
                    fill={config.color}
                    className="drop-shadow-sm"
                  />
                </svg>
                {/* Score number */}
                <div className="absolute inset-0 flex items-center justify-center pt-3">
                  <motion.span
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8, duration: 0.5, type: 'spring' }}
                    className="text-2xl font-extrabold"
                    style={{ color: config.color }}
                  >
                    {score}
                  </motion.span>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[200px]">
              <p className="font-semibold">{t(config.label)}</p>
              <p className="text-xs text-muted-foreground mt-1">{t(config.descriptionKey)}</p>
              {totalItems > 0 && (
                <p className="text-xs text-muted-foreground mt-1">{t('itemsNeedAction', { count: itemsNeedingAction })}</p>
              )}
            </TooltipContent>
          </Tooltip>

          {/* Text info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">{t('riskScore')}</p>
            <p className={`text-xs font-medium mt-1 ${config.iconColor}`}>
              {t(config.label)}
            </p>
            <div className="flex items-center gap-1.5 mt-2">
              <Icon className={`size-4 ${config.iconColor} shrink-0`} />
              <span className="text-xs text-muted-foreground">{t(config.descriptionKey)}</span>
            </div>
            {totalItems > 0 && (
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs text-muted-foreground">{t('needAction', { count: itemsNeedingAction })}</span>
                <span className="text-xs text-muted-foreground/40">·</span>
                <span className="text-xs text-muted-foreground">{t('itemsTotal', { count: totalItems })}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
