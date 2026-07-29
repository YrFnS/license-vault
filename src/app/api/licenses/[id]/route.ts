import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { canManageOrganization, getOrgContext } from "@/lib/org-context";
import { sanitizeString } from "@/lib/sanitize";
import { dispatchWebhook } from "@/lib/webhook-delivery";

function computeLicenseStatus(expirationDate: Date, now = new Date()): string {
  const thirtyDaysFromNow = new Date(now);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  if (expirationDate < now) return "expired";
  if (expirationDate <= thirtyDaysFromNow) return "expiring_soon";
  return "active";
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
    const license = await db.license.findFirst({
      where: { id, orgId: context.orgId },
    });

    if (!license) {
      return NextResponse.json({ error: "License not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        license: {
          ...license,
          status: computeLicenseStatus(license.expirationDate),
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Get license error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const updateLicenseSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    type: z.string().trim().min(1).max(100).optional(),
    licenseNumber: z.string().trim().min(1).max(100).optional(),
    issuedBy: z.string().trim().min(1).max(200).optional(),
    state: z.string().trim().max(100).nullable().optional(),
    issueDate: z.coerce.date().optional(),
    expirationDate: z.coerce.date().optional(),
    notes: z.string().max(10_000).nullable().optional(),
    isRenewed: z.boolean().optional(),
  })
  .refine(
    (value) =>
      !value.issueDate ||
      !value.expirationDate ||
      value.expirationDate >= value.issueDate,
    {
      message: "Expiration date must be on or after the issue date",
      path: ["expirationDate"],
    },
  );

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
        { error: "Insufficient permissions. Only owners and admins can update licenses." },
        { status: 403 },
      );
    }

    const { id } = await params;
    const existing = await db.license.findFirst({
      where: { id, orgId: context.orgId },
    });
    if (!existing) {
      return NextResponse.json({ error: "License not found" }, { status: 404 });
    }

    const result = updateLicenseSchema.safeParse(await request.json());
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || "Validation failed" },
        { status: 400 },
      );
    }

    const effectiveIssueDate = result.data.issueDate || existing.issueDate;
    const effectiveExpirationDate = result.data.expirationDate || existing.expirationDate;
    if (effectiveExpirationDate < effectiveIssueDate) {
      return NextResponse.json(
        { error: "Expiration date must be on or after the issue date" },
        { status: 400 },
      );
    }

    if (result.data.licenseNumber) {
      const normalizedNumber = sanitizeString(result.data.licenseNumber);
      const duplicate = await db.license.findFirst({
        where: {
          orgId: context.orgId,
          id: { not: id },
          licenseNumber: { equals: normalizedNumber, mode: "insensitive" },
        },
        select: { id: true },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: "A license with this number already exists in the organization." },
          { status: 409 },
        );
      }
    }

    const updateData = {
      ...(result.data.name !== undefined
        ? { name: sanitizeString(result.data.name) }
        : {}),
      ...(result.data.type !== undefined
        ? { type: sanitizeString(result.data.type) }
        : {}),
      ...(result.data.licenseNumber !== undefined
        ? { licenseNumber: sanitizeString(result.data.licenseNumber) }
        : {}),
      ...(result.data.issuedBy !== undefined
        ? { issuedBy: sanitizeString(result.data.issuedBy) }
        : {}),
      ...(result.data.state !== undefined
        ? { state: result.data.state ? sanitizeString(result.data.state) : null }
        : {}),
      ...(result.data.issueDate !== undefined
        ? { issueDate: result.data.issueDate }
        : {}),
      ...(result.data.expirationDate !== undefined
        ? { expirationDate: result.data.expirationDate }
        : {}),
      ...(result.data.notes !== undefined
        ? { notes: result.data.notes ? sanitizeString(result.data.notes) : null }
        : {}),
      ...(result.data.isRenewed !== undefined
        ? { isRenewed: result.data.isRenewed }
        : {}),
    };

    const license = await db.$transaction(async (transaction) => {
      const updated = await transaction.license.update({
        where: { id },
        data: updateData,
      });
      await transaction.auditLog.create({
        data: {
          orgId: context.orgId,
          userId: context.userId,
          action: "update",
          entityType: "license",
          entityId: updated.id,
          entityName: updated.name,
          details: `Updated license: ${updated.name} (${updated.licenseNumber})`,
        },
      });
      return updated;
    });

    dispatchWebhook(context.orgId, "license.updated", {
      id: license.id,
      name: license.name,
      type: license.type,
      licenseNumber: license.licenseNumber,
      issuedBy: license.issuedBy,
      state: license.state,
      expirationDate: license.expirationDate,
    }).catch((error) => console.error("License webhook delivery failed:", error));

    return NextResponse.json({
      license: {
        ...license,
        status: computeLicenseStatus(license.expirationDate),
      },
    });
  } catch (error) {
    console.error("Update license error:", error);
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
        { error: "Insufficient permissions. Only owners and admins can delete licenses." },
        { status: 403 },
      );
    }

    const { id } = await params;
    const existing = await db.license.findFirst({
      where: { id, orgId: context.orgId },
    });
    if (!existing) {
      return NextResponse.json({ error: "License not found" }, { status: 404 });
    }

    await db.$transaction(async (transaction) => {
      await transaction.auditLog.create({
        data: {
          orgId: context.orgId,
          userId: context.userId,
          action: "delete",
          entityType: "license",
          entityId: existing.id,
          entityName: existing.name,
          details: `Deleted license: ${existing.name} (${existing.licenseNumber})`,
        },
      });
      await transaction.license.delete({ where: { id } });
    });

    dispatchWebhook(context.orgId, "license.deleted", {
      id: existing.id,
      name: existing.name,
      licenseNumber: existing.licenseNumber,
    }).catch((error) => console.error("License webhook delivery failed:", error));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete license error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
