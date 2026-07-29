import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { canManageOrganization, getOrgContext } from "@/lib/org-context";
import { dispatchWebhook } from "@/lib/webhook-delivery";

const bulkDeleteSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(100),
});

export async function DELETE(request: Request) {
  try {
    const context = await getOrgContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!canManageOrganization(context.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const result = bulkDeleteSchema.safeParse(await request.json());
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || "Validation failed" },
        { status: 400 },
      );
    }

    const ids = [...new Set(result.data.ids)];
    const licenses = await db.license.findMany({
      where: {
        orgId: context.orgId,
        id: { in: ids },
      },
      select: {
        id: true,
        name: true,
        licenseNumber: true,
      },
    });

    if (licenses.length !== ids.length) {
      return NextResponse.json(
        { error: "One or more licenses were not found" },
        { status: 404 },
      );
    }

    const deleted = await db.$transaction(async (transaction) => {
      await transaction.auditLog.createMany({
        data: licenses.map((license) => ({
          orgId: context.orgId,
          userId: context.userId,
          action: "delete",
          entityType: "license",
          entityId: license.id,
          entityName: license.name,
          details: `Deleted license: ${license.name} (${license.licenseNumber})`,
        })),
      });

      return transaction.license.deleteMany({
        where: {
          orgId: context.orgId,
          id: { in: ids },
        },
      });
    });

    Promise.all(
      licenses.map((license) =>
        dispatchWebhook(context.orgId, "license.deleted", {
          id: license.id,
          name: license.name,
          licenseNumber: license.licenseNumber,
        }),
      ),
    ).catch((error) => console.error("Bulk license webhook delivery failed:", error));

    return NextResponse.json(
      { success: true, deleted: deleted.count },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Bulk delete licenses error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
