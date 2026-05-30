import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// GET: Get organization profile
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

    const organization = await db.organization.findUnique({
      where: { id: orgMember.orgId },
      include: {
        locations: true,
        _count: {
          select: {
            members: true,
            licenses: true,
          },
        },
      },
    });

    return NextResponse.json({ organization, userRole: orgMember.role });
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const updateOrgSchema = z.object({
  name: z.string().min(1, 'Organization name is required').optional(),
  tradeType: z.string().min(1).optional(),
  primaryState: z.string().min(1).optional(),
});

// PUT: Update organization profile (owner only)
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

    if (orgMember.role !== 'owner') {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only owners can update organization settings.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const result = updateOrgSchema.safeParse(body);

    if (!result.success) {
      const firstError = result.error.issues?.[0];
      return NextResponse.json(
        { error: firstError?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const organization = await db.organization.update({
      where: { id: orgMember.orgId },
      data: result.data,
    });

    // Create audit log entry
    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'update',
        entityType: 'organization',
        entityId: organization.id,
        entityName: organization.name,
        details: `Updated organization profile`,
      },
    });

    return NextResponse.json({ organization });
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
