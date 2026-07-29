import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateOrgComplianceReport } from "@/lib/pdf-report";
import { canManageOrganization, getOrgContext } from "@/lib/org-context";

function getStatus(expirationDate: Date, now: Date): string {
  const daysRemaining = Math.ceil(
    (expirationDate.getTime() - now.getTime()) / 86_400_000,
  );
  if (daysRemaining < 0) return "expired";
  if (daysRemaining <= 60) return "expiring_soon";
  return "active";
}

function safeFileName(value: string): string {
  return (
    value
      .normalize("NFKD")
      .replace(/[^a-zA-Z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80)
      .toLowerCase() || "organization"
  );
}

export async function GET() {
  try {
    const context = await getOrgContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!canManageOrganization(context.role)) {
      return NextResponse.json(
        { error: "Only organization owners and admins can export this report." },
        { status: 403 },
      );
    }

    const [organization, licenses, insurance, ceRecords, teamMembers] =
      await Promise.all([
        db.organization.findUnique({
          where: { id: context.orgId },
          select: {
            id: true,
            name: true,
            companyName: true,
            tradeType: true,
            primaryState: true,
          },
        }),
        db.license.findMany({
          where: { orgId: context.orgId },
          orderBy: { expirationDate: "asc" },
        }),
        db.insuranceBond.findMany({
          where: { orgId: context.orgId },
          orderBy: { expirationDate: "asc" },
        }),
        db.cETracking.findMany({
          where: { orgId: context.orgId },
          orderBy: { completionDate: "desc" },
        }),
        db.orgMember.findMany({
          where: { orgId: context.orgId, joinedAt: { not: null } },
          orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
          include: {
            user: { select: { name: true, email: true } },
          },
        }),
      ]);

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 },
      );
    }

    const now = new Date();
    const licensesWithStatus = licenses.map((license) => ({
      ...license,
      status: getStatus(license.expirationDate, now),
    }));
    const insuranceWithStatus = insurance.map((record) => ({
      ...record,
      status: getStatus(record.expirationDate, now),
    }));

    const totalItems = licensesWithStatus.length + insuranceWithStatus.length;
    const currentItems =
      licensesWithStatus.filter((item) => item.status !== "expired").length +
      insuranceWithStatus.filter((item) => item.status !== "expired").length;
    const complianceScore =
      totalItems > 0 ? Math.round((currentItems / totalItems) * 100) : 100;
    const organizationName = organization.companyName || organization.name;

    const pdfBuffer = generateOrgComplianceReport({
      org: {
        name: organizationName,
        tradeType: organization.tradeType,
        primaryState: organization.primaryState,
      },
      licenses: licensesWithStatus.map((license) => ({
        id: license.id,
        name: license.name,
        type: license.type,
        licenseNumber: license.licenseNumber,
        issuedBy: license.issuedBy,
        expirationDate: license.expirationDate,
        status: license.status,
      })),
      insurance: insuranceWithStatus.map((record) => ({
        name: record.name,
        type: record.type,
        provider: record.provider,
        expirationDate: record.expirationDate,
        status: record.status,
      })),
      ceRecords: ceRecords.map((record) => ({
        courseName: record.courseName,
        hoursEarned: record.hoursEarned,
        hoursRequired: record.hoursRequired,
      })),
      users: teamMembers.map((member) => ({
        name: member.user?.name || member.fullName || member.email,
        email: member.user?.email || member.email,
        role: member.role,
      })),
      complianceScore,
    });

    await db.auditLog.create({
      data: {
        orgId: context.orgId,
        userId: context.userId,
        action: "generate_report",
        entityType: "organization",
        entityId: context.orgId,
        entityName: organizationName,
        details: JSON.stringify({
          format: "pdf",
          reportType: "organization_compliance",
          licenseCount: licenses.length,
          insuranceCount: insurance.length,
        }),
      },
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="org-compliance-report-${safeFileName(organizationName)}.pdf"`,
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Org report generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate organization report" },
      { status: 500 },
    );
  }
}
