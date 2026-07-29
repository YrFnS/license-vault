import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { sanitizeString } from "@/lib/sanitize";
import { getOrgContext } from "@/lib/org-context";
import {
  canActOnWorkflowStep,
  parseWorkflowHistory,
  safeParseStoredObject,
  safeParseStoredWorkflowSteps,
} from "@/lib/workflow-engine";

const advanceSchema = z.object({
  action: z.enum([
    "approve",
    "reject",
    "request_changes",
    "complete",
    "delegate",
  ]),
  notes: z.string().trim().max(2_000).optional(),
  conditionsConfirmed: z.boolean().optional(),
  delegateTo: z.string().trim().max(320).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const context = await getOrgContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const result = advanceSchema.safeParse(await request.json());
    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error.issues[0]?.message || "Validation failed",
          details: result.error.flatten(),
        },
        { status: 400 },
      );
    }
    if (result.data.action === "delegate") {
      return NextResponse.json(
        {
          error:
            "Workflow delegation is not implemented because instances do not yet store a per-step delegate. No change was made.",
          code: "WORKFLOW_DELEGATION_NOT_IMPLEMENTED",
        },
        { status: 501 },
      );
    }

    const instance = await db.workflowInstance.findFirst({
      where: { id, orgId: context.orgId },
      include: {
        definition: {
          select: { name: true, steps: true, triggerType: true },
        },
      },
    });
    if (!instance) {
      return NextResponse.json(
        { error: "Workflow instance not found" },
        { status: 404 },
      );
    }
    if (instance.status !== "active") {
      return NextResponse.json(
        { error: `This workflow is already ${instance.status}.` },
        { status: 409 },
      );
    }
    if (instance.definition.triggerType !== "manual") {
      return NextResponse.json(
        { error: "Only manual workflows can be advanced in this version." },
        { status: 422 },
      );
    }

    const steps = safeParseStoredWorkflowSteps(instance.definition.steps);
    const currentStep = steps[instance.currentStep];
    if (!currentStep) {
      return NextResponse.json(
        { error: "The current workflow step is invalid." },
        { status: 409 },
      );
    }
    if (!canActOnWorkflowStep(context.role, currentStep.assignee)) {
      return NextResponse.json(
        {
          error: `This step is assigned to ${currentStep.assignee} users.`,
        },
        { status: 403 },
      );
    }
    if (
      currentStep.conditions.length > 0 &&
      !["reject", "request_changes"].includes(result.data.action) &&
      !result.data.conditionsConfirmed
    ) {
      return NextResponse.json(
        {
          error:
            "Confirm that the workflow step conditions have been satisfied before advancing.",
          conditions: currentStep.conditions,
        },
        { status: 400 },
      );
    }
    if (
      result.data.action === "approve" &&
      !["approval", "review"].includes(currentStep.type)
    ) {
      return NextResponse.json(
        { error: `Use complete for a ${currentStep.type} step.` },
        { status: 400 },
      );
    }
    if (
      result.data.action === "complete" &&
      ["approval", "review"].includes(currentStep.type)
    ) {
      return NextResponse.json(
        { error: `Use approve or reject for a ${currentStep.type} step.` },
        { status: 400 },
      );
    }
    if (
      result.data.action === "request_changes" &&
      !["approval", "review"].includes(currentStep.type)
    ) {
      return NextResponse.json(
        { error: "Changes can only be requested from an approval or review step." },
        { status: 400 },
      );
    }
    if (
      ["reject", "request_changes"].includes(result.data.action) &&
      !result.data.notes?.trim()
    ) {
      return NextResponse.json(
        { error: "Add a reason before rejecting or requesting changes." },
        { status: 400 },
      );
    }
    if (
      result.data.action === "request_changes" &&
      instance.currentStep === 0
    ) {
      return NextResponse.json(
        { error: "There is no previous workflow step to return to." },
        { status: 409 },
      );
    }

    const notes = result.data.notes
      ? sanitizeString(result.data.notes)
      : null;
    const history = parseWorkflowHistory(instance.stepHistory);
    history.push({
      stepId: currentStep.id,
      stepName: currentStep.name,
      action: result.data.action,
      userId: context.userId,
      timestamp: new Date().toISOString(),
      notes,
    });

    const isRejected = result.data.action === "reject";
    const requestsChanges = result.data.action === "request_changes";
    const isLastStep = instance.currentStep >= steps.length - 1;
    const nextStatus = isRejected
      ? "failed"
      : requestsChanges
        ? "active"
        : isLastStep
          ? "completed"
          : "active";
    const nextStep = requestsChanges
      ? instance.currentStep - 1
      : isRejected || isLastStep
        ? instance.currentStep
        : instance.currentStep + 1;
    const completedAt = nextStatus === "active" ? null : new Date();

    const updated = await db.$transaction(async (transaction) => {
      const claim = await transaction.workflowInstance.updateMany({
        where: {
          id: instance.id,
          orgId: context.orgId,
          status: "active",
          currentStep: instance.currentStep,
        },
        data: {
          currentStep: nextStep,
          status: nextStatus,
          completedAt,
          stepHistory: JSON.stringify(history.slice(-500)),
        },
      });
      if (claim.count !== 1) {
        throw new Error("WORKFLOW_CONFLICT");
      }

      await transaction.auditLog.create({
        data: {
          orgId: context.orgId,
          userId: context.userId,
          action: result.data.action,
          entityType: "workflow_instance",
          entityId: instance.id,
          entityName: instance.definition.name,
          details: JSON.stringify({
            stepId: currentStep.id,
            stepName: currentStep.name,
            stepType: currentStep.type,
            assignee: currentStep.assignee,
            nextStep,
            status: nextStatus,
            notes,
          }),
        },
      });

      return transaction.workflowInstance.findUniqueOrThrow({
        where: { id: instance.id },
      });
    });

    return NextResponse.json({
      ...updated,
      stepHistory: history,
      variables: safeParseStoredObject(updated.variables),
      currentStepData:
        updated.status === "active" ? steps[updated.currentStep] : null,
      completed: updated.status === "completed",
      failed: updated.status === "failed",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "WORKFLOW_CONFLICT") {
      return NextResponse.json(
        {
          error:
            "This workflow changed while your request was being processed. Refresh and try again.",
        },
        { status: 409 },
      );
    }
    console.error("Advance workflow error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
