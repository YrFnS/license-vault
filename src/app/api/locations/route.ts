import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

// GET: List locations for the user's organization
export async function GET() {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const userId = (session.user as any).id;

		const orgMember = await db.orgMember.findFirst({
			where: { userId },
		});

		if (!orgMember) {
			return NextResponse.json(
				{ error: "No organization found" },
				{ status: 404 },
			);
		}

		const locations = await db.location.findMany({
			where: { orgId: orgMember.orgId },
			orderBy: { createdAt: "desc" },
			include: {
				licenses: { select: { id: true } },
			},
		});

		return NextResponse.json({ locations });
	} catch (error) {
		console.error("Get locations error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

const createLocationSchema = z.object({
	name: z.string().min(1, "Location name is required"),
	city: z.string().optional(),
	state: z.string().optional(),
	zip: z.string().optional(),
});

// POST: Create a new location
export async function POST(request: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const userId = (session.user as any).id;

		const orgMember = await db.orgMember.findFirst({
			where: { userId },
		});

		if (!orgMember) {
			return NextResponse.json(
				{ error: "No organization found" },
				{ status: 404 },
			);
		}

		if (!["owner", "admin"].includes(orgMember.role)) {
			return NextResponse.json(
				{
					error:
						"Insufficient permissions. Only owners and admins can create locations.",
				},
				{ status: 403 },
			);
		}

		const body = await request.json();
		const result = createLocationSchema.safeParse(body);

		if (!result.success) {
			const firstError = result.error.issues?.[0];
			return NextResponse.json(
				{ error: firstError?.message || "Validation failed" },
				{ status: 400 },
			);
		}

		const { name, city, state, zip } = result.data;

		const location = await db.location.create({
			data: {
				orgId: orgMember.orgId,
				name,
				city: city || null,
				state: state || null,
				zip: zip || null,
			},
		});

		// Create audit log entry
		await db.auditLog.create({
			data: {
				orgId: orgMember.orgId,
				userId,
				action: "create",
				entityType: "location",
				entityId: location.id,
				entityName: location.name,
				details: `Created location: ${location.name}`,
			},
		});

		return NextResponse.json({ location }, { status: 201 });
	} catch (error) {
		console.error("Create location error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
