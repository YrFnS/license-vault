import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { sanitizeString } from "@/lib/sanitize";
import { canManageOrganization, getOrgContext } from "@/lib/org-context";
import { refreshProjectCompliance } from "@/lib/project-compliance";

const updateLinkSchema = z
  .object({
    required: z.boolean().optional(),
    verified: z.boolean().optional(),
    notes: z.string().trim().max(2_000).nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, "No changes supplied");

async function getProjectAndLink(
  projectId: string,
  licenseId: string,
  orgId: string,
) {
  const project = await db.project.findFirst({
    where: { id: projectId, orgId },
    select: { id: true, name: true },
  });
  if (!project) return null;

  const link = await db.projectLicense.findUnique({
    where: { projectId_licenseId: { projectId, licenseId } },
    include: {
      license: { select: { name: true, licenseNumber: true } },
    },
  });
  if (!link) return null;
  return { project, link };
}

export async function PATCH(
  request: Request,
  {
    params,
  }: { params: Promise<{ id: string; licenseId: string }> },
) {
  try {
    const context = await getOrgContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!canManageOrganization(context.role)) {
      return NextResponse.json(
        { error: "Only organization owners and admins can update project licenses." },
        { status: 403 },
      );
    }

    const { id: projectId, licenseId } = await params;
    const scoped = await getProjectAndLink(projectId, licenseId, context.orgId);
    if (!scoped) {
      return NextResponse.json({ error: "Project license link not found" }, { status: 404 });
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
      const updated = await transaction.projectLicense.update({
        where: { id: scoped.link.id },
        data: {
          ...(result.data.required !== undefined
            ? { required: result.data.required }
            : {}),
          ...(result.data.verified !== undefined
            ? {
                verified: result.data.verified,
                verifiedAt: result.data.verified ? new Date() : null,
              }
            : {}),
          ...(result.data.notes !== undefined
            ? {
                notes: result.data.notes
                  ? sanitizeString(result.data.notes)
                  : null,
              }
            : {}),
        },
      });
      await transaction.auditLog.create({
        data: {
          orgId: context.orgId,
          userId: context.userId,
          action: "update_project_license",
          entityType: "project",
          entityId: scoped.project.id,
          entityName: scoped.project.name,
          details: JSON.stringify({
            licenseId,
            licenseNumber: scoped.link.license.licenseNumber,
            updatedFields: Object.keys(result.data),
          }),
        },
      });
      return updated;
    });

    const compliance = await refreshProjectCompliance(projectId, context.orgId);
    return NextResponse.json({ projectLicense: updatedLink, compliance });
  } catch (error) {
    console.error("Update project license error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  {
    params,
  }: { params: Promise<{ id: string; licenseId: string }> },
) {
  try {
    const context = await getOrgContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!canManageOrganization(context.role)) {
      return NextResponse.json(
        { error: "Only organization owners and admins can remove project licenses." },
        { status: 403 },
      );
    }

    const { id: projectId, licenseId } = await params;
    const scoped = await getProjectAndLink(projectId, licenseId, context.orgId);
    if (!scoped) {
      return NextResponse.json({ error: "Project license link not found" }, { status: 404 });
    }

    await db.$transaction(async (transaction) => {
      await transaction.auditLog.create({
        data: {
          orgId: context.orgId,
          userId: context.userId,
          action: "remove_project_license",
          entityType: "project",
          entityId: scoped.project.id,
          entityName: scoped.project.name,
          details: JSON.stringify({
            licenseId,
            licenseNumber: scoped.link.license.licenseNumber,
          }),
        },
      });
      await transaction.projectLicense.delete({ where: { id: scoped.link.id } });
    });

    const compliance = await refreshProjectCompliance(projectId, context.orgId);
    return NextResponse.json({ success: true, compliance });
  } catch (error) {
    console.error("Unlink license error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
