import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// GET: Get alert preferences for current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Find user's org membership
    const orgMember = await db.orgMember.findFirst({
      where: { userId },
    });

    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    let preferences = await db.alertPreference.findUnique({
      where: {
        orgId_userId: {
          orgId: orgMember.orgId,
          userId,
        },
      },
    });

    // Create default preferences if none exist
    if (!preferences) {
      preferences = await db.alertPreference.create({
        data: {
          orgId: orgMember.orgId,
          userId,
          alert60Days: true,
          alert30Days: true,
          alert5Days: true,
          alertEmail: true,
          alertInApp: true,
          alertEmailFrequency: 'immediate',
          alertEmailCategories: 'all',
        },
      });
    }

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error('Get alert preferences error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const updateAlertsSchema = z.object({
  alert60Days: z.boolean().optional(),
  alert30Days: z.boolean().optional(),
  alert5Days: z.boolean().optional(),
  alertEmail: z.boolean().optional(),
  alertInApp: z.boolean().optional(),
  alertEmailFrequency: z.enum(['immediate', 'daily', 'weekly', 'none']).optional(),
  alertEmailCategories: z.enum(['licenses', 'insurance', 'ce', 'all', 'critical_only', 'none']).optional(),
});

// PUT: Update alert preferences
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Find user's org membership
    const orgMember = await db.orgMember.findFirst({
      where: { userId },
    });

    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const body = await request.json();
    const result = updateAlertsSchema.safeParse(body);

    if (!result.success) {
      const firstError = result.error.issues?.[0];
      return NextResponse.json(
        { error: firstError?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const preferences = await db.alertPreference.upsert({
      where: {
        orgId_userId: {
          orgId: orgMember.orgId,
          userId,
        },
      },
      update: result.data,
      create: {
        orgId: orgMember.orgId,
        userId,
        ...result.data,
      },
    });

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error('Update alert preferences error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
