import { db } from "@/lib/db";

interface ProjectLicenseComplianceInput {
  required: boolean;
  verified: boolean;
  license: {
    expirationDate: Date;
  };
}

interface ProjectSubcontractorComplianceInput {
  complianceStatus: string;
  subcontractor: {
    status: string;
    complianceStatus: string;
    licenseExpiry: Date | null;
    insuranceExpiry: Date | null;
  };
}

export interface ProjectComplianceResult {
  score: number;
  configured: boolean;
  atRisk: boolean;
  requiredItems: number;
  itemsNeedingAction: number;
}

function scoreLicense(
  link: ProjectLicenseComplianceInput,
  now: Date,
  thirtyDaysFromNow: Date,
): number {
  if (link.license.expirationDate < now) return 0;

  let score = link.license.expirationDate <= thirtyDaysFromNow ? 50 : 100;
  if (link.required && !link.verified) score = Math.min(score, 75);
  return score;
}

function scoreSubcontractor(
  link: ProjectSubcontractorComplianceInput,
  now: Date,
): number {
  const subcontractor = link.subcontractor;
  if (subcontractor.status !== "active") return 0;
  if (subcontractor.licenseExpiry && subcontractor.licenseExpiry < now) return 0;
  if (subcontractor.insuranceExpiry && subcontractor.insuranceExpiry < now) return 0;

  const status =
    link.complianceStatus !== "pending"
      ? link.complianceStatus
      : subcontractor.complianceStatus;

  if (["compliant", "approved", "active"].includes(status)) return 100;
  if (["pending", "review", "unknown"].includes(status)) return 50;
  return 0;
}

export function calculateProjectCompliance(input: {
  projectLicenses: ProjectLicenseComplianceInput[];
  projectSubs: ProjectSubcontractorComplianceInput[];
}): ProjectComplianceResult {
  const now = new Date();
  const thirtyDaysFromNow = new Date(now);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const requiredLicenses = input.projectLicenses.filter((link) => link.required);
  const licenseScores = requiredLicenses.map((link) =>
    scoreLicense(link, now, thirtyDaysFromNow),
  );
  const subcontractorScores = input.projectSubs.map((link) =>
    scoreSubcontractor(link, now),
  );
  const scores = [...licenseScores, ...subcontractorScores];

  if (scores.length === 0) {
    return {
      score: 100,
      configured: false,
      atRisk: false,
      requiredItems: 0,
      itemsNeedingAction: 0,
    };
  }

  const score = Math.round(
    scores.reduce((total, itemScore) => total + itemScore, 0) / scores.length,
  );
  return {
    score,
    configured: true,
    atRisk: score < 80,
    requiredItems: scores.length,
    itemsNeedingAction: scores.filter((itemScore) => itemScore < 100).length,
  };
}

export async function refreshProjectCompliance(
  projectId: string,
  orgId: string,
): Promise<ProjectComplianceResult | null> {
  const project = await db.project.findFirst({
    where: { id: projectId, orgId },
    include: {
      projectLicenses: {
        include: { license: { select: { expirationDate: true } } },
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
  });
  if (!project) return null;

  const compliance = calculateProjectCompliance({
    projectLicenses: project.projectLicenses,
    projectSubs: project.projectSubs,
  });
  if (project.complianceScore !== compliance.score) {
    await db.project.update({
      where: { id: project.id },
      data: { complianceScore: compliance.score },
    });
  }
  return compliance;
}
