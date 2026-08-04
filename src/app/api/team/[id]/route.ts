import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { canManageOrganization, getOrgContext } from "@/lib/org-context";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const context = await getOrgContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!canManageOrganization(context.role)) {
      return NextResponse.json(
        { error: "Only organization owners and admins can remove members." },
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

    if (!targetMember.joinedAt) {
      return NextResponse.json(
        { error: "This invitation is still pending. Cancel the invitation instead." },
        { status: 400 },
      );
    }
    if (targetMember.userId === context.userId) {
      return NextResponse.json(
        { error: "You cannot remove your own membership." },
        { status: 400 },
      );
    }
    if (context.role === "admin" && targetMember.role !== "member") {
      return NextResponse.json(
        { error: "Administrators can remove members only. An owner must manage admins." },
        { status: 403 },
      );
    }

    if (targetMember.role === "owner") {
      const ownerCount = await db.orgMember.count({
        where: {
          orgId: context.orgId,
          role: "owner",
          joinedAt: { not: null },
        },
      });
      if (ownerCount <= 1) {
        return NextResponse.json(
          { error: "The last owner cannot be removed. Transfer ownership first." },
          { status: 400 },
        );
      }
    }

    await db.$transaction(async (transaction) => {
      await transaction.auditLog.create({
        data: {
          orgId: context.orgId,
          userId: context.userId,
          action: "remove_member",
          entityType: "member",
          entityId: targetMember.id,
          entityName: targetMember.email,
          details: JSON.stringify({ previousRole: targetMember.role }),
        },
      });
      await transaction.orgMember.delete({ where: { id: targetMember.id } });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove member error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
