import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOrgContext } from "@/lib/org-context";
import { calculateProjectCompliance } from "@/lib/project-compliance";

function licenseStatus(expirationDate: Date, now: Date, warningDate: Date) {
  if (expirationDate < now) return "expired";
  if (expirationDate <= warningDate) return "expiring_soon";
  return "compliant";
}

function subcontractorStatus(input: {
  projectStatus: string;
  status: string;
  complianceStatus: string;
  licenseExpiry: Date | null;
  insuranceExpiry: Date | null;
}, now: Date) {
  if (input.status !== "active") return "inactive";
  if (input.licenseExpiry && input.licenseExpiry < now) return "license_expired";
  if (input.insuranceExpiry && input.insuranceExpiry < now) {
    return "insurance_expired";
  }
  return input.projectStatus !== "pending"
    ? input.projectStatus
    : input.complianceStatus;
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

    const now = new Date();
    const thirtyDaysFromNow = new Date(now);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const licenses = project.projectLicenses.map((link) => ({
      id: link.id,
      licenseId: link.licenseId,
      licenseName: link.license.name,
      licenseType: link.license.type,
      licenseNumber: link.license.licenseNumber,
      expirationDate: link.license.expirationDate,
      status: licenseStatus(
        link.license.expirationDate,
        now,
        thirtyDaysFromNow,
      ),
      required: link.required,
      verified: link.verified,
      verifiedAt: link.verifiedAt,
      notes: link.notes,
    }));

    const subcontractors = project.projectSubs.map((link) => ({
      id: link.id,
      subcontractorId: link.subcontractorId,
      companyName: link.subcontractor.companyName,
      complianceStatus: subcontractorStatus(
        {
          projectStatus: link.complianceStatus,
          status: link.subcontractor.status,
          complianceStatus: link.subcontractor.complianceStatus,
          licenseExpiry: link.subcontractor.licenseExpiry,
          insuranceExpiry: link.subcontractor.insuranceExpiry,
        },
        now,
      ),
      role: link.role,
      lastChecked: link.lastChecked,
      licenseExpiry: link.subcontractor.licenseExpiry,
      insuranceExpiry: link.subcontractor.insuranceExpiry,
      insuranceStatus: link.subcontractor.insuranceStatus,
    }));

    const compliance = calculateProjectCompliance({
      projectLicenses: project.projectLicenses,
      projectSubs: project.projectSubs,
    });

    return NextResponse.json(
      {
        projectId: project.id,
        projectName: project.name,
        complianceScore: compliance.score,
        complianceConfigured: compliance.configured,
        atRisk: compliance.atRisk,
        requiredItems: compliance.requiredItems,
        itemsNeedingAction: compliance.itemsNeedingAction,
        licenseCompliance: {
          total: licenses.length,
          required: licenses.filter((license) => license.required).length,
          compliant: licenses.filter(
            (license) => license.status === "compliant" && license.verified,
          ).length,
          expiring: licenses.filter(
            (license) => license.status === "expiring_soon",
          ).length,
          expired: licenses.filter((license) => license.status === "expired").length,
          unverified: licenses.filter(
            (license) => license.required && !license.verified,
          ).length,
          licenses,
        },
        subcontractorCompliance: {
          total: subcontractors.length,
          compliant: subcontractors.filter((sub) =>
            ["compliant", "approved", "active"].includes(
              sub.complianceStatus,
            ),
          ).length,
          pending: subcontractors.filter((sub) =>
            ["pending", "review", "unknown"].includes(
              sub.complianceStatus,
            ),
          ).length,
          nonCompliant: subcontractors.filter(
            (sub) =>
              ![
                "compliant",
                "approved",
                "active",
                "pending",
                "review",
                "unknown",
              ].includes(sub.complianceStatus),
          ).length,
          subcontractors,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Get project compliance error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
