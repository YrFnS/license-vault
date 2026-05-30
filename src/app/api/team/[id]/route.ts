import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// DELETE: Remove a team member (owner/admin only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { id: memberId } = await params;

    // Find the current user's org membership and role
    const currentUserMember = await db.orgMember.findFirst({
      where: { userId },
    });

    if (!currentUserMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    // Check permissions: only owner or admin can remove members
    if (!['owner', 'admin'].includes(currentUserMember.role as string)) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only owners and admins can remove members.' },
        { status: 403 }
      );
    }

    // Find the target member
    const targetMember = await db.orgMember.findUnique({
      where: { id: memberId },
    });

    if (!targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Ensure the target member belongs to the same org
    if (targetMember.orgId !== currentUserMember.orgId) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Cannot remove yourself (use leave org instead)
    if (targetMember.userId === userId) {
      return NextResponse.json(
        { error: 'Cannot remove yourself. Use leave organization instead.' },
        { status: 400 }
      );
    }

    // Cannot remove the last owner
    if (targetMember.role === 'owner') {
      const ownerCount = await db.orgMember.count({
        where: {
          orgId: currentUserMember.orgId,
          role: 'owner',
          joinedAt: { not: null },
        },
      });

      if (ownerCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot remove the last owner. Transfer ownership first.' },
          { status: 400 }
        );
      }
    }

    // Delete the member
    await db.orgMember.delete({
      where: { id: memberId },
    });

    // Create audit log entry
    await db.auditLog.create({
      data: {
        orgId: currentUserMember.orgId,
        userId,
        action: 'remove_member',
        entityType: 'member',
        entityId: memberId,
        entityName: targetMember.email,
        details: `Removed ${targetMember.email} from the organization`,
      },
    });

    return NextResponse.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove member error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
