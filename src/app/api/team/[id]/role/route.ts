import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const changeRoleSchema = z.object({
  role: z.enum(['owner', 'admin', 'member'], {
    required_error: 'Role is required',
    invalid_type_error: 'Invalid role. Must be owner, admin, or member.',
  }),
});

// PUT: Change a member's role (owner only)
export async function PUT(
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

    // Check permissions: only owner can change roles
    if (currentUserMember.role !== 'owner') {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only owners can change member roles.' },
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

    // Validate request body
    const body = await request.json();
    const result = changeRoleSchema.safeParse(body);

    if (!result.success) {
      const firstError = result.error.issues?.[0];
      return NextResponse.json(
        { error: firstError?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const { role: newRole } = result.data;

    // Cannot change your own role
    if (targetMember.userId === userId) {
      return NextResponse.json(
        { error: 'Cannot change your own role.' },
        { status: 400 }
      );
    }

    // Cannot change the last owner's role
    if (targetMember.role === 'owner' && newRole !== 'owner') {
      const ownerCount = await db.orgMember.count({
        where: {
          orgId: currentUserMember.orgId,
          role: 'owner',
          joinedAt: { not: null },
        },
      });

      if (ownerCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot change the last owner\'s role. Transfer ownership first.' },
          { status: 400 }
        );
      }
    }

    // No-op if the role is the same
    if (targetMember.role === newRole) {
      return NextResponse.json(
        { error: `Member already has the ${newRole} role.` },
        { status: 400 }
      );
    }

    const previousRole = targetMember.role;

    // Update the member's role
    const updatedMember = await db.orgMember.update({
      where: { id: memberId },
      data: { role: newRole },
    });

    // Create audit log entry
    await db.auditLog.create({
      data: {
        orgId: currentUserMember.orgId,
        userId,
        action: 'change_role',
        entityType: 'member',
        entityId: memberId,
        entityName: targetMember.email,
        details: `Changed ${targetMember.email}'s role from ${previousRole} to ${newRole}`,
      },
    });

    return NextResponse.json({ member: updatedMember });
  } catch (error) {
    console.error('Change role error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
