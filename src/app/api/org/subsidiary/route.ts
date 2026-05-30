import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const subsidiarySchema = z.object({
  name: z.string().min(1),
  tradeType: z.string().min(1),
  primaryState: z.string().min(1),
  companyName: z.string().optional(),
});

async function getUserOrg(session: any) {
  if (!session?.user?.email) return null;
  const member = await db.orgMember.findFirst({
    where: { email: session.user.email },
    orderBy: { invitedAt: 'desc' },
  });
  return member;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const member = await getUserOrg(session);
    if (!member) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    // Only owner can create subsidiaries
    if (member.role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validated = subsidiarySchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ error: 'Validation failed', details: validated.error.flatten() }, { status: 400 });
    }

    const { name, tradeType, primaryState, companyName } = validated.data;

    // Create new organization with parentId
    const newOrg = await db.organization.create({
      data: {
        name,
        tradeType,
        primaryState,
        companyName: companyName || null,
        parentId: member.orgId,
        plan: 'free',
      },
    });

    // Create OrgMember linking the requesting user as owner of the subsidiary
    await db.orgMember.create({
      data: {
        orgId: newOrg.id,
        userId: (session.user as any).id,
        email: session.user.email,
        fullName: session.user.name || null,
        role: 'owner',
        joinedAt: new Date(),
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        orgId: member.orgId,
        userId: (session.user as any).id,
        action: 'create',
        entityType: 'organization',
        entityId: newOrg.id,
        entityName: newOrg.name,
        details: JSON.stringify({ action: 'subsidiary_created', subsidiaryName: name }),
      },
    });

    return NextResponse.json({
      id: newOrg.id,
      name: newOrg.name,
      tradeType: newOrg.tradeType,
      primaryState: newOrg.primaryState,
      companyName: newOrg.companyName,
      parentId: newOrg.parentId,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating subsidiary:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
