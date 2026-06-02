export interface Subcontractor {
  id: string;
  orgId: string;
  companyName: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  licenseNumber: string | null;
  licenseState: string | null;
  licenseExpiry: string | null;
  insuranceExpiry: string | null;
  insuranceStatus: string;
  complianceStatus: string;
  status: string;
  uploadToken: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  computedInsuranceStatus: string;
  projectSubs?: { project: { id: string; name: string; status: string } }[];
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface StatusCounts {
  total: number;
  active: number;
  compliant: number;
  non_compliant: number;
}

export interface SubcontractorForm {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  licenseNumber: string;
  licenseState: string;
  licenseExpiry: string;
  insuranceExpiry: string;
  insuranceStatus: string;
  notes: string;
}

export const EMPTY_FORM: SubcontractorForm = {
  companyName: "",
  contactName: "",
  email: "",
  phone: "",
  licenseNumber: "",
  licenseState: "",
  licenseExpiry: "",
  insuranceExpiry: "",
  insuranceStatus: "unknown",
  notes: "",
};
