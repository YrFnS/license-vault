/**
 * Prisma Seed Script
 * Populates essential lookup data AND demo organization data for License Vault.
 * Run with: npx prisma db seed
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
	console.log("🌱 Seeding database...");

	// ── 1. System org for default templates ─────────────────────────────────
	const systemOrg = await prisma.organization.upsert({
		where: { id: "system" },
		update: {},
		create: {
			id: "system",
			name: "System",
			tradeType: "general",
			primaryState: "US",
			plan: "enterprise",
		},
	});
	console.log(`✅ System org: ${systemOrg.id}`);

	// ── 2. Default checklist templates ─────────────────────────────────────
	await prisma.checklistTemplate.upsert({
		where: { id: "default-license-renewal" },
		update: {},
		create: {
			id: "default-license-renewal",
			name: "License Renewal Checklist",
			description: "Standard checklist for contractor license renewal applications",
			category: "license_renewal",
			isDefault: true,
			isActive: true,
			orgId: "system",
			items: JSON.stringify([
				{ id: "1", label: "Verify current license status with state board", required: true },
				{ id: "2", label: "Complete CE hour requirements", required: true },
				{ id: "3", label: "Obtain current COI from insurance provider", required: true },
				{ id: "4", label: "Pay state renewal fee", required: true },
				{ id: "5", label: "Submit renewal application before deadline", required: true },
				{ id: "6", label: "Update business entity annual report if needed", required: false },
				{ id: "7", label: "Verify bond status / obtain new bond if required", required: false },
				{ id: "8", label: "Update contact information with state board", required: false },
			]),
		},
	});

	await prisma.checklistTemplate.upsert({
		where: { id: "default-onboarding" },
		update: {},
		create: {
			id: "default-onboarding",
			name: "New Organization Onboarding",
			description: "Initial setup checklist for new License Vault organizations",
			category: "general",
			isDefault: true,
			isActive: true,
			orgId: "system",
			items: JSON.stringify([
				{ id: "1", label: "Add primary organization details and trade type", required: true },
				{ id: "2", label: "Invite team members", required: false },
				{ id: "3", label: "Add all active contractor licenses", required: true },
				{ id: "4", label: "Upload current insurance certificates", required: true },
				{ id: "5", label: "Add qualifiers and link to licenses", required: true },
				{ id: "6", label: "Configure alert preferences", required: false },
				{ id: "7", label: "Set up subcontractor portal access", required: false },
				{ id: "8", label: "Add active projects and required licenses", required: false },
			]),
		},
	});
	console.log("✅ Created default checklist templates");

	// ── 3. Demo user ───────────────────────────────────────────────────────
	const demoPassword = await bcrypt.hash("DemoPass123!", 12);
	const demoUser = await prisma.user.upsert({
		where: { email: "demo@licensevault.com" },
		update: {},
		create: {
			email: "demo@licensevault.com",
			name: "Demo User",
			password: demoPassword,
		},
	});
	console.log(`✅ Demo user: ${demoUser.email}`);

	// ── 4. Demo organization ───────────────────────────────────────────────
	const demoOrg = await prisma.organization.upsert({
		where: { id: "demo-org" },
		update: {},
		create: {
			id: "demo-org",
			name: "Acme Construction Co.",
			tradeType: "general",
			primaryState: "CA",
			plan: "professional",
			companyName: "Acme Construction Co.",
			primaryColor: "#10b981",
		},
	});
	console.log(`✅ Demo org: ${demoOrg.name}`);

	// ── 5. Org membership ──────────────────────────────────────────────────
	await prisma.orgMember.upsert({
		where: { orgId_email: { orgId: demoOrg.id, email: demoUser.email } },
		update: {},
		create: {
			orgId: demoOrg.id,
			userId: demoUser.id,
			email: demoUser.email,
			fullName: demoUser.name,
			role: "admin",
			joinedAt: new Date(),
		},
	});
	console.log("✅ Org membership created");

	// ── 6. Demo locations ──────────────────────────────────────────────────
	const locations = [
		{ name: "Main Office", city: "Sacramento", state: "CA", zip: "95814" },
		{ name: "Las Vegas Branch", city: "Las Vegas", state: "NV", zip: "89101" },
		{ name: "Phoenix Operations", city: "Phoenix", state: "AZ", zip: "85001" },
	];

	const createdLocations: { id: string; name: string; city: string | null; state: string | null; zip: string | null }[] = [];
	for (const loc of locations) {
		const created = await prisma.location.create({
			data: { ...loc, orgId: demoOrg.id },
		});
		createdLocations.push(created);
	}
	console.log(`✅ Created ${createdLocations.length} locations`);

	// ── 7. Demo licenses (10 licenses with varying statuses) ───────────────
	const now = new Date();
	const daysFromNow = (days: number) => { const d = new Date(now); d.setDate(d.getDate() + days); return d; };
	const monthsFromNow = (months: number) => { const d = new Date(now); d.setMonth(d.getMonth() + months); return d; };
	const monthsAgo = (months: number) => { const d = new Date(now); d.setMonth(d.getMonth() - months); return d; };

	const licenseData = [
		{ name: "California Electrical License", type: "electrical", number: "EL-CA-2024-001", issuer: "CA Contractors State License Board", state: "CA", issueDate: monthsAgo(6), expirationDate: monthsFromNow(8), locationIdx: 0 },
		{ name: "Texas General Contractor License", type: "general", number: "GC-TX-2023-045", issuer: "TX Dept of Licensing", state: "TX", issueDate: monthsAgo(10), expirationDate: monthsFromNow(10), locationIdx: 1 },
		{ name: "Arizona HVAC License", type: "hvac", number: "HV-AZ-2024-012", issuer: "AZ Registrar of Contractors", state: "AZ", issueDate: monthsAgo(4), expirationDate: monthsFromNow(7), locationIdx: 2 },
		{ name: "Nevada Plumbing License", type: "plumbing", number: "PL-NV-2024-033", issuer: "NV State Contractors Board", state: "NV", issueDate: monthsAgo(3), expirationDate: monthsFromNow(6), locationIdx: 1 },
		{ name: "Florida Electrical License", type: "electrical", number: "EL-FL-2024-078", issuer: "FL DBPR", state: "FL", issueDate: monthsAgo(2), expirationDate: monthsFromNow(11), locationIdx: null },
		{ name: "California Plumbing License", type: "plumbing", number: "PL-CA-2022-019", issuer: "CA Contractors State License Board", state: "CA", issueDate: monthsAgo(24), expirationDate: daysFromNow(22), locationIdx: 0 },
		{ name: "Texas HVAC License", type: "hvac", number: "HV-TX-2023-056", issuer: "TX Dept of Licensing", state: "TX", issueDate: monthsAgo(14), expirationDate: daysFromNow(38), locationIdx: 1 },
		{ name: "Nevada General Contractor License", type: "general", number: "GC-NV-2021-011", issuer: "NV State Contractors Board", state: "NV", issueDate: monthsAgo(36), expirationDate: monthsAgo(2), locationIdx: 1 },
		{ name: "Arizona Electrical License", type: "electrical", number: "EL-AZ-2022-044", issuer: "AZ Registrar of Contractors", state: "AZ", issueDate: monthsAgo(18), expirationDate: monthsAgo(5), locationIdx: 2 },
		{ name: "California General Contractor License", type: "general", number: "GC-CA-2020-007", issuer: "CA Contractors State License Board", state: "CA", issueDate: monthsAgo(48), expirationDate: monthsFromNow(12), locationIdx: 0, isRenewed: true, renewalDate: daysFromNow(-3), autoRenew: true },
	];

	const createdLicenses: { id: string }[] = [];
	for (const lic of licenseData) {
		const created = await prisma.license.create({
			data: {
				orgId: demoOrg.id,
				name: lic.name,
				type: lic.type,
				licenseNumber: lic.number,
				issuedBy: lic.issuer,
				state: lic.state,
				issueDate: lic.issueDate,
				expirationDate: lic.expirationDate,
				locationId: lic.locationIdx !== null ? createdLocations[lic.locationIdx].id : undefined,
				createdById: demoUser.id,
				isRenewed: (lic as any).isRenewed || false,
				renewalDate: (lic as any).renewalDate,
				autoRenew: (lic as any).autoRenew || false,
			},
		});
		createdLicenses.push(created);
	}
	console.log(`✅ Created ${createdLicenses.length} licenses`);

	// ── 8. Demo qualifiers ─────────────────────────────────────────────────
	const qualifiers = [
		{ firstName: "John", lastName: "Martinez", email: "jmartinez@acme.com", phone: "916-555-0101", licenseNumber: "EL-CA-2024-Q01", licenseState: "CA", licenseType: "electrical" },
		{ firstName: "Sarah", lastName: "Chen", email: "schen@acme.com", phone: "702-555-0102", licenseNumber: "PL-NV-2024-Q02", licenseState: "NV", licenseType: "plumbing" },
		{ firstName: "Mike", lastName: "Johnson", email: "mjohnson@acme.com", phone: "602-555-0103", licenseNumber: "HV-AZ-2024-Q03", licenseState: "AZ", licenseType: "hvac" },
	];
	for (const q of qualifiers) {
		await prisma.qualifier.create({
			data: {
				orgId: demoOrg.id,
				firstName: q.firstName,
				lastName: q.lastName,
				email: q.email,
				phone: q.phone,
				licenseNumber: q.licenseNumber,
				licenseState: q.licenseState,
				licenseType: q.licenseType,
				licenseExpiry: monthsFromNow(18),
				status: "active",
			},
		});
	}
	console.log(`✅ Created ${qualifiers.length} qualifiers`);

	// ── 9. Demo subcontractors ─────────────────────────────────────────────
	const subs = [
		{ companyName: "Desert Sun Electric", contactName: "Bob Wilson", email: "bwilson@desertsun.com", phone: "702-555-0201", licenseNumber: "EL-NV-2023-101", licenseState: "NV", tradeType: "Electrical", insuranceAmount: 2000000 },
		{ companyName: "Valley Plumbing Pros", contactName: "Lisa Park", email: "lpark@valleyplumbing.com", phone: "602-555-0202", licenseNumber: "PL-AZ-2024-055", licenseState: "AZ", tradeType: "Plumbing", insuranceAmount: 1000000 },
		{ companyName: "Lone Star HVAC", contactName: "Carlos Ruiz", email: "cruiz@lonestarhvac.com", phone: "512-555-0203", licenseNumber: "HV-TX-2024-078", licenseState: "TX", tradeType: "HVAC", insuranceAmount: 1500000 },
		{ companyName: "Golden State Roofing", contactName: "Amy Lee", email: "alee@gsrco.com", phone: "916-555-0204", licenseNumber: "RF-CA-2024-033", licenseState: "CA", tradeType: "Roofing", insuranceAmount: 2000000 },
	];
	for (const s of subs) {
		await prisma.subcontractor.create({
			data: {
				orgId: demoOrg.id,
				companyName: s.companyName,
				contactName: s.contactName,
				email: s.email,
				phone: s.phone,
				licenseNumber: s.licenseNumber,
				licenseState: s.licenseState,
				licenseExpiry: monthsFromNow(14),
				tradeType: s.tradeType,
				insuranceAmount: s.insuranceAmount,
				insuranceExpiry: monthsFromNow(10),
				insuranceStatus: "compliant",
				complianceStatus: "compliant",
				status: "active",
			},
		});
	}
	console.log(`✅ Created ${subs.length} subcontractors`);

	// ── 10. Demo projects ──────────────────────────────────────────────────
	const projects = [
		{ name: "Sacramento Medical Center", description: "New 120-bed medical facility", clientName: "Sacramento Health System", state: "CA", startDate: monthsAgo(3), endDate: monthsFromNow(15), status: "active" },
		{ name: "Las Vegas Hotel Expansion", description: "200-room hotel tower addition", clientName: "Vegas Luxury Resorts", state: "NV", startDate: monthsAgo(1), endDate: monthsFromNow(24), status: "active" },
		{ name: "Phoenix Corporate Campus", description: "3-building office complex", clientName: "AZ Tech Partners", state: "AZ", startDate: monthsFromNow(2), endDate: monthsFromNow(18), status: "active" },
		{ name: "Austin Data Center", description: "Tier III data center build-out", clientName: "CloudWest Inc.", state: "TX", startDate: monthsAgo(6), endDate: monthsAgo(1), status: "completed" },
	];
	for (const p of projects) {
		await prisma.project.create({
			data: {
				orgId: demoOrg.id,
				name: p.name,
				description: p.description,
				clientName: p.clientName,
				state: p.state,
				location: p.state,
				startDate: p.startDate,
				endDate: p.endDate,
				status: p.status,
				complianceScore: p.status === "completed" ? 100 : Math.floor(Math.random() * 30) + 70,
			},
		});
	}
	console.log(`✅ Created ${projects.length} projects`);

	// ── 11. Demo insurance bonds ───────────────────────────────────────────
	const bonds = [
		{ name: "General Liability Policy", type: "insurance", policyNumber: "GL-2024-001", provider: "Liberty Mutual", coverageAmount: 2000000, premiumAmount: 15000, expirationDate: monthsFromNow(10) },
		{ name: "Workers' Compensation", type: "insurance", policyNumber: "WC-2024-002", provider: "Travelers", coverageAmount: 1000000, premiumAmount: 45000, expirationDate: monthsFromNow(8) },
		{ name: "Commercial Auto Policy", type: "insurance", policyNumber: "CA-2024-003", provider: "Nationwide", coverageAmount: 1000000, premiumAmount: 8500, expirationDate: monthsFromNow(14) },
		{ name: "Umbrella Liability", type: "insurance", policyNumber: "UM-2024-004", provider: "Zurich", coverageAmount: 5000000, premiumAmount: 12000, expirationDate: monthsFromNow(6) },
	];
	for (const b of bonds) {
		await prisma.insuranceBond.create({
			data: {
				orgId: demoOrg.id,
				name: b.name,
				type: b.type,
				policyNumber: b.policyNumber,
				provider: b.provider,
				coverageAmount: b.coverageAmount,
				premiumAmount: b.premiumAmount,
				issueDate: monthsAgo(6),
				expirationDate: b.expirationDate,
				status: "active",
				complianceStatus: "compliant",
			},
		});
	}
	console.log(`✅ Created ${bonds.length} insurance policies`);

	// ── 12. Demo audit logs ────────────────────────────────────────────────
	const auditActions = [
		{ action: "LICENSE_CREATED", entityType: "License", entityName: "California Electrical License", details: "License added to system" },
		{ action: "LICENSE_CREATED", entityType: "License", entityName: "Texas General Contractor License", details: "License added to system" },
		{ action: "LICENSE_RENEWED", entityType: "License", entityName: "California General Contractor License", details: "Annual renewal completed" },
		{ action: "DOCUMENT_UPLOADED", entityType: "LicenseDocument", entityName: "EL-CA Certificate", details: "Certificate of insurance uploaded" },
		{ action: "SETTINGS_UPDATED", entityType: "Organization", entityName: "Alert Preferences", details: "Updated 30-day alert settings" },
		{ action: "SUBCONTRACTOR_ADDED", entityType: "Subcontractor", entityName: "Desert Sun Electric", details: "New subcontractor invited" },
		{ action: "PROJECT_CREATED", entityType: "Project", entityName: "Sacramento Medical Center", details: "New project created" },
		{ action: "TEAM_INVITE_SENT", entityType: "User", entityName: "newuser@acme.com", details: "Team invitation sent" },
	];
	for (let i = 0; i < auditActions.length; i++) {
		const a = auditActions[i];
		await prisma.auditLog.create({
			data: {
				orgId: demoOrg.id,
				userId: demoUser.id,
				action: a.action,
				entityType: a.entityType,
				entityName: a.entityName,
				details: a.details,
				createdAt: daysFromNow(-(i * 3)),
			},
		});
	}
	console.log(`✅ Created ${auditActions.length} audit logs`);

	// ── 13. Demo notifications ─────────────────────────────────────────────
	const notifications = [
		{ title: "License Expiring Soon", message: "California Plumbing License expires in 22 days.", read: false },
		{ title: "License Expiring Soon", message: "Texas HVAC License expires in 38 days.", read: false },
		{ title: "License Expired", message: "Nevada General Contractor License has expired. Renew immediately.", read: false },
		{ title: "Insurance Expiring", message: "Umbrella Liability policy expires in 6 months.", read: false },
		{ title: "License Renewed Successfully", message: "California General Contractor License has been renewed.", read: true },
		{ title: "Subcontractor Document Received", message: "Desert Sun Electric submitted new COI.", read: true },
	];
	for (const n of notifications) {
		await prisma.notification.create({
			data: {
				orgId: demoOrg.id,
				userId: demoUser.id,
				title: n.title,
				message: n.message,
				read: n.read,
			},
		});
	}
	console.log(`✅ Created ${notifications.length} notifications`);

	// ── 14. Demo alert preferences ─────────────────────────────────────────
	await prisma.alertPreference.upsert({
		where: { orgId_userId: { orgId: demoOrg.id, userId: demoUser.id } },
		update: {},
		create: {
			orgId: demoOrg.id,
			userId: demoUser.id,
			alert60Days: true,
			alert30Days: true,
			alert5Days: true,
			alertEmail: true,
			alertInApp: true,
			alertEmailFrequency: "immediate",
			alertEmailCategories: "all",
		},
	});
	console.log("✅ Alert preferences set");

	// ── Summary ────────────────────────────────────────────────────────────
	console.log("\n📊 Seed Summary:");
	console.log("   Organizations: 2 (System + Acme Construction Co.)");
	console.log("   Users: 1 (demo@licensevault.com)");
	console.log("   Org Members: 1");
	console.log(`   Locations: ${locations.length}`);
	console.log(`   Licenses: ${licenseData.length}`);
	console.log(`   Qualifiers: ${qualifiers.length}`);
	console.log(`   Subcontractors: ${subs.length}`);
	console.log(`   Projects: ${projects.length}`);
	console.log(`   Insurance Policies: ${bonds.length}`);
	console.log(`   Audit Logs: ${auditActions.length}`);
	console.log(`   Notifications: ${notifications.length}`);
	console.log("   Checklist Templates: 2");
	console.log("\n🔑 Login credentials:");
	console.log("   Email: demo@licensevault.com");
	console.log("   Password: DemoPass123!");
	console.log("\n✅ Seed complete!");
}

main()
	.then(async () => {
		await prisma.$disconnect();
	})
	.catch(async (e) => {
		console.error("Seed error:", e);
		await prisma.$disconnect();
		process.exit(1);
	});
