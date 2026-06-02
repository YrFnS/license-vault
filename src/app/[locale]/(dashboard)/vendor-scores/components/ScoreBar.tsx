'use client';

import { motion } from 'framer-motion';
import { getScoreColor } from '../helpers';

export function ScoreBar({ label, score, icon: Icon, weight }: { label: string; score: number; icon: React.ElementType; weight: string }) {
  const color = getScoreColor(score);
  return (
    <div className="flex items-center gap-3 py-1.5">
      <Icon className="size-4 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground truncate">{label}</span>
          <span className="text-xs font-medium" style={{ color }}>{Math.round(score)}%</span>
        </div>
        <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
          <motion.div className="h-full rounded-full" style={{ backgroundColor: color }} initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 0.5 }} />
        </div>
      </div>
      <span className="text-[10px] text-muted-foreground/60 shrink-0">{weight}</span>
    </div>
  );
}
