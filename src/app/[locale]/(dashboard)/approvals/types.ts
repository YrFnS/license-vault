export interface ApprovalItem {
	id: string;
	orgId: string;
	title: string;
	description: string | null;
	type: string;
	status: string;
	priority: string;
	entityId: string | null;
	entityType: string | null;
	requestData: string | null;
	requestedBy: string | null;
	reviewedBy: string | null;
	reviewNotes: string | null;
	reviewedAt: string | null;
	createdAt: string;
	updatedAt: string;
	requesterName: string | null;
	requesterEmail: string | null;
	reviewerName: string | null;
	reviewerEmail: string | null;
}

export interface ApprovalStats {
	countsByStatus: {
		pending: number;
		approved: number;
		rejected: number;
		cancelled: number;
	};
	countsByType: { type: string; count: number }[];
	pendingByPriority: { priority: string; count: number }[];
	avgReviewTimeHours: number;
	total: number;
}
