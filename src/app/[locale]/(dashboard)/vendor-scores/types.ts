export interface VendorScoreData {
  id: string;
  vendorName: string;
  vendorEmail: string | null;
  subcontractorId: string | null;
  overallScore: number;
  riskLevel: string;
  licenseScore: number;
  insuranceScore: number;
  documentScore: number;
  complianceScore: number;
  experienceScore: number;
  responsivenessScore: number;
  licenseVerified: boolean;
  licenseExpiry: string | null;
  licenseState: string | null;
  licenseType: string | null;
  insuranceVerified: boolean;
  insuranceExpiry: string | null;
  coiOnFile: boolean;
  endorsementStatus: string;
  requiredDocs: number;
  submittedDocs: number;
  expiredDocs: number;
  totalProjects: number;
  completedProjects: number;
  onTimeRate: number;
  avgRating: number;
  avgResponseDays: number;
  docRequestCount: number;
  docResponseCount: number;
  isFlagged: boolean;
  flagReason: string | null;
  lastAssessment: string | null;
  nextAssessment: string | null;
  assessmentHistory: string | null;
  notes: string | null;
  createdAt: string;
}

export interface AssessmentResult {
  vendor: VendorScoreData;
  findings: { status: string; message: string }[];
  recommendations: string[];
  history: { date: string; score: number; changes: string }[];
}

export interface VendorFormData {
  vendorName: string;
  vendorEmail: string;
  subcontractorId: string;
  licenseVerified: boolean;
  licenseExpiry: string;
  licenseState: string;
  licenseType: string;
  insuranceVerified: boolean;
  insuranceExpiry: string;
  coiOnFile: boolean;
  endorsementStatus: string;
  requiredDocs: number;
  submittedDocs: number;
  expiredDocs: number;
  totalProjects: number;
  completedProjects: number;
  onTimeRate: number;
  avgRating: number;
  avgResponseDays: number;
  docRequestCount: number;
  docResponseCount: number;
  notes: string;
}

export const DEFAULT_FORM_DATA: VendorFormData = {
  vendorName: '',
  vendorEmail: '',
  subcontractorId: '',
  licenseVerified: false,
  licenseExpiry: '',
  licenseState: '',
  licenseType: '',
  insuranceVerified: false,
  insuranceExpiry: '',
  coiOnFile: false,
  endorsementStatus: 'unknown',
  requiredDocs: 0,
  submittedDocs: 0,
  expiredDocs: 0,
  totalProjects: 0,
  completedProjects: 0,
  onTimeRate: 0,
  avgRating: 0,
  avgResponseDays: 0,
  docRequestCount: 0,
  docResponseCount: 0,
  notes: '',
};
