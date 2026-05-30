import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const settingsUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  tradeType: z.string().optional(),
  primaryState: z.string().optional(),
  logoUrl: z.string().url().or(z.literal('')).optional(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  companyName: z.string().optional(),
  brandingConfig: z.string().optional(), // JSON string
});

async function getUserOrg(session: any) {
  if (!session?.user?.email) return null;
  const member = await db.orgMember.findFirst({
    where: { email: session.user.email },
    include: { org: true },
    orderBy: { invitedAt: 'desc' },
  });
  return member;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const member = await getUserOrg(session);
    if (!member) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const org = await db.organization.findUnique({
      where: { id: member.orgId },
      include: {
        parent: { select: { id: true, name: true, tradeType: true, primaryState: true } },
        subsidiaries: { select: { id: true } },
      },
    });

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: org.id,
      name: org.name,
      tradeType: org.tradeType,
      primaryState: org.primaryState,
      logoUrl: org.logoUrl,
      primaryColor: org.primaryColor,
      companyName: org.companyName,
      brandingConfig: org.brandingConfig,
      plan: org.plan,
      parentId: org.parentId,
      parent: org.parent,
      subsidiaryCount: org.subsidiaries.length,
    });
  } catch (error) {
    console.error('Error fetching org settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const member = await getUserOrg(session);
    if (!member) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    // Only owner or admin can update settings
    if (member.role !== 'owner' && member.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validated = settingsUpdateSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ error: 'Validation failed', details: validated.error.flatten() }, { status: 400 });
    }

    const data = validated.data;
    const org = await db.organization.update({
      where: { id: member.orgId },
      data,
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        orgId: member.orgId,
        userId: (session.user as any).id,
        action: 'update',
        entityType: 'organization',
        entityId: org.id,
        entityName: org.name,
        details: JSON.stringify({ updatedFields: Object.keys(data) }),
      },
    });

    return NextResponse.json({
      id: org.id,
      name: org.name,
      tradeType: org.tradeType,
      primaryState: org.primaryState,
      logoUrl: org.logoUrl,
      primaryColor: org.primaryColor,
      companyName: org.companyName,
      brandingConfig: org.brandingConfig,
      plan: org.plan,
      parentId: org.parentId,
    });
  } catch (error) {
    console.error('Error updating org settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
