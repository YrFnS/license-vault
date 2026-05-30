import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

function computeInsuranceStatus(expirationDate: Date): string {
	const now = new Date();
	const thirtyDaysFromNow = new Date();
	thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
	if (expirationDate < now) return "expired";
	if (expirationDate <= thirtyDaysFromNow) return "expiring_soon";
	return "active";
}

// GET: Check all insurance against project requirements and return deficiencies
export async function GET() {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const userId = (session.user as any).id;

		const orgMember = await db.orgMember.findFirst({
			where: { userId },
		});

		if (!orgMember) {
			return NextResponse.json(
				{ error: "No organization found" },
				{ status: 404 },
			);
		}

		const orgId = orgMember.orgId;

		// Get all insurance/bond records
		const insuranceBonds = await db.insuranceBond.findMany({
			where: { orgId },
		});

		// Get all projects with insurance requirements
		const projects = await db.project.findMany({
			where: { orgId, status: "active" },
		});

		const deficiencies: Array<{
			insuranceId: string;
			insuranceName: string;
			type: string;
			policyNumber: string;
			projectId: string | null;
			projectName: string | null;
			deficiencyType: string;
			details: string;
			severity: "critical" | "warning" | "info";
		}> = [];

		// Check each insurance record for COI deficiencies
		for (const ib of insuranceBonds) {
			const computedStatus = computeInsuranceStatus(ib.expirationDate);

			// Check expiration
			if (computedStatus === "expired") {
				deficiencies.push({
					insuranceId: ib.id,
					insuranceName: ib.name,
					type: ib.type,
					policyNumber: ib.policyNumber,
					projectId: null,
					projectName: null,
					deficiencyType: "expired",
					details: `Policy expired on ${ib.expirationDate.toLocaleDateString()}`,
					severity: "critical",
				});
			} else if (computedStatus === "expiring_soon") {
				deficiencies.push({
					insuranceId: ib.id,
					insuranceName: ib.name,
					type: ib.type,
					policyNumber: ib.policyNumber,
					projectId: null,
					projectName: null,
					deficiencyType: "expiring_soon",
					details: `Policy expires on ${ib.expirationDate.toLocaleDateString()}`,
					severity: "warning",
				});
			}

			// Check COI-specific deficiencies for insurance/certificate types
			if (ib.type === "insurance" || ib.type === "certificate") {
				const endorsements: string[] = (() => {
					try {
						const parsed = JSON.parse(ib.endorsementTypes || "[]");
						return Array.isArray(parsed) ? parsed : [];
					} catch {
						return [];
					}
				})();

				// Missing additional insured
				if (!ib.additionalInsured) {
					deficiencies.push({
						insuranceId: ib.id,
						insuranceName: ib.name,
						type: ib.type,
						policyNumber: ib.policyNumber,
						projectId: null,
						projectName: null,
						deficiencyType: "missing_additional_insured",
						details: "No additional insured specified on COI",
						severity: "warning",
					});
				}

				// Missing primary & noncontributory
				if (!ib.primaryNoncontrib) {
					deficiencies.push({
						insuranceId: ib.id,
						insuranceName: ib.name,
						type: ib.type,
						policyNumber: ib.policyNumber,
						projectId: null,
						projectName: null,
						deficiencyType: "missing_primary_noncontributory",
						details: "Primary & Noncontributory endorsement not confirmed",
						severity: "warning",
					});
				}

				// Missing waiver of subrogation
				if (!ib.waiverSubrogation) {
					deficiencies.push({
						insuranceId: ib.id,
						insuranceName: ib.name,
						type: ib.type,
						policyNumber: ib.policyNumber,
						projectId: null,
						projectName: null,
						deficiencyType: "missing_waiver_of_subrogation",
						details: "Waiver of Subrogation endorsement not confirmed",
						severity: "warning",
					});
				}

				// Missing common endorsements
				const requiredEndorsements = ["CG 20 10", "CG 20 37"];
				for (const req of requiredEndorsements) {
					if (!endorsements.includes(req)) {
						deficiencies.push({
							insuranceId: ib.id,
							insuranceName: ib.name,
							type: ib.type,
							policyNumber: ib.policyNumber,
							projectId: null,
							projectName: null,
							deficiencyType: "missing_endorsement",
							details: `Missing endorsement: ${req}`,
							severity: "info",
						});
					}
				}

				// Zero coverage limits
				if (ib.perOccurrenceLimit === 0) {
					deficiencies.push({
						insuranceId: ib.id,
						insuranceName: ib.name,
						type: ib.type,
						policyNumber: ib.policyNumber,
						projectId: null,
						projectName: null,
						deficiencyType: "missing_per_occurrence",
						details: "Per occurrence coverage limit is $0",
						severity: "warning",
					});
				}

				if (ib.aggregateLimit === 0) {
					deficiencies.push({
						insuranceId: ib.id,
						insuranceName: ib.name,
						type: ib.type,
						policyNumber: ib.policyNumber,
						projectId: null,
						projectName: null,
						deficiencyType: "missing_aggregate",
						details: "Aggregate coverage limit is $0",
						severity: "warning",
					});
				}
			}

			// Check against project requirements
			for (const project of projects) {
				if (
					project.requiredInsurance &&
					ib.coverageAmount < (project.requiredInsurance as unknown as number)
				) {
					if (ib.type === "insurance") {
						deficiencies.push({
							insuranceId: ib.id,
							insuranceName: ib.name,
							type: ib.type,
							policyNumber: ib.policyNumber,
							projectId: project.id,
							projectName: project.name,
							deficiencyType: "insufficient_coverage",
							details: `Coverage $${ib.coverageAmount.toLocaleString()} is below project requirement for "${project.name}"`,
							severity: "critical",
						});
					}
				}
			}
		}

		// Check for projects requiring insurance with no active policies
		for (const project of projects) {
			if (project.requiredInsurance) {
				const hasActiveInsurance = insuranceBonds.some(
					(ib) =>
						ib.type === "insurance" &&
						computeInsuranceStatus(ib.expirationDate) === "active",
				);
				if (!hasActiveInsurance) {
					deficiencies.push({
						insuranceId: "",
						insuranceName: "",
						type: "insurance",
						policyNumber: "",
						projectId: project.id,
						projectName: project.name,
						deficiencyType: "no_active_insurance",
						details: `Project "${project.name}" requires insurance but no active policy exists`,
						severity: "critical",
					});
				}
			}

			if ((project as any).bondRequired && (project as any).bondAmount > 0) {
				const hasActiveBond = insuranceBonds.some(
					(ib) =>
						ib.type === "bond" &&
						computeInsuranceStatus(ib.expirationDate) === "active" &&
						ib.coverageAmount >= (project as any).bondAmount,
				);
				if (!hasActiveBond) {
					deficiencies.push({
						insuranceId: "",
						insuranceName: "",
						type: "bond",
						policyNumber: "",
						projectId: project.id,
						projectName: project.name,
						deficiencyType: "insufficient_bond",
						details: `Project "${project.name}" requires a bond of $${((project as any).bondAmount as number).toLocaleString()} but no active qualifying bond exists`,
						severity: "critical",
					});
				}
			}
		}

		const summary = {
			total: deficiencies.length,
			critical: deficiencies.filter((d) => d.severity === "critical").length,
			warning: deficiencies.filter((d) => d.severity === "warning").length,
			info: deficiencies.filter((d) => d.severity === "info").length,
		};

		return NextResponse.json({ deficiencies, summary });
	} catch (error) {
		console.error("Get insurance deficiencies error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
