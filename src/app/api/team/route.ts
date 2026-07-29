import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { sanitizeString } from "@/lib/sanitize";
import { sendTeamInvitation } from "@/lib/email";
import { canManageOrganization, getOrgContext } from "@/lib/org-context";
import { createTeamInvitationToken } from "@/lib/team-invitation";

export async function GET() {
  try {
    const context = await getOrgContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const members = await db.orgMember.findMany({
      where: { orgId: context.orgId },
      orderBy: [
        { joinedAt: "asc" },
        { role: "asc" },
        { invitedAt: "asc" },
      ],
      select: {
        id: true,
        userId: true,
        email: true,
        fullName: true,
        role: true,
        invitedAt: true,
        joinedAt: true,
      },
    });

    return NextResponse.json(
      {
        members: members.map((member) => ({
          ...member,
          status: member.joinedAt ? "active" : "pending",
        })),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Get team error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const inviteMemberSchema = z.object({
  email: z.string().trim().email("Invalid email address").max(320),
  role: z.enum(["admin", "member"]),
  fullName: z.string().trim().max(200).optional(),
});

export async function POST(request: Request) {
  try {
    const context = await getOrgContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!canManageOrganization(context.role)) {
      return NextResponse.json(
        { error: "Only organization owners and admins can invite members." },
        { status: 403 },
      );
    }

    const result = inviteMemberSchema.safeParse(await request.json());
    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error.issues[0]?.message || "Validation failed",
          details: result.error.flatten(),
        },
        { status: 400 },
      );
    }

    const email = result.data.email.toLowerCase();
    const role = result.data.role;
    const fullName = result.data.fullName
      ? sanitizeString(result.data.fullName)
      : null;

    if (role === "admin" && context.role !== "owner") {
      return NextResponse.json(
        { error: "Only organization owners can invite administrators." },
        { status: 403 },
      );
    }

    if (email === context.email.toLowerCase()) {
      return NextResponse.json(
        { error: "You are already a member of this organization." },
        { status: 409 },
      );
    }

    const existingMember = await db.orgMember.findUnique({
      where: { orgId_email: { orgId: context.orgId, email } },
    });
    if (existingMember) {
      return NextResponse.json(
        {
          error: existingMember.joinedAt
            ? "This email is already a member of the organization."
            : "An invitation is already pending for this email.",
          memberId: existingMember.id,
        },
        { status: 409 },
      );
    }

    const existingUser = await db.user.findUnique({
      where: { email },
      select: { id: true, name: true },
    });

    const newMember = await db.$transaction(async (transaction) => {
      const member = await transaction.orgMember.create({
        data: {
          orgId: context.orgId,
          userId: existingUser?.id || null,
          email,
          fullName: fullName || existingUser?.name || null,
          role,
          joinedAt: null,
        },
      });

      await transaction.auditLog.create({
        data: {
          orgId: context.orgId,
          userId: context.userId,
          action: "invite",
          entityType: "member",
          entityId: member.id,
          entityName: email,
          details: JSON.stringify({ role, existingAccount: Boolean(existingUser) }),
        },
      });
      return member;
    });

    const invitationToken = createTeamInvitationToken({
      memberId: newMember.id,
      orgId: context.orgId,
      email,
      invitedAt: newMember.invitedAt,
    });
    const appUrl =
      process.env.NEXTAUTH_URL ||
      process.env.APP_URL ||
      new URL(request.url).origin;

    sendTeamInvitation(
      email,
      {
        inviterName: context.email,
        orgName: context.orgName,
        acceptUrl: `${appUrl}/en/invite/${encodeURIComponent(invitationToken)}`,
        role,
      },
      context.orgId,
    ).catch((error) =>
      console.error("Failed to send team invitation email:", error),
    );

    return NextResponse.json(
      {
        member: {
          id: newMember.id,
          email: newMember.email,
          fullName: newMember.fullName,
          role: newMember.role,
          invitedAt: newMember.invitedAt,
          joinedAt: newMember.joinedAt,
          status: "pending",
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Invite member error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
