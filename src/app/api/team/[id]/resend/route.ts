import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendTeamInvitation } from "@/lib/email";
import { canManageOrganization, getOrgContext } from "@/lib/org-context";
import { createTeamInvitationToken } from "@/lib/team-invitation";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const context = await getOrgContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!canManageOrganization(context.role)) {
      return NextResponse.json(
        { error: "Only organization owners and admins can resend invitations." },
        { status: 403 },
      );
    }

    const { id: memberId } = await params;
    const invitation = await db.orgMember.findFirst({
      where: { id: memberId, orgId: context.orgId },
    });
    if (!invitation || invitation.joinedAt) {
      return NextResponse.json({ error: "Pending invitation not found" }, { status: 404 });
    }
    if (context.role === "admin" && invitation.role === "admin") {
      return NextResponse.json(
        { error: "Only an owner can resend an administrator invitation." },
        { status: 403 },
      );
    }

    const updatedInvitation = await db.$transaction(async (transaction) => {
      const updated = await transaction.orgMember.update({
        where: { id: invitation.id },
        data: { invitedAt: new Date() },
      });
      await transaction.auditLog.create({
        data: {
          orgId: context.orgId,
          userId: context.userId,
          action: "resend_invite",
          entityType: "member",
          entityId: invitation.id,
          entityName: invitation.email,
          details: JSON.stringify({ role: invitation.role }),
        },
      });
      return updated;
    });

    const token = createTeamInvitationToken({
      memberId: updatedInvitation.id,
      orgId: context.orgId,
      email: updatedInvitation.email,
      invitedAt: updatedInvitation.invitedAt,
    });
    const appUrl =
      process.env.NEXTAUTH_URL ||
      process.env.APP_URL ||
      new URL(request.url).origin;

    sendTeamInvitation(
      updatedInvitation.email,
      {
        inviterName: context.email,
        orgName: context.orgName,
        acceptUrl: `${appUrl}/en/invite/${encodeURIComponent(token)}`,
        role: updatedInvitation.role,
      },
      context.orgId,
    ).catch((error) =>
      console.error("Failed to resend team invitation email:", error),
    );

    return NextResponse.json({
      member: {
        id: updatedInvitation.id,
        email: updatedInvitation.email,
        fullName: updatedInvitation.fullName,
        role: updatedInvitation.role,
        invitedAt: updatedInvitation.invitedAt,
        joinedAt: null,
        status: "pending",
      },
    });
  } catch (error) {
    console.error("Resend invite error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
