import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  checkInsuranceCompliance,
  computeComplianceStatus,
} from "@/lib/insurance-compliance";
import { sanitizeString } from "@/lib/sanitize";
import { dispatchWebhook } from "@/lib/webhook-delivery";
import { canManageOrganization, getOrgContext } from "@/lib/org-context";

function computeInsuranceStatus(expirationDate: Date): string {
  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  if (expirationDate < now) return "expired";
  if (expirationDate <= thirtyDaysFromNow) return "expiring_soon";
  return "active";
}

function validDate(value: string): boolean {
  return Number.isFinite(new Date(value).getTime());
}

export async function GET(request: Request) {
  try {
    const context = await getOrgContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const typeFilter = searchParams.get("type");
    const statusFilter = searchParams.get("status");
    const complianceFilter = searchParams.get("compliance");

    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const where: Prisma.InsuranceBondWhereInput = { orgId: context.orgId };

    if (
      typeFilter &&
      typeFilter !== "both" &&
      ["insurance", "bond", "certificate"].includes(typeFilter)
    ) {
      where.type = typeFilter;
    }

    if (statusFilter === "active") {
      where.expirationDate = { gt: thirtyDaysFromNow };
    } else if (statusFilter === "expiring_soon") {
      where.expirationDate = { gt: now, lte: thirtyDaysFromNow };
    } else if (statusFilter === "expired") {
      where.expirationDate = { lte: now };
    }

    if (
      complianceFilter &&
      ["compliant", "deficient", "expired", "pending"].includes(complianceFilter)
    ) {
      where.complianceStatus = complianceFilter;
    }

    const [records, allRecords] = await Promise.all([
      db.insuranceBond.findMany({
        where,
        orderBy: [{ expirationDate: "asc" }, { createdAt: "desc" }],
      }),
      db.insuranceBond.findMany({ where: { orgId: context.orgId } }),
    ]);

    const recordsWithStatus = records.map((record) => {
      const compliance = checkInsuranceCompliance(record);
      return {
        ...record,
        computedStatus: computeInsuranceStatus(record.expirationDate),
        compliance: {
          isCompliant: compliance.isCompliant,
          deficiencies: compliance.deficiencies,
        },
      };
    });

    const statusCounts = allRecords.reduce(
      (counts, record) => {
        const status = computeInsuranceStatus(record.expirationDate);
        counts[status as "active" | "expiring_soon" | "expired"] += 1;
        return counts;
      },
      { active: 0, expiring_soon: 0, expired: 0 },
    );

    const complianceCounts = allRecords.reduce(
      (counts, record) => {
        const status = computeComplianceStatus(record);
        counts[status as "compliant" | "deficient" | "expired" | "pending"] += 1;
        return counts;
      },
      { compliant: 0, deficient: 0, expired: 0, pending: 0 },
    );

    return NextResponse.json(
      {
        records: recordsWithStatus,
        summary: {
          total: allRecords.length,
          active: statusCounts.active,
          expiring: statusCounts.expiring_soon,
          expired: statusCounts.expired,
          totalCoverage: allRecords.reduce(
            (sum, record) => sum + record.coverageAmount,
            0,
          ),
          totalPremium: allRecords.reduce(
            (sum, record) => sum + record.premiumAmount,
            0,
          ),
          compliant: complianceCounts.compliant,
          deficient: complianceCounts.deficient,
          expiredCompliance: complianceCounts.expired,
          pending: complianceCounts.pending,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Get insurance error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const createInsuranceSchema = z
  .object({
    name: z.string().trim().min(1, "Policy name is required").max(200),
    type: z.enum(["insurance", "bond", "certificate"]),
    policyNumber: z.string().trim().min(1, "Policy number is required").max(150),
    provider: z.string().trim().min(1, "Provider is required").max(200),
    coverageAmount: z.number().finite().min(0),
    premiumAmount: z.number().finite().min(0),
    issueDate: z.string().refine(validDate, "Issue date is invalid"),
    expirationDate: z.string().refine(validDate, "Expiration date is invalid"),
    holderName: z.string().trim().max(200).optional(),
    notes: z.string().trim().max(5_000).optional(),
    autoRenew: z.boolean().optional(),
    additionalInsured: z.boolean().optional(),
    primaryNoncontrib: z.boolean().optional(),
    waiverSubrogation: z.boolean().optional(),
    perOccurrenceLimit: z.number().finite().min(0).optional(),
    aggregateLimit: z.number().finite().min(0).optional(),
    deductible: z.number().finite().min(0).optional(),
    endorsementTypes: z.array(z.string().trim().min(1).max(100)).max(50).optional(),
    requiredCoverage: z.number().finite().min(0).optional(),
    requiredPerOccurrence: z.number().finite().min(0).optional(),
    requiredAggregate: z.number().finite().min(0).optional(),
    requiredEndorsements: z
      .array(z.string().trim().min(1).max(100))
      .max(50)
      .optional(),
  })
  .superRefine((value, context) => {
    if (new Date(value.expirationDate) < new Date(value.issueDate)) {
      context.addIssue({
        code: "custom",
        path: ["expirationDate"],
        message: "Expiration date must be on or after the issue date",
      });
    }
  });

export async function POST(request: Request) {
  try {
    const context = await getOrgContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!canManageOrganization(context.role)) {
      return NextResponse.json(
        { error: "Only organization owners and admins can create insurance records." },
        { status: 403 },
      );
    }

    const result = createInsuranceSchema.safeParse(await request.json());
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
    const name = sanitizeString(value.name);
    const policyNumber = sanitizeString(value.policyNumber);
    const provider = sanitizeString(value.provider);
    const holderName = value.holderName ? sanitizeString(value.holderName) : undefined;
    const notes = value.notes ? sanitizeString(value.notes) : undefined;
    const issueDate = new Date(value.issueDate);
    const expirationDate = new Date(value.expirationDate);

    const duplicate = await db.insuranceBond.findFirst({
      where: {
        orgId: context.orgId,
        policyNumber: { equals: policyNumber, mode: "insensitive" },
      },
      select: { id: true },
    });
    if (duplicate) {
      return NextResponse.json(
        { error: "A policy with this number already exists in the organization." },
        { status: 409 },
      );
    }

    const endorsementTypes = [...new Set(value.endorsementTypes || [])];
    const requiredEndorsements = [...new Set(value.requiredEndorsements || [])];
    const computedStatus = computeInsuranceStatus(expirationDate);
    const recordForCompliance = {
      coverageAmount: value.coverageAmount,
      perOccurrenceLimit: value.perOccurrenceLimit ?? 0,
      aggregateLimit: value.aggregateLimit ?? 0,
      additionalInsured: value.additionalInsured ?? false,
      primaryNoncontrib: value.primaryNoncontrib ?? false,
      waiverSubrogation: value.waiverSubrogation ?? false,
      endorsementTypes: endorsementTypes.length
        ? JSON.stringify(endorsementTypes)
        : null,
      requiredCoverage: value.requiredCoverage ?? 0,
      requiredPerOccurrence: value.requiredPerOccurrence ?? 0,
      requiredAggregate: value.requiredAggregate ?? 0,
      requiredEndorsements: requiredEndorsements.length
        ? JSON.stringify(requiredEndorsements)
        : null,
      expirationDate,
      complianceStatus: "pending",
    };
    const complianceStatus = computeComplianceStatus(recordForCompliance);

    const record = await db.$transaction(async (transaction) => {
      const created = await transaction.insuranceBond.create({
        data: {
          orgId: context.orgId,
          name,
          type: value.type,
          policyNumber,
          provider,
          coverageAmount: value.coverageAmount,
          premiumAmount: value.premiumAmount,
          issueDate,
          expirationDate,
          status: computedStatus,
          holderName,
          notes,
          autoRenew: value.autoRenew ?? false,
          additionalInsured: value.additionalInsured ?? false,
          primaryNoncontrib: value.primaryNoncontrib ?? false,
          waiverSubrogation: value.waiverSubrogation ?? false,
          perOccurrenceLimit: value.perOccurrenceLimit ?? 0,
          aggregateLimit: value.aggregateLimit ?? 0,
          deductible: value.deductible ?? 0,
          endorsementTypes: recordForCompliance.endorsementTypes,
          requiredCoverage: value.requiredCoverage ?? 0,
          requiredPerOccurrence: value.requiredPerOccurrence ?? 0,
          requiredAggregate: value.requiredAggregate ?? 0,
          requiredEndorsements: recordForCompliance.requiredEndorsements,
          complianceStatus,
        },
      });

      await transaction.auditLog.create({
        data: {
          orgId: context.orgId,
          userId: context.userId,
          action: "create",
          entityType: "insurance_bond",
          entityId: created.id,
          entityName: created.name,
          details: JSON.stringify({
            policyNumber: created.policyNumber,
            complianceStatus,
          }),
        },
      });
      return created;
    });

    dispatchWebhook(context.orgId, "insurance.created", {
      id: record.id,
      name: record.name,
      type: record.type,
      policyNumber: record.policyNumber,
      provider: record.provider,
      coverageAmount: record.coverageAmount,
      expirationDate: record.expirationDate,
      complianceStatus,
    }).catch(console.error);

    const compliance = checkInsuranceCompliance(record);
    return NextResponse.json(
      {
        record: {
          ...record,
          computedStatus,
          compliance: {
            isCompliant: compliance.isCompliant,
            deficiencies: compliance.deficiencies,
          },
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create insurance error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
