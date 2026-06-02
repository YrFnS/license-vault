export interface License {
  id: string;
  name: string;
  type: string;
}

export interface CERecord {
  id: string;
  orgId: string;
  licenseId: string;
  courseName: string;
  provider: string;
  hoursEarned: number;
  hoursRequired: number;
  completionDate: string;
  category: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  license: License;
}

export interface SummaryCard {
  key: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: 'teal' | 'emerald' | 'amber';
}
