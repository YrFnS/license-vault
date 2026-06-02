import type { LucideIcon } from 'lucide-react';

export interface LicenseData {
  id: string;
  name: string;
  type: string;
  licenseNumber: string;
  issuedBy: string;
  issueDate: string;
  expirationDate: string;
  notes: string | null;
  isRenewed: boolean;
  renewalDate: string | null;
  autoRenew: boolean;
  renewalHistory: string | null;
  status: string;
  daysUntilExpiration: number | null;
}

export interface ActivityEntry {
  id: string;
  action: string;
  entityType: string;
  entityName?: string | null;
  details?: string | null;
  userName?: string | null;
  createdAt: string;
}

export interface ActivityConfig {
  icon: LucideIcon;
  iconColor: string;
  dotColor: string;
  bgColor: string;
}
