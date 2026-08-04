import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { sanitizeString } from "@/lib/sanitize";
import { canManageOrganization, getOrgContext } from "@/lib/org-context";
import { refreshProjectCompliance } from "@/lib/project-compliance";

const linkLicenseSchema = z.object({
  licenseId: z.string().trim().min(1, "License ID is required").max(200),
  required: z.boolean().default(true),
  notes: z.string().trim().max(2_000).optional(),
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
        { error: "Only organization owners and admins can assign project licenses." },
        { status: 403 },
      );
    }

    const { id: projectId } = await params;
    const result = linkLicenseSchema.safeParse(await request.json());
    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error.issues[0]?.message || "Validation failed",
          details: result.error.flatten(),
        },
        { status: 400 },
      );
    }

    const [project, license] = await Promise.all([
      db.project.findFirst({
        where: { id: projectId, orgId: context.orgId },
        select: { id: true, name: true },
      }),
      db.license.findFirst({
        where: { id: result.data.licenseId, orgId: context.orgId },
        select: { id: true, name: true, licenseNumber: true },
      }),
    ]);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (!license) {
      return NextResponse.json({ error: "License not found" }, { status: 404 });
    }

    const existing = await db.projectLicense.findUnique({
      where: {
        projectId_licenseId: {
          projectId,
          licenseId: license.id,
        },
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: "License is already assigned to this project." },
        { status: 409 },
      );
    }

    const projectLicense = await db.$transaction(async (transaction) => {
      const link = await transaction.projectLicense.create({
        data: {
          projectId,
          licenseId: license.id,
          required: result.data.required,
          notes: result.data.notes ? sanitizeString(result.data.notes) : null,
        },
      });
      await transaction.auditLog.create({
        data: {
          orgId: context.orgId,
          userId: context.userId,
          action: "assign_license",
          entityType: "project",
          entityId: project.id,
          entityName: project.name,
          details: JSON.stringify({
            licenseId: license.id,
            licenseNumber: license.licenseNumber,
            required: link.required,
          }),
        },
      });
      return link;
    });

    const compliance = await refreshProjectCompliance(projectId, context.orgId);
    return NextResponse.json(
      {
        projectLicense,
        complianceScore: compliance?.score ?? 100,
        compliance,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Link license error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
