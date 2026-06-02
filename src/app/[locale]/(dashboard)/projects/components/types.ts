export interface Project {
	id: string;
	orgId: string;
	name: string;
	description: string | null;
	clientName: string | null;
	clientEmail: string | null;
	location: string | null;
	state: string | null;
	startDate: string | null;
	endDate: string | null;
	status: string;
	requiredLicenses: string | null;
	requiredInsurance: string | null;
	complianceScore: number;
	createdAt: string;
	updatedAt: string;
	licenseCount: number;
	subcontractorCount: number;
}

export interface ProjectLicense {
	id: string;
	licenseId: string;
	required: boolean;
	verified: boolean;
	verifiedAt: string | null;
	notes: string | null;
	license: {
		id: string;
		name: string;
		type: string;
		licenseNumber: string;
		expirationDate: string;
		state: string | null;
	};
}

export interface ProjectSub {
	id: string;
	subcontractorId: string;
	role: string | null;
	complianceStatus: string;
	lastChecked: string | null;
	subcontractor: {
		id: string;
		companyName: string;
		contactName: string | null;
		email: string | null;
		complianceStatus: string;
		licenseExpiry: string | null;
		insuranceExpiry: string | null;
	};
}

export interface OrgLicense {
	id: string;
	name: string;
	type: string;
	licenseNumber: string;
	expirationDate: string;
}

export interface OrgSubcontractor {
	id: string;
	companyName: string;
	contactName: string | null;
	complianceStatus: string;
}
