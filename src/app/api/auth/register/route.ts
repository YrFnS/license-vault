import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { sanitizeString } from "@/lib/sanitize";
import { verifyTeamInvitationToken } from "@/lib/team-invitation";

const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(200),
  email: z.string().trim().email("Invalid email address").max(320),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(200)
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  inviteToken: z.string().max(4_096).optional(),
});

export async function POST(request: Request) {
  try {
    const result = registerSchema.safeParse(await request.json());
    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error.issues[0]?.message || "Validation failed",
          details: result.error.flatten(),
        },
        { status: 400 },
      );
    }

    const name = sanitizeString(result.data.name);
    const email = result.data.email.toLowerCase();
    const existingUser = await db.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 },
      );
    }

    const hashedPassword = await bcrypt.hash(result.data.password, 12);

    if (result.data.inviteToken) {
      const payload = verifyTeamInvitationToken(result.data.inviteToken);
      if (!payload || payload.email !== email) {
        return NextResponse.json(
          { error: "This invitation is invalid, expired, or belongs to another email." },
          { status: 400 },
        );
      }

      const invitation = await db.orgMember.findFirst({
        where: {
          id: payload.memberId,
          orgId: payload.orgId,
          joinedAt: null,
        },
      });
      if (
        !invitation ||
        invitation.email.toLowerCase() !== email ||
        invitation.invitedAt.getTime() !== payload.invitedAt ||
        invitation.userId
      ) {
        return NextResponse.json(
          { error: "This invitation is no longer available." },
          { status: 409 },
        );
      }

      const user = await db.$transaction(async (transaction) => {
        const created = await transaction.user.create({
          data: { name, email, password: hashedPassword },
        });

        await transaction.orgMember.update({
          where: { id: invitation.id },
          data: {
            userId: created.id,
            fullName: name,
            joinedAt: new Date(),
          },
        });

        await transaction.alertPreference.create({
          data: {
            orgId: invitation.orgId,
            userId: created.id,
            alert60Days: true,
            alert30Days: true,
            alert5Days: true,
            alertEmail: true,
            alertInApp: true,
          },
        });

        await transaction.auditLog.create({
          data: {
            orgId: invitation.orgId,
            userId: created.id,
            action: "accept_invite",
            entityType: "member",
            entityId: invitation.id,
            entityName: email,
            details: JSON.stringify({ role: invitation.role, registered: true }),
          },
        });
        return created;
      });

      return NextResponse.json(
        {
          success: true,
          invited: true,
          orgId: invitation.orgId,
          user: { id: user.id, name: user.name, email: user.email },
        },
        { status: 201 },
      );
    }

    const resultData = await db.$transaction(async (transaction) => {
      const user = await transaction.user.create({
        data: { name, email, password: hashedPassword },
      });
      const organization = await transaction.organization.create({
        data: {
          name: `${name}'s Organization`,
          tradeType: "general",
          primaryState: "CA",
          plan: "free",
        },
      });
      await transaction.orgMember.create({
        data: {
          orgId: organization.id,
          userId: user.id,
          email: user.email,
          fullName: user.name,
          role: "owner",
          joinedAt: new Date(),
        },
      });
      await transaction.alertPreference.create({
        data: {
          orgId: organization.id,
          userId: user.id,
          alert60Days: true,
          alert30Days: true,
          alert5Days: true,
          alertEmail: true,
          alertInApp: true,
        },
      });
      return { user, organization };
    });

    return NextResponse.json(
      {
        success: true,
        invited: false,
        orgId: resultData.organization.id,
        user: {
          id: resultData.user.id,
          name: resultData.user.name,
          email: resultData.user.email,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 },
      );
    }
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
