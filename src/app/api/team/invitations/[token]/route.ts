import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { verifyTeamInvitationToken } from "@/lib/team-invitation";

async function resolveInvitation(token: string) {
  const payload = verifyTeamInvitationToken(token);
  if (!payload) return null;

  const membership = await db.orgMember.findFirst({
    where: {
      id: payload.memberId,
      orgId: payload.orgId,
    },
    include: {
      org: {
        select: {
          id: true,
          name: true,
          companyName: true,
          logoUrl: true,
        },
      },
    },
  });

  if (
    !membership ||
    membership.joinedAt ||
    membership.email.toLowerCase() !== payload.email ||
    membership.invitedAt.getTime() !== payload.invitedAt
  ) {
    return null;
  }

  return { payload, membership };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    const invitation = await resolveInvitation(token);
    if (!invitation) {
      return NextResponse.json(
        { error: "This invitation is invalid, expired, or has already been used." },
        { status: 404 },
      );
    }

    const existingUser = await db.user.findUnique({
      where: { email: invitation.membership.email.toLowerCase() },
      select: { id: true },
    });

    return NextResponse.json(
      {
        invitation: {
          email: invitation.membership.email,
          fullName: invitation.membership.fullName,
          role: invitation.membership.role,
          expiresAt: new Date(invitation.payload.expiresAt).toISOString(),
          hasAccount: Boolean(existingUser),
          organization: {
            id: invitation.membership.org.id,
            name:
              invitation.membership.org.companyName ||
              invitation.membership.org.name,
            logoUrl: invitation.membership.org.logoUrl,
          },
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Resolve invitation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as
      | { id?: string; email?: string | null; name?: string | null }
      | undefined;
    if (!sessionUser?.id || !sessionUser.email) {
      return NextResponse.json(
        { error: "Sign in with the invited email address to accept this invitation." },
        { status: 401 },
      );
    }

    const userId = sessionUser.id;
    const userEmail = sessionUser.email;
    const userName = sessionUser.name;

    const { token } = await params;
    const invitation = await resolveInvitation(token);
    if (!invitation) {
      return NextResponse.json(
        { error: "This invitation is invalid, expired, or has already been used." },
        { status: 404 },
      );
    }

    if (
      userEmail.toLowerCase() !== invitation.membership.email.toLowerCase()
    ) {
      return NextResponse.json(
        { error: "This invitation belongs to a different email address." },
        { status: 403 },
      );
    }
    if (
      invitation.membership.userId &&
      invitation.membership.userId !== userId
    ) {
      return NextResponse.json(
        { error: "This invitation is linked to a different account." },
        { status: 403 },
      );
    }

    const membership = await db.$transaction(async (transaction) => {
      const accepted = await transaction.orgMember.update({
        where: { id: invitation.membership.id },
        data: {
          userId,
          fullName:
            invitation.membership.fullName ||
            userName ||
            invitation.membership.email,
          joinedAt: new Date(),
        },
      });

      await transaction.alertPreference.upsert({
        where: {
          orgId_userId: {
            orgId: invitation.membership.orgId,
            userId,
          },
        },
        update: {},
        create: {
          orgId: invitation.membership.orgId,
          userId,
          alert60Days: true,
          alert30Days: true,
          alert5Days: true,
          alertEmail: true,
          alertInApp: true,
        },
      });

      await transaction.auditLog.create({
        data: {
          orgId: invitation.membership.orgId,
          userId,
          action: "accept_invite",
          entityType: "member",
          entityId: accepted.id,
          entityName: accepted.email,
          details: JSON.stringify({ role: accepted.role }),
        },
      });
      return accepted;
    });

    return NextResponse.json({
      success: true,
      orgId: membership.orgId,
      role: membership.role,
    });
  } catch (error) {
    console.error("Accept invitation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
