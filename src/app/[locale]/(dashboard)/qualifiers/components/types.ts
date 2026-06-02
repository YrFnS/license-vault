export interface Qualifier {
  id: string;
  orgId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  licenseNumber: string | null;
  licenseState: string | null;
  licenseType: string | null;
  licenseExpiry: string | null;
  ceHoursEarned: number;
  ceHoursRequired: number;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  computedStatus: string;
  linkedLicensesCount: number;
  licenseLinks?: LinkedLicense[];
}

export interface LinkedLicense {
  id: string;
  qualifierId: string;
  licenseId: string;
  role: string;
  assignedAt: string;
  license: {
    id: string;
    name: string;
    type: string;
    licenseNumber: string;
    state: string | null;
    expirationDate: string;
  };
}

export interface OrgLicense {
  id: string;
  name: string;
  type: string;
  licenseNumber: string;
}

export type StatusFilter = 'all' | 'active' | 'expiring' | 'expired' | 'ce_deficient';

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface StatusCounts {
  all: number;
  active: number;
  expiring: number;
  ce_deficient: number;
}

export interface QualifierForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  licenseNumber: string;
  licenseState: string;
  licenseType: string;
  licenseExpiry: string;
  ceHoursEarned: number;
  ceHoursRequired: number;
  status: string;
  notes: string;
}
