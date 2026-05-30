import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
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

		const orgId = orgMember.orgId;
		const now = new Date();

		// Get org with primaryState
		const org = await db.organization.findUnique({
			where: { id: orgId },
		});

		// Get all licenses and projects
		const licenses = await db.license.findMany({ where: { orgId } });
		const projects = await db.project.findMany({
			where: { orgId, status: "active" },
		});

		// Get state requirements for reciprocity
		const stateRequirements = await db.stateRequirement.findMany();

		const recommendations: {
			type: "expired_active" | "reciprocity" | "missing" | "consolidation";
			severity: "high" | "medium" | "low";
			title: string;
			description: string;
			state?: string;
		}[] = [];

		// 1. Check for expired licenses in states with active projects
		const activeProjectStates = new Set(
			projects.map((p) => p.state).filter((s): s is string => !!s),
		);
		const expiredLicenses = licenses.filter((l) => l.expirationDate < now);

		for (const license of expiredLicenses) {
			if (license.state && activeProjectStates.has(license.state)) {
				recommendations.push({
					type: "expired_active",
					severity: "high",
					title: "expiredInActiveState",
					description: `"${license.name}" expired in ${license.state} which has active projects`,
					state: license.state,
				});
			}
		}

		// 2. Check for reciprocity opportunities
		const licenseStates = new Set(
			licenses
				.filter((l) => l.expirationDate > now)
				.map((l) => l.state)
				.filter(Boolean),
		);
		for (const req of stateRequirements) {
			if (req.reciprocityStates) {
				try {
					const reciprocityList = JSON.parse(req.reciprocityStates) as string[];
					for (const licensedState of licenseStates) {
						if (reciprocityList.includes(licensedState as string)) {
							// Check if we don't already have a license in the target state
							if (!licenseStates.has(req.state)) {
								recommendations.push({
									type: "reciprocity",
									severity: "medium",
									title: "reciprocityOpportunity",
									description: `${licensedState} license can cover ${req.state} operations via reciprocity`,
									state: req.state,
								});
							}
						}
					}
				} catch {
					// Skip invalid JSON
				}
			}
		}

		// 3. Check for missing licenses in active project states
		for (const state of activeProjectStates) {
			if (!licenseStates.has(state)) {
				recommendations.push({
					type: "missing",
					severity: "high",
					title: "missingLicense",
					description: `General Contractor license may be required for operations in ${state}`,
					state,
				});
			}
		}

		// 4. Check for NASCLA consolidation opportunities
		const nasclaStates = stateRequirements.filter((sr) => sr.nasclaAccepted);
		if (nasclaStates.length >= 2) {
			const nasclaStateNames = nasclaStates.map((s) => s.state);
			const overlappingLicenses = licenses.filter(
				(l) =>
					l.expirationDate > now &&
					l.state &&
					nasclaStateNames.includes(l.state),
			);
			if (overlappingLicenses.length >= 2) {
				recommendations.push({
					type: "consolidation",
					severity: "low",
					title: "consolidationPossible",
					description: `${overlappingLicenses.length} licenses can potentially be consolidated via NASCLA exam across ${nasclaStateNames.join(", ")}`,
				});
			}
		}

		// State coverage analysis
		const usStates = [
			"AL",
			"AK",
			"AZ",
			"AR",
			"CA",
			"CO",
			"CT",
			"DE",
			"FL",
			"GA",
			"HI",
			"ID",
			"IL",
			"IN",
			"IA",
			"KS",
			"KY",
			"LA",
			"ME",
			"MD",
			"MA",
			"MI",
			"MN",
			"MS",
			"MO",
			"MT",
			"NE",
			"NV",
			"NH",
			"NJ",
			"NM",
			"NY",
			"NC",
			"ND",
			"OH",
			"OK",
			"OR",
			"PA",
			"RI",
			"SC",
			"SD",
			"TN",
			"TX",
			"UT",
			"VT",
			"VA",
			"WA",
			"WV",
			"WI",
			"WY",
			"DC",
		];

		const coveredStates: string[] = [];
		const uncoveredStates: string[] = [];

		for (const state of usStates) {
			const hasActive = licenses.some(
				(l) => l.state === state && l.expirationDate > now,
			);
			const hasProject = projects.some((p) => p.state === state);
			if (hasActive) {
				coveredStates.push(state);
			} else if (hasProject) {
				uncoveredStates.push(state);
			}
		}

		return NextResponse.json({
			recommendations: recommendations.slice(0, 10),
			coverage: {
				coveredStates,
				uncoveredStates,
				totalStates: usStates.length,
				coveragePercent: Math.round(
					(coveredStates.length / usStates.length) * 100,
				),
			},
		});
	} catch (error) {
		console.error("Portfolio analytics error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
