import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { sanitizeString } from "@/lib/sanitize";
import { canManageOrganization, getOrgContext } from "@/lib/org-context";
import { refreshProjectCompliance } from "@/lib/project-compliance";

const updateLinkSchema = z
  .object({
    role: z.string().trim().max(200).nullable().optional(),
    complianceStatus: z
      .enum(["pending", "compliant", "non_compliant", "review"])
      .optional(),
  })
  .refine((value) => Object.keys(value).length > 0, "No changes supplied");

async function getProjectAndLink(
  projectId: string,
  subcontractorId: string,
  orgId: string,
) {
  const project = await db.project.findFirst({
    where: { id: projectId, orgId },
    select: { id: true, name: true },
  });
  if (!project) return null;

  const link = await db.projectSubcontractor.findUnique({
    where: { projectId_subcontractorId: { projectId, subcontractorId } },
    include: { subcontractor: { select: { companyName: true } } },
  });
  if (!link) return null;
  return { project, link };
}

export async function PATCH(
  request: Request,
  {
    params,
  }: { params: Promise<{ id: string; subcontractorId: string }> },
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
            "Only organization owners and admins can update project subcontractors.",
        },
        { status: 403 },
      );
    }

    const { id: projectId, subcontractorId } = await params;
    const scoped = await getProjectAndLink(
      projectId,
      subcontractorId,
      context.orgId,
    );
    if (!scoped) {
      return NextResponse.json(
        { error: "Project subcontractor link not found" },
        { status: 404 },
      );
    }

    const result = updateLinkSchema.safeParse(await request.json());
    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error.issues[0]?.message || "Validation failed",
          details: result.error.flatten(),
        },
        { status: 400 },
      );
    }

    const updatedLink = await db.$transaction(async (transaction) => {
      const updated = await transaction.projectSubcontractor.update({
        where: { id: scoped.link.id },
        data: {
          ...(result.data.role !== undefined
            ? {
                role: result.data.role
                  ? sanitizeString(result.data.role)
                  : null,
              }
            : {}),
          ...(result.data.complianceStatus !== undefined
            ? {
                complianceStatus: result.data.complianceStatus,
                lastChecked: new Date(),
              }
            : {}),
        },
      });
      await transaction.auditLog.create({
        data: {
          orgId: context.orgId,
          userId: context.userId,
          action: "update_project_subcontractor",
          entityType: "project",
          entityId: scoped.project.id,
          entityName: scoped.project.name,
          details: JSON.stringify({
            subcontractorId,
            companyName: scoped.link.subcontractor.companyName,
            updatedFields: Object.keys(result.data),
          }),
        },
      });
      return updated;
    });

    const compliance = await refreshProjectCompliance(projectId, context.orgId);
    return NextResponse.json({ projectSubcontractor: updatedLink, compliance });
  } catch (error) {
    console.error("Update project subcontractor error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  {
    params,
  }: { params: Promise<{ id: string; subcontractorId: string }> },
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
            "Only organization owners and admins can remove project subcontractors.",
        },
        { status: 403 },
      );
    }

    const { id: projectId, subcontractorId } = await params;
    const scoped = await getProjectAndLink(
      projectId,
      subcontractorId,
      context.orgId,
    );
    if (!scoped) {
      return NextResponse.json(
        { error: "Project subcontractor link not found" },
        { status: 404 },
      );
    }

    await db.$transaction(async (transaction) => {
      await transaction.auditLog.create({
        data: {
          orgId: context.orgId,
          userId: context.userId,
          action: "remove_project_subcontractor",
          entityType: "project",
          entityId: scoped.project.id,
          entityName: scoped.project.name,
          details: JSON.stringify({
            subcontractorId,
            companyName: scoped.link.subcontractor.companyName,
          }),
        },
      });
      await transaction.projectSubcontractor.delete({
        where: { id: scoped.link.id },
      });
    });

    const compliance = await refreshProjectCompliance(projectId, context.orgId);
    return NextResponse.json({ success: true, compliance });
  } catch (error) {
    console.error("Unlink subcontractor error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
