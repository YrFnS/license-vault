import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { sendComplianceReport } from "@/lib/email";

export const runtime = "nodejs";

const emailSchema = z.string().trim().email().max(320);

function getCronSecret(): string {
  const secret = process.env.CRON_SECRET;
  if (!secret) throw new Error("CRON_SECRET environment variable is required");
  return secret;
}

function getProvidedSecret(request: Request): string | null {
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice("Bearer ".length).trim();
  }
  return request.headers.get("x-cron-secret")?.trim() || null;
}

function secretsMatch(provided: string | null, expected: string): boolean {
  if (!provided) return false;
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  return (
    providedBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(providedBuffer, expectedBuffer)
  );
}

function isDue(
  frequency: string,
  lastSentAt: Date | null,
  now: Date,
): boolean {
  if (!lastSentAt) return true;
  const dueAt = new Date(lastSentAt);
  if (frequency === "weekly") dueAt.setDate(dueAt.getDate() + 7);
  else if (frequency === "quarterly") dueAt.setMonth(dueAt.getMonth() + 3);
  else dueAt.setMonth(dueAt.getMonth() + 1);
  return now >= dueAt;
}

function parseRecipients(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const recipients: string[] = [];
    for (const item of parsed) {
      const result = emailSchema.safeParse(item);
      if (result.success) recipients.push(result.data.toLowerCase());
    }
    return [...new Set(recipients)];
  } catch {
    return [];
  }
}

export async function POST(request: Request) {
  try {
    if (!secretsMatch(getProvidedSecret(request), getCronSecret())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXTAUTH_URL ||
      process.env.APP_URL;
    if (!appUrl) {
      return NextResponse.json(
        { error: "APP_URL or NEXTAUTH_URL must be configured" },
        { status: 500 },
      );
    }

    const schedules = await db.scheduledReport.findMany({
      where: { enabled: true },
      include: {
        org: {
          select: { id: true, name: true, companyName: true },
        },
      },
    });

    const results: Array<{
      orgId: string;
      orgName: string;
      status: "sent" | "partial" | "failed" | "skipped";
      sent: number;
      errors: string[];
    }> = [];

    for (const schedule of schedules) {
      const now = new Date();
      const orgName = schedule.org.companyName || schedule.org.name;
      if (!isDue(schedule.frequency, schedule.lastSentAt, now)) {
        results.push({
          orgId: schedule.orgId,
          orgName,
          status: "skipped",
          sent: 0,
          errors: [],
        });
        continue;
      }

      // Atomically claim this schedule. A concurrent cron invocation sees the
      // changed lastSentAt value and cannot send the same schedule twice.
      const claim = await db.scheduledReport.updateMany({
        where: {
          id: schedule.id,
          lastSentAt: schedule.lastSentAt,
          enabled: true,
        },
        data: { lastSentAt: now },
      });
      if (claim.count !== 1) {
        results.push({
          orgId: schedule.orgId,
          orgName,
          status: "skipped",
          sent: 0,
          errors: [],
        });
        continue;
      }

      const recipients = parseRecipients(schedule.recipients);
      const errors: string[] = [];
      let sent = 0;

      try {
        if (recipients.length === 0) {
          throw new Error("No valid recipients are configured");
        }

        const currentTime = new Date();
        const thirtyDaysFromNow = new Date(currentTime);
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        const [
          totalLicenses,
          activeLicenses,
          expiringLicenses,
          expiredLicenses,
          atRiskLicenses,
        ] = await Promise.all([
          db.license.count({ where: { orgId: schedule.orgId } }),
          db.license.count({
            where: {
              orgId: schedule.orgId,
              expirationDate: { gt: thirtyDaysFromNow },
            },
          }),
          db.license.count({
            where: {
              orgId: schedule.orgId,
              expirationDate: { gte: currentTime, lte: thirtyDaysFromNow },
            },
          }),
          db.license.count({
            where: {
              orgId: schedule.orgId,
              expirationDate: { lt: currentTime },
            },
          }),
          db.license.findMany({
            where: {
              orgId: schedule.orgId,
              expirationDate: { lte: thirtyDaysFromNow },
            },
            orderBy: { expirationDate: "asc" },
            take: 8,
            select: { name: true, expirationDate: true },
          }),
        ]);

        const complianceScore =
          totalLicenses > 0
            ? Math.round(
                ((totalLicenses - expiredLicenses) / totalLicenses) * 100,
              )
            : 100;
        const reportUrl = new URL("/en/reports", appUrl);
        reportUrl.searchParams.set("type", schedule.reportType);
        reportUrl.searchParams.set("format", schedule.format);

        for (const recipient of recipients) {
          const delivery = await sendComplianceReport(
            recipient,
            {
              orgName,
              complianceScore,
              reportUrl: reportUrl.toString(),
              totalLicenses,
              activeLicenses,
              expiringLicenses,
              expiredLicenses,
              atRiskItems: atRiskLicenses.map((license) =>
                `${license.name} — ${license.expirationDate.toLocaleDateString()}`,
              ),
            },
            schedule.orgId,
          );
          if (delivery.success) sent += 1;
          else errors.push(`${recipient}: ${delivery.error || "Email delivery failed"}`);
        }

        if (sent === 0) {
          throw new Error(errors[0] || "No report emails were delivered");
        }

        await db.auditLog.create({
          data: {
            orgId: schedule.orgId,
            userId: null,
            action: "scheduled_report_sent",
            entityType: "scheduled_report",
            entityId: schedule.id,
            entityName: `Scheduled Report (${schedule.frequency})`,
            details: JSON.stringify({
              sent,
              failed: errors.length,
              reportType: schedule.reportType,
              format: schedule.format,
            }),
          },
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Scheduled report failed";
        if (!errors.includes(message)) errors.push(message);

        // Release the claim only when nothing was delivered so the next cron
        // run may retry. Partial delivery stays claimed to avoid duplicates.
        if (sent === 0) {
          await db.scheduledReport.updateMany({
            where: { id: schedule.id, lastSentAt: now },
            data: { lastSentAt: schedule.lastSentAt },
          });
        }
      }

      results.push({
        orgId: schedule.orgId,
        orgName,
        status:
          sent === recipients.length && errors.length === 0
            ? "sent"
            : sent > 0
              ? "partial"
              : "failed",
        sent,
        errors,
      });
    }

    return NextResponse.json(
      {
        success: true,
        processed: schedules.length,
        sent: results.reduce((total, result) => total + result.sent, 0),
        failed: results.filter((result) => result.status === "failed").length,
        results,
        checkedAt: new Date().toISOString(),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Send scheduled reports error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
