import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const orgMember = await db.orgMember.findFirst({
      where: { userId },
      select: {
        role: true,
        orgId: true,
        joinedAt: true,
        invitedAt: true,
      },
    });

    let organization = null;
    if (orgMember) {
      organization = await db.organization.findUnique({
        where: { id: orgMember.orgId },
        select: { id: true, name: true, tradeType: true, primaryState: true },
      });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt.toISOString(),
      },
      role: orgMember?.role || 'member',
      memberSince: orgMember?.joinedAt?.toISOString() || orgMember?.invitedAt?.toISOString() || user.createdAt.toISOString(),
      organization,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const body = await request.json();
    const result = updateProfileSchema.safeParse(body);

    if (!result.success) {
      const firstError = result.error.issues?.[0];
      return NextResponse.json(
        { error: firstError?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    if (result.data.name) {
      const user = await db.user.update({
        where: { id: userId },
        data: { name: result.data.name },
        select: { id: true, name: true, email: true },
      });

      // Create audit log
      const orgMember = await db.orgMember.findFirst({
        where: { userId },
      });

      if (orgMember) {
        await db.auditLog.create({
          data: {
            orgId: orgMember.orgId,
            userId,
            action: 'update',
            entityType: 'user',
            entityId: userId,
            entityName: result.data.name,
            details: 'Updated profile name',
          },
        });
      }

      return NextResponse.json({ user });
    }

    return NextResponse.json({ error: 'No changes provided' }, { status: 400 });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
