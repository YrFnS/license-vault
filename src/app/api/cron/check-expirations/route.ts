import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
	runFullCheck,
	createAutomationRun,
	completeAutomationRun,
	updateLastRunAt,
	getOrCreateAutomationSettings,
} from "@/lib/automation";
import { sendExpirationAlert, sendInsuranceExpirationAlert } from "@/lib/email";

// ─── Types ─────────────────────────────────────────────────────────────────

type ExpirationThreshold = 60 | 30 | 5;

interface AlertSummary {
	licensesChecked: number;
	insuranceChecked: number;
	emailAlertsSent: number;
	inAppAlertsCreated: number;
	skippedDuplicate: number;
	errors: string[];
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function getDaysUntil(date: Date): number {
	const now = new Date();
	const diffMs = date.getTime() - now.getTime();
	return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Determine which threshold bucket a "days until" value falls into.
 * Returns the most urgent threshold that applies.
 */
function getThresholdBucket(daysUntil: number): ExpirationThreshold | null {
	if (daysUntil <= 0) return 5; // Expired → treat as 5-day urgency
	if (daysUntil <= 5) return 5;
	if (daysUntil <= 30) return 30;
	if (daysUntil <= 60) return 60;
	return null; // Not within any alert window
}

/**
 * Map threshold to the AlertPreference boolean field name.
 */
function thresholdToPrefField(
	threshold: ExpirationThreshold,
): "alert60Days" | "alert30Days" | "alert5Days" {
	switch (threshold) {
		case 60:
			return "alert60Days";
		case 30:
			return "alert30Days";
		case 5:
			return "alert5Days";
	}
}

/**
 * Build a deduplication key for a notification.
 * Using a prefix + threshold + entity ID to avoid resending the same threshold alert.
 */
function buildDedupKey(
	prefix: string,
	threshold: ExpirationThreshold,
	entityId: string,
): string {
	return `${prefix}${threshold}_${entityId}`;
}

/**
 * Check whether an alert has already been sent (exists as a Notification with the dedup key in the title).
 */
async function isAlertAlreadySent(
	userId: string,
	dedupKey: string,
): Promise<boolean> {
	const existing = await db.notification.findFirst({
		where: {
			userId,
			title: dedupKey,
		},
	});
	return !!existing;
}

// ─── Cron Endpoint ─────────────────────────────────────────────────────────

function getCronSecret(): string {
	const secret = process.env.CRON_SECRET;
	if (!secret) {
		throw new Error("CRON_SECRET environment variable is required");
	}
	return secret;
}

/**
 * POST /api/cron/check-expirations
 *
 * Checks all organizations for licenses and insurance/bonds approaching expiration,
 * sends email alerts and creates in-app notifications based on user alert preferences.
 * Also runs the automation engine for each org.
 *
 * Can be called:
 * - Via a cron service (pass ?secret=CRON_SECRET for auth)
 * - Manually from the admin panel
 */
export async function POST(request: Request) {
	try {
		const CRON_SECRET = getCronSecret();
		// Optional secret-based auth for cron callers
		const { searchParams } = new URL(request.url);
		const providedSecret = searchParams.get("secret");

		if (providedSecret !== CRON_SECRET) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const summary: AlertSummary = {
			licensesChecked: 0,
			insuranceChecked: 0,
			emailAlertsSent: 0,
			inAppAlertsCreated: 0,
			skippedDuplicate: 0,
			errors: [],
		};

		// ── Process using Automation Engine for each org ───────────────────────

		const orgs = await db.organization.findMany();

		for (const org of orgs) {
			const autoSettings = await getOrCreateAutomationSettings(org.id);

			// Skip if automation is disabled
			if (!autoSettings.enabled) continue;

			// Create automation run record
			const run = await createAutomationRun(org.id, "full_check");

			try {
				// Run the full automation check
				const results = await runFullCheck(org.id);

				// Complete the run record
				await completeAutomationRun(run.id, { ...results }, "completed");

				// Update lastRunAt
				await updateLastRunAt(org.id);

				summary.licensesChecked +=
					results.licensesExpiring + results.licensesExpired;
				summary.insuranceChecked +=
					results.insuranceExpiring + results.insuranceExpired;
				summary.inAppAlertsCreated += results.notificationsCreated;
			} catch (err) {
				const msg = err instanceof Error ? err.message : "Unknown error";
				await completeAutomationRun(run.id, { error: msg }, "failed");
				summary.errors.push(`Org ${org.id}: ${msg}`);
			}
		}

		// ── Legacy email-based processing (still runs for email alerts) ────────

		const now = new Date();
		const sixtyDaysFromNow = new Date();
		sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

		// Find all licenses expiring within 60 days that haven't been renewed
		const expiringLicenses = await db.license.findMany({
			where: {
				expirationDate: { lte: sixtyDaysFromNow },
				isRenewed: false,
			},
			include: {
				org: {
					select: {
						id: true,
						name: true,
						members: {
							where: { userId: { not: null } },
							include: {
								user: {
									include: { alertPrefs: true },
								},
							},
						},
					},
				},
			},
		});

		for (const license of expiringLicenses) {
			const daysUntil = getDaysUntil(license.expirationDate);
			const threshold = getThresholdBucket(daysUntil);

			if (!threshold) continue;

			for (const member of license.org.members) {
				if (!member.user) continue;

				const user = member.user;
				const alertPref = user.alertPrefs.find(
					(p) => p.orgId === license.orgId && p.userId === user.id,
				);

				if (!alertPref) continue;

				const thresholdField = thresholdToPrefField(threshold);
				const isThresholdEnabled = alertPref[thresholdField];

				if (!isThresholdEnabled) continue;

				const dedupKey = buildDedupKey(
					"EXPIRATION_ALERT_",
					threshold,
					license.id,
				);

				const alreadySent = await isAlertAlreadySent(user.id, dedupKey);
				if (alreadySent) {
					summary.skippedDuplicate++;
					continue;
				}

				// ── Send email alert ────────────────────────────────────────────
				if (alertPref.alertEmail) {
					try {
						const expirationDateStr =
							license.expirationDate.toLocaleDateString();
						await sendExpirationAlert(user.email, {
							licenseName: license.name,
							expirationDate: expirationDateStr,
							daysUntil,
							licenseType: license.type,
							licenseNumber: license.licenseNumber,
						});
						summary.emailAlertsSent++;
					} catch (err) {
						const msg =
							err instanceof Error
								? err.message
								: "Failed to send license expiration email";
						summary.errors.push(
							`License ${license.id} → ${user.email}: ${msg}`,
						);
					}
				}
			}
		}

		// ── Process Insurance/Bonds (email alerts) ────────────────────────────

		const expiringInsurance = await db.insuranceBond.findMany({
			where: {
				expirationDate: { lte: sixtyDaysFromNow },
				status: { not: "expired" },
			},
			include: {
				org: {
					select: {
						id: true,
						name: true,
						members: {
							where: { userId: { not: null } },
							include: {
								user: {
									include: { alertPrefs: true },
								},
							},
						},
					},
				},
			},
		});

		for (const record of expiringInsurance) {
			const daysUntil = getDaysUntil(record.expirationDate);
			const threshold = getThresholdBucket(daysUntil);

			if (!threshold) continue;

			for (const member of record.org.members) {
				if (!member.user) continue;

				const user = member.user;
				const alertPref = user.alertPrefs.find(
					(p) => p.orgId === record.orgId && p.userId === user.id,
				);

				if (!alertPref) continue;

				const thresholdField = thresholdToPrefField(threshold);
				const isThresholdEnabled = alertPref[thresholdField];

				if (!isThresholdEnabled) continue;

				const dedupKey = buildDedupKey(
					"INSURANCE_ALERT_",
					threshold,
					record.id,
				);

				const alreadySent = await isAlertAlreadySent(user.id, dedupKey);
				if (alreadySent) {
					summary.skippedDuplicate++;
					continue;
				}

				// ── Send email alert ────────────────────────────────────────────
				if (alertPref.alertEmail) {
					try {
						const expirationDateStr =
							record.expirationDate.toLocaleDateString();
						await sendInsuranceExpirationAlert(user.email, {
							name: record.name,
							type: record.type,
							expirationDate: expirationDateStr,
							daysUntil,
							policyNumber: record.policyNumber,
						});
						summary.emailAlertsSent++;
					} catch (err) {
						const msg =
							err instanceof Error
								? err.message
								: "Failed to send insurance expiration email";
						summary.errors.push(
							`Insurance ${record.id} → ${user.email}: ${msg}`,
						);
					}
				}
			}
		}

		return NextResponse.json({
			success: true,
			summary,
			checkedAt: now.toISOString(),
		});
	} catch (error) {
		console.error("Check expirations cron error:", error);
		return NextResponse.json(
			{
				error: "Internal server error",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}

/**
 * GET: Quick status check — returns counts without sending alerts.
 */
export async function GET(request: Request) {
	try {
		const CRON_SECRET = getCronSecret();
		// Require CRON_SECRET for GET as well
		const { searchParams } = new URL(request.url);
		const providedSecret = searchParams.get("secret");
		if (providedSecret !== CRON_SECRET) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
		const now = new Date();
		const fiveDaysFromNow = new Date();
		fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5);
		const thirtyDaysFromNow = new Date();
		thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
		const sixtyDaysFromNow = new Date();
		sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

		const [
			expiredLicenses,
			expiring5dLicenses,
			expiring30dLicenses,
			expiring60dLicenses,
			expiredInsurance,
			expiring5dInsurance,
			expiring30dInsurance,
			expiring60dInsurance,
		] = await Promise.all([
			db.license.count({
				where: { expirationDate: { lt: now }, isRenewed: false },
			}),
			db.license.count({
				where: {
					expirationDate: { gte: now, lte: fiveDaysFromNow },
					isRenewed: false,
				},
			}),
			db.license.count({
				where: {
					expirationDate: { gt: fiveDaysFromNow, lte: thirtyDaysFromNow },
					isRenewed: false,
				},
			}),
			db.license.count({
				where: {
					expirationDate: { gt: thirtyDaysFromNow, lte: sixtyDaysFromNow },
					isRenewed: false,
				},
			}),
			db.insuranceBond.count({
				where: { expirationDate: { lt: now }, status: { not: "expired" } },
			}),
			db.insuranceBond.count({
				where: {
					expirationDate: { gte: now, lte: fiveDaysFromNow },
					status: { not: "expired" },
				},
			}),
			db.insuranceBond.count({
				where: {
					expirationDate: { gt: fiveDaysFromNow, lte: thirtyDaysFromNow },
					status: { not: "expired" },
				},
			}),
			db.insuranceBond.count({
				where: {
					expirationDate: { gt: thirtyDaysFromNow, lte: sixtyDaysFromNow },
					status: { not: "expired" },
				},
			}),
		]);

		// Also get automation status for each org
		const automationSettings = await db.automationSetting.findMany();
		const lastRun =
			automationSettings.length > 0
				? automationSettings.reduce(
						(latest, s) =>
							s.lastRunAt && (!latest || s.lastRunAt > latest)
								? s.lastRunAt
								: latest,
						null as Date | null,
					)
				: null;

		return NextResponse.json({
			licenses: {
				expired: expiredLicenses,
				expiring5Days: expiring5dLicenses,
				expiring30Days: expiring30dLicenses,
				expiring60Days: expiring60dLicenses,
			},
			insurance: {
				expired: expiredInsurance,
				expiring5Days: expiring5dInsurance,
				expiring30Days: expiring30dInsurance,
				expiring60Days: expiring60dInsurance,
			},
			automation: {
				enabledOrgs: automationSettings.filter((s) => s.enabled).length,
				totalOrgs: automationSettings.length,
				lastRunAt: lastRun?.toISOString() || null,
			},
		});
	} catch (error) {
		console.error("Check expirations status error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
