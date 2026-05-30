import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// DELETE: Cancel a pending invite (owner/admin only)
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

    // Check permissions: only owner or admin can cancel invites
    if (!['owner', 'admin'].includes(currentUserMember.role as string)) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only owners and admins can cancel invites.' },
        { status: 403 }
      );
    }

    // Find the target member
    const targetMember = await db.orgMember.findUnique({
      where: { id: memberId },
    });

    if (!targetMember) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    // Ensure the target member belongs to the same org
    if (targetMember.orgId !== currentUserMember.orgId) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    // Can only cancel pending invites (no joinedAt means not yet accepted)
    if (targetMember.joinedAt) {
      return NextResponse.json(
        { error: 'Cannot cancel an invite that has already been accepted. Remove the member instead.' },
        { status: 400 }
      );
    }

    // Delete the pending invite
    await db.orgMember.delete({
      where: { id: memberId },
    });

    // Create audit log entry
    await db.auditLog.create({
      data: {
        orgId: currentUserMember.orgId,
        userId,
        action: 'cancel_invite',
        entityType: 'member',
        entityId: memberId,
        entityName: targetMember.email,
        details: `Cancelled invite for ${targetMember.email}`,
      },
    });

    return NextResponse.json({ message: 'Invite cancelled successfully' });
  } catch (error) {
    console.error('Cancel invite error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
