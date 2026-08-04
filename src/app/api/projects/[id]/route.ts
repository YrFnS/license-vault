import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { sanitizeString } from "@/lib/sanitize";
import { canManageOrganization, getOrgContext } from "@/lib/org-context";
import { calculateProjectCompliance } from "@/lib/project-compliance";

const PROJECT_STATUSES = ["active", "completed", "on_hold"] as const;

function validDate(value: string): boolean {
  return Number.isFinite(new Date(value).getTime());
}

async function findProject(id: string, orgId: string, includeRelations = false) {
  return db.project.findFirst({
    where: { id, orgId },
    ...(includeRelations
      ? {
          include: {
            projectLicenses: {
              include: { license: true },
            },
            projectSubs: {
              include: { subcontractor: true },
            },
          },
        }
      : {}),
  });
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
    const project = await db.project.findFirst({
      where: { id, orgId: context.orgId },
      include: {
        projectLicenses: { include: { license: true } },
        projectSubs: { include: { subcontractor: true } },
      },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const compliance = calculateProjectCompliance({
      projectLicenses: project.projectLicenses,
      projectSubs: project.projectSubs,
    });

    return NextResponse.json(
      {
        project: {
          ...project,
          complianceScore: compliance.score,
          complianceConfigured: compliance.configured,
          itemsNeedingAction: compliance.itemsNeedingAction,
          requiredItems: compliance.requiredItems,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Get project error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const updateProjectSchema = z
  .object({
    name: z.string().trim().min(1, "Project name is required").max(200).optional(),
    description: z.string().trim().max(5_000).nullable().optional(),
    clientName: z.string().trim().max(200).nullable().optional(),
    clientEmail: z
      .string()
      .trim()
      .email()
      .max(320)
      .or(z.literal(""))
      .nullable()
      .optional(),
    location: z.string().trim().max(500).nullable().optional(),
    state: z.string().trim().max(100).nullable().optional(),
    startDate: z
      .string()
      .refine(validDate, "Start date is invalid")
      .nullable()
      .optional(),
    endDate: z
      .string()
      .refine(validDate, "End date is invalid")
      .nullable()
      .optional(),
    status: z.enum(PROJECT_STATUSES).optional(),
    requiredLicenses: z.string().max(20_000).nullable().optional(),
    requiredInsurance: z.string().max(20_000).nullable().optional(),
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
        { error: "Only organization owners and admins can update projects." },
        { status: 403 },
      );
    }

    const { id } = await params;
    const existing = await findProject(id, context.orgId);
    if (!existing) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const result = updateProjectSchema.safeParse(await request.json());
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
    const startDate =
      value.startDate === undefined
        ? existing.startDate
        : value.startDate
          ? new Date(value.startDate)
          : null;
    const endDate =
      value.endDate === undefined
        ? existing.endDate
        : value.endDate
          ? new Date(value.endDate)
          : null;
    if (startDate && endDate && endDate < startDate) {
      return NextResponse.json(
        { error: "End date must be on or after the start date." },
        { status: 400 },
      );
    }

    const updateData: Prisma.ProjectUncheckedUpdateInput = {
      ...(value.name !== undefined ? { name: sanitizeString(value.name) } : {}),
      ...(value.description !== undefined
        ? {
            description: value.description
              ? sanitizeString(value.description)
              : null,
          }
        : {}),
      ...(value.clientName !== undefined
        ? { clientName: value.clientName ? sanitizeString(value.clientName) : null }
        : {}),
      ...(value.clientEmail !== undefined
        ? { clientEmail: value.clientEmail?.toLowerCase() || null }
        : {}),
      ...(value.location !== undefined
        ? { location: value.location ? sanitizeString(value.location) : null }
        : {}),
      ...(value.state !== undefined
        ? { state: value.state ? sanitizeString(value.state) : null }
        : {}),
      ...(value.startDate !== undefined ? { startDate } : {}),
      ...(value.endDate !== undefined ? { endDate } : {}),
      ...(value.status !== undefined ? { status: value.status } : {}),
      ...(value.requiredLicenses !== undefined
        ? {
            requiredLicenses: value.requiredLicenses
              ? sanitizeString(value.requiredLicenses)
              : null,
          }
        : {}),
      ...(value.requiredInsurance !== undefined
        ? {
            requiredInsurance: value.requiredInsurance
              ? sanitizeString(value.requiredInsurance)
              : null,
          }
        : {}),
    };

    const project = await db.$transaction(async (transaction) => {
      const updated = await transaction.project.update({
        where: { id: existing.id },
        data: updateData,
      });
      await transaction.auditLog.create({
        data: {
          orgId: context.orgId,
          userId: context.userId,
          action: "update",
          entityType: "project",
          entityId: updated.id,
          entityName: updated.name,
          details: JSON.stringify({ updatedFields: Object.keys(value) }),
        },
      });
      return updated;
    });

    return NextResponse.json({ project });
  } catch (error) {
    console.error("Update project error:", error);
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
        { error: "Only organization owners and admins can delete projects." },
        { status: 403 },
      );
    }

    const { id } = await params;
    const existing = await findProject(id, context.orgId);
    if (!existing) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    await db.$transaction(async (transaction) => {
      await transaction.auditLog.create({
        data: {
          orgId: context.orgId,
          userId: context.userId,
          action: "delete",
          entityType: "project",
          entityId: existing.id,
          entityName: existing.name,
          details: JSON.stringify({ status: existing.status }),
        },
      });
      await transaction.project.delete({ where: { id: existing.id } });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete project error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
