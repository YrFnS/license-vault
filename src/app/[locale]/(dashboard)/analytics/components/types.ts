export interface OverviewData {
	complianceScore: number;
	financialExposure: number;
	activeRiskItems: number;
	portfolioHealth: number;
	total: number;
	active: number;
	expiring: number;
	expired: number;
}

export interface TrendPoint {
	date: string;
	score: number;
}

export interface CostLicense {
	id: string;
	name: string;
	status: string;
	daysOverdue: number;
	estimatedFine: number;
	riskLevel: string;
}

export interface CostData {
	totalExposure: number;
	finesRisk: number;
	projectDelayCost: number;
	lostContracts: number;
	licenses: CostLicense[];
	parameters: { avgFine: number; dailyPenaltyRate: number };
}

export interface PortfolioRecommendation {
	type: string;
	severity: string;
	title: string;
	description: string;
	state?: string;
}

export interface TeamActivityData {
	actionsByUser: { id: string; name: string; count: number }[];
	mostActiveUsers: { id: string; name: string; count: number }[];
	actionTypes: { action: string; count: number }[];
	timeline: { date: string; count: number }[];
	totalActions: number;
}

export interface PortfolioData {
	recommendations: PortfolioRecommendation[];
	coverage: {
		coveredStates: string[];
		uncoveredStates: string[];
		totalStates: number;
		coveragePercent: number;
	};
}

export interface ScheduleConfig {
	frequency: string;
	recipients: string[];
	reportType: string;
	format: string;
	enabled: boolean;
}
