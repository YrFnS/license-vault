export interface BoardSubmission {
  id: string;
  orgId: string;
  submissionType: string;
  licenseId: string | null;
  qualifierId: string | null;
  state: string;
  boardName: string;
  boardEmail: string | null;
  boardPortalUrl: string | null;
  applicationForm: string | null;
  supportingDocs: string | null;
  coverLetter: string | null;
  submissionData: string | null;
  status: string;
  trackingNumber: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  responseDate: string | null;
  boardResponse: string | null;
  filingFee: number;
  feePaid: boolean;
  paymentRef: string | null;
  estimatedDays: number;
  priority: string;
  notes: string | null;
  checklistData: string | null;
  auditTrail: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubmissionStats {
  totalSubmissions: number;
  pendingReview: number;
  approved: number;
  rejected: number;
}

export interface StatusCounts {
  all: number;
  draft: number;
  ready: number;
  submitted: number;
  under_review: number;
  approved: number;
  rejected: number;
  returned: number;
}

export interface Template {
  state: string;
  submissionType: string;
  boardName: string;
  boardEmail: string;
  boardPortalUrl: string;
  filingFee: number;
  estimatedDays: number;
  fields: { name: string; label: string; value: string; required: boolean }[];
  requiredDocs: string[];
}
