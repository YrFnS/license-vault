import { NextResponse } from "next/server";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { sanitizeString } from "@/lib/sanitize";
import { canManageOrganization, getOrgContext } from "@/lib/org-context";
import {
  computeSubcontractorCompliance,
  refreshSubcontractorProjects,
} from "@/lib/subcontractor-compliance";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const FILE_DEFINITIONS: Record<
  string,
  { mimeTypes: string[]; matches: (buffer: Buffer) => boolean }
> = {
  pdf: {
    mimeTypes: ["application/pdf"],
    matches: (buffer) => buffer.subarray(0, 5).toString("ascii") === "%PDF-",
  },
  jpg: {
    mimeTypes: ["image/jpeg"],
    matches: (buffer) =>
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff,
  },
  jpeg: {
    mimeTypes: ["image/jpeg"],
    matches: (buffer) =>
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff,
  },
  png: {
    mimeTypes: ["image/png"],
    matches: (buffer) =>
      buffer.subarray(0, 8).equals(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      ),
  },
  doc: {
    mimeTypes: ["application/msword", "application/x-ole-storage"],
    matches: (buffer) =>
      buffer.subarray(0, 8).equals(
        Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]),
      ),
  },
  docx: {
    mimeTypes: [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/zip",
    ],
    matches: (buffer) =>
      buffer.length >= 4 &&
      buffer[0] === 0x50 &&
      buffer[1] === 0x4b &&
      [0x03, 0x05, 0x07].includes(buffer[2] ?? -1) &&
      [0x04, 0x06, 0x08].includes(buffer[3] ?? -1),
  },
};

const categorySchema = z
  .string()
  .trim()
  .min(1)
  .max(50)
  .regex(/^[a-zA-Z0-9_-]+$/, "Invalid document category");

