import { z } from "zod";
import { db } from "@/lib/db";
import type { OrgRole } from "@/lib/org-context";

export const workflowCategorySchema = z.enum([
  "license_renewal",
  "onboarding",
  "audit",
  "document_review",
  "custom",
]);

export const workflowStepTypeSchema = z.enum([
  "approval",
  "review",
  "notification",
  "condition",
  "action",
  "delay",
]);

export const workflowAssigneeSchema = z.enum(["owner", "admin", "member"]);

export const workflowStepSchema = z.object({
  id: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .regex(/^[a-zA-Z0-9_-]+$/, "Step IDs may contain letters, numbers, _ and -"),
  name: z.string().trim().min(1).max(200),
  type: workflowStepTypeSchema,
  assignee: workflowAssigneeSchema,
  actions: z.array(z.string().trim().min(1).max(100)).max(20).default([]),
  conditions: z.array(z.string().trim().min(1).max(200)).max(20).default([]),
  order: z.number().int().min(0).max(99),
  autoAdvance: z.boolean().optional(),
  slaHours: z.number().int().min(1).max(8_760).optional(),
});

export type WorkflowStep = z.infer<typeof workflowStepSchema>;

const workflowStepsSchema = z
  .array(workflowStepSchema)
  .min(1, "A workflow must contain at least one step")
  .max(50)
  .superRefine((steps, context) => {
    const ids = new Set<string>();
    for (const [index, step] of steps.entries()) {
      if (ids.has(step.id)) {
        context.addIssue({
          code: "custom",
          path: [index, "id"],
          message: `Duplicate step ID: ${step.id}`,
        });
      }
      ids.add(step.id);
    }
  });

const jsonObjectSchema = z.record(z.string().max(100), z.unknown());

function parseJsonInput(value: unknown, label: string): unknown {
  if (typeof value !== "string") return value;
  if (value.length > 20_000) throw new Error(`${label} is too large`);
  try {
    return JSON.parse(value);
  } catch {
    throw new Error(`${label} must be valid JSON`);
  }
}

export function parseWorkflowSteps(value: unknown): WorkflowStep[] {
  const parsedInput = parseJsonInput(value, "Workflow steps");
  const steps = workflowStepsSchema.parse(parsedInput);
  return [...steps]
    .sort((left, right) => left.order - right.order)
    .map((step, order) => ({
      ...step,
      order,
      actions: [...new Set(step.actions)],
      conditions: [...new Set(step.conditions)],
    }));
}

export function safeParseStoredWorkflowSteps(value: string): WorkflowStep[] {
  try {
    return parseWorkflowSteps(value);
  } catch {
    return [];
  }
}

export function parseWorkflowVariables(value: unknown): Record<string, unknown> {
  if (value === undefined || value === null || value === "") return {};
  return jsonObjectSchema.parse(parseJsonInput(value, "Workflow variables"));
}

export function safeParseStoredObject(value: string | null): Record<string, unknown> {
  if (!value) return {};
  try {
    return parseWorkflowVariables(value);
  } catch {
    return {};
  }
}

export function canActOnWorkflowStep(
  role: OrgRole,
  assignee: WorkflowStep["assignee"],
): boolean {
  if (role === "owner") return true;
  if (assignee === "owner") return false;
  if (role === "admin") return true;
  return assignee === "member";
}

export async function validateWorkflowEntity(
  orgId: string,
  entityType: "license" | "application" | "document" | "subcontractor",
  entityId?: string,
): Promise<boolean> {
  if (!entityId) return true;

  if (entityType === "license") {
    return Boolean(
      await db.license.findFirst({
        where: { id: entityId, orgId },
        select: { id: true },
      }),
    );
  }
  if (entityType === "application") {
    return Boolean(
      await db.licenseApplication.findFirst({
        where: { id: entityId, orgId },
        select: { id: true },
      }),
    );
  }
  if (entityType === "subcontractor") {
    return Boolean(
      await db.subcontractor.findFirst({
        where: { id: entityId, orgId },
        select: { id: true },
      }),
    );
  }

  const [licenseDocument, subcontractorDocument, generatedDocument] =
    await Promise.all([
      db.licenseDocument.findFirst({
        where: { id: entityId, orgId },
        select: { id: true },
      }),
      db.subcontractorDocument.findFirst({
        where: { id: entityId, orgId },
        select: { id: true },
      }),
      db.generatedDocument.findFirst({
        where: { id: entityId, orgId },
        select: { id: true },
      }),
    ]);
  return Boolean(licenseDocument || subcontractorDocument || generatedDocument);
}

export interface WorkflowHistoryEntry {
  stepId: string;
  stepName: string;
  action: string;
  userId: string;
  timestamp: string;
  notes: string | null;
}

export function parseWorkflowHistory(value: string | null): WorkflowHistoryEntry[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (entry): entry is WorkflowHistoryEntry =>
          entry &&
          typeof entry === "object" &&
          typeof entry.stepId === "string" &&
          typeof entry.stepName === "string" &&
          typeof entry.action === "string" &&
          typeof entry.userId === "string" &&
          typeof entry.timestamp === "string",
      )
      .slice(-500);
  } catch {
    return [];
  }
}
