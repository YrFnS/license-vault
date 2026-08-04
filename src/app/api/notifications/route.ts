import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getOrgContext } from "@/lib/org-context";

export async function GET() {
  try {
    const context = await getOrgContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notifications = await db.notification.findMany({
      where: {
        userId: context.userId,
        orgId: context.orgId,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(
      {
        notifications,
        unreadCount: notifications.filter((notification) => !notification.read).length,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Get notifications error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const markReadSchema = z
  .object({
    notificationIds: z.array(z.string().min(1)).max(100).optional(),
    markAll: z.boolean().optional(),
  })
  .refine(
    (value) => value.markAll === true || Boolean(value.notificationIds?.length),
    { message: "Select at least one notification" },
  );

export async function PUT(request: Request) {
  try {
    const context = await getOrgContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = markReadSchema.safeParse(await request.json());
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || "Validation failed" },
        { status: 400 },
      );
    }

    const baseWhere = {
      userId: context.userId,
      orgId: context.orgId,
      read: false,
    };

    await db.notification.updateMany({
      where: result.data.markAll
        ? baseWhere
        : {
            ...baseWhere,
            id: { in: result.data.notificationIds || [] },
          },
      data: { read: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mark notifications error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
