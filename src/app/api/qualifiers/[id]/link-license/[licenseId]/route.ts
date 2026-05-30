import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// DELETE: Unlink a qualifier from a license
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; licenseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { id: qualifierId, licenseId } = await params;

    const orgMember = await db.orgMember.findFirst({
      where: { userId },
    });

    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    // Check qualifier belongs to user's org
    const qualifier = await db.qualifier.findFirst({
      where: { id: qualifierId, orgId: orgMember.orgId },
    });

    if (!qualifier) {
      return NextResponse.json({ error: 'Qualifier not found' }, { status: 404 });
    }

    // Delete the link
    const link = await db.qualifierLicense.findUnique({
      where: { qualifierId_licenseId: { qualifierId, licenseId } },
    });

    if (!link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    await db.qualifierLicense.delete({
      where: { id: link.id },
    });

    // Create audit log entry
    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'update',
        entityType: 'qualifier',
        entityId: qualifierId,
        entityName: `${qualifier.firstName} ${qualifier.lastName}`,
        details: `Unlinked license from qualifier ${qualifier.firstName} ${qualifier.lastName}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unlink license error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
