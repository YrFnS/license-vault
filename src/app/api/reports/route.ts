import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOrgContext } from "@/lib/org-context";

function getLocale(request: Request): string {
  const language = request.headers.get("accept-language")?.split(",")[0]?.trim();
  return language || "en";
}

export async function GET(request: Request) {
  try {
    const context = await getOrgContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const thirtyDaysFromNow = new Date(now);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const ninetyDaysFromNow = new Date(now);
    ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);

    const [
      total,
      active,
      expiringSoon,
      expired,
      typeGroups,
      insuranceRecords,
      expiringLicenses,
    ] = await Promise.all([
      db.license.count({ where: { orgId: context.orgId } }),
      db.license.count({
        where: {
          orgId: context.orgId,
          expirationDate: { gt: thirtyDaysFromNow },
        },
      }),
      db.license.count({
        where: {
          orgId: context.orgId,
          expirationDate: { gte: now, lte: thirtyDaysFromNow },
        },
      }),
      db.license.count({
        where: { orgId: context.orgId, expirationDate: { lt: now } },
      }),
      db.license.groupBy({
        by: ["type"],
        where: { orgId: context.orgId },
        _count: { _all: true },
        orderBy: { _count: { type: "desc" } },
      }),
      db.insuranceBond.findMany({
        where: { orgId: context.orgId },
        select: {
          type: true,
          coverageAmount: true,
          premiumAmount: true,
          expirationDate: true,
          complianceStatus: true,
        },
      }),
      db.license.findMany({
        where: {
          orgId: context.orgId,
          expirationDate: { gte: now, lte: ninetyDaysFromNow },
        },
        orderBy: { expirationDate: "asc" },
        take: 10,
        select: {
          id: true,
          name: true,
          type: true,
          expirationDate: true,
        },
      }),
    ]);

    const locale = getLocale(request);
    const trendDates = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      const monthEnd = new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      );
      return { date, monthEnd };
    });
    const trendCounts = await Promise.all(
      trendDates.flatMap(({ monthEnd }) => [
        db.license.count({
          where: { orgId: context.orgId, createdAt: { lte: monthEnd } },
        }),
        db.license.count({
          where: {
            orgId: context.orgId,
            createdAt: { lte: monthEnd },
            expirationDate: { gt: monthEnd },
          },
        }),
      ]),
    );
    const complianceTrend = trendDates.map(({ date }, index) => {
      const monthTotal = trendCounts[index * 2] || 0;
      const compliant = trendCounts[index * 2 + 1] || 0;
      return {
        month: date.toLocaleString(locale, { month: "short" }),
        rate:
          monthTotal > 0 ? Math.round((compliant / monthTotal) * 100) : 100,
      };
    });

    const activeInsuranceRecords = insuranceRecords.filter(
      (record) => record.expirationDate > now,
    );
    const complianceScore =
      total > 0 ? Math.round(((total - expired) / total) * 100) : 100;

    return NextResponse.json(
      {
        summary: {
          total,
          active,
          expiringSoon,
          expired,
          complianceScore,
        },
        licenseDistribution: typeGroups.map((group) => ({
          type: group.type || "Other",
          count: group._count._all,
        })),
        complianceTrend,
        statusDistribution: [
          { name: "active", value: active },
          { name: "expiring", value: expiringSoon },
          { name: "expired", value: expired },
        ],
        insuranceSummary: {
          totalPolicies: insuranceRecords.filter(
            (record) => record.type === "insurance",
          ).length,
          activePolicies: activeInsuranceRecords.filter(
            (record) => record.type === "insurance",
          ).length,
          totalBonds: insuranceRecords.filter((record) => record.type === "bond")
            .length,
          activeBonds: activeInsuranceRecords.filter(
            (record) => record.type === "bond",
          ).length,
          totalCoverage: activeInsuranceRecords.reduce(
            (sum, record) => sum + record.coverageAmount,
            0,
          ),
          totalPremium: activeInsuranceRecords.reduce(
            (sum, record) => sum + record.premiumAmount,
            0,
          ),
          compliant: insuranceRecords.filter(
            (record) => record.complianceStatus === "compliant",
          ).length,
          needsAction: insuranceRecords.filter(
            (record) => record.complianceStatus !== "compliant",
          ).length,
        },
        expiringLicenses: expiringLicenses.map((license) => ({
          ...license,
          expirationDate: license.expirationDate.toISOString(),
          daysLeft: Math.ceil(
            (license.expirationDate.getTime() - now.getTime()) / 86_400_000,
          ),
        })),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Reports API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
