import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { sanitizeString } from "@/lib/sanitize";
import {
  computeSubcontractorInsuranceStatus,
  refreshSubcontractorProjects,
} from "@/lib/subcontractor-compliance";

function validDate(value: string): boolean {
  return Number.isFinite(new Date(value).getTime());
}

async function findPortalSubcontractor(token: string) {
  return db.subcontractor.findFirst({
    where: {
      portalToken: token,
      portalExpiresAt: { gt: new Date() },
      status: "active",
    },
    include: {
      documents: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          fileName: true,
          fileType: true,
          fileSize: true,
          category: true,
          reviewStatus: true,
          createdAt: true,
        },
      },
      org: {
        select: {
          id: true,
          name: true,
          companyName: true,
          tradeType: true,
          logoUrl: true,
        },
      },
    },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: token } = await params;
    const subcontractor = await findPortalSubcontractor(token);
    if (!subcontractor) {
      return NextResponse.json(
        { error: "This portal link is invalid or has expired." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        subcontractor: {
          id: subcontractor.id,
          name: subcontractor.contactName,
          company: subcontractor.companyName,
          email: subcontractor.email,
          phone: subcontractor.phone,
          tradeType: subcontractor.tradeType,
          licenseNumber: subcontractor.licenseNumber,
          licenseState: subcontractor.licenseState,
          licenseExpiry: subcontractor.licenseExpiry?.toISOString() || null,
          insuranceProvider: subcontractor.insuranceProvider,
          insuranceExpiry:
            subcontractor.insuranceExpiry?.toISOString() || null,
          insuranceAmount: subcontractor.insuranceAmount,
          insuranceStatus: computeSubcontractorInsuranceStatus(
            subcontractor.insuranceExpiry,
          ),
          complianceStatus: subcontractor.complianceStatus,
          portalExpiresAt: subcontractor.portalExpiresAt?.toISOString(),
          orgName: subcontractor.org.companyName || subcontractor.org.name,
          orgLogoUrl: subcontractor.org.logoUrl,
          documents: subcontractor.documents.map((document) => ({
            ...document,
            createdAt: document.createdAt.toISOString(),
          })),
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Get subcontractor portal error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const updatePortalSchema = z
  .object({
    licenseNumber: z.string().trim().max(150).optional(),
    licenseState: z.string().trim().max(100).optional(),
    licenseExpiry: z
      .string()
      .refine(validDate, "License expiry is invalid")
      .nullable()
      .optional(),
    insuranceProvider: z.string().trim().max(200).optional(),
    insuranceExpiry: z
      .string()
      .refine(validDate, "Insurance expiry is invalid")
      .nullable()
      .optional(),
    insuranceAmount: z.number().finite().min(0).optional(),
    phone: z.string().trim().max(100).optional(),
    contactName: z.string().trim().max(200).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, "No changes supplied");

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: token } = await params;
    const subcontractor = await findPortalSubcontractor(token);
    if (!subcontractor) {
      return NextResponse.json(
        { error: "This portal link is invalid or has expired." },
        { status: 404 },
      );
    }

    const result = updatePortalSchema.safeParse(await request.json());
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
    const updated = await db.$transaction(async (transaction) => {
      const record = await transaction.subcontractor.update({
        where: { id: subcontractor.id },
        data: {
          ...(value.licenseNumber !== undefined
            ? {
                licenseNumber: value.licenseNumber
                  ? sanitizeString(value.licenseNumber)
                  : null,
              }
            : {}),
          ...(value.licenseState !== undefined
            ? {
                licenseState: value.licenseState
                  ? sanitizeString(value.licenseState)
                  : null,
              }
            : {}),
          ...(value.licenseExpiry !== undefined
            ? {
                licenseExpiry: value.licenseExpiry
                  ? new Date(value.licenseExpiry)
                  : null,
              }
            : {}),
          ...(value.insuranceProvider !== undefined
            ? {
                insuranceProvider: value.insuranceProvider
                  ? sanitizeString(value.insuranceProvider)
                  : null,
              }
            : {}),
          ...(value.insuranceExpiry !== undefined
            ? {
                insuranceExpiry: value.insuranceExpiry
                  ? new Date(value.insuranceExpiry)
                  : null,
              }
            : {}),
          ...(value.insuranceAmount !== undefined
            ? { insuranceAmount: value.insuranceAmount }
            : {}),
          ...(value.phone !== undefined
            ? { phone: value.phone ? sanitizeString(value.phone) : null }
            : {}),
          ...(value.contactName !== undefined
            ? {
                contactName: value.contactName
                  ? sanitizeString(value.contactName)
                  : null,
              }
            : {}),
          complianceStatus: "pending",
          lastSubmittedAt: new Date(),
        },
      });

      await transaction.projectSubcontractor.updateMany({
        where: { subcontractorId: subcontractor.id },
        data: { complianceStatus: "pending", lastChecked: new Date() },
      });
      await transaction.auditLog.create({
        data: {
          orgId: subcontractor.orgId,
          userId: null,
          action: "portal_submission",
          entityType: "subcontractor",
          entityId: subcontractor.id,
          entityName: subcontractor.companyName,
          details: JSON.stringify({ updatedFields: Object.keys(value) }),
        },
      });
      return record;
    });

    await refreshSubcontractorProjects(subcontractor.id, subcontractor.orgId);
    return NextResponse.json({
      subcontractor: {
        id: updated.id,
        name: updated.contactName,
        company: updated.companyName,
        email: updated.email,
        phone: updated.phone,
        tradeType: updated.tradeType,
        licenseNumber: updated.licenseNumber,
        licenseState: updated.licenseState,
        licenseExpiry: updated.licenseExpiry?.toISOString() || null,
        insuranceProvider: updated.insuranceProvider,
        insuranceExpiry: updated.insuranceExpiry?.toISOString() || null,
        insuranceAmount: updated.insuranceAmount,
        complianceStatus: updated.complianceStatus,
      },
    });
  } catch (error) {
    console.error("Update subcontractor portal error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
