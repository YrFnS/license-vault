'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Building2,
  FileText,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { fadeIn, getComplianceColor } from './helpers';
import type { CrossComplianceData } from './types';

interface CrossComplianceSectionProps {
  crossCompliance: CrossComplianceData;
  hasSubsidiaries: boolean;
}

export function CrossComplianceSection({
  crossCompliance,
  hasSubsidiaries,
}: CrossComplianceSectionProps) {
  const t = useTranslations('organization');

  if (!hasSubsidiaries) return null;

  return (
    <motion.div {...fadeIn} transition={{ delay: 0.2 }}>
      <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="size-5 text-emerald-600 dark:text-emerald-400" />
            <CardTitle>{t('crossCompliance.title')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: t('crossCompliance.totalOrgs'), value: crossCompliance.summary.totalOrgs, icon: Building2, color: 'emerald' },
              { label: t('crossCompliance.combinedCompliance'), value: `${crossCompliance.summary.combinedCompliance}%`, icon: ShieldCheck, color: 'teal' },
              { label: t('crossCompliance.totalLicenses'), value: crossCompliance.summary.totalLicenses, icon: FileText, color: 'emerald' },
              { label: t('crossCompliance.atRisk'), value: crossCompliance.summary.atRisk, icon: AlertTriangle, color: 'red' },
            ].map((stat) => {
              const Icon = stat.icon;
              const colorMap: Record<string, string> = {
                emerald: 'from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-emerald-200/50 dark:border-emerald-800/30',
                teal: 'from-teal-50 to-cyan-50 dark:from-teal-950/20 dark:to-cyan-950/20 border-teal-200/50 dark:border-teal-800/30',
                red: 'from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 border-red-200/50 dark:border-red-800/30',
              };
              const iconColorMap: Record<string, string> = {
                emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
                teal: 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400',
                red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
              };
              return (
                <div
                  key={stat.label}
                  className={`rounded-xl border p-4 bg-gradient-to-br ${colorMap[stat.color]}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`size-7 rounded-lg flex items-center justify-center ${iconColorMap[stat.color]}`}>
                      <Icon className="size-3.5" />
                    </div>
                  </div>
                  <p className="text-2xl font-extrabold tabular-nums">{stat.value}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</p>
                </div>
              );
            })}
          </div>

          {/* Bar chart */}
          {crossCompliance.organizations.length > 0 && (
            <div className="rounded-xl border border-border/50 p-4">
              <p className="text-sm font-medium mb-4">Compliance by Organization</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={crossCompliance.organizations} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                      tickFormatter={(v: number) => `${v}%`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      formatter={(value: number) => [`${value}%`, 'Compliance']}
                    />
                    <Bar dataKey="complianceRate" radius={[6, 6, 0, 0]}>
                      {crossCompliance.organizations.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getComplianceColor(entry.complianceRate)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Comparison table */}
          <div className="rounded-xl border border-border/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/30">
                    <th className="text-start p-3 font-medium">{t('crossCompliance.orgName')}</th>
                    <th className="text-center p-3 font-medium">{t('hierarchy.licenseCount')}</th>
                    <th className="text-center p-3 font-medium">{t('crossCompliance.compliancePercent')}</th>
                    <th className="text-center p-3 font-medium">{t('crossCompliance.activeLicenses')}</th>
                    <th className="text-center p-3 font-medium">{t('crossCompliance.expiringLicenses')}</th>
                    <th className="text-center p-3 font-medium">{t('crossCompliance.expiredLicenses')}</th>
                  </tr>
                </thead>
                <tbody>
                  {crossCompliance.organizations.map((org) => (
                    <tr key={org.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Building2 className="size-4 text-muted-foreground" />
                          <span className="font-medium">{org.name}</span>
                        </div>
                      </td>
                      <td className="text-center p-3 tabular-nums">{org.totalLicenses}</td>
                      <td className="text-center p-3">
                        <div className="flex items-center justify-center gap-1">
                          <div
                            className="size-2 rounded-full"
                            style={{ backgroundColor: getComplianceColor(org.complianceRate) }}
                          />
                          <span className="tabular-nums font-medium">{org.complianceRate}%</span>
                        </div>
                      </td>
                      <td className="text-center p-3 tabular-nums text-emerald-600 dark:text-emerald-400">{org.activeLicenses}</td>
                      <td className="text-center p-3 tabular-nums text-amber-600 dark:text-amber-400">{org.expiringLicenses}</td>
                      <td className="text-center p-3 tabular-nums text-red-600 dark:text-red-400">{org.expiredLicenses}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
