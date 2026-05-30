import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { readFile, unlink } from "fs/promises";
import path from "path";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

// GET: Download/serve a document file
export async function GET(
	request: Request,
	{ params }: { params: Promise<{ id: string; docId: string }> },
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const userId = (session.user as any).id;
		const { id, docId } = await params;

		// Find user's org membership
		const orgMember = await db.orgMember.findFirst({
			where: { userId },
		});

		if (!orgMember) {
			return NextResponse.json(
				{ error: "No organization found" },
				{ status: 404 },
			);
		}

		// Find the document
		const document = await db.licenseDocument.findFirst({
			where: {
				id: docId,
				licenseId: id,
				orgId: orgMember.orgId,
			},
		});

		if (!document) {
			return NextResponse.json(
				{ error: "Document not found" },
				{ status: 404 },
			);
		}

		// Read the file from disk
		const filePath = path.join(UPLOADS_DIR, document.filePath);
		let fileBuffer: Buffer;
		try {
			fileBuffer = await readFile(filePath);
		} catch {
			return NextResponse.json(
				{ error: "File not found on disk" },
				{ status: 404 },
			);
		}

		// Determine content type
		const contentType = getContentType(document.fileType);

		// Return the file with appropriate headers
		return new NextResponse(fileBuffer as BodyInit, {
			status: 200,
			headers: {
				"Content-Type": contentType,
				"Content-Disposition": `inline; filename="${document.fileName}"`,
				"Content-Length": fileBuffer.length.toString(),
			},
		});
	} catch (error) {
		console.error("Download document error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

// DELETE: Delete a document (owner/admin only)
export async function DELETE(
	request: Request,
	{ params }: { params: Promise<{ id: string; docId: string }> },
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const userId = (session.user as any).id;
		const { id, docId } = await params;

		// Find user's org membership and check role
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
						"Insufficient permissions. Only owners and admins can delete documents.",
				},
				{ status: 403 },
			);
		}

		// Find the document
		const document = await db.licenseDocument.findFirst({
			where: {
				id: docId,
				licenseId: id,
				orgId: orgMember.orgId,
			},
		});

		if (!document) {
			return NextResponse.json(
				{ error: "Document not found" },
				{ status: 404 },
			);
		}

		// Get license name for audit log
		const license = await db.license.findFirst({
			where: { id, orgId: orgMember.orgId },
			select: { name: true },
		});

		// Delete file from disk
		const filePath = path.join(UPLOADS_DIR, document.filePath);
		try {
			await unlink(filePath);
		} catch {
			// File might already be deleted, continue with DB cleanup
			console.warn(`File not found on disk: ${filePath}`);
		}

		// Create audit log entry before deletion
		await db.auditLog.create({
			data: {
				orgId: orgMember.orgId,
				userId,
				action: "DOCUMENT_DELETED",
				entityType: "license_document",
				entityId: document.id,
				entityName: document.fileName,
				details: `Deleted document "${document.fileName}" from license "${license?.name || id}"`,
			},
		});

		// Delete metadata from database
		await db.licenseDocument.delete({
			where: { id: docId },
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Delete document error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

function getContentType(fileType: string): string {
	const mimeTypes: Record<string, string> = {
		pdf: "application/pdf",
		jpg: "image/jpeg",
		jpeg: "image/jpeg",
		png: "image/png",
		doc: "application/msword",
		docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	};
	return mimeTypes[fileType.toLowerCase()] || "application/octet-stream";
}
