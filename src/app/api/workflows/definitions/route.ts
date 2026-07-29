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
  type WorkflowStep,
} from "@/lib/workflow-engine";

const templateSteps: Record<string, WorkflowStep[]> = {
  license_renewal: [
    {
      id: "step_1",
      name: "Initiate Renewal",
      type: "action",
      assignee: "owner",
      actions: ["start_renewal"],
      conditions: [],
      order: 0,
    },
    {
      id: "step_2",
      name: "Review Requirements",
      type: "review",
      assignee: "admin",
      actions: ["check_requirements"],
      conditions: [],
      order: 1,
    },
    {
      id: "step_3",
      name: "Complete Continuing Education",
      type: "action",
      assignee: "member",
      actions: ["complete_ce"],
      conditions: [],
      order: 2,
    },
    {
      id: "step_4",
      name: "Submit Renewal Application",
      type: "approval",
      assignee: "admin",
      actions: ["submit_application"],
      conditions: ["ce_complete"],
      order: 3,
    },
    {
      id: "step_5",
      name: "Verify New License",
      type: "review",
      assignee: "owner",
      actions: ["verify_license"],
      conditions: [],
      order: 4,
    },
  ],
  onboarding: [
    {
      id: "step_1",
      name: "Submit Credentials",
      type: "action",
      assignee: "member",
      actions: ["upload_credentials"],
      conditions: [],
      order: 0,
    },
    {
      id: "step_2",
      name: "Admin Review",
      type: "approval",
      assignee: "admin",
      actions: ["review_credentials"],
      conditions: [],
      order: 1,
    },
    {
      id: "step_3",
      name: "Upload Documents",
      type: "action",
      assignee: "member",
      actions: ["upload_documents"],
      conditions: ["credentials_approved"],
      order: 2,
    },
    {
      id: "step_4",
      name: "Compliance Check",
      type: "review",
      assignee: "owner",
      actions: ["verify_compliance"],
      conditions: [],
      order: 3,
    },
  ],
  audit: [
    {
      id: "step_1",
      name: "Schedule Audit",
      type: "action",
      assignee: "admin",
      actions: ["schedule_audit"],
      conditions: [],
      order: 0,
    },
    {
      id: "step_2",
      name: "Conduct Review",
      type: "review",
      assignee: "admin",
      actions: ["conduct_review"],
      conditions: [],
      order: 1,
    },
    {
      id: "step_3",
      name: "Generate Report",
      type: "action",
      assignee: "owner",
      actions: ["generate_report"],
      conditions: [],
      order: 2,
    },
  ],
};

const createDefinitionSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  description: z.string().trim().max(5_000).optional(),
  category: workflowCategorySchema.default("custom"),
  triggerType: z
    .enum(["manual", "automatic", "scheduled", "event"])
    .default("manual"),
  triggerConfig: z.union([z.string().max(20_000), z.record(z.string(), z.unknown())]).optional(),
  steps: z.unknown().optional(),
  template: z.enum(["license_renewal", "onboarding", "audit"]).optional(),
});

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

export async function GET(request: Request) {
  try {
    const context = await getOrgContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const categoryResult = workflowCategorySchema.safeParse(
      searchParams.get("category") || undefined,
    );
    const includeInactive = searchParams.get("includeInactive") === "true";

    const where: Prisma.WorkflowDefinitionWhereInput = {
      orgId: context.orgId,
      ...(!includeInactive ? { isActive: true } : {}),
      ...(categoryResult.success && categoryResult.data
        ? { category: categoryResult.data }
        : {}),
    };

    const [definitions, groupedInstances, total, active, runningInstances, completed] =
      await Promise.all([
        db.workflowDefinition.findMany({
          where,
          orderBy: { updatedAt: "desc" },
          include: { _count: { select: { instances: true } } },
        }),
        db.workflowInstance.groupBy({
          by: ["definitionId", "status"],
          where: { orgId: context.orgId },
          _count: { _all: true },
        }),
        db.workflowDefinition.count({ where: { orgId: context.orgId } }),
        db.workflowDefinition.count({
          where: { orgId: context.orgId, isActive: true },
        }),
        db.workflowInstance.count({
          where: { orgId: context.orgId, status: "active" },
        }),
        db.workflowInstance.count({
          where: { orgId: context.orgId, status: "completed" },
        }),
      ]);

    const instanceCountMap = new Map<string, Map<string, number>>();
    for (const group of groupedInstances) {
      const statuses = instanceCountMap.get(group.definitionId) || new Map();
      statuses.set(group.status, group._count._all);
      instanceCountMap.set(group.definitionId, statuses);
    }

    return NextResponse.json(
      {
        definitions: definitions.map((definition) => {
          const statuses = instanceCountMap.get(definition.id);
          return {
            ...serializeDefinition(definition),
            _count: {
              instances: definition._count.instances,
              activeInstances: statuses?.get("active") || 0,
              completedInstances: statuses?.get("completed") || 0,
            },
          };
        }),
        stats: { total, active, runningInstances, completed },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Get workflow definitions error:", error);
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
        { error: "Only organization owners and admins can create workflows." },
        { status: 403 },
      );
    }

    const result = createDefinitionSchema.safeParse(await request.json());
    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error.issues[0]?.message || "Validation failed",
          details: result.error.flatten(),
        },
        { status: 400 },
      );
    }
    if (result.data.triggerType !== "manual") {
      return NextResponse.json(
        {
          error:
            "Automatic, scheduled, and event workflow triggers are not available yet. Create a manual workflow instead.",
          code: "WORKFLOW_TRIGGER_NOT_IMPLEMENTED",
        },
        { status: 422 },
      );
    }

    let steps: WorkflowStep[];
    try {
      steps = result.data.template
        ? parseWorkflowSteps(templateSteps[result.data.template])
        : parseWorkflowSteps(result.data.steps);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Invalid workflow steps" },
        { status: 400 },
      );
    }

    const definition = await db.$transaction(async (transaction) => {
      const created = await transaction.workflowDefinition.create({
        data: {
          orgId: context.orgId,
          name: sanitizeString(result.data.name),
          description: result.data.description
            ? sanitizeString(result.data.description)
            : null,
          category: result.data.category,
          triggerType: "manual",
          triggerConfig: null,
          steps: JSON.stringify(steps),
        },
      });
      await transaction.auditLog.create({
        data: {
          orgId: context.orgId,
          userId: context.userId,
          action: "create",
          entityType: "workflow_definition",
          entityId: created.id,
          entityName: created.name,
          details: JSON.stringify({
            category: created.category,
            triggerType: created.triggerType,
            stepCount: steps.length,
          }),
        },
      });
      return created;
    });

    return NextResponse.json(serializeDefinition(definition), { status: 201 });
  } catch (error) {
    console.error("Create workflow definition error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
