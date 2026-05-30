import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { sendTeamInvitation } from '@/lib/email';

// POST: Resend an invite (owner/admin only)
export async function POST(
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

    // Check permissions: only owner or admin can resend invites
    if (!['owner', 'admin'].includes(currentUserMember.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only owners and admins can resend invites.' },
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

    // Can only resend pending invites (no joinedAt means not yet accepted)
    if (targetMember.joinedAt) {
      return NextResponse.json(
        { error: 'Cannot resend an invite that has already been accepted.' },
        { status: 400 }
      );
    }

    // Update invitedAt to current date
    const updatedMember = await db.orgMember.update({
      where: { id: memberId },
      data: { invitedAt: new Date() },
    });

    // Create audit log entry
    await db.auditLog.create({
      data: {
        orgId: currentUserMember.orgId,
        userId,
        action: 'resend_invite',
        entityType: 'member',
        entityId: memberId,
        entityName: targetMember.email,
        details: `Resent invite to ${targetMember.email}`,
      },
    });

    // Send team invitation email (fire-and-forget)
    const inviterUser = await db.user.findUnique({ where: { id: userId } });
    const org = await db.organization.findUnique({ where: { id: currentUserMember.orgId } });
    const appUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || new URL(request.url).origin;

    sendTeamInvitation(
      targetMember.email,
      {
        inviterName: inviterUser?.name || inviterUser?.email || 'A team member',
        orgName: org?.name || org?.companyName || 'License Vault',
        acceptUrl: `${appUrl}/signup?invite=${encodeURIComponent(targetMember.email)}`,
        role: targetMember.role,
      },
      currentUserMember.orgId
    ).catch(err => console.error('Failed to resend team invitation email:', err));

    return NextResponse.json({ member: updatedMember });
  } catch (error) {
    console.error('Resend invite error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
