import { db } from "@/lib/db";
import { refreshProjectCompliance } from "@/lib/project-compliance";

export type SubcontractorComplianceStatus =
  | "compliant"
  | "pending"
  | "non_compliant";

export function computeSubcontractorCompliance(input: {
  licenseExpiry: Date | null;
  insuranceExpiry: Date | null;
  status?: string;
}): SubcontractorComplianceStatus {
  if (input.status && input.status !== "active") return "non_compliant";
  if (!input.licenseExpiry || !input.insuranceExpiry) return "pending";

  const now = new Date();
  const warningDate = new Date(now);
  warningDate.setDate(warningDate.getDate() + 30);

  if (input.licenseExpiry < now || input.insuranceExpiry < now) {
    return "non_compliant";
  }
  if (
    input.licenseExpiry <= warningDate ||
    input.insuranceExpiry <= warningDate
  ) {
    return "pending";
  }
  return "compliant";
}

export function computeSubcontractorInsuranceStatus(
  insuranceExpiry: Date | null,
): "unknown" | "expired" | "expiring" | "active" {
  if (!insuranceExpiry) return "unknown";
  const now = new Date();
  const warningDate = new Date(now);
  warningDate.setDate(warningDate.getDate() + 30);
  if (insuranceExpiry < now) return "expired";
  if (insuranceExpiry <= warningDate) return "expiring";
  return "active";
}

export async function refreshSubcontractorProjects(
  subcontractorId: string,
  orgId: string,
): Promise<void> {
  const links = await db.projectSubcontractor.findMany({
    where: {
      subcontractorId,
      project: { orgId },
    },
    select: { projectId: true },
  });

  await Promise.all(
    links.map((link) => refreshProjectCompliance(link.projectId, orgId)),
  );
}
