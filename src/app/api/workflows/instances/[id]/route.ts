import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { sanitizeString } from "@/lib/sanitize";
import { canManageOrganization, getOrgContext } from "@/lib/org-context";
import {
  parseWorkflowHistory,
  safeParseStoredObject,
  safeParseStoredWorkflowSteps,
} from "@/lib/workflow-engine";

const updateInstanceSchema = z
  .object({
    currentStep: z.number().int().min(0).max(49).optional(),
    status: z.enum(["active", "completed", "cancelled", "failed"]).optional(),
    notes: z.string().trim().min(1).max(2_000),
  })
  .refine(
    (value) => value.currentStep !== undefined || value.status !== undefined,
    "No workflow change supplied",
  );

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
    const instance = await db.workflowInstance.findFirst({
      where: { id, orgId: context.orgId },
      include: {
        definition: {
          select: {
            name: true,
            category: true,
            steps: true,
            triggerType: true,
          },
        },
      },
    });
    if (!instance) {
      return NextResponse.json(
        { error: "Workflow instance not found" },
        { status: 404 },
      );
    }

    const steps = safeParseStoredWorkflowSteps(instance.definition.steps);
    return NextResponse.json(
      {
        ...instance,
        stepHistory: parseWorkflowHistory(instance.stepHistory),
        variables: safeParseStoredObject(instance.variables),
        definition: {
          ...instance.definition,
          steps,
          totalSteps: steps.length,
          executable: instance.definition.triggerType === "manual",
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Get workflow instance error:", error);
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
        { error: "Only organization owners and admins can override workflows." },
        { status: 403 },
      );
    }

    const { id } = await params;
    const existing = await db.workflowInstance.findFirst({
      where: { id, orgId: context.orgId },
      include: {
        definition: { select: { name: true, steps: true, triggerType: true } },
      },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Workflow instance not found" },
        { status: 404 },
      );
    }

    const result = updateInstanceSchema.safeParse(await request.json());
    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error.issues[0]?.message || "Validation failed",
          details: result.error.flatten(),
        },
        { status: 400 },
      );
    }

    const steps = safeParseStoredWorkflowSteps(existing.definition.steps);
    if (steps.length === 0) {
      return NextResponse.json(
        { error: "The workflow definition contains no valid steps." },
        { status: 409 },
      );
    }
    if (
      result.data.currentStep !== undefined &&
      result.data.currentStep >= steps.length
    ) {
      return NextResponse.json(
        { error: `Current step must be between 0 and ${steps.length - 1}.` },
        { status: 400 },
      );
    }

    const notes = sanitizeString(result.data.notes);
    const history = parseWorkflowHistory(existing.stepHistory);
    history.push({
      stepId: "administrative_override",
      stepName: "Administrative Override",
      action: "override",
      userId: context.userId,
      timestamp: new Date().toISOString(),
      notes,
    });

    const updateData: Prisma.WorkflowInstanceUncheckedUpdateInput = {
      stepHistory: JSON.stringify(history.slice(-500)),
      ...(result.data.currentStep !== undefined
        ? { currentStep: result.data.currentStep }
        : {}),
    };
    if (result.data.status !== undefined) {
      updateData.status = result.data.status;
      updateData.completedAt =
        result.data.status === "active" ? null : new Date();
    }

    const updated = await db.$transaction(async (transaction) => {
      const instance = await transaction.workflowInstance.update({
        where: { id: existing.id },
        data: updateData,
      });
      await transaction.auditLog.create({
        data: {
          orgId: context.orgId,
          userId: context.userId,
          action: "workflow_override",
          entityType: "workflow_instance",
          entityId: existing.id,
          entityName: existing.definition.name,
          details: JSON.stringify({
            previousStep: existing.currentStep,
            currentStep: instance.currentStep,
            previousStatus: existing.status,
            status: instance.status,
            notes,
          }),
        },
      });
      return instance;
    });

    return NextResponse.json({
      ...updated,
      stepHistory: history,
      variables: safeParseStoredObject(updated.variables),
    });
  } catch (error) {
    console.error("Update workflow instance error:", error);
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
        { error: "Only organization owners and admins can cancel workflows." },
        { status: 403 },
      );
    }

    const { id } = await params;
    const existing = await db.workflowInstance.findFirst({
      where: { id, orgId: context.orgId },
      include: { definition: { select: { name: true } } },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Workflow instance not found" },
        { status: 404 },
      );
    }
    if (existing.status !== "active") {
      return NextResponse.json(
        { error: `Only active workflows can be cancelled; this instance is ${existing.status}.` },
        { status: 409 },
      );
    }

    const history = parseWorkflowHistory(existing.stepHistory);
    history.push({
      stepId: "cancelled",
      stepName: "Workflow Cancelled",
      action: "cancel",
      userId: context.userId,
      timestamp: new Date().toISOString(),
      notes: null,
    });

    await db.$transaction(async (transaction) => {
      await transaction.workflowInstance.update({
        where: { id: existing.id },
        data: {
          status: "cancelled",
          completedAt: new Date(),
          stepHistory: JSON.stringify(history.slice(-500)),
        },
      });
      await transaction.auditLog.create({
        data: {
          orgId: context.orgId,
          userId: context.userId,
          action: "cancel",
          entityType: "workflow_instance",
          entityId: existing.id,
          entityName: existing.definition.name,
          details: JSON.stringify({ currentStep: existing.currentStep }),
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cancel workflow instance error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
