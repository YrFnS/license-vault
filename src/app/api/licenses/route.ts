import { Prisma } from "@prisma/client";
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

export async function GET(request: Request) {
  try {
    const context = await getOrgContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(searchParams.get("limit") || "20", 10)),
    );
    const statusFilter = searchParams.get("status") || undefined;
    const search = searchParams.get("search")?.trim() || undefined;
    const typeFilter = searchParams.get("type")?.trim() || undefined;

    const where: Prisma.LicenseWhereInput = { orgId: context.orgId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { licenseNumber: { contains: search, mode: "insensitive" } },
      ];
    }
    if (typeFilter) where.type = typeFilter;

    const now = new Date();
    const thirtyDaysFromNow = new Date(now);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    if (statusFilter === "active") {
      where.expirationDate = { gt: thirtyDaysFromNow };
    } else if (statusFilter === "expiring_soon") {
      where.expirationDate = { gte: now, lte: thirtyDaysFromNow };
    } else if (statusFilter === "expired") {
      where.expirationDate = { lt: now };
    } else if (statusFilter === "renewalNeeded") {
      where.expirationDate = { lte: thirtyDaysFromNow };
    }

    const orgWhere: Prisma.LicenseWhereInput = { orgId: context.orgId };
    const [total, licenses, countAll, countActive, countExpiring, countExpired] =
      await Promise.all([
        db.license.count({ where }),
        db.license.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        db.license.count({ where: orgWhere }),
        db.license.count({
          where: { ...orgWhere, expirationDate: { gt: thirtyDaysFromNow } },
        }),
        db.license.count({
          where: {
            ...orgWhere,
            expirationDate: { gte: now, lte: thirtyDaysFromNow },
          },
        }),
        db.license.count({
          where: { ...orgWhere, expirationDate: { lt: now } },
        }),
      ]);

    return NextResponse.json(
      {
        licenses: licenses.map((license) => ({
          ...license,
          status: computeLicenseStatus(license.expirationDate, now),
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        counts: {
          all: countAll,
          active: countActive,
          expiring_soon: countExpiring,
          expired: countExpired,
          renewal_needed: countExpiring + countExpired,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Get licenses error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const createLicenseSchema = z
  .object({
    name: z.string().trim().min(1, "License name is required").max(200),
    type: z.string().trim().min(1, "License type is required").max(100),
    licenseNumber: z.string().trim().min(1, "License number is required").max(100),
    issuedBy: z.string().trim().min(1, "Issuing authority is required").max(200),
    state: z.string().trim().max(100).optional(),
    issueDate: z.coerce.date(),
    expirationDate: z.coerce.date(),
    notes: z.string().max(10_000).optional(),
  })
  .refine((value) => value.expirationDate >= value.issueDate, {
    message: "Expiration date must be on or after the issue date",
    path: ["expirationDate"],
  });

export async function POST(request: Request) {
  try {
    const context = await getOrgContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!canManageOrganization(context.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions. Only owners and admins can create licenses." },
        { status: 403 },
      );
    }

    const result = createLicenseSchema.safeParse(await request.json());
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || "Validation failed" },
        { status: 400 },
      );
    }

    const licenseNumber = sanitizeString(result.data.licenseNumber);
    const duplicate = await db.license.findFirst({
      where: {
        orgId: context.orgId,
        licenseNumber: { equals: licenseNumber, mode: "insensitive" },
      },
      select: { id: true },
    });
    if (duplicate) {
      return NextResponse.json(
        { error: "A license with this number already exists in the organization." },
        { status: 409 },
      );
    }

    const license = await db.$transaction(async (transaction) => {
      const created = await transaction.license.create({
        data: {
          orgId: context.orgId,
          name: sanitizeString(result.data.name),
          type: sanitizeString(result.data.type),
          licenseNumber,
          issuedBy: sanitizeString(result.data.issuedBy),
          state: result.data.state ? sanitizeString(result.data.state) : undefined,
          issueDate: result.data.issueDate,
          expirationDate: result.data.expirationDate,
          notes: result.data.notes ? sanitizeString(result.data.notes) : undefined,
          createdById: context.userId,
        },
      });

      await transaction.auditLog.create({
        data: {
          orgId: context.orgId,
          userId: context.userId,
          action: "create",
          entityType: "license",
          entityId: created.id,
          entityName: created.name,
          details: `Created license: ${created.name} (${created.licenseNumber})`,
        },
      });
      return created;
    });

    dispatchWebhook(context.orgId, "license.created", {
      id: license.id,
      name: license.name,
      type: license.type,
      licenseNumber: license.licenseNumber,
      issuedBy: license.issuedBy,
      state: license.state,
      expirationDate: license.expirationDate,
    }).catch((error) => console.error("License webhook delivery failed:", error));

    let suggestedRequirements: unknown[] = [];
    if (license.state) {
      try {
        const requirements = await db.stateRequirement.findMany({
          where: { state: license.state, licenseType: license.type },
        });
        suggestedRequirements = requirements.map((requirement) => ({
          ...requirement,
          reciprocityStates: requirement.reciprocityStates
            ? JSON.parse(requirement.reciprocityStates)
            : [],
        }));
      } catch (error) {
        console.error("Error fetching suggested requirements:", error);
      }
    }

    return NextResponse.json(
      {
        license: {
          ...license,
          status: computeLicenseStatus(license.expirationDate),
        },
        suggestedRequirements,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create license error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
