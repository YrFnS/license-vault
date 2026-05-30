import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// DELETE: Unlink qualifier from license
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; linkId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { id: qualifierId, linkId } = await params;

    const orgMember = await db.orgMember.findFirst({
      where: { userId },
    });

    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    if (!['owner', 'admin'].includes(orgMember.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Verify the link belongs to this qualifier and org
    const existingLink = await db.qualifierLicense.findFirst({
      where: { id: linkId, qualifierId },
      include: { qualifier: true },
    });

    if (!existingLink || existingLink.qualifier.orgId !== orgMember.orgId) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    const qualifierName = `${existingLink.qualifier.firstName} ${existingLink.qualifier.lastName}`;

    // Create audit log entry before deletion
    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'delete',
        entityType: 'qualifier_license',
        entityId: existingLink.id,
        entityName: qualifierName,
        details: `Unlinked qualifier ${qualifierName} from license`,
      },
    });

    await db.qualifierLicense.delete({
      where: { id: linkId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unlink qualifier error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
