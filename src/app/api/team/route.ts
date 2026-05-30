import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { sanitizeString } from '@/lib/sanitize';
import { sendTeamInvitation } from '@/lib/email';

// GET: List team members for the user's org
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Find user's org membership
    const orgMember = await db.orgMember.findFirst({
      where: { userId },
    });

    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const members = await db.orgMember.findMany({
      where: { orgId: orgMember.orgId },
      orderBy: { invitedAt: 'asc' },
    });

    return NextResponse.json({ members });
  } catch (error) {
    console.error('Get team error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'member'], { required_error: 'Role is required' }),
  fullName: z.string().optional(),
});

// POST: Invite a new team member (owner/admin only)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Find user's org membership and check role
    const orgMember = await db.orgMember.findFirst({
      where: { userId },
    });

    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    if (!['owner', 'admin'].includes(orgMember.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only owners and admins can invite members.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const result = inviteMemberSchema.safeParse(body);

    if (!result.success) {
      const firstError = result.error.issues?.[0];
      return NextResponse.json(
        { error: firstError?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const { email, role, fullName } = result.data;

    // Sanitize inputs (email is already validated by zod, but sanitize name)
    const sanitizedEmail = email;
    const sanitizedFullName = fullName ? sanitizeString(fullName) : null;

    // Check if member already exists in the org
    const existingMember = await db.orgMember.findUnique({
      where: {
        orgId_email: {
          orgId: orgMember.orgId,
          email,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: 'This email is already a member of the organization.' },
        { status: 409 }
      );
    }

    // Check if there's an existing user with this email
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    // Create org_member entry
    const newMember = await db.orgMember.create({
      data: {
        orgId: orgMember.orgId,
        userId: existingUser?.id || null,
        email: sanitizedEmail,
        fullName: sanitizedFullName,
        role,
        joinedAt: existingUser ? new Date() : null,
      },
    });

    // Create audit log entry
    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'invite',
        entityType: 'member',
        entityId: newMember.id,
        entityName: email,
        details: `Invited ${email} as ${role}`,
      },
    });

    // Send team invitation email (fire-and-forget)
    const inviterUser = await db.user.findUnique({ where: { id: userId } });
    const org = await db.organization.findUnique({ where: { id: orgMember.orgId } });
    const appUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || new URL(request.url).origin;

    sendTeamInvitation(
      email,
      {
        inviterName: inviterUser?.name || inviterUser?.email || 'A team member',
        orgName: org?.name || org?.companyName || 'License Vault',
        acceptUrl: `${appUrl}/signup?invite=${encodeURIComponent(email)}`,
        role,
      },
      orgMember.orgId
    ).catch(err => console.error('Failed to send team invitation email:', err));

    return NextResponse.json({ member: newMember }, { status: 201 });
  } catch (error) {
    console.error('Invite member error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
