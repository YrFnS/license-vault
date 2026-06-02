export interface BreakdownCategory {
  score: number;
  total: number;
  active: number;
  completed?: number;
  uploaded?: number;
}

export interface AtRiskItem {
  id: string;
  name: string;
  type: string;
  expirationDate: string;
  status: string;
  daysUntil: number;
}

export interface Recommendation {
  id: string;
  titleKey: string;
  descKey: string;
  priority: 'high' | 'medium' | 'low';
  actionType: string;
  active: boolean;
}

export interface ComplianceData {
  overallScore: number;
  trend: 'up' | 'down' | 'same';
  trendDelta: number;
  breakdown: {
    license: BreakdownCategory;
    insurance: BreakdownCategory;
    ce: BreakdownCategory;
    documents: BreakdownCategory;
  };
  atRiskItems: AtRiskItem[];
  recommendations: Recommendation[];
  history: Array<{ month: string; score: number }>;
}
