import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import crypto from "crypto";
import { db } from "@/lib/db";
import { sanitizeString } from "@/lib/sanitize";
import { canManageOrganization, getOrgContext } from "@/lib/org-context";
import {
  computeSubcontractorCompliance,
  computeSubcontractorInsuranceStatus,
} from "@/lib/subcontractor-compliance";

const SUBCONTRACTOR_STATUSES = ["active", "inactive", "suspended"] as const;
const COMPLIANCE_STATUSES = ["compliant", "pending", "non_compliant"] as const;

function parsePositiveInt(value: string | null, fallback: number, max: number): number {
  const parsed = Number.parseInt(value || "", 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}

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

export async function GET(request: Request) {
  try {
    const context = await getOrgContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parsePositiveInt(searchParams.get("page"), 1, 1_000_000);
    const limit = parsePositiveInt(searchParams.get("limit"), 20, 100);
    const search = searchParams.get("search")?.trim();
    const statusFilter = searchParams.get("status");
    const complianceFilter = searchParams.get("compliance");

    const where: Prisma.SubcontractorWhereInput = { orgId: context.orgId };
    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: "insensitive" } },
        { contactName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { licenseNumber: { contains: search, mode: "insensitive" } },
      ];
    }
    if (
      statusFilter &&
      statusFilter !== "all" &&
      (SUBCONTRACTOR_STATUSES as readonly string[]).includes(statusFilter)
    ) {
      where.status = statusFilter;
    }
    if (
      complianceFilter &&
      complianceFilter !== "all" &&
      (COMPLIANCE_STATUSES as readonly string[]).includes(complianceFilter)
    ) {
      where.complianceStatus = complianceFilter;
    }

    const [total, subcontractors, countTotal, countActive, countCompliant, countPending, countNonCompliant] =
      await Promise.all([
        db.subcontractor.count({ where }),
        db.subcontractor.findMany({
          where,
          orderBy: [{ complianceStatus: "asc" }, { updatedAt: "desc" }],
          skip: (page - 1) * limit,
          take: limit,
          include: {
            projectSubs: {
              include: {
                project: { select: { id: true, name: true, status: true } },
              },
            },
            _count: { select: { documents: true } },
          },
        }),
        db.subcontractor.count({ where: { orgId: context.orgId } }),
        db.subcontractor.count({
          where: { orgId: context.orgId, status: "active" },
        }),
        db.subcontractor.count({
          where: { orgId: context.orgId, complianceStatus: "compliant" },
        }),
        db.subcontractor.count({
          where: { orgId: context.orgId, complianceStatus: "pending" },
        }),
        db.subcontractor.count({
          where: { orgId: context.orgId, complianceStatus: "non_compliant" },
        }),
      ]);

    return NextResponse.json(
      {
        subcontractors: subcontractors.map((record) => ({
          ...stripPortalSecrets(record),
          computedInsuranceStatus: computeSubcontractorInsuranceStatus(
            record.insuranceExpiry,
          ),
          computedComplianceStatus: computeSubcontractorCompliance({
            licenseExpiry: record.licenseExpiry,
            insuranceExpiry: record.insuranceExpiry,
            status: record.status,
          }),
          documentCount: record._count.documents,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        counts: {
          total: countTotal,
          active: countActive,
          compliant: countCompliant,
          pending: countPending,
          non_compliant: countNonCompliant,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Get subcontractors error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const createSubcontractorSchema = z.object({
  companyName: z.string().trim().min(1, "Company name is required").max(200),
  contactName: z.string().trim().max(200).optional(),
  email: z.string().trim().email().max(320).or(z.literal("")).optional(),
  phone: z.string().trim().max(100).optional(),
  licenseNumber: z.string().trim().max(150).optional(),
  licenseState: z.string().trim().max(100).optional(),
  licenseExpiry: z.string().refine(validDate, "License expiry is invalid").optional(),
  insuranceExpiry: z
    .string()
    .refine(validDate, "Insurance expiry is invalid")
    .optional(),
  notes: z.string().trim().max(5_000).optional(),
  tradeType: z.string().trim().max(150).optional(),
  insuranceProvider: z.string().trim().max(200).optional(),
  insuranceAmount: z.number().finite().min(0).optional(),
});

export async function POST(request: Request) {
  try {
    const context = await getOrgContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!canManageOrganization(context.role)) {
      return NextResponse.json(
        {
          error:
            "Only organization owners and admins can create subcontractors.",
        },
        { status: 403 },
      );
    }

    const result = createSubcontractorSchema.safeParse(await request.json());
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
    const companyName = sanitizeString(value.companyName);
    const licenseNumber = value.licenseNumber
      ? sanitizeString(value.licenseNumber)
      : null;

    if (licenseNumber) {
      const duplicate = await db.subcontractor.findFirst({
        where: {
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

    const licenseExpiry = value.licenseExpiry
      ? new Date(value.licenseExpiry)
      : null;
    const insuranceExpiry = value.insuranceExpiry
      ? new Date(value.insuranceExpiry)
      : null;
    const complianceStatus = computeSubcontractorCompliance({
      licenseExpiry,
      insuranceExpiry,
      status: "active",
    });
    const insuranceStatus = computeSubcontractorInsuranceStatus(insuranceExpiry);

    const subcontractor = await db.$transaction(async (transaction) => {
      const created = await transaction.subcontractor.create({
        data: {
          orgId: context.orgId,
          companyName,
          contactName: value.contactName
            ? sanitizeString(value.contactName)
            : null,
          email: value.email?.toLowerCase() || null,
          phone: value.phone ? sanitizeString(value.phone) : null,
          licenseNumber,
          licenseState: value.licenseState
            ? sanitizeString(value.licenseState)
            : null,
          licenseExpiry,
          insuranceExpiry,
          insuranceStatus,
          complianceStatus,
          uploadToken: crypto.randomBytes(32).toString("base64url"),
          notes: value.notes ? sanitizeString(value.notes) : null,
          tradeType: value.tradeType ? sanitizeString(value.tradeType) : null,
          insuranceProvider: value.insuranceProvider
            ? sanitizeString(value.insuranceProvider)
            : null,
          insuranceAmount: value.insuranceAmount ?? 0,
        },
      });
      await transaction.auditLog.create({
        data: {
          orgId: context.orgId,
          userId: context.userId,
          action: "create",
          entityType: "subcontractor",
          entityId: created.id,
          entityName: created.companyName,
          details: JSON.stringify({
            complianceStatus,
            licenseNumber: created.licenseNumber,
          }),
        },
      });
      return created;
    });

    return NextResponse.json(
      {
        subcontractor: {
          ...stripPortalSecrets(subcontractor),
          computedInsuranceStatus: insuranceStatus,
          computedComplianceStatus: complianceStatus,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create subcontractor error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
