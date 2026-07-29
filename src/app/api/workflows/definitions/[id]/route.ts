import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { sanitizeString } from "@/lib/sanitize";
import { canManageOrganization, getOrgContext } from "@/lib/org-context";
import {
  parseWorkflowSteps,
  safeParseStoredObject,
  safeParseStoredWorkflowSteps,
  workflowCategorySchema,
} from "@/lib/workflow-engine";

const updateDefinitionSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(5_000).nullable().optional(),
    category: workflowCategorySchema.optional(),
    triggerType: z
      .enum(["manual", "automatic", "scheduled", "event"])
      .optional(),
    steps: z.unknown().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, "No changes supplied");

function serializeDefinition<
  T extends {
    steps: string;
    triggerConfig: string | null;
    triggerType: string;
  },
>(definition: T) {
  return {
    ...definition,
    steps: safeParseStoredWorkflowSteps(definition.steps),
    triggerConfig: safeParseStoredObject(definition.triggerConfig),
    executable: definition.triggerType === "manual",
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
    const definition = await db.workflowDefinition.findFirst({
      where: { id, orgId: context.orgId },
      include: { _count: { select: { instances: true } } },
    });
    if (!definition) {
      return NextResponse.json(
        { error: "Workflow definition not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(serializeDefinition(definition), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Get workflow definition error:", error);
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
        { error: "Only organization owners and admins can update workflows." },
        { status: 403 },
      );
    }

    const { id } = await params;
    const existing = await db.workflowDefinition.findFirst({
      where: { id, orgId: context.orgId },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Workflow definition not found" },
        { status: 404 },
      );
    }

    const result = updateDefinitionSchema.safeParse(await request.json());
    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error.issues[0]?.message || "Validation failed",
          details: result.error.flatten(),
        },
        { status: 400 },
      );
    }
    if (result.data.triggerType && result.data.triggerType !== "manual") {
      return NextResponse.json(
        {
          error:
            "Automatic, scheduled, and event workflow triggers are not available yet.",
          code: "WORKFLOW_TRIGGER_NOT_IMPLEMENTED",
        },
        { status: 422 },
      );
    }

    const updateData: Prisma.WorkflowDefinitionUncheckedUpdateInput = {
      ...(result.data.name !== undefined
        ? { name: sanitizeString(result.data.name) }
        : {}),
      ...(result.data.description !== undefined
        ? {
            description: result.data.description
              ? sanitizeString(result.data.description)
              : null,
          }
        : {}),
      ...(result.data.category !== undefined
        ? { category: result.data.category }
        : {}),
      ...(result.data.triggerType !== undefined
        ? { triggerType: "manual", triggerConfig: null }
        : {}),
      ...(result.data.isActive !== undefined
        ? { isActive: result.data.isActive }
        : {}),
    };

    let stepCount: number | undefined;
    if (result.data.steps !== undefined) {
      try {
        const steps = parseWorkflowSteps(result.data.steps);
        updateData.steps = JSON.stringify(steps);
        updateData.version = existing.version + 1;
        stepCount = steps.length;
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : "Invalid workflow steps" },
          { status: 400 },
        );
      }
    }

    const updated = await db.$transaction(async (transaction) => {
      const definition = await transaction.workflowDefinition.update({
        where: { id: existing.id },
        data: updateData,
      });
      await transaction.auditLog.create({
        data: {
          orgId: context.orgId,
          userId: context.userId,
          action: "update",
          entityType: "workflow_definition",
          entityId: definition.id,
          entityName: definition.name,
          details: JSON.stringify({
            version: definition.version,
            updatedFields: Object.keys(result.data),
            stepCount,
          }),
        },
      });
      return definition;
    });

    return NextResponse.json(serializeDefinition(updated));
  } catch (error) {
    console.error("Update workflow definition error:", error);
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
        { error: "Only organization owners and admins can deactivate workflows." },
        { status: 403 },
      );
    }

    const { id } = await params;
    const existing = await db.workflowDefinition.findFirst({
      where: { id, orgId: context.orgId },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Workflow definition not found" },
        { status: 404 },
      );
    }
    if (!existing.isActive) {
      return NextResponse.json({ success: true });
    }

    await db.$transaction(async (transaction) => {
      await transaction.workflowDefinition.update({
        where: { id: existing.id },
        data: { isActive: false },
      });
      await transaction.auditLog.create({
        data: {
          orgId: context.orgId,
          userId: context.userId,
          action: "deactivate",
          entityType: "workflow_definition",
          entityId: existing.id,
          entityName: existing.name,
          details: JSON.stringify({ version: existing.version }),
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Deactivate workflow definition error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
