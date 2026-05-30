import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// GET: List all CE records for the user's org, with optional filter by licenseId
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const orgMember = await db.orgMember.findFirst({
      where: { userId },
    });

    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const licenseId = searchParams.get('licenseId') || undefined;

    const where: any = { orgId: orgMember.orgId };
    if (licenseId) {
      where.licenseId = licenseId;
    }

    const records = await db.cETracking.findMany({
      where,
      orderBy: { completionDate: 'desc' },
      include: {
        license: {
          select: { id: true, name: true, type: true },
        },
      },
    });

    return NextResponse.json({ records });
  } catch (error) {
    console.error('Get CE tracking error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const createCESchema = z.object({
  licenseId: z.string().min(1, 'License is required'),
  courseName: z.string().min(1, 'Course name is required'),
  provider: z.string().min(1, 'Provider is required'),
  hoursEarned: z.number().min(0, 'Hours earned must be non-negative'),
  hoursRequired: z.number().min(0, 'Hours required must be non-negative').default(0),
  completionDate: z.string().min(1, 'Completion date is required'),
  category: z.string().default('general'),
  certificateUrl: z.string().optional(),
  notes: z.string().optional(),
});

// POST: Create a new CE record
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const orgMember = await db.orgMember.findFirst({
      where: { userId },
    });

    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const body = await request.json();
    const result = createCESchema.safeParse(body);

    if (!result.success) {
      const firstError = result.error.issues?.[0];
      return NextResponse.json(
        { error: firstError?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const { licenseId, courseName, provider, hoursEarned, hoursRequired, completionDate, category, certificateUrl, notes } = result.data;

    // Verify the license belongs to the org
    const license = await db.license.findFirst({
      where: { id: licenseId, orgId: orgMember.orgId },
    });

    if (!license) {
      return NextResponse.json({ error: 'License not found in your organization' }, { status: 404 });
    }

    const record = await db.cETracking.create({
      data: {
        orgId: orgMember.orgId,
        licenseId,
        courseName,
        provider,
        hoursEarned,
        hoursRequired,
        completionDate: new Date(completionDate),
        category,
        certificateUrl: certificateUrl || null,
        notes: notes || null,
      },
      include: {
        license: {
          select: { id: true, name: true, type: true },
        },
      },
    });

    // Create audit log entry
    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'create',
        entityType: 'ce_tracking',
        entityId: record.id,
        entityName: record.courseName,
        details: `Created CE record: ${record.courseName} (${record.hoursEarned} hours)`,
      },
    });

    return NextResponse.json({ record }, { status: 201 });
  } catch (error) {
    console.error('Create CE tracking error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
