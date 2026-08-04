import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { sanitizeString } from "@/lib/sanitize";
import { canManageOrganization, getOrgContext } from "@/lib/org-context";
import {
  computeSubcontractorCompliance,
  computeSubcontractorInsuranceStatus,
  refreshSubcontractorProjects,
} from "@/lib/subcontractor-compliance";
import { refreshProjectCompliance } from "@/lib/project-compliance";

const SUBCONTRACTOR_STATUSES = ["active", "inactive", "suspended"] as const;

function validDate(value: string): boolean {
  return Number.isFinite(new Date(value).getTime());
}

function stripPortalSecrets<T extends {
  uploadToken: string | null;
  portalToken: string | null;
}>(record: T): Omit<T, "uploadToken" | "portalToken"> {
  const { uploadToken: _uploadToken, portalToken: _portalToken, ...safe } = record;
  return safe;
}

async function findSubcontractor(id: string, orgId: string) {
  return db.subcontractor.findFirst({ where: { id, orgId } });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const context = await getOrgContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const subcontractor = await db.subcontractor.findFirst({
      where: { id, orgId: context.orgId },
      include: {
        projectSubs: {
          include: {
            project: { select: { id: true, name: true, status: true } },
          },
        },
        documents: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            fileName: true,
            fileType: true,
            fileSize: true,
            category: true,
            reviewStatus: true,
            reviewedBy: true,
            reviewedAt: true,
            reviewNotes: true,
            createdAt: true,
          },
        },
      },
    });
    if (!subcontractor) {
      return NextResponse.json(
        { error: "Subcontractor not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        subcontractor: {
          ...stripPortalSecrets(subcontractor),
          computedInsuranceStatus: computeSubcontractorInsuranceStatus(
            subcontractor.insuranceExpiry,
          ),
          computedComplianceStatus: computeSubcontractorCompliance({
            licenseExpiry: subcontractor.licenseExpiry,
            insuranceExpiry: subcontractor.insuranceExpiry,
            status: subcontractor.status,
          }),
          portalEnabled: Boolean(
            subcontractor.portalExpiresAt &&
              subcontractor.portalExpiresAt > new Date(),
          ),
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Get subcontractor error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const updateSubcontractorSchema = z
  .object({
    companyName: z.string().trim().min(1).max(200).optional(),
    contactName: z.string().trim().max(200).nullable().optional(),
    email: z
      .string()
      .trim()
      .email()
      .max(320)
      .or(z.literal(""))
      .nullable()
      .optional(),
    phone: z.string().trim().max(100).nullable().optional(),
    licenseNumber: z.string().trim().max(150).nullable().optional(),
    licenseState: z.string().trim().max(100).nullable().optional(),
    licenseExpiry: z
      .string()
      .refine(validDate, "License expiry is invalid")
      .nullable()
      .optional(),
    insuranceExpiry: z
      .string()
      .refine(validDate, "Insurance expiry is invalid")
      .nullable()
      .optional(),
    status: z.enum(SUBCONTRACTOR_STATUSES).optional(),
    notes: z.string().trim().max(5_000).nullable().optional(),
    tradeType: z.string().trim().max(150).nullable().optional(),
    insuranceProvider: z.string().trim().max(200).nullable().optional(),
    insuranceAmount: z.number().finite().min(0).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, "No changes supplied");

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
        { error: "Only organization owners and admins can update subcontractors." },
        { status: 403 },
      );
    }

    const { id } = await params;
    const existing = await findSubcontractor(id, context.orgId);
    if (!existing) {
      return NextResponse.json(
        { error: "Subcontractor not found" },
        { status: 404 },
      );
    }

    const result = updateSubcontractorSchema.safeParse(await request.json());
    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error.issues[0]?.message || "Validation failed",
          details: result.error.flatten(),
        },
        { status: 400 },
      );
    }

    const value = result.data;
    const licenseNumber =
      value.licenseNumber === undefined
        ? existing.licenseNumber
        : value.licenseNumber
          ? sanitizeString(value.licenseNumber)
          : null;
    if (value.licenseNumber && licenseNumber) {
      const duplicate = await db.subcontractor.findFirst({
        where: {
          id: { not: existing.id },
          orgId: context.orgId,
          licenseNumber: { equals: licenseNumber, mode: "insensitive" },
        },
        select: { id: true },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: "A subcontractor with this license number already exists." },
          { status: 409 },
        );
      }
    }

    const licenseExpiry =
      value.licenseExpiry === undefined
        ? existing.licenseExpiry
        : value.licenseExpiry
          ? new Date(value.licenseExpiry)
          : null;
    const insuranceExpiry =
      value.insuranceExpiry === undefined
        ? existing.insuranceExpiry
        : value.insuranceExpiry
          ? new Date(value.insuranceExpiry)
          : null;
    const status = value.status ?? existing.status;
    const complianceStatus = computeSubcontractorCompliance({
      licenseExpiry,
      insuranceExpiry,
      status,
    });
    const insuranceStatus = computeSubcontractorInsuranceStatus(insuranceExpiry);

    const updateData: Prisma.SubcontractorUncheckedUpdateInput = {
      ...(value.companyName !== undefined
        ? { companyName: sanitizeString(value.companyName) }
        : {}),
      ...(value.contactName !== undefined
        ? {
            contactName: value.contactName
              ? sanitizeString(value.contactName)
              : null,
          }
        : {}),
      ...(value.email !== undefined
        ? { email: value.email?.toLowerCase() || null }
        : {}),
      ...(value.phone !== undefined
        ? { phone: value.phone ? sanitizeString(value.phone) : null }
        : {}),
      ...(value.licenseNumber !== undefined ? { licenseNumber } : {}),
      ...(value.licenseState !== undefined
        ? {
            licenseState: value.licenseState
              ? sanitizeString(value.licenseState)
              : null,
          }
        : {}),
      ...(value.licenseExpiry !== undefined ? { licenseExpiry } : {}),
      ...(value.insuranceExpiry !== undefined ? { insuranceExpiry } : {}),
      ...(value.status !== undefined ? { status } : {}),
      ...(value.notes !== undefined
        ? { notes: value.notes ? sanitizeString(value.notes) : null }
        : {}),
      ...(value.tradeType !== undefined
        ? { tradeType: value.tradeType ? sanitizeString(value.tradeType) : null }
        : {}),
      ...(value.insuranceProvider !== undefined
        ? {
            insuranceProvider: value.insuranceProvider
              ? sanitizeString(value.insuranceProvider)
              : null,
          }
        : {}),
      ...(value.insuranceAmount !== undefined
        ? { insuranceAmount: value.insuranceAmount }
        : {}),
      insuranceStatus,
      complianceStatus,
    };

    const subcontractor = await db.$transaction(async (transaction) => {
      const updated = await transaction.subcontractor.update({
        where: { id: existing.id },
        data: updateData,
      });
      await transaction.projectSubcontractor.updateMany({
        where: { subcontractorId: existing.id },
        data: { complianceStatus, lastChecked: new Date() },
      });
      await transaction.auditLog.create({
        data: {
          orgId: context.orgId,
          userId: context.userId,
          action: "update",
          entityType: "subcontractor",
          entityId: updated.id,
          entityName: updated.companyName,
          details: JSON.stringify({
            updatedFields: Object.keys(value),
            complianceStatus,
          }),
        },
      });
      return updated;
    });

    await refreshSubcontractorProjects(existing.id, context.orgId);
    return NextResponse.json({
      subcontractor: {
        ...stripPortalSecrets(subcontractor),
        computedInsuranceStatus: insuranceStatus,
        computedComplianceStatus: complianceStatus,
      },
    });
  } catch (error) {
    console.error("Update subcontractor error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const context = await getOrgContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!canManageOrganization(context.role)) {
      return NextResponse.json(
        { error: "Only organization owners and admins can delete subcontractors." },
        { status: 403 },
      );
    }

    const { id } = await params;
    const existing = await db.subcontractor.findFirst({
      where: { id, orgId: context.orgId },
      include: { projectSubs: { select: { projectId: true } } },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Subcontractor not found" },
        { status: 404 },
      );
    }

    const projectIds = existing.projectSubs.map((link) => link.projectId);
    await db.$transaction(async (transaction) => {
      await transaction.auditLog.create({
        data: {
          orgId: context.orgId,
          userId: context.userId,
          action: "delete",
          entityType: "subcontractor",
          entityId: existing.id,
          entityName: existing.companyName,
          details: JSON.stringify({ linkedProjects: projectIds.length }),
        },
      });
      await transaction.subcontractor.delete({ where: { id: existing.id } });
    });

    await Promise.all(
      projectIds.map((projectId) =>
        refreshProjectCompliance(projectId, context.orgId),
      ),
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete subcontractor error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
