import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { canManageOrganization, getOrgContext } from "@/lib/org-context";

const createApiKeySchema = z.object({
  name: z.string().trim().min(1, "Key name is required").max(100),
  permissions: z.enum(["read", "write", "admin"]).default("read"),
  expiresAt: z.coerce.date().optional(),
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

    const apiKeys = await db.apiKey.findMany({
      where: { orgId: context.orgId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        permissions: true,
        lastUsedAt: true,
        expiresAt: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      { apiKeys },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Get API keys error:", error);
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

    const result = createApiKeySchema.safeParse(await request.json());
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || "Validation failed" },
        { status: 400 },
      );
    }
    if (result.data.expiresAt && result.data.expiresAt <= new Date()) {
      return NextResponse.json(
        { error: "Expiration date must be in the future" },
        { status: 400 },
      );
    }

    const rawKey = `lv_live_${crypto.randomBytes(32).toString("hex")}`;
    const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
    const keyPrefix = rawKey.substring(0, 12);

    const apiKey = await db.$transaction(async (transaction) => {
      const created = await transaction.apiKey.create({
        data: {
          orgId: context.orgId,
          name: result.data.name,
          keyHash,
          keyPrefix,
          permissions: result.data.permissions,
          expiresAt: result.data.expiresAt || null,
        },
      });
      await transaction.auditLog.create({
        data: {
          orgId: context.orgId,
          userId: context.userId,
          action: "create",
          entityType: "apiKey",
          entityId: created.id,
          entityName: created.name,
          details: `Created API key: ${created.name}`,
        },
      });
      return created;
    });

    return NextResponse.json(
      {
        apiKey: {
          id: apiKey.id,
          name: apiKey.name,
          keyPrefix: apiKey.keyPrefix,
          permissions: apiKey.permissions,
          expiresAt: apiKey.expiresAt,
          isActive: apiKey.isActive,
          createdAt: apiKey.createdAt,
        },
        key: rawKey,
      },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Create API key error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
