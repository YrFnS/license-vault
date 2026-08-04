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
        { error: "Only organization owners and admins can cancel invitations." },
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
        { error: "Only an owner can cancel an administrator invitation." },
        { status: 403 },
      );
    }

    await db.$transaction(async (transaction) => {
      await transaction.auditLog.create({
        data: {
          orgId: context.orgId,
          userId: context.userId,
          action: "cancel_invite",
          entityType: "member",
          entityId: invitation.id,
          entityName: invitation.email,
          details: JSON.stringify({ role: invitation.role }),
        },
      });
      await transaction.orgMember.delete({ where: { id: invitation.id } });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cancel invite error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
