export interface Contractor {
	id: string;
	orgId: string;
	companyName: string;
	tradeType: string;
	licenseNumber: string | null;
	licenseState: string | null;
	licenseStatus: string;
	licenseExpiry: string | null;
	contactName: string | null;
	contactEmail: string | null;
	contactPhone: string | null;
	address: string | null;
	city: string | null;
	state: string | null;
	zip: string | null;
	website: string | null;
	insuranceProvider: string | null;
	insuranceExpiry: string | null;
	insuranceStatus: string;
	bondingCapacity: number;
	complianceScore: number;
	totalProjects: number;
	completedProjects: number;
	rating: number;
	reviewCount: number;
	specialties: string | null;
	certifications: string | null;
	serviceAreas: string | null;
	yearsInBusiness: number;
	employeeCount: string | null;
	isVerified: boolean;
	isPreferred: boolean;
	isBlacklisted: boolean;
	notes: string | null;
	tags: string | null;
	lastVerifiedAt: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface PaginationInfo {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}

export interface ScoreBreakdown {
	licensePoints: number;
	insurancePoints: number;
	bondingPoints: number;
	projectPoints: number;
	verificationPoints: number;
	ratingPoints: number;
	total: number;
	maxTotal: number;
}

export interface DirectoryStats {
	totalContractors: number;
	verifiedCount: number;
	preferredCount: number;
	blacklistedCount: number;
	avgScore: number;
	tradeTypeBreakdown: { tradeType: string; count: number }[];
	stateBreakdown: { state: string; count: number }[];
}
