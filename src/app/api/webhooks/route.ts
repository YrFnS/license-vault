import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { canManageOrganization, getOrgContext } from "@/lib/org-context";
import { assertSafeWebhookUrl } from "@/lib/safe-webhook-url";
import { encryptWebhookSecret } from "@/lib/webhook-secret";

const VALID_EVENTS = [
  "license.created",
  "license.updated",
  "license.deleted",
  "license.renewed",
  "license.expiring",
  "license.expired",
  "insurance.created",
  "insurance.updated",
  "insurance.deleted",
  "insurance.expiring",
  "insurance.expired",
  "compliance.changed",
  "approval.created",
  "approval.approved",
  "approval.rejected",
] as const;

const createWebhookSchema = z.object({
  name: z.string().trim().min(1, "Webhook name is required").max(100),
  url: z.string().trim().url("Must be a valid URL"),
  events: z
    .string()
    .min(1, "At least one event is required")
    .transform((events) =>
      [...new Set(events.split(",").map((event) => event.trim()).filter(Boolean))].join(","),
    )
    .refine(
      (events) => events.split(",").every((event) => VALID_EVENTS.includes(event as (typeof VALID_EVENTS)[number])),
      { message: "Invalid event type(s)" },
    ),
});

export async function GET() {
  try {
    const context = await getOrgContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!canManageOrganization(context.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const webhooks = await db.webhook.findMany({
      where: { orgId: context.orgId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        url: true,
        events: true,
        isActive: true,
        lastTriggeredAt: true,
        failureCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      { webhooks },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Get webhooks error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const context = await getOrgContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!canManageOrganization(context.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const parsed = createWebhookSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Validation failed" },
        { status: 400 },
      );
    }

    try {
      await assertSafeWebhookUrl(parsed.data.url);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Webhook URL is not allowed" },
        { status: 400 },
      );
    }

    const secret = `whsec_${crypto.randomBytes(24).toString("hex")}`;
    const webhook = await db.$transaction(async (transaction) => {
      const created = await transaction.webhook.create({
        data: {
          orgId: context.orgId,
          name: parsed.data.name,
          url: parsed.data.url,
          events: parsed.data.events,
          secret: encryptWebhookSecret(secret),
        },
        select: {
          id: true,
          name: true,
          url: true,
          events: true,
          isActive: true,
          lastTriggeredAt: true,
          failureCount: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      await transaction.auditLog.create({
        data: {
          orgId: context.orgId,
          userId: context.userId,
          action: "create",
          entityType: "webhook",
          entityId: created.id,
          entityName: created.name,
          details: `Created webhook: ${created.name}`,
        },
      });
      return created;
    });

    return NextResponse.json(
      { webhook, secret },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Create webhook error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
