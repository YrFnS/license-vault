import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// GET: Seed sample notifications for the current user (demo purposes)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Check if user already has notifications
    const existingCount = await db.notification.count({
      where: { userId },
    });

    if (existingCount > 0) {
      return NextResponse.json({
        message: 'Notifications already exist',
        count: existingCount,
        created: 0,
      });
    }

    // Get the user's org
    const membership = await db.orgMember.findFirst({
      where: { userId },
    });

    const orgId = membership?.orgId || '';

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

    const created = await db.notification.createMany({
      data: sampleNotifications,
    });

    return NextResponse.json({
      message: 'Sample notifications seeded successfully',
      count: existingCount,
      created: created.count,
    });
  } catch (error) {
    console.error('Seed notifications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
