import { db } from "@/lib/db";

export interface ComplianceAlert {
  id: string;
  type:
    | "expiration"
    | "ce_gap"
    | "insurance_deficiency"
    | "renewal_needed"
    | "compliance_risk";
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
  actionItems: string[];
  relatedItemId?: string;
  relatedItemType?: "license" | "insurance" | "ce";
  dueDate?: string;
}

const severityRank = { critical: 0, warning: 1, info: 2 } as const;

function daysUntil(date: Date, now: Date): number {
  return Math.ceil((date.getTime() - now.getTime()) / 86_400_000);
}

function expirationSeverity(daysRemaining: number): ComplianceAlert["severity"] {
  if (daysRemaining <= 30) return "critical";
  if (daysRemaining <= 60) return "warning";
  return "info";
}

export async function generateOrganizationComplianceAlerts(
  orgId: string,
): Promise<ComplianceAlert[]> {
  const now = new Date();
  const [licenses, insuranceRecords, projects, subcontractorCounts] =
    await Promise.all([
      db.license.findMany({
        where: { orgId },
        include: { ceTrackings: true },
        orderBy: { expirationDate: "asc" },
      }),
      db.insuranceBond.findMany({
        where: { orgId },
        orderBy: { expirationDate: "asc" },
      }),
      db.project.findMany({
        where: { orgId, status: "active", complianceScore: { lt: 80 } },
        select: { id: true, name: true, complianceScore: true, endDate: true },
        orderBy: { complianceScore: "asc" },
        take: 20,
      }),
      db.subcontractor.groupBy({
        by: ["complianceStatus"],
        where: { orgId, status: "active" },
        _count: { _all: true },
      }),
    ]);

  const alerts: ComplianceAlert[] = [];

  for (const license of licenses) {
    const daysRemaining = daysUntil(license.expirationDate, now);
    if (daysRemaining <= 90) {
      const expired = daysRemaining < 0;
      alerts.push({
        id: `${expired ? "expired" : "expiring"}-license-${license.id}`,
        type: expired ? "expiration" : "renewal_needed",
        severity: expirationSeverity(daysRemaining),
        title: expired
          ? `${license.name} has expired`
          : `${license.name} expires in ${daysRemaining} days`,
        description: expired
          ? `The ${license.type} license expired on ${license.expirationDate.toLocaleDateString()}.`
          : `The ${license.type} license expires on ${license.expirationDate.toLocaleDateString()}.`,
        actionItems: expired
          ? [
              "Confirm whether work requiring this license must pause",
              "Contact the issuing board and begin reinstatement or renewal",
              "Record the renewed expiration date when confirmed",
            ]
          : [
              "Review the official renewal requirements",
              "Confirm continuing-education completion",
              "Prepare documents and fees before the deadline",
            ],
        relatedItemId: license.id,
        relatedItemType: "license",
        dueDate: license.expirationDate.toISOString(),
      });
    }

    if (daysRemaining > 0 && daysRemaining <= 90) {
      const completedHours = license.ceTrackings.reduce(
        (total, entry) => total + entry.hoursEarned,
        0,
      );
      const requiredHours = license.ceTrackings.reduce(
        (maximum, entry) => Math.max(maximum, entry.hoursRequired),
        0,
      );
      const remainingHours = Math.max(0, requiredHours - completedHours);
      if (remainingHours > 0) {
        alerts.push({
          id: `ce-gap-${license.id}`,
          type: "ce_gap",
          severity: expirationSeverity(daysRemaining),
          title: `${remainingHours} CE hours remain for ${license.name}`,
          description: `${completedHours} of ${requiredHours} tracked CE hours are complete before the renewal deadline.`,
          actionItems: [
            "Confirm the official CE categories and provider eligibility",
            `Complete and record ${remainingHours} remaining hours`,
            "Upload the completion certificate before renewal submission",
          ],
          relatedItemId: license.id,
          relatedItemType: "ce",
          dueDate: license.expirationDate.toISOString(),
        });
      }
    }
  }

  for (const record of insuranceRecords) {
    const daysRemaining = daysUntil(record.expirationDate, now);
    const complianceIssue = record.complianceStatus !== "compliant";
    if (daysRemaining <= 90 || complianceIssue) {
      const expired = daysRemaining < 0;
      const severity: ComplianceAlert["severity"] =
        expired || record.complianceStatus === "deficient"
          ? "critical"
          : expirationSeverity(daysRemaining);
      alerts.push({
        id: `insurance-${record.id}-${record.complianceStatus}`,
        type: "insurance_deficiency",
        severity,
        title: expired
          ? `${record.name} has expired`
          : complianceIssue
            ? `${record.name} needs compliance review`
            : `${record.name} expires in ${daysRemaining} days`,
        description: `Provider: ${record.provider}. Current compliance status: ${record.complianceStatus}.`,
        actionItems: [
          "Compare current limits and endorsements with requirements",
          "Contact the provider for renewal or correction",
          "Upload and verify the replacement certificate",
        ],
        relatedItemId: record.id,
        relatedItemType: "insurance",
        dueDate: record.expirationDate.toISOString(),
      });
    }
  }

  for (const project of projects) {
    alerts.push({
      id: `project-risk-${project.id}`,
      type: "compliance_risk",
      severity: project.complianceScore < 50 ? "critical" : "warning",
      title: `${project.name} compliance is ${Math.round(project.complianceScore)}%`,
      description:
        "Required licenses or subcontractor compliance items need review for this active project.",
      actionItems: [
        "Open the project compliance view",
        "Resolve expired or unverified required licenses",
        "Review subcontractors marked pending or non-compliant",
      ],
      dueDate: project.endDate?.toISOString(),
    });
  }

  const nonCompliantSubcontractors = subcontractorCounts.find(
    (group) => group.complianceStatus === "non_compliant",
  )?._count._all;
  const pendingSubcontractors = subcontractorCounts.find(
    (group) => group.complianceStatus === "pending",
  )?._count._all;
  if ((nonCompliantSubcontractors || 0) > 0 || (pendingSubcontractors || 0) > 0) {
    alerts.push({
      id: "subcontractor-compliance-summary",
      type: "compliance_risk",
      severity: (nonCompliantSubcontractors || 0) > 0 ? "warning" : "info",
      title: "Subcontractor compliance needs attention",
      description: `${nonCompliantSubcontractors || 0} non-compliant and ${pendingSubcontractors || 0} pending subcontractors are active.`,
      actionItems: [
        "Review rejected or missing documents",
        "Request updated license and insurance records",
        "Recheck linked project compliance after approval",
      ],
    });
  }

  return alerts
    .sort((left, right) => {
      const severityDifference =
        severityRank[left.severity] - severityRank[right.severity];
      if (severityDifference !== 0) return severityDifference;
      if (left.dueDate && right.dueDate) {
        return new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime();
      }
      if (left.dueDate) return -1;
      if (right.dueDate) return 1;
      return left.title.localeCompare(right.title);
    })
    .slice(0, 100);
}
