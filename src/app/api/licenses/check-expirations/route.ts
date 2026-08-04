import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOrgContext } from "@/lib/org-context";

type ExpirationStatus =
  | "EXPIRED"
  | "EXPIRING_5_DAYS"
  | "EXPIRING_30_DAYS"
  | "EXPIRING_60_DAYS";

function getExpirationStatus(expirationDate: Date, now: Date): ExpirationStatus | null {
  const daysRemaining = Math.ceil(
    (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (daysRemaining < 0) return "EXPIRED";
  if (daysRemaining <= 5) return "EXPIRING_5_DAYS";
  if (daysRemaining <= 30) return "EXPIRING_30_DAYS";
  if (daysRemaining <= 60) return "EXPIRING_60_DAYS";
  return null;
}

/** Read-only expiration summary. Notification creation belongs in a scheduled job. */
export async function GET() {
  try {
    const context = await getOrgContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const licenses = await db.license.findMany({
      where: { orgId: context.orgId },
      select: { expirationDate: true },
    });

    const now = new Date();
    const summary = {
      checked: licenses.length,
      expired: 0,
      expiring5Days: 0,
      expiring30Days: 0,
      expiring60Days: 0,
      notificationsCreated: 0,
    };

    for (const license of licenses) {
      const status = getExpirationStatus(license.expirationDate, now);
      if (status === "EXPIRED") summary.expired += 1;
      if (status === "EXPIRING_5_DAYS") summary.expiring5Days += 1;
      if (status === "EXPIRING_30_DAYS") summary.expiring30Days += 1;
      if (status === "EXPIRING_60_DAYS") summary.expiring60Days += 1;
    }

    return NextResponse.json(summary, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Check expirations error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
