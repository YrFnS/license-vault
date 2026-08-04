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

async function getScopedRecord(id: string, orgId: string) {
  return db.insuranceBond.findFirst({ where: { id, orgId } });
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
    const record = await getScopedRecord(id, context.orgId);
    if (!record) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    const compliance = checkInsuranceCompliance(record);
    return NextResponse.json(
      {
        record: {
          ...record,
          computedStatus: computeInsuranceStatus(record.expirationDate),
          compliance: {
            isCompliant: compliance.isCompliant,
            deficiencies: compliance.deficiencies,
            status: computeComplianceStatus(record),
          },
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Get insurance record error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const updateInsuranceSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    type: z.enum(["insurance", "bond", "certificate"]).optional(),
    policyNumber: z.string().trim().min(1).max(150).optional(),
    provider: z.string().trim().min(1).max(200).optional(),
    coverageAmount: z.number().finite().min(0).optional(),
    premiumAmount: z.number().finite().min(0).optional(),
    issueDate: z.string().refine(validDate, "Issue date is invalid").optional(),
    expirationDate: z
      .string()
      .refine(validDate, "Expiration date is invalid")
      .optional(),
    holderName: z.string().trim().max(200).nullable().optional(),
    notes: z.string().trim().max(5_000).nullable().optional(),
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
        { error: "Only organization owners and admins can update insurance records." },
        { status: 403 },
      );
    }

    const { id } = await params;
    const existingRecord = await getScopedRecord(id, context.orgId);
    if (!existingRecord) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    const result = updateInsuranceSchema.safeParse(await request.json());
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
    const issueDate = value.issueDate ? new Date(value.issueDate) : existingRecord.issueDate;
    const expirationDate = value.expirationDate
      ? new Date(value.expirationDate)
      : existingRecord.expirationDate;

    if (expirationDate < issueDate) {
      return NextResponse.json(
        { error: "Expiration date must be on or after the issue date." },
        { status: 400 },
      );
    }

    const policyNumber = value.policyNumber
      ? sanitizeString(value.policyNumber)
      : existingRecord.policyNumber;
    if (value.policyNumber) {
      const duplicate = await db.insuranceBond.findFirst({
        where: {
          orgId: context.orgId,
          id: { not: id },
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
    }

    const endorsementTypes = value.endorsementTypes
      ? [...new Set(value.endorsementTypes.map(sanitizeString))]
      : undefined;
    const requiredEndorsements = value.requiredEndorsements
      ? [...new Set(value.requiredEndorsements.map(sanitizeString))]
      : undefined;

    const updateData: Prisma.InsuranceBondUncheckedUpdateInput = {
      ...(value.name !== undefined ? { name: sanitizeString(value.name) } : {}),
      ...(value.type !== undefined ? { type: value.type } : {}),
      ...(value.policyNumber !== undefined ? { policyNumber } : {}),
      ...(value.provider !== undefined
        ? { provider: sanitizeString(value.provider) }
        : {}),
      ...(value.coverageAmount !== undefined
        ? { coverageAmount: value.coverageAmount }
        : {}),
      ...(value.premiumAmount !== undefined
        ? { premiumAmount: value.premiumAmount }
        : {}),
      ...(value.issueDate !== undefined ? { issueDate } : {}),
      ...(value.expirationDate !== undefined ? { expirationDate } : {}),
      ...(value.holderName !== undefined
        ? { holderName: value.holderName ? sanitizeString(value.holderName) : null }
        : {}),
      ...(value.notes !== undefined
        ? { notes: value.notes ? sanitizeString(value.notes) : null }
        : {}),
      ...(value.autoRenew !== undefined ? { autoRenew: value.autoRenew } : {}),
      ...(value.additionalInsured !== undefined
        ? { additionalInsured: value.additionalInsured }
        : {}),
      ...(value.primaryNoncontrib !== undefined
        ? { primaryNoncontrib: value.primaryNoncontrib }
        : {}),
      ...(value.waiverSubrogation !== undefined
        ? { waiverSubrogation: value.waiverSubrogation }
        : {}),
      ...(value.perOccurrenceLimit !== undefined
        ? { perOccurrenceLimit: value.perOccurrenceLimit }
        : {}),
      ...(value.aggregateLimit !== undefined
        ? { aggregateLimit: value.aggregateLimit }
        : {}),
      ...(value.deductible !== undefined ? { deductible: value.deductible } : {}),
      ...(endorsementTypes !== undefined
        ? {
            endorsementTypes: endorsementTypes.length
              ? JSON.stringify(endorsementTypes)
              : null,
          }
        : {}),
      ...(value.requiredCoverage !== undefined
        ? { requiredCoverage: value.requiredCoverage }
        : {}),
      ...(value.requiredPerOccurrence !== undefined
        ? { requiredPerOccurrence: value.requiredPerOccurrence }
        : {}),
      ...(value.requiredAggregate !== undefined
        ? { requiredAggregate: value.requiredAggregate }
        : {}),
      ...(requiredEndorsements !== undefined
        ? {
            requiredEndorsements: requiredEndorsements.length
              ? JSON.stringify(requiredEndorsements)
              : null,
          }
        : {}),
      status: computeInsuranceStatus(expirationDate),
    };

    const complianceInput = {
      coverageAmount: value.coverageAmount ?? existingRecord.coverageAmount,
      perOccurrenceLimit:
        value.perOccurrenceLimit ?? existingRecord.perOccurrenceLimit,
      aggregateLimit: value.aggregateLimit ?? existingRecord.aggregateLimit,
      additionalInsured:
        value.additionalInsured ?? existingRecord.additionalInsured,
      primaryNoncontrib:
        value.primaryNoncontrib ?? existingRecord.primaryNoncontrib,
      waiverSubrogation:
        value.waiverSubrogation ?? existingRecord.waiverSubrogation,
      endorsementTypes:
        endorsementTypes !== undefined
          ? endorsementTypes.length
            ? JSON.stringify(endorsementTypes)
            : null
          : existingRecord.endorsementTypes,
      requiredCoverage:
        value.requiredCoverage ?? existingRecord.requiredCoverage,
      requiredPerOccurrence:
        value.requiredPerOccurrence ?? existingRecord.requiredPerOccurrence,
      requiredAggregate:
        value.requiredAggregate ?? existingRecord.requiredAggregate,
      requiredEndorsements:
        requiredEndorsements !== undefined
          ? requiredEndorsements.length
            ? JSON.stringify(requiredEndorsements)
            : null
          : existingRecord.requiredEndorsements,
      expirationDate,
      complianceStatus: existingRecord.complianceStatus,
    };
    const complianceStatus = computeComplianceStatus(complianceInput);

    const record = await db.$transaction(async (transaction) => {
      const updated = await transaction.insuranceBond.update({
        where: { id },
        data: { ...updateData, complianceStatus },
      });
      await transaction.auditLog.create({
        data: {
          orgId: context.orgId,
          userId: context.userId,
          action: "update",
          entityType: "insurance_bond",
          entityId: updated.id,
          entityName: updated.name,
          details: JSON.stringify({
            updatedFields: Object.keys(value),
            complianceStatus,
          }),
        },
      });
      return updated;
    });

    dispatchWebhook(context.orgId, "insurance.updated", {
      id: record.id,
      name: record.name,
      type: record.type,
      policyNumber: record.policyNumber,
      provider: record.provider,
      complianceStatus,
    }).catch(console.error);

    const compliance = checkInsuranceCompliance(record);
    return NextResponse.json({
      record: {
        ...record,
        computedStatus: computeInsuranceStatus(record.expirationDate),
        compliance: {
          isCompliant: compliance.isCompliant,
          deficiencies: compliance.deficiencies,
          status: complianceStatus,
        },
      },
    });
  } catch (error) {
    console.error("Update insurance error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
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
        { error: "Only organization owners and admins can verify insurance records." },
        { status: 403 },
      );
    }

    const { id } = await params;
    const existingRecord = await getScopedRecord(id, context.orgId);
    if (!existingRecord) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    const complianceStatus = computeComplianceStatus(existingRecord);
    const compliance = checkInsuranceCompliance(existingRecord);
    const record = await db.$transaction(async (transaction) => {
      const updated = await transaction.insuranceBond.update({
        where: { id },
        data: { complianceStatus, lastVerified: new Date() },
      });
      await transaction.auditLog.create({
        data: {
          orgId: context.orgId,
          userId: context.userId,
          action: "verify",
          entityType: "insurance_bond",
          entityId: updated.id,
          entityName: updated.name,
          details: JSON.stringify({
            complianceStatus,
            deficiencies: compliance.deficiencies,
          }),
        },
      });
      return updated;
    });

    return NextResponse.json({
      record: {
        ...record,
        computedStatus: computeInsuranceStatus(record.expirationDate),
        compliance: {
          isCompliant: compliance.isCompliant,
          deficiencies: compliance.deficiencies,
          status: complianceStatus,
        },
      },
    });
  } catch (error) {
    console.error("Verify insurance error:", error);
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
        { error: "Only organization owners and admins can delete insurance records." },
        { status: 403 },
      );
    }

    const { id } = await params;
    const existingRecord = await getScopedRecord(id, context.orgId);
    if (!existingRecord) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    await db.$transaction(async (transaction) => {
      await transaction.auditLog.create({
        data: {
          orgId: context.orgId,
          userId: context.userId,
          action: "delete",
          entityType: "insurance_bond",
          entityId: existingRecord.id,
          entityName: existingRecord.name,
          details: JSON.stringify({ policyNumber: existingRecord.policyNumber }),
        },
      });
      await transaction.insuranceBond.delete({ where: { id } });
    });

    dispatchWebhook(context.orgId, "insurance.deleted", {
      id: existingRecord.id,
      name: existingRecord.name,
      policyNumber: existingRecord.policyNumber,
    }).catch(console.error);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete insurance error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
