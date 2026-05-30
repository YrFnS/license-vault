'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface ComplianceScoreRingProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

const SIZE_MAP = {
  sm: { container: 64, stroke: 5, fontSize: 'text-sm' },
  md: { container: 88, stroke: 6, fontSize: 'text-lg' },
  lg: { container: 112, stroke: 7, fontSize: 'text-2xl' },
} as const;

function getColor(score: number): string {
  if (score >= 80) return '#10b981'; // emerald-500
  if (score >= 60) return '#f59e0b'; // amber-500
  return '#ef4444'; // red-500
}

export function ComplianceScoreRing({ score, size = 'md', label, className }: ComplianceScoreRingProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const { container, stroke, fontSize } = SIZE_MAP[size];
  const radius = (container - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;
  const color = getColor(score);

  useEffect(() => {
    const timeout = setTimeout(() => setAnimatedScore(score), 50);
    return () => clearTimeout(timeout);
  }, [score]);

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <svg
        width={container}
        height={container}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={container / 2}
          cy={container / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-muted/30"
        />
        {/* Foreground circle */}
        <circle
          cx={container / 2}
          cy={container / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-1000 ease-out"
        />
      </svg>
      <div
        className={cn('absolute flex flex-col items-center justify-center font-bold tabular-nums', fontSize)}
        style={{ width: container, height: container, marginTop: -container }}
      >
        <span style={{ color }}>{Math.round(animatedScore)}%</span>
      </div>
      {label && (
        <span className="text-xs text-muted-foreground mt-1">{label}</span>
      )}
    </div>
  );
}
