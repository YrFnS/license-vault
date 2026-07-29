import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOrgContext } from "@/lib/org-context";

function computeLicenseStatus(expirationDate: Date, now = new Date()): string {
  const thirtyDaysFromNow = new Date(now);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  if (expirationDate < now) return "expired";
  if (expirationDate <= thirtyDaysFromNow) return "expiring_soon";
  return "active";
}

export async function GET() {
  try {
    const context = await getOrgContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const thirtyDaysFromNow = new Date(now);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const orgWhere = { orgId: context.orgId };

    const [
      total,
      active,
      expiringSoon,
      expired,
      recentLicenseRows,
      recentAuditLogs,
      expiringRows,
    ] = await Promise.all([
      db.license.count({ where: orgWhere }),
      db.license.count({
        where: { ...orgWhere, expirationDate: { gt: thirtyDaysFromNow } },
      }),
      db.license.count({
        where: {
          ...orgWhere,
          expirationDate: { gte: now, lte: thirtyDaysFromNow },
        },
      }),
      db.license.count({
        where: { ...orgWhere, expirationDate: { lt: now } },
      }),
      db.license.findMany({
        where: orgWhere,
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      db.auditLog.findMany({
        where: { orgId: context.orgId },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      db.license.findMany({
        where: { ...orgWhere, expirationDate: { lte: thirtyDaysFromNow } },
        orderBy: { expirationDate: "asc" },
        take: 5,
        select: { id: true, name: true, expirationDate: true },
      }),
    ]);

    const userIds = [
      ...new Set(recentAuditLogs.map((log) => log.userId).filter(Boolean)),
    ] as string[];
    const users = userIds.length
      ? await db.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true },
        })
      : [];
    const userMap = new Map(users.map((user) => [user.id, user.name]));

    return NextResponse.json(
      {
        summary: { total, active, expiringSoon, expired },
        recentLicenses: recentLicenseRows.map((license) => ({
          ...license,
          status: computeLicenseStatus(license.expirationDate, now),
        })),
        recentActivity: recentAuditLogs.map((log) => ({
          id: log.id,
          action: log.action,
          entityType: log.entityType,
          entityName: log.entityName,
          details: log.details,
          userName: log.userId ? userMap.get(log.userId) ?? null : null,
          createdAt: log.createdAt.toISOString(),
        })),
        expiringLicenses: expiringRows.map((license) => ({
          id: license.id,
          name: license.name,
          expirationDate: license.expirationDate.toISOString(),
          status: computeLicenseStatus(license.expirationDate, now),
        })),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
