/**
 * Seed Demo Data Script
 *
 * Creates realistic demo data for the test user "qatest@licensevault.com":
 * - 8-10 licenses with varying statuses (active, expiring soon, expired, renewed)
 * - 5-8 audit log entries
 * - 2-3 locations
 * - 4-6 notifications
 *
 * Run with: bun run src/scripts/seed-demo.ts
 */

import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function seedDemoData() {
  console.log('🌱 Seeding demo data...');

  // 1. Find the user by email
  const user = await prisma.user.findUnique({
    where: { email: 'qatest@licensevault.com' },
  });

  if (!user) {
    console.error('❌ User "qatest@licensevault.com" not found. Please create this user first.');
    process.exit(1);
  }

  console.log(`✅ Found user: ${user.name} (${user.email})`);

  // 2. Find their organization
  const orgMember = await prisma.orgMember.findFirst({
    where: { userId: user.id },
  });

  if (!orgMember) {
    console.error('❌ User is not part of any organization.');
    process.exit(1);
  }

  const orgId = orgMember.orgId;
  console.log(`✅ Found organization: ${orgId}`);

  // Helper: generate a date relative to now
  const now = new Date();
  const daysFromNow = (days: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    return d;
  };

  const monthsFromNow = (months: number) => {
    const d = new Date(now);
    d.setMonth(d.getMonth() + months);
    return d;
  };

  const monthsAgo = (months: number) => {
    const d = new Date(now);
    d.setMonth(d.getMonth() - months);
    return d;
  };

  // 3. Create 2-3 locations for the org
  const existingLocations = await prisma.location.count({ where: { orgId } });

  let locations: { id: string }[] = [];

  if (existingLocations === 0) {
    const locationData = [
      {
        id: randomUUID(),
        orgId,
        name: 'Main Office',
        city: 'Sacramento',
        state: 'CA',
        zip: '95814',
      },
      {
        id: randomUUID(),
        orgId,
        name: 'Las Vegas Branch',
        city: 'Las Vegas',
        state: 'NV',
        zip: '89101',
      },
      {
        id: randomUUID(),
        orgId,
        name: 'Phoenix Operations',
        city: 'Phoenix',
        state: 'AZ',
        zip: '85001',
      },
    ];

    for (const loc of locationData) {
      await prisma.location.create({ data: loc });
    }
    locations = locationData;
    console.log(`✅ Created ${locationData.length} locations`);
  } else {
    locations = await prisma.location.findMany({
      where: { orgId },
      select: { id: true },
    });
    console.log(`ℹ️  Organization already has ${existingLocations} locations. Skipping location seed.`);
  }

  // 4. Create 8-10 licenses with varying statuses
  const existingLicenses = await prisma.license.count({ where: { orgId } });

  if (existingLicenses > 0) {
    console.log(`ℹ️  Organization already has ${existingLicenses} licenses. Clearing existing demo data first...`);
    await prisma.license.deleteMany({ where: { orgId } });
    console.log('✅ Cleared existing licenses');
  }

  const licenseData = [
    // 4-5 ACTIVE licenses (expiration 6-12 months from now)
    {
      id: randomUUID(),
      orgId,
      name: 'California Electrical License',
      type: 'electrical',
      licenseNumber: 'EL-CA-2024-001',
      issuedBy: 'California Contractors State License Board',
      state: 'CA',
      issueDate: monthsAgo(6),
      expirationDate: monthsFromNow(8),
      notes: 'Primary electrical contractor license for CA operations',
      createdById: user.id,
      locationId: locations[0]?.id,
      createdAt: monthsAgo(6),
    },
    {
      id: randomUUID(),
      orgId,
      name: 'Texas General Contractor License',
      type: 'general',
      licenseNumber: 'GC-TX-2023-045',
      issuedBy: 'Texas Department of Licensing and Regulation',
      state: 'TX',
      issueDate: monthsAgo(10),
      expirationDate: monthsFromNow(10),
      notes: 'General contracting license for TX projects',
      createdById: user.id,
      locationId: locations[1]?.id,
      createdAt: monthsAgo(10),
    },
    {
      id: randomUUID(),
      orgId,
      name: 'Arizona HVAC License',
      type: 'hvac',
      licenseNumber: 'HV-AZ-2024-012',
      issuedBy: 'Arizona Registrar of Contractors',
      state: 'AZ',
      issueDate: monthsAgo(4),
      expirationDate: monthsFromNow(7),
      notes: 'HVAC installation and repair license',
      createdById: user.id,
      locationId: locations[2]?.id,
      createdAt: monthsAgo(4),
    },
    {
      id: randomUUID(),
      orgId,
      name: 'Nevada Plumbing License',
      type: 'plumbing',
      licenseNumber: 'PL-NV-2024-033',
      issuedBy: 'Nevada State Contractors Board',
      state: 'NV',
      issueDate: monthsAgo(3),
      expirationDate: monthsFromNow(6),
      notes: 'Plumbing contractor license for NV branch',
      createdById: user.id,
      locationId: locations[1]?.id,
      createdAt: monthsAgo(3),
    },
    {
      id: randomUUID(),
      orgId,
      name: 'Florida Electrical License',
      type: 'electrical',
      licenseNumber: 'EL-FL-2024-078',
      issuedBy: 'Florida Department of Business and Professional Regulation',
      state: 'FL',
      issueDate: monthsAgo(2),
      expirationDate: monthsFromNow(11),
      notes: 'Electrical license for Florida expansion',
      createdById: user.id,
      createdAt: monthsAgo(2),
    },

    // 2 EXPIRING SOON (expiration 15-45 days from now)
    {
      id: randomUUID(),
      orgId,
      name: 'California Plumbing License',
      type: 'plumbing',
      licenseNumber: 'PL-CA-2022-019',
      issuedBy: 'California Contractors State License Board',
      state: 'CA',
      issueDate: monthsAgo(24),
      expirationDate: daysFromNow(22),
      notes: 'Plumbing license needs immediate renewal attention',
      createdById: user.id,
      locationId: locations[0]?.id,
      createdAt: monthsAgo(24),
    },
    {
      id: randomUUID(),
      orgId,
      name: 'Texas HVAC License',
      type: 'hvac',
      licenseNumber: 'HV-TX-2023-056',
      issuedBy: 'Texas Department of Licensing and Regulation',
      state: 'TX',
      issueDate: monthsAgo(14),
      expirationDate: daysFromNow(38),
      notes: 'HVAC license expiring soon - renewal in progress',
      createdById: user.id,
      locationId: locations[1]?.id,
      createdAt: monthsAgo(14),
    },

    // 2 EXPIRED (expiration 1-6 months ago)
    {
      id: randomUUID(),
      orgId,
      name: 'Nevada General Contractor License',
      type: 'general',
      licenseNumber: 'GC-NV-2021-011',
      issuedBy: 'Nevada State Contractors Board',
      state: 'NV',
      issueDate: monthsAgo(36),
      expirationDate: monthsAgo(2),
      notes: 'Expired - renewal required before resuming NV operations',
      createdById: user.id,
      locationId: locations[1]?.id,
      createdAt: monthsAgo(36),
    },
    {
      id: randomUUID(),
      orgId,
      name: 'Arizona Electrical License',
      type: 'electrical',
      licenseNumber: 'EL-AZ-2022-044',
      issuedBy: 'Arizona Registrar of Contractors',
      state: 'AZ',
      issueDate: monthsAgo(18),
      expirationDate: monthsAgo(5),
      notes: 'Expired - must renew to operate in Arizona',
      createdById: user.id,
      locationId: locations[2]?.id,
      createdAt: monthsAgo(18),
    },

    // 1 RENEWED (isRenewed=true, recent renewalDate)
    {
      id: randomUUID(),
      orgId,
      name: 'California General Contractor License',
      type: 'general',
      licenseNumber: 'GC-CA-2020-007',
      issuedBy: 'California Contractors State License Board',
      state: 'CA',
      issueDate: monthsAgo(48),
      expirationDate: monthsFromNow(12),
      notes: 'Successfully renewed - valid for another year',
      isRenewed: true,
      renewalDate: daysFromNow(-3),
      autoRenew: true,
      renewalHistory: JSON.stringify([
        {
          date: daysFromNow(-3).toISOString(),
          renewedBy: user.name,
          notes: 'Annual renewal completed on time',
        },
        {
          date: monthsAgo(12).toISOString(),
          renewedBy: user.name,
          notes: 'Previous renewal cycle',
        },
      ]),
      createdById: user.id,
      locationId: locations[0]?.id,
      createdAt: monthsAgo(48),
    },
  ];

  for (const license of licenseData) {
    await prisma.license.create({ data: license });
  }
  console.log(`✅ Created ${licenseData.length} licenses`);

  // 5. Create 5-8 audit log entries for the org
  const existingAuditLogs = await prisma.auditLog.count({ where: { orgId } });

  if (existingAuditLogs > 0) {
    await prisma.auditLog.deleteMany({ where: { orgId } });
    console.log('✅ Cleared existing audit logs');
  }

  const auditLogData = [
    {
      id: randomUUID(),
      orgId,
      userId: user.id,
      action: 'LICENSE_CREATED',
      entityType: 'License',
      entityId: licenseData[0].id,
      entityName: 'California Electrical License',
      details: 'Created new electrical license',
      createdAt: monthsAgo(6),
    },
    {
      id: randomUUID(),
      orgId,
      userId: user.id,
      action: 'LICENSE_CREATED',
      entityType: 'License',
      entityId: licenseData[1].id,
      entityName: 'Texas General Contractor License',
      details: 'Created new general contractor license',
      createdAt: monthsAgo(10),
    },
    {
      id: randomUUID(),
      orgId,
      userId: user.id,
      action: 'LICENSE_UPDATED',
      entityType: 'License',
      entityId: licenseData[5].id,
      entityName: 'California Plumbing License',
      details: 'Updated expiration alert settings',
      createdAt: daysFromNow(-5),
    },
    {
      id: randomUUID(),
      orgId,
      userId: user.id,
      action: 'LICENSE_IMPORTED',
      entityType: 'License',
      entityId: null,
      entityName: null,
      details: 'Imported 3 licenses from CSV file',
      createdAt: monthsAgo(3),
    },
    {
      id: randomUUID(),
      orgId,
      userId: user.id,
      action: 'LICENSE_EXPORTED',
      entityType: 'License',
      entityId: null,
      entityName: null,
      details: 'Exported compliance report to PDF',
      createdAt: weeksAgo(1),
    },
    {
      id: randomUUID(),
      orgId,
      userId: user.id,
      action: 'SETTINGS_UPDATED',
      entityType: 'Organization',
      entityId: orgId,
      entityName: 'Organization Settings',
      details: 'Updated alert preferences for 60-day warnings',
      createdAt: weeksAgo(2),
    },
    {
      id: randomUUID(),
      orgId,
      userId: user.id,
      action: 'LICENSE_CREATED',
      entityType: 'License',
      entityId: licenseData[9].id,
      entityName: 'California General Contractor License',
      details: 'Created new general contractor license with auto-renewal',
      createdAt: monthsAgo(48),
    },
    {
      id: randomUUID(),
      orgId,
      userId: user.id,
      action: 'LICENSE_UPDATED',
      entityType: 'License',
      entityId: licenseData[9].id,
      entityName: 'California General Contractor License',
      details: 'License renewed successfully for another year',
      createdAt: daysFromNow(-3),
    },
  ];

  for (const log of auditLogData) {
    await prisma.auditLog.create({ data: log });
  }
  console.log(`✅ Created ${auditLogData.length} audit log entries`);

  // 6. Create 4-6 notifications for the user
  const existingNotifications = await prisma.notification.count({ where: { userId: user.id } });

  if (existingNotifications > 0) {
    await prisma.notification.deleteMany({ where: { userId: user.id } });
    console.log('✅ Cleared existing notifications');
  }

  const notificationData = [
    {
      id: randomUUID(),
      orgId,
      userId: user.id,
      title: 'License Expiring Soon',
      message: 'California Plumbing License expires in 22 days. Renew now to stay compliant.',
      read: false,
      createdAt: daysFromNow(-1),
    },
    {
      id: randomUUID(),
      orgId,
      userId: user.id,
      title: 'License Expiring Soon',
      message: 'Texas HVAC License expires in 38 days. Consider starting the renewal process.',
      read: false,
      createdAt: daysFromNow(-2),
    },
    {
      id: randomUUID(),
      orgId,
      userId: user.id,
      title: 'License Expired',
      message: 'Nevada General Contractor License has expired. Renew immediately to avoid penalties.',
      read: false,
      createdAt: daysFromNow(-3),
    },
    {
      id: randomUUID(),
      orgId,
      userId: user.id,
      title: 'License Renewed Successfully',
      message: 'California General Contractor License has been renewed. New expiration date is next year.',
      read: true,
      createdAt: daysFromNow(-3),
    },
    {
      id: randomUUID(),
      orgId,
      userId: user.id,
      title: 'License Expired',
      message: 'Arizona Electrical License has expired. Renewal is required to continue operations.',
      read: true,
      createdAt: weeksAgo(3),
    },
    {
      id: randomUUID(),
      orgId,
      userId: user.id,
      title: 'Compliance Score Update',
      message: 'Your organization compliance rate is 50%. 2 licenses need attention to improve your score.',
      read: false,
      createdAt: daysFromNow(-1),
    },
  ];

  for (const notification of notificationData) {
    await prisma.notification.create({ data: notification });
  }
  console.log(`✅ Created ${notificationData.length} notifications`);

  // Summary
  console.log('\n📊 Demo Data Summary:');
  console.log(`   Licenses: ${licenseData.length} (5 active, 2 expiring soon, 2 expired, 1 renewed)`);
  console.log(`   Audit Logs: ${auditLogData.length}`);
  console.log(`   Locations: ${Math.max(locations.length, existingLocations)}`);
  console.log(`   Notifications: ${notificationData.length}`);
  console.log('\n🎉 Demo data seeding complete!');

  await prisma.$disconnect();
}

function weeksAgo(weeks: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - weeks * 7);
  return d;
}

seedDemoData().catch((e) => {
  console.error('❌ Seeding failed:', e);
  prisma.$disconnect();
  process.exit(1);
});
