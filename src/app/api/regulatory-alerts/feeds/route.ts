import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import ZAI from "z-ai-web-dev-sdk";

// GET: Check for regulatory changes via web search
export async function GET(request: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const userId = (session.user as any).id;
		const orgMember = await db.orgMember.findFirst({ where: { userId } });
		if (!orgMember) {
			return NextResponse.json(
				{ error: "No organization found" },
				{ status: 404 },
			);
		}

		// Get active watches for this org
		const watches = await db.regulatoryWatch.findMany({
			where: { orgId: orgMember.orgId, isActive: true },
		});

		if (watches.length === 0) {
			return NextResponse.json({
				newAlerts: 0,
				message: "No watched states configured",
			});
		}

		const zai = await ZAI.create();
		const newAlerts: any[] = [];

		for (const watch of watches) {
			try {
				const searchQuery =
					`${watch.state} contractor license regulatory changes 2025 ${watch.licenseType || ""}`.trim();
				const results = await (zai as any).web.search({
					query: searchQuery,
					count: 5,
				});

				// Get existing alert titles for deduplication
				const existingAlerts = await db.regulatoryAlert.findMany({
					where: { orgId: orgMember.orgId, state: watch.state },
					select: { title: true },
				});
				const existingTitles = new Set(existingAlerts.map((a) => a.title));

				for (const result of results as any[]) {
					const title =
						result.title || result.name || "Regulatory Change Detected";
					if (existingTitles.has(title)) continue;

					// Determine severity from content
					const content = (
						result.snippet ||
						result.description ||
						""
					).toLowerCase();
					let severity = "info";
					let changeType = "regulatory_update";

					if (
						content.includes("emergency") ||
						content.includes("immediate") ||
						content.includes("critical")
					) {
						severity = "critical";
					} else if (
						content.includes("deadline") ||
						content.includes("change") ||
						content.includes("update")
					) {
						severity = "warning";
					}

					if (
						content.includes("fee") ||
						content.includes("cost") ||
						content.includes("price")
					) {
						changeType = "fee_change";
					} else if (
						content.includes("deadline") ||
						content.includes("due date")
					) {
						changeType = "deadline_change";
					} else if (
						content.includes("new requirement") ||
						content.includes("new regulation")
					) {
						changeType = "new_requirement";
					} else if (
						content.includes("form") ||
						content.includes("application")
					) {
						changeType = "form_update";
					}

					const alert = await db.regulatoryAlert.create({
						data: {
							orgId: orgMember.orgId,
							state: watch.state,
							licenseType: watch.licenseType,
							title,
							description:
								result.snippet ||
								result.description ||
								"Regulatory change detected via web search",
							changeType,
							severity,
							sourceUrl: result.url || result.link || null,
						},
					});

					newAlerts.push(alert);
				}

				// Update last checked time
				await db.regulatoryWatch.update({
					where: { id: watch.id },
					data: { lastChecked: new Date() },
				});
			} catch (searchError) {
				console.error(`Search error for ${watch.state}:`, searchError);
				// Continue with other watches even if one fails
			}
		}

		// Create audit log
		await db.auditLog.create({
			data: {
				orgId: orgMember.orgId,
				userId,
				action: "check_updates",
				entityType: "regulatory_alert",
				entityName: "Regulatory Feed Check",
				details: `Checked for updates across ${watches.length} watched states, found ${newAlerts.length} new alerts`,
			},
		});

		return NextResponse.json({
			newAlerts: newAlerts.length,
			alerts: newAlerts,
		});
	} catch (error) {
		console.error("Regulatory feed check error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
