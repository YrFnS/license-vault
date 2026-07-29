import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOrgContext } from "@/lib/org-context";

/** Explicit development-only demo data. Never called by the application UI. */
export async function POST() {
  if (
    process.env.NODE_ENV !== "development" ||
    process.env.ALLOW_DEMO_NOTIFICATION_SEED !== "true"
  ) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const context = await getOrgContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existingCount = await db.notification.count({
      where: {
        userId: context.userId,
        orgId: context.orgId,
      },
    });

    if (existingCount > 0) {
      return NextResponse.json({ created: 0, count: existingCount });
    }

    const now = new Date();
    const sampleNotifications = [
      {
        orgId: context.orgId,
        userId: context.userId,
        title: "[Demo] License Expiring Soon",
        message: "Sample notification for development testing only.",
        read: false,
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      },
      {
        orgId: context.orgId,
        userId: context.userId,
        title: "[Demo] Compliance Review",
        message: "Sample compliance notification for development testing only.",
        read: true,
        createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      },
    ];

    const created = await db.notification.createMany({
      data: sampleNotifications,
    });

    return NextResponse.json({ created: created.count, count: existingCount });
  } catch (error) {
    console.error("Seed notifications error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