function getSafeOriginalName(fileName: string): string {
  const base = path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, "_");
  return base.slice(0, 180) || "document";
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let savedPath: string | null = null;

  try {
    const context = await getOrgContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!canManageOrganization(context.role)) {
      return NextResponse.json(
        { error: "Only organization owners and admins can upload documents." },
        { status: 403 },
      );
    }

    const { id } = await params;
    const subcontractor = await db.subcontractor.findFirst({
      where: { id, orgId: context.orgId },
      select: { id: true, companyName: true },
    });
    if (!subcontractor) {
      return NextResponse.json(
        { error: "Subcontractor not found" },
        { status: 404 },
      );
    }

    const formData = await request.formData();
    const fileValue = formData.get("file");
    if (!(fileValue instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (fileValue.size <= 0 || fileValue.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File must be between 1 byte and 10MB." },
        { status: 400 },
      );
    }

    const categoryResult = categorySchema.safeParse(
      formData.get("category") || "other",
    );
    if (!categoryResult.success) {
      return NextResponse.json(
        { error: categoryResult.error.issues[0]?.message || "Invalid category" },
        { status: 400 },
      );
    }

    const safeOriginalName = getSafeOriginalName(fileValue.name);
    const extension = safeOriginalName.split(".").pop()?.toLowerCase() || "";
    const definition = FILE_DEFINITIONS[extension];
    if (!definition || !definition.mimeTypes.includes(fileValue.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed types: PDF, JPG, PNG, DOC, DOCX." },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await fileValue.arrayBuffer());
    if (!definition.matches(buffer)) {
      return NextResponse.json(
        { error: "The file content does not match its declared type." },
        { status: 400 },
      );
    }

    const relativeDirectory = path.join(
      "subcontractors",
      context.orgId,
      subcontractor.id,
    );
    const absoluteDirectory = path.join(process.cwd(), "uploads", relativeDirectory);
    await mkdir(absoluteDirectory, { recursive: true });

    const storedName = `${crypto.randomUUID()}.${extension}`;
    savedPath = path.join(absoluteDirectory, storedName);
    await writeFile(savedPath, buffer, { flag: "wx" });
    const relativePath = path.join(relativeDirectory, storedName).replace(/\\/g, "/");

    const document = await db.$transaction(async (transaction) => {
      const created = await transaction.subcontractorDocument.create({
        data: {
          subcontractorId: subcontractor.id,
          orgId: context.orgId,
          fileName: safeOriginalName,
          fileType: extension,
          fileSize: fileValue.size,
          filePath: relativePath,
          category: categoryResult.data,
          reviewStatus: "pending",
        },
      });
      await transaction.subcontractor.update({
        where: { id: subcontractor.id },
        data: { lastSubmittedAt: new Date(), complianceStatus: "pending" },
      });
      await transaction.projectSubcontractor.updateMany({
        where: { subcontractorId: subcontractor.id },
        data: { complianceStatus: "pending", lastChecked: new Date() },
      });
      await transaction.auditLog.create({
        data: {
          orgId: context.orgId,
          userId: context.userId,
          action: "document_uploaded",
          entityType: "subcontractor_document",
          entityId: created.id,
          entityName: safeOriginalName,
          details: JSON.stringify({
            subcontractorId: subcontractor.id,
            companyName: subcontractor.companyName,
            category: created.category,
            fileSize: created.fileSize,
          }),
        },
      });
      return created;
    });

    await refreshSubcontractorProjects(subcontractor.id, context.orgId);
    return NextResponse.json(
      {
        document: {
          id: document.id,
          fileName: document.fileName,
          fileType: document.fileType,
          fileSize: document.fileSize,
          category: document.category,
          reviewStatus: document.reviewStatus,
          createdAt: document.createdAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (savedPath) await unlink(savedPath).catch(() => undefined);
    console.error("Upload subcontractor document error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const reviewDocumentSchema = z.object({
  documentId: z.string().trim().min(1).max(200),
  reviewStatus: z.enum(["approved", "rejected"]),
  reviewNotes: z.string().trim().max(2_000).optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const context = await getOrgContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!canManageOrganization(context.role)) {
      return NextResponse.json(
        { error: "Only organization owners and admins can review documents." },
        { status: 403 },
      );
    }

    const { id } = await params;
    const result = reviewDocumentSchema.safeParse(await request.json());
    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error.issues[0]?.message || "Validation failed",
          details: result.error.flatten(),
        },
        { status: 400 },
      );
    }

    const [subcontractor, document, reviewer] = await Promise.all([
      db.subcontractor.findFirst({
        where: { id, orgId: context.orgId },
      }),
      db.subcontractorDocument.findFirst({
        where: {
          id: result.data.documentId,
          subcontractorId: id,
          orgId: context.orgId,
        },
      }),
      db.user.findUnique({
        where: { id: context.userId },
        select: { name: true },
      }),
    ]);
    if (!subcontractor || !document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const output = await db.$transaction(async (transaction) => {
      const updated = await transaction.subcontractorDocument.update({
        where: { id: document.id },
        data: {
          reviewStatus: result.data.reviewStatus,
          reviewedBy: reviewer?.name || context.email,
          reviewedAt: new Date(),
          reviewNotes: result.data.reviewNotes
            ? sanitizeString(result.data.reviewNotes)
            : null,
        },
      });

      const allDocuments = await transaction.subcontractorDocument.findMany({
        where: { subcontractorId: subcontractor.id, orgId: context.orgId },
        select: { reviewStatus: true },
      });
      const anyRejected = allDocuments.some(
        (item) => item.reviewStatus === "rejected",
      );
      const allApproved =
        allDocuments.length > 0 &&
        allDocuments.every((item) => item.reviewStatus === "approved");
      const baseCompliance = computeSubcontractorCompliance({
        licenseExpiry: subcontractor.licenseExpiry,
        insuranceExpiry: subcontractor.insuranceExpiry,
        status: subcontractor.status,
      });
      const complianceStatus = anyRejected
        ? "non_compliant"
        : allApproved
          ? baseCompliance
          : "pending";

      await transaction.subcontractor.update({
        where: { id: subcontractor.id },
        data: { complianceStatus },
      });
      await transaction.projectSubcontractor.updateMany({
        where: { subcontractorId: subcontractor.id },
        data: { complianceStatus, lastChecked: new Date() },
      });
      await transaction.auditLog.create({
        data: {
          orgId: context.orgId,
          userId: context.userId,
          action: "document_reviewed",
          entityType: "subcontractor_document",
          entityId: document.id,
          entityName: document.fileName,
          details: JSON.stringify({
            subcontractorId: subcontractor.id,
            reviewStatus: updated.reviewStatus,
            complianceStatus,
          }),
        },
      });
      return { updated, complianceStatus };
    });

    await refreshSubcontractorProjects(subcontractor.id, context.orgId);
    return NextResponse.json({
      document: {
        id: output.updated.id,
        fileName: output.updated.fileName,
        fileType: output.updated.fileType,
        fileSize: output.updated.fileSize,
        category: output.updated.category,
        reviewStatus: output.updated.reviewStatus,
        reviewedBy: output.updated.reviewedBy,
        reviewedAt: output.updated.reviewedAt?.toISOString(),
        reviewNotes: output.updated.reviewNotes,
        createdAt: output.updated.createdAt.toISOString(),
      },
      complianceStatus: output.complianceStatus,
    });
  } catch (error) {
    console.error("Review subcontractor document error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
