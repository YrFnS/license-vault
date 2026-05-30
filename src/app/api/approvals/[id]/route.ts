import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

// GET: Get single approval with full details
export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const userId = (session.user as any).id;
		const { id } = await params;

		const orgMember = await db.orgMember.findFirst({
			where: { userId },
		});

		if (!orgMember) {
			return NextResponse.json(
				{ error: "No organization found" },
				{ status: 404 },
			);
		}

		const approval = await db.approvalWorkflow.findFirst({
			where: { id, orgId: orgMember.orgId },
		});

		if (!approval) {
			return NextResponse.json(
				{ error: "Approval not found" },
				{ status: 404 },
			);
		}

		// Fetch requester info
		let requester: { id: string; name: string; email: string } | null = null;
		if (approval.requestedBy) {
			const user = await db.user.findUnique({
				where: { id: approval.requestedBy },
				select: { id: true, name: true, email: true },
			});
			requester = user;
		}

		// Fetch reviewer info
		let reviewer: { id: string; name: string; email: string } | null = null;
		if (approval.reviewedBy) {
			const user = await db.user.findUnique({
				where: { id: approval.reviewedBy },
				select: { id: true, name: true, email: true },
			});
			reviewer = user;
		}

		return NextResponse.json({
			approval: {
				...approval,
				requester,
				reviewer,
			},
		});
	} catch (error) {
		console.error("Get approval error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

const updateApprovalSchema = z.object({
	status: z.enum(["approved", "rejected"]),
	reviewNotes: z.string().optional(),
});

// PUT: Update an approval (approve/reject)
export async function PUT(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const userId = (session.user as any).id;
		const { id } = await params;

		const orgMember = await db.orgMember.findFirst({
			where: { userId },
		});

		if (!orgMember) {
			return NextResponse.json(
				{ error: "No organization found" },
				{ status: 404 },
			);
		}

		// Only owner/admin can approve/reject
		if (!["owner", "admin"].includes(orgMember.role)) {
			return NextResponse.json(
				{
					error:
						"Insufficient permissions. Only owners and admins can approve or reject requests.",
				},
				{ status: 403 },
			);
		}

		const approval = await db.approvalWorkflow.findFirst({
			where: { id, orgId: orgMember.orgId },
		});

		if (!approval) {
			return NextResponse.json(
				{ error: "Approval not found" },
				{ status: 404 },
			);
		}

		if (approval.status !== "pending") {
			return NextResponse.json(
				{ error: "This request has already been reviewed" },
				{ status: 400 },
			);
		}

		const body = await request.json();
		const result = updateApprovalSchema.safeParse(body);

		if (!result.success) {
			const firstError = result.error.issues?.[0];
			return NextResponse.json(
				{ error: firstError?.message || "Validation failed" },
				{ status: 400 },
			);
		}

		const { status, reviewNotes } = result.data;

		const updated = await db.approvalWorkflow.update({
			where: { id },
			data: {
				status,
				reviewedBy: userId,
				reviewedAt: new Date(),
				reviewNotes: reviewNotes || null,
			},
		});

		// Create audit log entry
		await db.auditLog.create({
			data: {
				orgId: orgMember.orgId,
				userId,
				action: "update",
				entityType: "approval",
				entityId: updated.id,
				entityName: updated.title,
				details: `Approval request ${status}: ${updated.title}${reviewNotes ? ` — Notes: ${reviewNotes}` : ""}`,
			},
		});

		return NextResponse.json({ approval: updated });
	} catch (error) {
		console.error("Update approval error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

// DELETE: Cancel an approval (soft delete - set status to cancelled)
export async function DELETE(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const userId = (session.user as any).id;
		const { id } = await params;

		const orgMember = await db.orgMember.findFirst({
			where: { userId },
		});

		if (!orgMember) {
			return NextResponse.json(
				{ error: "No organization found" },
				{ status: 404 },
			);
		}

		const approval = await db.approvalWorkflow.findFirst({
			where: { id, orgId: orgMember.orgId },
		});

		if (!approval) {
			return NextResponse.json(
				{ error: "Approval not found" },
				{ status: 404 },
			);
		}

		// Only requester or admin can cancel
		if (
			approval.requestedBy !== userId &&
			!["owner", "admin"].includes(orgMember.role as string)
		) {
			return NextResponse.json(
				{
					error:
						"Insufficient permissions. Only the requester or admins can cancel.",
				},
				{ status: 403 },
			);
		}

		if (approval.status !== "pending") {
			return NextResponse.json(
				{ error: "Only pending requests can be cancelled" },
				{ status: 400 },
			);
		}

		const updated = await db.approvalWorkflow.update({
			where: { id },
			data: { status: "cancelled" },
		});

		// Create audit log entry
		await db.auditLog.create({
			data: {
				orgId: orgMember.orgId,
				userId,
				action: "delete",
				entityType: "approval",
				entityId: updated.id,
				entityName: updated.title,
				details: `Cancelled approval request: ${updated.title}`,
			},
		});

		return NextResponse.json({ approval: updated });
	} catch (error) {
		console.error("Delete approval error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
