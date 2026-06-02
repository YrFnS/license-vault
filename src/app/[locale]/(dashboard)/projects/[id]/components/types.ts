export interface ProjectData {
	id: string;
	name: string;
	description?: string | null;
	clientName?: string | null;
	clientEmail?: string | null;
	location?: string | null;
	startDate?: string | null;
	endDate?: string | null;
	status: string;
	complianceScore: number;
	insuranceRequired: number;
	bondRequired: boolean;
	bondAmount: number;
	notes?: string | null;
	createdAt: string;
}

export interface ProjectLicense {
	id: string;
	projectId: string;
	licenseId: string;
	required: boolean;
	status: string;
	notes?: string | null;
	license: {
		id: string;
		name: string;
		type: string;
		licenseNumber: string;
		expirationDate: string;
		computedStatus: string;
	};
}

export interface ProjectSub {
	id: string;
	projectId: string;
	subcontractorId: string;
	role?: string | null;
	complianceStatus: string;
	notes?: string | null;
	subcontractor: {
		id: string;
		companyName: string;
		tradeType?: string | null;
		email: string;
		complianceStatus: string;
	};
}

export interface ComplianceData {
	score: number;
	riskLevel: string;
	riskColor: string;
	licenses: {
		total: number;
		active: number;
		expiring: number;
		expired: number;
		required: number;
		requiredMet: number;
		score: number;
	};
	subcontractors: {
		total: number;
		compliant: number;
		pending: number;
		nonCompliant: number;
		score: number;
	};
	gaps: string[];
}
