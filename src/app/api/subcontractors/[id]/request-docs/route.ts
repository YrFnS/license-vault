import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { sendSubcontractorPortalInvite } from "@/lib/email";
import { canManageOrganization, getOrgContext } from "@/lib/org-context";

const PORTAL_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

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
        { error: "Only organization owners and admins can request documents." },
        { status: 403 },
      );
    }

    const { id } = await params;
    const subcontractor = await db.subcontractor.findFirst({
      where: { id, orgId: context.orgId },
      select: {
        id: true,
        companyName: true,
        email: true,
        status: true,
      },
    });
    if (!subcontractor) {
      return NextResponse.json(
        { error: "Subcontractor not found" },
        { status: 404 },
      );
    }
    if (!subcontractor.email) {
      return NextResponse.json(
        { error: "Add a valid subcontractor email before requesting documents." },
        { status: 400 },
      );
    }
    if (subcontractor.status !== "active") {
      return NextResponse.json(
        { error: "Document requests can only be sent to active subcontractors." },
        { status: 400 },
      );
    }

    const portalToken = crypto.randomBytes(32).toString("base64url");
    const portalExpiresAt = new Date(Date.now() + PORTAL_LIFETIME_MS);

    await db.$transaction(async (transaction) => {
      await transaction.subcontractor.update({
        where: { id: subcontractor.id },
        data: {
          portalToken,
          portalExpiresAt,
          complianceStatus: "pending",
        },
      });
      await transaction.projectSubcontractor.updateMany({
        where: { subcontractorId: subcontractor.id },
        data: { complianceStatus: "pending", lastChecked: new Date() },
      });
      await transaction.auditLog.create({
        data: {
          orgId: context.orgId,
          userId: context.userId,
          action: "request_docs",
          entityType: "subcontractor",
          entityId: subcontractor.id,
          entityName: subcontractor.companyName,
          details: JSON.stringify({
            recipient: subcontractor.email,
            expiresAt: portalExpiresAt.toISOString(),
          }),
        },
      });
    });

    const appUrl =
      process.env.NEXTAUTH_URL ||
      process.env.APP_URL ||
      new URL(request.url).origin;
    const portalUrl = `${appUrl}/en/subcontractor-upload?token=${encodeURIComponent(portalToken)}`;

    sendSubcontractorPortalInvite(
      subcontractor.email,
      {
        orgName: context.orgName,
        portalUrl,
        companyName: subcontractor.companyName,
      },
      context.orgId,
    ).catch((error) =>
      console.error("Failed to send subcontractor portal invite email:", error),
    );

    return NextResponse.json({
      success: true,
      portalUrl,
      expiresAt: portalExpiresAt.toISOString(),
    });
  } catch (error) {
    console.error("Request docs error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
