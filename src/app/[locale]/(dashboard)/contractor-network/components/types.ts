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

export const LIMIT = 20;

export const US_STATES = [
	"AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
	"HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
	"MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
	"NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
	"SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC",
];

export const TRADE_TYPES = [
	"electrical", "plumbing", "hvac", "general", "roofing",
	"concrete", "painting", "landscaping", "other",
];

export const fadeIn = {
	initial: { opacity: 0, y: 10 },
	animate: { opacity: 1, y: 0 },
	exit: { opacity: 0, y: -10 },
};

export const staggerContainer = {
	animate: { transition: { staggerChildren: 0.05 } },
};

export const staggerItem = {
	initial: { opacity: 0, y: 10 },
	animate: { opacity: 1, y: 0 },
};
