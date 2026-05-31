// Contractor Network — shared types, interfaces & constants

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

export interface ContractorForm {
	companyName: string;
	tradeType: string;
	licenseNumber: string;
	licenseState: string;
	licenseStatus: string;
	licenseExpiry: string;
	contactName: string;
	contactEmail: string;
	contactPhone: string;
	address: string;
	city: string;
	state: string;
	zip: string;
	website: string;
	insuranceProvider: string;
	insuranceExpiry: string;
	insuranceStatus: string;
	bondingCapacity: string;
	totalProjects: string;
	completedProjects: string;
	rating: string;
	yearsInBusiness: string;
	employeeCount: string;
	notes: string;
}

export const LIMIT = 20;

export const US_STATES = [
	"AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
	"HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
	"MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
	"NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
	"SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC",
] as const;

export const TRADE_TYPES = [
	"electrical", "plumbing", "hvac", "general", "roofing",
	"concrete", "painting", "landscaping", "other",
] as const;

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

export function getEmptyForm(): ContractorForm {
	return {
		companyName: "",
		tradeType: "general",
		licenseNumber: "",
		licenseState: "",
		licenseStatus: "unknown",
		licenseExpiry: "",
		contactName: "",
		contactEmail: "",
		contactPhone: "",
		address: "",
		city: "",
		state: "",
		zip: "",
		website: "",
		insuranceProvider: "",
		insuranceExpiry: "",
		insuranceStatus: "unknown",
		bondingCapacity: "",
		totalProjects: "",
		completedProjects: "",
		rating: "",
		yearsInBusiness: "",
		employeeCount: "",
		notes: "",
	};
}
