export interface InsuranceRecord {
  id: string;
  orgId: string;
  name: string;
  type: string;
  policyNumber: string;
  provider: string;
  coverageAmount: number;
  premiumAmount: number;
  issueDate: string;
  expirationDate: string;
  status: string;
  holderName: string | null;
  notes: string | null;
  autoRenew: boolean;
  additionalInsured: boolean;
  primaryNoncontrib: boolean;
  waiverSubrogation: boolean;
  perOccurrenceLimit: number;
  aggregateLimit: number;
  deductible: number;
  endorsementTypes: string | null;
  requiredCoverage: number;
  requiredPerOccurrence: number;
  requiredAggregate: number;
  requiredEndorsements: string | null;
  complianceStatus: string;
  lastVerified: string | null;
  createdAt: string;
  updatedAt: string;
  computedStatus: string;
  compliance: {
    isCompliant: boolean;
    deficiencies: string[];
  };
}

export interface InsuranceSummary {
  total: number;
  active: number;
  expiring: number;
  expired: number;
  totalCoverage: number;
  totalPremium: number;
  compliant: number;
  deficient: number;
  expiredCompliance: number;
  pending: number;
}

export type FilterTab = 'all' | 'insurance' | 'bond' | 'certificate' | 'active' | 'expiring' | 'expired' | 'compliant' | 'deficient';

export interface FormData {
  name: string;
  type: string;
  policyNumber: string;
  provider: string;
  coverageAmount: string;
  premiumAmount: string;
  issueDate: string;
  expirationDate: string;
  holderName: string;
  notes: string;
  autoRenew: boolean;
  additionalInsured: boolean;
  primaryNoncontrib: boolean;
  waiverSubrogation: boolean;
  perOccurrenceLimit: string;
  aggregateLimit: string;
  deductible: string;
  endorsementTypes: string[];
  requiredCoverage: string;
  requiredPerOccurrence: string;
  requiredAggregate: string;
  requiredEndorsements: string[];
}

export const emptyForm: FormData = {
  name: '',
  type: 'insurance',
  policyNumber: '',
  provider: '',
  coverageAmount: '',
  premiumAmount: '',
  issueDate: '',
  expirationDate: '',
  holderName: '',
  notes: '',
  autoRenew: false,
  additionalInsured: false,
  primaryNoncontrib: false,
  waiverSubrogation: false,
  perOccurrenceLimit: '',
  aggregateLimit: '',
  deductible: '',
  endorsementTypes: [],
  requiredCoverage: '',
  requiredPerOccurrence: '',
  requiredAggregate: '',
  requiredEndorsements: [],
};
