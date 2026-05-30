/**
 * Seed Notifications Script
 *
 * This script creates sample notification data for the LicenseVault application.
 * Run with: bun run src/scripts/seed-notifications.ts
 *
 * It creates 8 sample notifications for the first user found in the database,
 * with varied content (license alerts, team updates, compliance warnings, etc.)
 * and varied dates (some recent, some from days ago).
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedNotifications() {
  console.log('🌱 Seeding notifications...');

  // Find the first user with an org membership
  const firstMember = await prisma.orgMember.findFirst({
    where: { userId: { not: null } },
    orderBy: { invitedAt: 'asc' },
  });

  if (!firstMember || !firstMember.userId) {
    console.error('❌ No user found. Please create a user first.');
    process.exit(1);
  }

  const userId = firstMember.userId;
  const orgId = firstMember.orgId;

  // Check if user already has notifications
  const existingCount = await prisma.notification.count({
    where: { userId },
  });

  if (existingCount > 0) {
    console.log(`ℹ️  User already has ${existingCount} notifications. Skipping seed.`);
    process.exit(0);
  }

  const now = new Date();

  const sampleNotifications = [
    {
      orgId,
      userId,
      title: 'License Expiring Soon',
      message: 'NYC Building Permit expires in 23 days. Consider renewing to stay compliant.',
      read: false,
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
    {
      orgId,
      userId,
      title: 'License Expired',
      message: 'California Electrical License has expired. Please renew immediately to avoid penalties.',
      read: false,
      createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000), // 5 hours ago
    },
    {
      orgId,
      userId,
      title: 'New Team Member',
      message: 'John Smith has joined your organization as a team member.',
      read: true,
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    },
    {
      orgId,
      userId,
      title: 'Compliance Alert',
      message: 'Your organization compliance rate has dropped below 80%. Review your expiring licenses.',
      read: false,
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    },
    {
      orgId,
      userId,
      title: 'License Renewed',
      message: 'Texas Plumbing License has been renewed successfully. New expiration: Dec 2027.',
      read: true,
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    },
    {
      orgId,
      userId,
      title: 'Weekly Summary',
      message: 'You have 2 licenses expiring this month. Review your dashboard for details.',
      read: true,
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    },
    {
      orgId,
      userId,
      title: 'System Update',
      message: 'New features available: CSV Import and Locations management. Check them out!',
      read: false,
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    },
    {
      orgId,
      userId,
      title: 'License Expiring Soon',
      message: 'Florida General Contractor License expires in 12 days. Renew now to stay compliant.',
      read: true,
      createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    },
  ];

  const result = await prisma.notification.createMany({
    data: sampleNotifications,
  });

  console.log(`✅ Created ${result.count} sample notifications for user ${userId}`);

  await prisma.$disconnect();
}

seedNotifications().catch((e) => {
  console.error('❌ Seeding failed:', e);
  prisma.$disconnect();
  process.exit(1);
});
