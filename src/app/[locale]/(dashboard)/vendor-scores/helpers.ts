import { RISK_COLORS } from './constants';

export function getScoreColor(score: number): string {
  if (score >= 75) return RISK_COLORS.low;
  if (score >= 50) return RISK_COLORS.medium;
  if (score >= 25) return RISK_COLORS.high;
  return RISK_COLORS.critical;
}
