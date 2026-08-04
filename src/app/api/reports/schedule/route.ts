import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { canManageOrganization, getOrgContext } from "@/lib/org-context";

const DEFAULT_CONFIG = {
  frequency: "monthly" as const,
  recipients: [] as string[],
  reportType: "compliance" as const,
  format: "pdf" as const,
  enabled: false,
  lastSentAt: null as string | null,
};

const scheduleSchema = z.object({
  frequency: z.enum(["weekly", "monthly", "quarterly"]).default("monthly"),
  recipients: z
    .array(z.string().trim().email().max(320))
    .max(50)
    .default([]),
  reportType: z.enum(["compliance", "full", "licenses"]).default("compliance"),
  format: z.enum(["pdf", "csv"]).default("pdf"),
  enabled: z.boolean().default(false),
});

function parseRecipients(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.filter((item): item is string => typeof item === "string"))];
  } catch {
    return [];
  }
}

export async function GET() {
  try {
    const context = await getOrgContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const scheduledReport = await db.scheduledReport.findUnique({
      where: { orgId: context.orgId },
    });
    if (!scheduledReport) {
      return NextResponse.json(
        { config: DEFAULT_CONFIG },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    return NextResponse.json(
      {
        config: {
          frequency: scheduledReport.frequency,
          recipients: parseRecipients(scheduledReport.recipients),
          reportType: scheduledReport.reportType,
          format: scheduledReport.format,
          enabled: scheduledReport.enabled,
          lastSentAt: scheduledReport.lastSentAt?.toISOString() || null,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Get schedule error:", error);
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
        {
          error:
            "Only organization owners and admins can configure scheduled reports.",
        },
        { status: 403 },
      );
    }

    const result = scheduleSchema.safeParse(await request.json());
    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error.issues[0]?.message || "Validation failed",
          details: result.error.flatten(),
        },
        { status: 400 },
      );
    }

    const recipients = [
      ...new Set(result.data.recipients.map((email) => email.toLowerCase())),
    ];
    if (result.data.enabled && recipients.length === 0) {
      return NextResponse.json(
        { error: "Add at least one recipient before enabling scheduled reports." },
        { status: 400 },
      );
    }

    const scheduledReport = await db.$transaction(async (transaction) => {
      const saved = await transaction.scheduledReport.upsert({
        where: { orgId: context.orgId },
        update: {
          frequency: result.data.frequency,
          recipients: JSON.stringify(recipients),
          reportType: result.data.reportType,
          format: result.data.format,
          enabled: result.data.enabled,
        },
        create: {
          orgId: context.orgId,
          frequency: result.data.frequency,
          recipients: JSON.stringify(recipients),
          reportType: result.data.reportType,
          format: result.data.format,
          enabled: result.data.enabled,
        },
      });
      await transaction.auditLog.create({
        data: {
          orgId: context.orgId,
          userId: context.userId,
          action: "scheduled_report_updated",
          entityType: "scheduled_report",
          entityId: saved.id,
          entityName: `Scheduled Report (${saved.frequency})`,
          details: JSON.stringify({
            frequency: saved.frequency,
            enabled: saved.enabled,
            reportType: saved.reportType,
            format: saved.format,
            recipientCount: recipients.length,
          }),
        },
      });
      return saved;
    });

    return NextResponse.json({
      config: {
        frequency: scheduledReport.frequency,
        recipients,
        reportType: scheduledReport.reportType,
        format: scheduledReport.format,
        enabled: scheduledReport.enabled,
        lastSentAt: scheduledReport.lastSentAt?.toISOString() || null,
      },
    });
  } catch (error) {
    console.error("Save schedule error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
