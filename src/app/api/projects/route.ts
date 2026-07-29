import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { sanitizeString } from "@/lib/sanitize";
import { canManageOrganization, getOrgContext } from "@/lib/org-context";
import { calculateProjectCompliance } from "@/lib/project-compliance";

const PROJECT_STATUSES = ["active", "completed", "on_hold"] as const;

function parsePositiveInt(value: string | null, fallback: number, max: number): number {
  const parsed = Number.parseInt(value || "", 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
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
    const page = parsePositiveInt(searchParams.get("page"), 1, 1_000_000);
    const limit = parsePositiveInt(searchParams.get("limit"), 20, 100);
    const statusFilter = searchParams.get("status");
    const search = searchParams.get("search")?.trim();

    const where: Prisma.ProjectWhereInput = { orgId: context.orgId };
    if (
      statusFilter &&
      (PROJECT_STATUSES as readonly string[]).includes(statusFilter)
    ) {
      where.status = statusFilter;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { clientName: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, projects, countAll, countActive, countCompleted, countOnHold, average, atRiskCount] =
      await Promise.all([
        db.project.count({ where }),
        db.project.findMany({
          where,
          orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
          skip: (page - 1) * limit,
          take: limit,
          include: {
            projectLicenses: {
              include: {
                license: { select: { expirationDate: true } },
              },
            },
            projectSubs: {
              include: {
                subcontractor: {
                  select: {
                    status: true,
                    complianceStatus: true,
                    licenseExpiry: true,
                    insuranceExpiry: true,
                  },
                },
              },
            },
          },
        }),
        db.project.count({ where: { orgId: context.orgId } }),
        db.project.count({ where: { orgId: context.orgId, status: "active" } }),
        db.project.count({ where: { orgId: context.orgId, status: "completed" } }),
        db.project.count({ where: { orgId: context.orgId, status: "on_hold" } }),
        db.project.aggregate({
          where: { orgId: context.orgId },
          _avg: { complianceScore: true },
        }),
        db.project.count({
          where: { orgId: context.orgId, complianceScore: { lt: 80 } },
        }),
      ]);

    const projectsWithScore = projects.map((project) => {
      const compliance = calculateProjectCompliance({
        projectLicenses: project.projectLicenses,
        projectSubs: project.projectSubs,
      });
      return {
        ...project,
        complianceScore: compliance.score,
        complianceConfigured: compliance.configured,
        itemsNeedingAction: compliance.itemsNeedingAction,
        licenseCount: project.projectLicenses.length,
        subcontractorCount: project.projectSubs.length,
      };
    });

    return NextResponse.json(
      {
        projects: projectsWithScore,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        counts: {
          all: countAll,
          active: countActive,
          completed: countCompleted,
          on_hold: countOnHold,
        },
        stats: {
          avgCompliance: Math.round(average._avg.complianceScore ?? 100),
          atRiskCount,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Get projects error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const createProjectSchema = z
  .object({
    name: z.string().trim().min(1, "Project name is required").max(200),
    description: z.string().trim().max(5_000).optional(),
    clientName: z.string().trim().max(200).optional(),
    clientEmail: z.string().trim().email().max(320).or(z.literal("")).optional(),
    location: z.string().trim().max(500).optional(),
    state: z.string().trim().max(100).optional(),
    startDate: z.string().refine(validDate, "Start date is invalid").optional(),
    endDate: z.string().refine(validDate, "End date is invalid").optional(),
    status: z.enum(PROJECT_STATUSES).default("active"),
    requiredLicenses: z.string().max(20_000).optional(),
    requiredInsurance: z.string().max(20_000).optional(),
  })
  .superRefine((value, context) => {
    if (
      value.startDate &&
      value.endDate &&
      new Date(value.endDate) < new Date(value.startDate)
    ) {
      context.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "End date must be on or after the start date",
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
        { error: "Only organization owners and admins can create projects." },
        { status: 403 },
      );
    }

    const result = createProjectSchema.safeParse(await request.json());
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
    const project = await db.$transaction(async (transaction) => {
      const created = await transaction.project.create({
        data: {
          orgId: context.orgId,
          name: sanitizeString(value.name),
          description: value.description
            ? sanitizeString(value.description)
            : null,
          clientName: value.clientName ? sanitizeString(value.clientName) : null,
          clientEmail: value.clientEmail?.toLowerCase() || null,
          location: value.location ? sanitizeString(value.location) : null,
          state: value.state ? sanitizeString(value.state) : null,
          startDate: value.startDate ? new Date(value.startDate) : null,
          endDate: value.endDate ? new Date(value.endDate) : null,
          status: value.status,
          requiredLicenses: value.requiredLicenses
            ? sanitizeString(value.requiredLicenses)
            : null,
          requiredInsurance: value.requiredInsurance
            ? sanitizeString(value.requiredInsurance)
            : null,
          complianceScore: 100,
        },
      });
      await transaction.auditLog.create({
        data: {
          orgId: context.orgId,
          userId: context.userId,
          action: "create",
          entityType: "project",
          entityId: created.id,
          entityName: created.name,
          details: JSON.stringify({ status: created.status }),
        },
      });
      return created;
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error("Create project error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
