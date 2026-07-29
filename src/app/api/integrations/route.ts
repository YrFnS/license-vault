import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { sanitizeString } from "@/lib/sanitize";
import { canManageOrganization, getOrgContext } from "@/lib/org-context";
import {
  decryptIntegrationConfig,
  encryptIntegrationConfig,
  getSafeIntegrationConfig,
  hasAutomaticSyncAdapter,
  integrationConfigSchema,
  testIntegrationConnection,
} from "@/lib/integration-config";

export const runtime = "nodejs";

const createSchema = z.object({
  name: z.string().trim().min(1).max(200),
  type: z.string().trim().min(1).max(100).regex(/^[a-z0-9_-]+$/),
  category: z.enum(["construction_erp", "accounting", "hris", "ats", "custom"]),
  config: integrationConfigSchema,
});

function serializeIntegration<
  T extends {
    config: string | null;
    type: string;
    status: string;
    lastError: string | null;
  },
>(integration: T) {
  const decrypted = decryptIntegrationConfig(integration.config);
  const safeConfig = getSafeIntegrationConfig(decrypted);
  return {
    ...integration,
    config: JSON.stringify(safeConfig),
    status: safeConfig.credentialConfigured
      ? integration.status
      : "disconnected",
    lastError: safeConfig.credentialConfigured
      ? integration.lastError
      : "Reconnect this integration to replace the legacy or missing credential.",
    syncAvailable: hasAutomaticSyncAdapter(integration.type),
  };
}

export async function GET() {
  try {
    const context = await getOrgContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const records = await db.integration.findMany({
      where: { orgId: context.orgId, isActive: true },
      include: {
        syncLogs: {
          orderBy: { startedAt: "desc" },
          take: 10,
        },
      },
      orderBy: { createdAt: "desc" },
    });
    const integrations = records.map(serializeIntegration);

    const stats = {
      total: integrations.length,
      connected: integrations.filter(
        (integration) => integration.status === "connected",
      ).length,
      disconnected: integrations.filter(
        (integration) => integration.status === "disconnected",
      ).length,
      error: integrations.filter((integration) => integration.status === "error")
        .length,
      syncing: integrations.filter(
        (integration) => integration.status === "syncing",
      ).length,
      lastSyncAt: integrations.reduce<Date | null>((latest, integration) => {
        if (!integration.lastSyncAt) return latest;
        if (!latest) return integration.lastSyncAt;
        return integration.lastSyncAt > latest
          ? integration.lastSyncAt
          : latest;
      }, null),
      totalSyncErrors: integrations.reduce(
        (total, integration) => total + integration.errorCount,
        0,
      ),
    };

    return NextResponse.json(
      { integrations, stats },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Error fetching integrations:", error);
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
      return NextResponse.json(
        { error: "Only organization owners and admins can connect integrations." },
        { status: 403 },
      );
    }

    const result = createSchema.safeParse(await request.json());
    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error.issues[0]?.message || "Validation failed",
          details: result.error.flatten(),
        },
        { status: 400 },
      );
    }

    const existing = await db.integration.findFirst({
      where: {
        orgId: context.orgId,
        type: result.data.type,
        isActive: true,
      },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: "An active integration of this type already exists." },
        { status: 409 },
      );
    }

    const connection = await testIntegrationConnection(result.data.config);
    if (!connection.success) {
      return NextResponse.json(
        { error: connection.message, connection },
        { status: 422 },
      );
    }

    const integration = await db.$transaction(async (transaction) => {
      const created = await transaction.integration.create({
        data: {
          orgId: context.orgId,
          name: sanitizeString(result.data.name),
          type: result.data.type,
          category: result.data.category,
          status: "connected",
          config: encryptIntegrationConfig(result.data.config),
          lastSyncAt: null,
          lastSyncStatus: "connection_verified",
          lastError: null,
        },
      });
      await transaction.auditLog.create({
        data: {
          orgId: context.orgId,
          userId: context.userId,
          action: "integration_connected",
          entityType: "integration",
          entityId: created.id,
          entityName: created.name,
          details: JSON.stringify({
            type: created.type,
            category: created.category,
            endpoint: result.data.config.baseUrl,
            latencyMs: connection.latencyMs,
            automaticSyncAvailable: hasAutomaticSyncAdapter(created.type),
          }),
        },
      });
      return created;
    });

    return NextResponse.json(
      {
        integration: serializeIntegration({ ...integration, syncLogs: [] }),
        connection,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating integration:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
