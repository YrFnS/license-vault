import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

async function getUserOrg(session: any) {
  if (!session?.user?.email) return null;
  const member = await db.orgMember.findFirst({
    where: { email: session.user.email },
    orderBy: { invitedAt: 'desc' },
  });
  return member;
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const member = await getUserOrg(session);
    if (!member) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    // Only owner can unlink subsidiaries
    if (member.role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const subsidiaryId = id;

    // Verify the subsidiary belongs to this org
    const subsidiary = await db.organization.findUnique({
      where: { id: subsidiaryId },
    });

    if (!subsidiary) {
      return NextResponse.json({ error: 'Subsidiary not found' }, { status: 404 });
    }

    if (subsidiary.parentId !== member.orgId) {
      return NextResponse.json({ error: 'Not a subsidiary of your organization' }, { status: 403 });
    }

    // Unlink: set parentId to null
    await db.organization.update({
      where: { id: subsidiaryId },
      data: { parentId: null },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        orgId: member.orgId,
        userId: (session.user as any).id,
        action: 'update',
        entityType: 'organization',
        entityId: subsidiaryId,
        entityName: subsidiary.name,
        details: JSON.stringify({ action: 'subsidiary_unlinked' }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unlinking subsidiary:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
