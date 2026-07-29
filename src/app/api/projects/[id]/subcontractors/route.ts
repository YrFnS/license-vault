import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { sanitizeString } from "@/lib/sanitize";
import { canManageOrganization, getOrgContext } from "@/lib/org-context";
import { refreshProjectCompliance } from "@/lib/project-compliance";

const linkSubcontractorSchema = z.object({
  subcontractorId: z
    .string()
    .trim()
    .min(1, "Subcontractor ID is required")
    .max(200),
  role: z.string().trim().max(200).optional(),
});

export async function POST(
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
        {
          error:
            "Only organization owners and admins can assign subcontractors.",
        },
        { status: 403 },
      );
    }

    const { id: projectId } = await params;
    const result = linkSubcontractorSchema.safeParse(await request.json());
    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error.issues[0]?.message || "Validation failed",
          details: result.error.flatten(),
        },
        { status: 400 },
      );
    }

    const [project, subcontractor] = await Promise.all([
      db.project.findFirst({
        where: { id: projectId, orgId: context.orgId },
        select: { id: true, name: true },
      }),
      db.subcontractor.findFirst({
        where: {
          id: result.data.subcontractorId,
          orgId: context.orgId,
        },
        select: {
          id: true,
          companyName: true,
          complianceStatus: true,
        },
      }),
    ]);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (!subcontractor) {
      return NextResponse.json(
        { error: "Subcontractor not found" },
        { status: 404 },
      );
    }

    const existing = await db.projectSubcontractor.findUnique({
      where: {
        projectId_subcontractorId: {
          projectId,
          subcontractorId: subcontractor.id,
        },
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Subcontractor is already assigned to this project." },
        { status: 409 },
      );
    }

    const projectSubcontractor = await db.$transaction(async (transaction) => {
      const link = await transaction.projectSubcontractor.create({
        data: {
          projectId,
          subcontractorId: subcontractor.id,
          role: result.data.role ? sanitizeString(result.data.role) : null,
          complianceStatus: subcontractor.complianceStatus,
          lastChecked: new Date(),
        },
      });
      await transaction.auditLog.create({
        data: {
          orgId: context.orgId,
          userId: context.userId,
          action: "assign_subcontractor",
          entityType: "project",
          entityId: project.id,
          entityName: project.name,
          details: JSON.stringify({
            subcontractorId: subcontractor.id,
            companyName: subcontractor.companyName,
            role: link.role,
          }),
        },
      });
      return link;
    });

    const compliance = await refreshProjectCompliance(projectId, context.orgId);
    return NextResponse.json(
      { projectSubcontractor, projectSub: projectSubcontractor, compliance },
      { status: 201 },
    );
  } catch (error) {
    console.error("Link subcontractor error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
