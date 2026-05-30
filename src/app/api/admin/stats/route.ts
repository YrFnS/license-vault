import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET: Admin stats for real data-driven charts
export async function GET() {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const userId = (session.user as any).id;

		// Find user's org membership and check admin role
		const orgMember = await db.orgMember.findFirst({
			where: { userId },
		});

		if (!orgMember) {
			return NextResponse.json(
				{ error: "No organization found" },
				{ status: 404 },
			);
		}

		// Only allow owners/admins
		if (!["owner", "admin"].includes(orgMember.role)) {
			return NextResponse.json({ error: "Access denied" }, { status: 403 });
		}

		const orgId = orgMember.orgId;
		const now = new Date();
		const thirtyDaysFromNow = new Date();
		thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

		// Count users in org
		const totalUsers = await db.orgMember.count({
			where: { orgId },
		});

		// Count organizations (just 1 for this org)
		const totalOrganizations = 1;

		// Get all licenses for the org
		const licenses = await db.license.findMany({
			where: { orgId },
			orderBy: { createdAt: "desc" },
		});

		const totalLicenses = licenses.length;
		const activeCount = licenses.filter(
			(l) => l.expirationDate > thirtyDaysFromNow,
		).length;
		const expiringCount = licenses.filter(
			(l) => l.expirationDate >= now && l.expirationDate <= thirtyDaysFromNow,
		).length;
		const expiredCount = licenses.filter((l) => l.expirationDate < now).length;

		// License distribution by status
		const licenseDistribution = [
			{ name: "active", value: activeCount, color: "#10b981" },
			{ name: "expiring", value: expiringCount, color: "#f59e0b" },
			{ name: "expired", value: expiredCount, color: "#ef4444" },
		];

		// License distribution by type (real data from DB)
		const typeMap = new Map<string, number>();
		for (const license of licenses) {
			const type = license.type || "Other";
			typeMap.set(type, (typeMap.get(type) || 0) + 1);
		}
		const licenseTypeDistribution = Array.from(typeMap.entries())
			.map(([type, count]) => ({ type, count }))
			.sort((a, b) => b.count - a.count);

		// Monthly signups trend (users joining the org over last 6 months)
		const monthlySignups: Array<{ month: string; signups: number }> = [];
		for (let i = 5; i >= 0; i--) {
			const monthDate = new Date();
			monthDate.setMonth(monthDate.getMonth() - i);
			const year = monthDate.getFullYear();
			const month = monthDate.getMonth();
			const monthStart = new Date(year, month, 1);
			const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);

			const orgMembers = await db.orgMember.findMany({
				where: {
					orgId,
					joinedAt: {
						gte: monthStart,
						lte: monthEnd,
					},
				},
			});

			const monthLabel = monthDate.toLocaleString("en-US", { month: "short" });
			monthlySignups.push({ month: monthLabel, signups: orgMembers.length });
		}

		// Compliance trend over last 6 months
		// Calculate based on what the compliance rate *was* at the end of each month
		// (licenses that hadn't expired by end of that month vs total that existed then)
		const complianceTrend: Array<{ month: string; rate: number }> = [];
		for (let i = 5; i >= 0; i--) {
			const monthDate = new Date();
			monthDate.setMonth(monthDate.getMonth() - i);
			const year = monthDate.getFullYear();
			const month = monthDate.getMonth();
			const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);

			// Licenses that existed by end of that month
			const licensesByMonthEnd = licenses.filter(
				(l) => new Date(l.createdAt) <= monthEnd,
			);
			const totalByMonthEnd = licensesByMonthEnd.length;

			if (totalByMonthEnd === 0) {
				const monthLabel = monthDate.toLocaleString("en-US", {
					month: "short",
				});
				complianceTrend.push({ month: monthLabel, rate: 100 });
			} else {
				const notExpiredByMonthEnd = licensesByMonthEnd.filter(
					(l) => l.expirationDate > monthEnd,
				).length;
				const rate = Math.round((notExpiredByMonthEnd / totalByMonthEnd) * 100);
				const monthLabel = monthDate.toLocaleString("en-US", {
					month: "short",
				});
				complianceTrend.push({ month: monthLabel, rate });
			}
		}

		// Recent activity count (audit logs in last 30 days)
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

		const recentActivityCount = await db.auditLog.count({
			where: {
				orgId,
				createdAt: { gte: thirtyDaysAgo },
			},
		});

		return NextResponse.json({
			totalUsers,
			totalOrganizations,
			totalLicenses,
			licenseDistribution,
			licenseTypeDistribution,
			monthlySignups,
			complianceTrend,
			recentActivityCount,
		});
	} catch (error) {
		console.error("Admin stats error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
