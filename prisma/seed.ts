import { Prisma, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const now = new Date();
const days = (value: number) => new Date(now.getTime() + value * 86_400_000);
const json = JSON.stringify;

async function main() {
	console.log("Seeding License Vault demo data...");
	const password = await bcrypt.hash("DemoPass123!", 12);

	const systemOrg = await prisma.organization.create({
		data: { id: "system", name: "System", tradeType: "general", primaryState: "US", plan: "enterprise" },
	});
	const org = await prisma.organization.create({
		data: {
			id: "demo-org",
			name: "Acme Construction Co.",
			companyName: "Acme Construction Co.",
			tradeType: "general",
			primaryState: "CA",
			plan: "professional",
			primaryColor: "#10b981",
			logoUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80",
			brandingConfig: json({ loginMessage: "Welcome to the Acme compliance portal" }),
		},
	});
	await prisma.organization.create({
		data: { id: "demo-subsidiary", name: "Acme Southwest", primaryState: "AZ", plan: "free", parentId: org.id },
	});

	const users = await Promise.all(
		[
			["owner@licensevault.com", "Olivia Owner", "owner"],
			["admin@licensevault.com", "Alex Admin", "admin"],
			["member@licensevault.com", "Morgan Member", "member"],
			["demo@licensevault.com", "Demo User", "owner"],
		].map(async ([email, name, role]) => {
			const user = await prisma.user.create({ data: { email, name, password } });
			await prisma.orgMember.create({
				data: { orgId: org.id, userId: user.id, email, fullName: name, role, joinedAt: days(-120) },
			});
			return user;
		}),
	);
	const [owner, admin, member, demo] = users;
	await prisma.orgMember.create({
		data: { orgId: org.id, email: "invited@licensevault.com", fullName: "Invited User", role: "member" },
	});

	await prisma.checklistTemplate.createMany({
		data: [
			{ id: "default-license-renewal", orgId: systemOrg.id, name: "License Renewal Checklist", category: "license_renewal", isDefault: true, items: json([{ id: "verify", label: "Verify license", required: true }]) },
			{ id: "default-onboarding", orgId: systemOrg.id, name: "Organization Onboarding", category: "onboarding", isDefault: true, items: json([{ id: "team", label: "Invite team", required: false }]) },
			{ id: "demo-audit", orgId: org.id, name: "Quarterly Audit", category: "audit", items: json([{ id: "docs", label: "Review documents", required: true }]) },
		],
	});

	const locations = await Promise.all([
		prisma.location.create({ data: { orgId: org.id, name: "Main Office", city: "Sacramento", state: "CA", zip: "95814" } }),
		prisma.location.create({ data: { orgId: org.id, name: "Phoenix Operations", city: "Phoenix", state: "AZ", zip: "85001" } }),
	]);
	const licenseRows = [
		["California General Contractor", "general", "GC-CA-001", "CA CSLB", "CA", days(-365), days(365), locations[0].id],
		["California Electrical", "electrical", "EL-CA-002", "CA CSLB", "CA", days(-600), days(20), locations[0].id],
		["Arizona HVAC", "hvac", "HV-AZ-003", "AZ ROC", "AZ", days(-730), days(-30), locations[1].id],
		["Unassigned Florida Plumbing", "plumbing", "PL-FL-004", "FL DBPR", "FL", days(-60), days(120), null],
	] as const;
	const licenses = await Promise.all(
		licenseRows.map(([name, type, licenseNumber, issuedBy, state, issueDate, expirationDate, locationId], index) =>
			prisma.license.create({
				data: { orgId: org.id, name, type, licenseNumber, issuedBy, state, issueDate, expirationDate, locationId, createdById: owner.id, autoRenew: index === 0, isRenewed: index === 0, renewalDate: index === 0 ? days(-5) : null },
			}),
		),
	);

	const qualifiers = await Promise.all([
		prisma.qualifier.create({ data: { orgId: org.id, firstName: "Jordan", lastName: "Lee", email: "jordan@example.test", licenseNumber: "Q-CA-1", licenseState: "CA", licenseType: "general", licenseExpiry: days(400), ceHoursEarned: 12, ceHoursRequired: 16, status: "active" } }),
		prisma.qualifier.create({ data: { orgId: org.id, firstName: "Casey", lastName: "Diaz", email: "casey@example.test", status: "inactive", licenseExpiry: days(-10) } }),
	]);
	await prisma.qualifierLicense.create({ data: { qualifierId: qualifiers[0].id, licenseId: licenses[0].id, role: "qualifier" } });
	await prisma.cETracking.createMany({
		data: [
			{ orgId: org.id, licenseId: licenses[0].id, courseName: "Safety Code Update", provider: "Builders Institute", hoursEarned: 8, hoursRequired: 16, completionDate: days(-30), category: "safety" },
			{ orgId: org.id, licenseId: licenses[0].id, courseName: "Ethics", provider: "State Board", hoursEarned: 4, hoursRequired: 16, completionDate: days(-10), category: "ethics" },
		],
	});
	await prisma.licenseDocument.create({
		data: { orgId: org.id, licenseId: licenses[0].id, fileName: "gc-license.pdf", fileType: "application/pdf", fileSize: 2048, filePath: "/demo/gc-license.pdf", category: "certificate", uploadedBy: owner.id },
	});

	const subcontractors = await Promise.all([
		prisma.subcontractor.create({ data: { orgId: org.id, companyName: "Desert Sun Electric", contactName: "Bob Wilson", email: "bob@example.test", licenseNumber: "NV-E-101", licenseState: "NV", licenseExpiry: days(300), insuranceExpiry: days(200), insuranceStatus: "compliant", complianceStatus: "compliant", status: "active", tradeType: "electrical", insuranceAmount: 2_000_000, portalToken: "demo-portal-active", portalExpiresAt: days(30) } }),
		prisma.subcontractor.create({ data: { orgId: org.id, companyName: "Expired Roofing", contactName: "Riley Chen", email: "riley@example.test", licenseNumber: "CA-R-202", licenseState: "CA", licenseExpiry: days(-20), insuranceExpiry: days(-5), insuranceStatus: "expired", complianceStatus: "non_compliant", status: "inactive", tradeType: "roofing", portalToken: "demo-portal-expired", portalExpiresAt: days(-1) } }),
	]);
	await prisma.subcontractorDocument.createMany({
		data: [
			{ orgId: org.id, subcontractorId: subcontractors[0].id, fileName: "coi.pdf", fileType: "application/pdf", fileSize: 4096, filePath: "/demo/coi.pdf", category: "insurance", reviewStatus: "approved", reviewedBy: admin.id, reviewedAt: days(-2) },
			{ orgId: org.id, subcontractorId: subcontractors[1].id, fileName: "expired-coi.pdf", fileType: "application/pdf", fileSize: 1024, filePath: "/demo/expired-coi.pdf", category: "insurance", reviewStatus: "rejected", reviewedBy: admin.id, reviewedAt: days(-1), reviewNotes: "Expired policy" },
		],
	});

	const projects = await Promise.all([
		prisma.project.create({ data: { orgId: org.id, name: "Sacramento Medical Center", clientName: "Sacramento Health", clientEmail: "client@example.test", state: "CA", location: "Sacramento, CA", startDate: days(-90), endDate: days(300), status: "active", complianceScore: 92, requiredLicenses: json(["general"]), requiredInsurance: json(["general_liability"]) } }),
		prisma.project.create({ data: { orgId: org.id, name: "Completed Data Center", state: "AZ", startDate: days(-500), endDate: days(-30), status: "completed", complianceScore: 100 } }),
	]);
	await prisma.projectLicense.createMany({
		data: [
			{ projectId: projects[0].id, licenseId: licenses[0].id, verified: true, verifiedAt: days(-7) },
			{ projectId: projects[0].id, licenseId: licenses[1].id, verified: false, notes: "Renewal pending" },
		],
	});
	await prisma.projectSubcontractor.createMany({
		data: [
			{ projectId: projects[0].id, subcontractorId: subcontractors[0].id, role: "electrical", complianceStatus: "compliant", lastChecked: days(-1) },
			{ projectId: projects[0].id, subcontractorId: subcontractors[1].id, role: "roofing", complianceStatus: "non_compliant", lastChecked: days(-1) },
		],
	});

	await prisma.insuranceBond.createMany({
		data: [
			{ orgId: org.id, name: "General Liability", policyNumber: "GL-001", provider: "Liberty Mutual", coverageAmount: 2_000_000, premiumAmount: 15_000, issueDate: days(-180), expirationDate: days(180), status: "active", complianceStatus: "compliant", requiredCoverage: 1_000_000 },
			{ orgId: org.id, name: "Expired Bond", type: "bond", policyNumber: "BOND-002", provider: "Surety Co", coverageAmount: 100_000, issueDate: days(-400), expirationDate: days(-10), status: "expired", complianceStatus: "deficient" },
		],
	});
	await prisma.stateRequirement.createMany({
		data: [
			{ state: "CA", licenseType: "general", renewPeriodMonths: 24, ceHoursRequired: 16, renewalFeeMin: 450, renewalFeeMax: 650, bondRequired: true, bondAmountMin: 25_000, insuranceRequired: true, boardName: "California CSLB", nasclaAccepted: false, reciprocityStates: json(["AZ", "NV"]) },
			{ state: "AZ", licenseType: "hvac", renewPeriodMonths: 24, ceHoursRequired: 8, renewalFeeMin: 300, renewalFeeMax: 500, bondRequired: true, bondAmountMin: 10_000, insuranceRequired: true, boardName: "Arizona ROC", nasclaAccepted: true },
		],
	});

	await prisma.alertPreference.createMany({ data: users.map((user, index) => ({ orgId: org.id, userId: user.id, alertEmail: index !== 2, alertInApp: true, alertEmailFrequency: index === 0 ? "immediate" : "daily" })) });
	await prisma.notification.createMany({ data: [{ orgId: org.id, userId: owner.id, title: "License expiring", message: "California Electrical expires in 20 days", read: false }, { orgId: org.id, userId: owner.id, title: "Policy verified", message: "General Liability verified", read: true }] });
	await prisma.auditLog.createMany({ data: [{ orgId: org.id, userId: owner.id, action: "LICENSE_CREATED", entityType: "License", entityId: licenses[0].id, entityName: licenses[0].name }, { orgId: org.id, userId: admin.id, action: "DOCUMENT_REJECTED", entityType: "SubcontractorDocument", details: "Expired policy" }] });
	await prisma.complianceShare.create({ data: { orgId: org.id, token: "demo-compliance-share", createdBy: owner.id } });
	await prisma.aiChatMessage.createMany({ data: [{ userId: demo.id, role: "user", content: "Which licenses expire soon?" }, { userId: demo.id, role: "assistant", content: "California Electrical expires in 20 days." }] });
	await prisma.passwordResetToken.createMany({ data: [{ userId: member.id, token: "demo-reset-valid", expiresAt: days(1) }, { userId: admin.id, token: "demo-reset-used", expiresAt: days(-1), usedAt: days(-2) }] });

	await prisma.approvalWorkflow.createMany({ data: [{ orgId: org.id, title: "Electrical renewal", status: "pending", priority: "high", entityId: licenses[1].id, entityType: "license", requestedBy: member.id }, { orgId: org.id, title: "General renewal approved", status: "approved", priority: "medium", entityId: licenses[0].id, entityType: "license", requestedBy: member.id, reviewedBy: admin.id, reviewedAt: days(-2), reviewNotes: "Approved" }] });
	await prisma.apiKey.create({ data: { orgId: org.id, name: "Demo read-only key", keyHash: "demo-key-hash-not-a-real-secret", keyPrefix: "lv_demo", permissions: "read", lastUsedAt: days(-1), expiresAt: days(90) } });
	await prisma.webhook.create({ data: { orgId: org.id, name: "Disabled demo webhook", url: "https://example.invalid/webhooks/license-vault", events: json(["license.expiring"]), secret: "demo-encrypted-placeholder", isActive: false } });
	await prisma.automationRun.createMany({ data: [{ orgId: org.id, type: "full_check", status: "completed", results: json({ checked: 4, alerts: 2 }), startedAt: days(-1), completedAt: days(-1) }, { orgId: org.id, type: "expiration_check", status: "failed", results: json({ error: "Demo failure" }), startedAt: days(-2), completedAt: days(-2) }] });
	await prisma.emailLog.createMany({ data: [{ orgId: org.id, to: "owner@licensevault.com", subject: "Compliance digest", status: "sent", sentAt: days(-1) }, { orgId: org.id, to: "invalid@example.test", subject: "Failed demo email", status: "failed", error: "Demo delivery failure" }] });
	await prisma.automationSetting.create({ data: { orgId: org.id, enabled: true, checkFrequency: "daily", lastRunAt: days(-1), nextRunAt: days(1) } });

	const applications = await Promise.all([
		prisma.licenseApplication.create({ data: { orgId: org.id, userId: owner.id, licenseType: "general", state: "NV", applicantName: "Olivia Owner", businessName: org.name, applicationType: "new", status: "draft", estimatedCost: 550, targetDate: days(45), checklistData: json([{ item: "Identity", complete: true }]) } }),
		prisma.licenseApplication.create({ data: { orgId: org.id, userId: admin.id, licenseType: "electrical", state: "CA", applicantName: "Alex Admin", businessName: org.name, applicationType: "renewal", status: "submitted", submittedDate: days(-5), estimatedCost: 450, actualCost: 450 } }),
		prisma.licenseApplication.create({ data: { orgId: org.id, userId: member.id, licenseType: "plumbing", state: "AZ", applicantName: "Morgan Member", businessName: org.name, applicationType: "new", status: "denied", denialReason: "Missing experience documentation" } }),
	]);
	await prisma.licenseApplicationDocument.create({ data: { applicationId: applications[1].id, fileName: "renewal-form.pdf", fileType: "application/pdf", fileSize: 3000, filePath: "/demo/renewal-form.pdf", category: "application", required: true } });
	await prisma.checklistInstance.createMany({ data: [{ orgId: org.id, templateId: "demo-audit", entityType: "project", entityId: projects[0].id, title: "Medical Center Audit", status: "in_progress", items: json([{ id: "docs", complete: false }]), completedCount: 0, totalCount: 1, dueDate: days(14) }, { orgId: org.id, templateId: "default-license-renewal", entityType: "license", entityId: licenses[0].id, title: "Completed renewal", status: "completed", items: json([{ id: "verify", complete: true }]), completedCount: 1, totalCount: 1, completedAt: days(-5) }] });
	await prisma.documentScan.createMany({ data: [{ orgId: org.id, userId: admin.id, fileName: "scanned-license.pdf", fileType: "application/pdf", fileSize: 5000, documentType: "license", extractedData: json({ licenseNumber: "GC-CA-001" }), rawText: "Demo extracted license text", confidence: 0.98, status: "completed" }, { orgId: org.id, userId: member.id, fileName: "low-confidence.jpg", fileType: "image/jpeg", fileSize: 2500, documentType: "auto", extractedData: json({}), confidence: 0.25, status: "needs_review" }] });
	await prisma.examTracking.createMany({ data: [{ orgId: org.id, qualifierId: qualifiers[0].id, examType: "nascla_general", examName: "NASCLA General", examProvider: "NASCLA", state: "CA", status: "passed", examDate: days(-100), score: 88, passingScore: 70, resultsReceived: days(-98) }, { orgId: org.id, qualifierId: qualifiers[1].id, examType: "state_specific", examName: "Arizona Statutes", state: "AZ", status: "scheduled", examDate: days(20), studyHours: 12 }] });

	const entity = await prisma.businessEntity.create({ data: { orgId: org.id, name: "Acme Construction LLC", entityType: "llc", formationState: "CA", formationDate: days(-2000), ein: "00-0000000", entityStatus: "active", annualReportDue: days(60), complianceScore: 95 } });
	await prisma.businessEntity.create({ data: { orgId: org.id, name: "Acme Legacy Division", entityType: "corporation", formationState: "NV", entityStatus: "dissolved", parentId: entity.id, complianceScore: 20 } });
	await prisma.entityLicense.create({ data: { entityId: entity.id, licenseId: licenses[0].id, role: "holder" } });

	const definition = await prisma.workflowDefinition.create({ data: { orgId: org.id, name: "License Renewal Approval", category: "license_renewal", triggerType: "manual", steps: json([{ id: "review", name: "Admin review", type: "approval", assignee: "admin", order: 0 }, { id: "complete", name: "Complete", type: "action", assignee: "owner", order: 1 }]) } });
	await prisma.workflowInstance.createMany({ data: [{ orgId: org.id, definitionId: definition.id, entityType: "license", entityId: licenses[1].id, currentStep: 0, status: "active", variables: json({ priority: "high" }) }, { orgId: org.id, definitionId: definition.id, entityType: "license", entityId: licenses[0].id, currentStep: 2, status: "completed", completedAt: days(-3), stepHistory: json([{ stepId: "review", action: "approved", userId: admin.id }]) }, { orgId: org.id, definitionId: definition.id, entityType: "license", entityId: licenses[2].id, currentStep: 0, status: "cancelled", completedAt: days(-1) }] });
	await prisma.regulatoryAlert.createMany({ data: [{ orgId: org.id, state: "CA", licenseType: "general", title: "Renewal fee update", description: "Demo regulatory update", changeType: "fee_change", severity: "warning", effectiveDate: days(30), isRead: false }, { orgId: org.id, state: "AZ", title: "New form available", description: "Demo informational update", changeType: "form_update", severity: "info", isRead: true }] });
	await prisma.regulatoryWatch.createMany({ data: [{ orgId: org.id, state: "CA", licenseType: "general", lastChecked: days(-1) }, { orgId: org.id, state: "AZ", licenseType: null, isActive: false }] });
	await prisma.generatedDocument.create({ data: { orgId: org.id, userId: owner.id, template: "compliance_certificate", inputData: json({ projectId: projects[0].id }), content: "<h1>Demo Compliance Certificate</h1>", format: "html" } });
	await prisma.signatureRequest.createMany({ data: [{ orgId: org.id, documentTitle: "Compliance Attestation", documentType: "compliance_cert", requestedById: owner.id, requestedToName: "Client Signer", requestedToEmail: "signer@example.test", status: "pending", signingToken: "demo-sign-pending", expiresAt: days(7) }, { orgId: org.id, documentTitle: "Signed Renewal", documentType: "license_renewal", requestedById: admin.id, requestedToName: "Olivia Owner", requestedToEmail: owner.email, status: "signed", signingToken: "demo-sign-signed", signedAt: days(-2), signerName: "Olivia Owner", signatureData: json({ type: "type", value: "Olivia Owner" }) }] });
	await prisma.contractorDirectory.createMany({ data: [{ orgId: org.id, companyName: "Trusted Electric", tradeType: "electrical", licenseNumber: "CA-E-900", licenseState: "CA", licenseStatus: "active", licenseExpiry: days(300), contactName: "Taylor Kim", contactEmail: "taylor@example.test", state: "CA", insuranceStatus: "compliant", complianceScore: 98, rating: 4.9, reviewCount: 32, isVerified: true, isPreferred: true, specialties: json(["healthcare"]) }, { orgId: org.id, companyName: "Blocked Demo Vendor", tradeType: "roofing", licenseStatus: "revoked", insuranceStatus: "expired", complianceScore: 5, isBlacklisted: true, notes: "Demo risk edge case" }] });

	const integration = await prisma.integration.create({ data: { orgId: org.id, name: "Procore Demo", type: "procore", category: "construction_erp", status: "connected", config: json({ mode: "demo", syncFrequency: "daily" }), lastSyncAt: days(-1), lastSyncStatus: "success", syncCount: 4 } });
	await prisma.integration.create({ data: { orgId: org.id, name: "QuickBooks Demo", type: "quickbooks", category: "accounting", status: "error", lastSyncStatus: "failed", errorCount: 2, lastError: "Demo expired connection" } });
	await prisma.integrationSyncLog.createMany({ data: [{ integrationId: integration.id, orgId: org.id, type: "manual", status: "completed", recordsSynced: 25, startedAt: days(-1), completedAt: days(-1) }, { integrationId: integration.id, orgId: org.id, type: "incremental", status: "failed", errors: json(["Demo record rejected"]), startedAt: days(-2), completedAt: days(-2) }] });
	await prisma.boardSubmission.createMany({ data: [{ orgId: org.id, submissionType: "renewal", licenseId: licenses[1].id, qualifierId: qualifiers[0].id, state: "CA", boardName: "California CSLB", status: "ready", filingFee: 450, feePaid: true, priority: "high", checklistData: json([{ item: "Form", completed: true }]) }, { orgId: org.id, submissionType: "new_license", state: "AZ", boardName: "Arizona ROC", status: "rejected", boardResponse: "Demo missing attachment", priority: "normal" }] });
	await prisma.vendorScore.createMany({ data: [{ orgId: org.id, subcontractorId: subcontractors[0].id, vendorName: subcontractors[0].companyName, vendorEmail: subcontractors[0].email, overallScore: 94, riskLevel: "low", licenseScore: 100, insuranceScore: 95, documentScore: 90, complianceScore: 95, experienceScore: 90, responsivenessScore: 94, licenseVerified: true, insuranceVerified: true, coiOnFile: true, requiredDocs: 2, submittedDocs: 2, totalProjects: 8, completedProjects: 7, onTimeRate: 96, avgRating: 4.8, lastAssessment: days(-2), nextAssessment: days(88) }, { orgId: org.id, subcontractorId: subcontractors[1].id, vendorName: subcontractors[1].companyName, overallScore: 18, riskLevel: "critical", isFlagged: true, flagReason: "Expired license and insurance", licenseScore: 0, insuranceScore: 0, expiredDocs: 2, lastAssessment: days(-1) }] });
	await prisma.scheduledReport.create({ data: { orgId: org.id, frequency: "weekly", recipients: json([owner.email, admin.email]), reportType: "compliance", format: "pdf", enabled: true, lastSentAt: days(-7) } });

	const counts: Record<string, number> = {};
	for (const model of Prisma.dmmf.datamodel.models) {
		const delegate = (prisma as unknown as Record<string, { count(): Promise<number> }>)[model.name[0].toLowerCase() + model.name.slice(1)];
		counts[model.name] = await delegate.count();
		if (counts[model.name] < 1) throw new Error(`Seed left ${model.name} empty`);
	}
	const linkedLicense = await prisma.license.findFirst({ where: { documents: { some: {} }, qualifierLinks: { some: {} }, projectLicenses: { some: {} }, entityLinks: { some: {} } } });
	const linkedSubcontractor = await prisma.subcontractor.findFirst({ where: { documents: { some: {} }, projectSubs: { some: {} } } });
	if (!linkedLicense || !linkedSubcontractor) throw new Error("Seed relationship verification failed");
	console.log("Per-table counts:", JSON.stringify(counts));
	console.log("FK verification: passed");
	console.log("Demo accounts: owner@licensevault.com, admin@licensevault.com, member@licensevault.com, demo@licensevault.com");
	console.log("Demo password: DemoPass123!");
}

main()
	.then(() => prisma.$disconnect())
	.catch(async (error) => {
		console.error("Seed error:", error);
		await prisma.$disconnect();
		process.exit(1);
	});
