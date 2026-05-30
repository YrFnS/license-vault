import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateDocument } from "@/lib/document-generator";
import { z } from "zod";

const generateSchema = z.object({
	template: z.enum([
		"renewal_letter",
		"compliance_certificate",
		"board_letter",
		"notice_to_proceed",
		"vendor_questionnaire",
		"custom",
	]),
	data: z.record(z.string(), z.unknown()),
	format: z.enum(["text", "html"]).default("html"),
});

// POST: Generate document
export async function POST(request: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const userId = (session.user as any).id;
		const orgMember = await db.orgMember.findFirst({ where: { userId } });
		if (!orgMember) {
			return NextResponse.json(
				{ error: "No organization found" },
				{ status: 404 },
			);
		}

		const body = await request.json();
		const result = generateSchema.safeParse(body);

		if (!result.success) {
			const firstError = result.error.issues?.[0];
			return NextResponse.json(
				{ error: firstError?.message || "Validation failed" },
				{ status: 400 },
			);
		}

		const { template, data, format } = result.data;

		const generated = await generateDocument({
			template,
			data,
			format,
		});

		// Save to database
		const savedDoc = await db.generatedDocument.create({
			data: {
				orgId: orgMember.orgId,
				userId,
				template,
				inputData: JSON.stringify(data),
				content: generated.content,
				format: generated.format,
			},
		});

		// Create audit log
		await db.auditLog.create({
			data: {
				orgId: orgMember.orgId,
				userId,
				action: "create",
				entityType: "generated_document",
				entityId: savedDoc.id,
				entityName: `${template.replace(/_/g, " ")} document`,
				details: `Generated ${template.replace(/_/g, " ")} document`,
			},
		});

		return NextResponse.json({
			document: {
				id: savedDoc.id,
				content: generated.content,
				format: generated.format,
				template: generated.template,
				generatedAt: generated.generatedAt,
			},
		});
	} catch (error) {
		console.error("Generate document error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
