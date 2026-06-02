'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { RISK_COLORS, SCORE_RANGES } from '../constants';

interface ChartsProps {
  riskDistribution: Record<string, number>;
  scoreDistribution: Record<string, number>;
}

const tooltipStyle = {
  backgroundColor: 'hsl(var(--popover))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  fontSize: '12px',
};

export function Charts({ riskDistribution, scoreDistribution }: ChartsProps) {
  const t = useTranslations('vendorScores');

  const riskChartData = [
    { name: t('critical'), value: riskDistribution.critical, fill: RISK_COLORS.critical },
    { name: t('high'), value: riskDistribution.high, fill: RISK_COLORS.high },
    { name: t('medium'), value: riskDistribution.medium, fill: RISK_COLORS.medium },
    { name: t('low'), value: riskDistribution.low, fill: RISK_COLORS.low },
  ].filter(d => d.value > 0);

  const scoreChartData = SCORE_RANGES.map(r => ({
    name: r.name,
    value: scoreDistribution[r.name] || 0,
    fill: r.color,
  })).filter(d => d.value > 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">{t('riskDistribution')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={riskChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {riskChartData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">{t('scoreDistribution')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={scoreChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                {scoreChartData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ ...tooltipStyle, fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-4 mt-2">
            {scoreChartData.map(d => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div className="size-2.5 rounded-full" style={{ backgroundColor: d.fill }} />
                <span className="text-[10px] text-muted-foreground">{d.name}: {d.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
