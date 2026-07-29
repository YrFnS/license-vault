import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { canManageOrganization, getOrgContext } from "@/lib/org-context";
import {
  decryptIntegrationConfig,
  hasAutomaticSyncAdapter,
  testIntegrationConnection,
} from "@/lib/integration-config";

export const runtime = "nodejs";

export async function POST(
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
        { error: "Only organization owners and admins can run integrations." },
        { status: 403 },
      );
    }

    const { id } = await params;
    const integration = await db.integration.findFirst({
      where: { id, orgId: context.orgId, isActive: true },
    });
    if (!integration) {
      return NextResponse.json(
        { error: "Integration not found" },
        { status: 404 },
      );
    }

    const config = decryptIntegrationConfig(integration.config);
    if (!config) {
      return NextResponse.json(
        {
          success: false,
          code: "INTEGRATION_RECONNECT_REQUIRED",
          message: "Reconnect this integration with a valid API endpoint and credential.",
        },
        { status: 409 },
      );
    }

    const connection = await testIntegrationConnection(config);
    if (!connection.success) {
      await db.$transaction(async (transaction) => {
        await transaction.integration.update({
          where: { id: integration.id },
          data: {
            status: "error",
            lastSyncStatus: "connection_failed",
            lastError: connection.message,
            errorCount: { increment: 1 },
          },
        });
        await transaction.integrationSyncLog.create({
          data: {
            integrationId: integration.id,
            orgId: context.orgId,
            type: "manual",
            status: "failed",
            recordsSynced: 0,
            errors: JSON.stringify([connection.message]),
            completedAt: new Date(),
          },
        });
      });

      return NextResponse.json(
        {
          success: false,
          code: "INTEGRATION_CONNECTION_FAILED",
          message: connection.message,
        },
        { status: 502 },
      );
    }

    if (!hasAutomaticSyncAdapter(integration.type)) {
      const message =
        "Connection verified, but an automatic data-sync adapter is not available for this provider yet.";
      await db.$transaction(async (transaction) => {
        await transaction.integration.update({
          where: { id: integration.id },
          data: {
            status: "connected",
            lastSyncStatus: "unsupported",
            lastError: message,
          },
        });
        await transaction.integrationSyncLog.create({
          data: {
            integrationId: integration.id,
            orgId: context.orgId,
            type: "manual",
            status: "unsupported",
            recordsSynced: 0,
            errors: JSON.stringify([message]),
            completedAt: new Date(),
          },
        });
        await transaction.auditLog.create({
          data: {
            orgId: context.orgId,
            userId: context.userId,
            action: "integration_connection_verified",
            entityType: "integration",
            entityId: integration.id,
            entityName: integration.name,
            details: JSON.stringify({
              type: integration.type,
              endpoint: config.baseUrl,
              latencyMs: connection.latencyMs,
              automaticSyncAvailable: false,
            }),
          },
        });
      });

      return NextResponse.json(
        {
          success: false,
          status: "unsupported",
          code: "SYNC_ADAPTER_NOT_AVAILABLE",
          message,
          connection,
        },
        { status: 501 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        code: "SYNC_ADAPTER_NOT_AVAILABLE",
        message: "No sync adapter is registered for this integration.",
      },
      { status: 501 },
    );
  } catch (error) {
    console.error("Error triggering sync:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
