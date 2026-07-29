import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { getOrgContext } from "@/lib/org-context";
import {
  canActOnWorkflowStep,
  parseWorkflowHistory,
  parseWorkflowVariables,
  safeParseStoredObject,
  safeParseStoredWorkflowSteps,
  validateWorkflowEntity,
} from "@/lib/workflow-engine";

const instanceStatusSchema = z.enum([
  "active",
  "completed",
  "cancelled",
  "failed",
]);

const entityTypeSchema = z.enum([
  "license",
  "application",
  "document",
  "subcontractor",
]);

const startInstanceSchema = z.object({
  definitionId: z.string().trim().min(1, "Definition ID is required").max(200),
  entityType: entityTypeSchema,
  entityId: z.string().trim().min(1).max(200).optional(),
  variables: z.unknown().optional(),
});

function parsePositiveInt(value: string | null, fallback: number, max: number): number {
  const parsed = Number.parseInt(value || "", 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}

export async function GET(request: Request) {
  try {
    const context = await getOrgContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const statusResult = instanceStatusSchema.safeParse(
      searchParams.get("status") || undefined,
    );
    const definitionId = searchParams.get("definitionId")?.trim() || undefined;
    const page = parsePositiveInt(searchParams.get("page"), 1, 1_000_000);
    const limit = parsePositiveInt(searchParams.get("limit"), 20, 100);

    const where: Prisma.WorkflowInstanceWhereInput = {
      orgId: context.orgId,
      ...(statusResult.success && statusResult.data
        ? { status: statusResult.data }
        : {}),
      ...(definitionId
        ? {
            definitionId,
            definition: { orgId: context.orgId },
          }
        : {}),
    };

    const [total, instances, active, completed, cancelled, failed] =
      await Promise.all([
        db.workflowInstance.count({ where }),
        db.workflowInstance.findMany({
          where,
          orderBy: { startedAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
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
        }),
        db.workflowInstance.count({
          where: { orgId: context.orgId, status: "active" },
        }),
        db.workflowInstance.count({
          where: { orgId: context.orgId, status: "completed" },
        }),
        db.workflowInstance.count({
          where: { orgId: context.orgId, status: "cancelled" },
        }),
        db.workflowInstance.count({
          where: { orgId: context.orgId, status: "failed" },
        }),
      ]);

    return NextResponse.json(
      {
        instances: instances.map((instance) => {
          const steps = safeParseStoredWorkflowSteps(instance.definition.steps);
          return {
            ...instance,
            stepHistory: parseWorkflowHistory(instance.stepHistory),
            variables: safeParseStoredObject(instance.variables),
            definition: {
              ...instance.definition,
              steps,
              totalSteps: steps.length,
              executable: instance.definition.triggerType === "manual",
            },
          };
        }),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        counts: { active, completed, cancelled, failed },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Get workflow instances error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const context = await getOrgContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = startInstanceSchema.safeParse(await request.json());
    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error.issues[0]?.message || "Validation failed",
          details: result.error.flatten(),
        },
        { status: 400 },
      );
    }

    const definition = await db.workflowDefinition.findFirst({
      where: {
        id: result.data.definitionId,
        orgId: context.orgId,
        isActive: true,
      },
    });
    if (!definition) {
      return NextResponse.json(
        { error: "Active workflow definition not found" },
        { status: 404 },
      );
    }
    if (definition.triggerType !== "manual") {
      return NextResponse.json(
        {
          error: "Only manual workflow definitions can be started in this version.",
          code: "WORKFLOW_TRIGGER_NOT_IMPLEMENTED",
        },
        { status: 422 },
      );
    }

    const steps = safeParseStoredWorkflowSteps(definition.steps);
    if (steps.length === 0) {
      return NextResponse.json(
        { error: "The workflow definition contains no valid steps." },
        { status: 409 },
      );
    }
    if (!canActOnWorkflowStep(context.role, steps[0].assignee)) {
      return NextResponse.json(
        {
          error: `The first step is assigned to ${steps[0].assignee} users.`,
        },
        { status: 403 },
      );
    }

    const entityExists = await validateWorkflowEntity(
      context.orgId,
      result.data.entityType,
      result.data.entityId,
    );
    if (!entityExists) {
      return NextResponse.json(
        { error: "The linked workflow record was not found in this organization." },
        { status: 404 },
      );
    }

    let variables: Record<string, unknown>;
    try {
      variables = parseWorkflowVariables(result.data.variables);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Invalid variables" },
        { status: 400 },
      );
    }

    if (result.data.entityId) {
      const duplicate = await db.workflowInstance.findFirst({
        where: {
          orgId: context.orgId,
          definitionId: definition.id,
          entityType: result.data.entityType,
          entityId: result.data.entityId,
          status: "active",
        },
        select: { id: true },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: "An active workflow already exists for this record." },
          { status: 409 },
        );
      }
    }

    const startedAt = new Date();
    const history = [
      {
        stepId: "started",
        stepName: "Workflow Started",
        action: "start",
        userId: context.userId,
        timestamp: startedAt.toISOString(),
        notes: `Started from definition: ${definition.name}`,
      },
    ];

    const instance = await db.$transaction(async (transaction) => {
      const created = await transaction.workflowInstance.create({
        data: {
          orgId: context.orgId,
          definitionId: definition.id,
          entityType: result.data.entityType,
          entityId: result.data.entityId || null,
          status: "active",
          currentStep: 0,
          stepHistory: JSON.stringify(history),
          variables: Object.keys(variables).length
            ? JSON.stringify(variables)
            : null,
        },
      });
      await transaction.auditLog.create({
        data: {
          orgId: context.orgId,
          userId: context.userId,
          action: "start",
          entityType: "workflow_instance",
          entityId: created.id,
          entityName: `Instance of ${definition.name}`,
          details: JSON.stringify({
            definitionId: definition.id,
            entityType: created.entityType,
            linkedEntityId: created.entityId,
            firstAssignee: steps[0].assignee,
          }),
        },
      });
      return created;
    });

    return NextResponse.json(
      {
        ...instance,
        stepHistory: history,
        variables,
        definition: {
          name: definition.name,
          category: definition.category,
          triggerType: definition.triggerType,
          steps,
          totalSteps: steps.length,
          executable: true,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Start workflow instance error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
