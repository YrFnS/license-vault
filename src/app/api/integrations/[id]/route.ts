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

const updateSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    config: integrationConfigSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, "No changes supplied");

function serializeIntegration<
  T extends {
    config: string | null;
    type: string;
    status: string;
    lastError: string | null;
  },
>(integration: T) {
  const config = decryptIntegrationConfig(integration.config);
  const safeConfig = getSafeIntegrationConfig(config);
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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const context = await getOrgContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const integration = await db.integration.findFirst({
      where: { id, orgId: context.orgId, isActive: true },
      include: {
        syncLogs: {
          orderBy: { startedAt: "desc" },
          take: 20,
        },
      },
    });
    if (!integration) {
      return NextResponse.json(
        { error: "Integration not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { integration: serializeIntegration(integration) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Error fetching integration:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const context = await getOrgContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!canManageOrganization(context.role)) {
      return NextResponse.json(
        { error: "Only organization owners and admins can update integrations." },
        { status: 403 },
      );
    }

    const { id } = await params;
    const existing = await db.integration.findFirst({
      where: { id, orgId: context.orgId, isActive: true },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Integration not found" },
        { status: 404 },
      );
    }

    const result = updateSchema.safeParse(await request.json());
    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error.issues[0]?.message || "Validation failed",
          details: result.error.flatten(),
        },
        { status: 400 },
      );
    }

    let connection:
      | Awaited<ReturnType<typeof testIntegrationConnection>>
      | undefined;
    if (result.data.config) {
      connection = await testIntegrationConnection(result.data.config);
      if (!connection.success) {
        return NextResponse.json(
          { error: connection.message, connection },
          { status: 422 },
        );
      }
    }

    const integration = await db.$transaction(async (transaction) => {
      const updated = await transaction.integration.update({
        where: { id: existing.id },
        data: {
          ...(result.data.name
            ? { name: sanitizeString(result.data.name) }
            : {}),
          ...(result.data.config
            ? {
                config: encryptIntegrationConfig(result.data.config),
                status: "connected",
                lastSyncStatus: "connection_verified",
                lastError: null,
              }
            : {}),
        },
      });
      await transaction.auditLog.create({
        data: {
          orgId: context.orgId,
          userId: context.userId,
          action: "integration_updated",
          entityType: "integration",
          entityId: updated.id,
          entityName: updated.name,
          details: JSON.stringify({
            updatedFields: Object.keys(result.data),
            endpoint: result.data.config?.baseUrl,
            latencyMs: connection?.latencyMs,
          }),
        },
      });
      return updated;
    });

    return NextResponse.json({
      integration: serializeIntegration(integration),
      connection: connection || null,
    });
  } catch (error) {
    console.error("Error updating integration:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const context = await getOrgContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!canManageOrganization(context.role)) {
      return NextResponse.json(
        { error: "Only organization owners and admins can disconnect integrations." },
        { status: 403 },
      );
    }

    const { id } = await params;
    const existing = await db.integration.findFirst({
      where: { id, orgId: context.orgId, isActive: true },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Integration not found" },
        { status: 404 },
      );
    }

    await db.$transaction(async (transaction) => {
      await transaction.integration.update({
        where: { id: existing.id },
        data: {
          isActive: false,
          status: "disconnected",
          config: null,
          lastError: null,
        },
      });
      await transaction.auditLog.create({
        data: {
          orgId: context.orgId,
          userId: context.userId,
          action: "integration_disconnected",
          entityType: "integration",
          entityId: existing.id,
          entityName: existing.name,
          details: JSON.stringify({ type: existing.type }),
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error disconnecting integration:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
