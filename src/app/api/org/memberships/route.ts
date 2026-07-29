import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const memberships = await db.orgMember.findMany({
      where: {
        userId,
        joinedAt: { not: null },
      },
      select: {
        orgId: true,
        role: true,
        org: {
          select: {
            name: true,
            logoUrl: true,
          },
        },
      },
      orderBy: [{ joinedAt: "desc" }, { invitedAt: "desc" }],
    });

    return NextResponse.json({
      organizations: memberships.map((membership) => ({
        id: membership.orgId,
        name: membership.org.name,
        logoUrl: membership.org.logoUrl,
        role: membership.role,
      })),
    });
  } catch (error) {
    console.error("List organization memberships error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
