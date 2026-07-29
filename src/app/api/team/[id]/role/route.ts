import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getOrgContext } from "@/lib/org-context";

const changeRoleSchema = z.object({
  role: z.enum(["owner", "admin", "member"]),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const context = await getOrgContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (context.role !== "owner") {
      return NextResponse.json(
        { error: "Only organization owners can change member roles." },
        { status: 403 },
      );
    }

    const { id: memberId } = await params;
    const targetMember = await db.orgMember.findFirst({
      where: { id: memberId, orgId: context.orgId },
    });
    if (!targetMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const result = changeRoleSchema.safeParse(await request.json());
    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error.issues[0]?.message || "Validation failed",
          details: result.error.flatten(),
        },
        { status: 400 },
      );
    }

    const newRole = result.data.role;
    if (targetMember.userId === context.userId) {
      return NextResponse.json(
        { error: "You cannot change your own role." },
        { status: 400 },
      );
    }
    if (targetMember.role === newRole) {
      return NextResponse.json(
        { error: `Member already has the ${newRole} role.` },
        { status: 400 },
      );
    }
    if (newRole === "owner" && !targetMember.joinedAt) {
      return NextResponse.json(
        { error: "A pending invitation cannot be promoted to owner." },
        { status: 400 },
      );
    }

    if (targetMember.role === "owner" && newRole !== "owner") {
      const ownerCount = await db.orgMember.count({
        where: {
          orgId: context.orgId,
          role: "owner",
          joinedAt: { not: null },
        },
      });
      if (ownerCount <= 1) {
        return NextResponse.json(
          { error: "The last owner cannot be demoted. Transfer ownership first." },
          { status: 400 },
        );
      }
    }

    const updatedMember = await db.$transaction(async (transaction) => {
      const member = await transaction.orgMember.update({
        where: { id: targetMember.id },
        data: { role: newRole },
      });
      await transaction.auditLog.create({
        data: {
          orgId: context.orgId,
          userId: context.userId,
          action: "change_role",
          entityType: "member",
          entityId: targetMember.id,
          entityName: targetMember.email,
          details: JSON.stringify({
            previousRole: targetMember.role,
            newRole,
          }),
        },
      });
      return member;
    });

    return NextResponse.json({ member: updatedMember });
  } catch (error) {
    console.error("Change role error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
