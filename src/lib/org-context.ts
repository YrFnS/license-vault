import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export type OrgRole = "owner" | "admin" | "member";

export interface OrgContext {
  userId: string;
  email: string;
  orgId: string;
  orgName: string;
  role: OrgRole;
}

function normalizeRole(role: string): OrgRole {
  if (role === "owner" || role === "admin") return role;
  return "member";
}

/**
 * Resolves the organization selected in the authenticated JWT and verifies that
 * the user still has an accepted membership in it. Older sessions without an
 * active organization fall back to the most recently joined organization.
 */
export async function getOrgContext(): Promise<OrgContext | null> {
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as
    | {
        id?: string;
        email?: string | null;
        activeOrgId?: string;
      }
    | undefined;

  if (!sessionUser?.id || !sessionUser.email) return null;

  const baseWhere = {
    userId: sessionUser.id,
    joinedAt: { not: null },
  } as const;

  const preferredMembership = sessionUser.activeOrgId
    ? await db.orgMember.findFirst({
        where: {
          ...baseWhere,
          orgId: sessionUser.activeOrgId,
        },
        include: {
          org: {
            select: { id: true, name: true },
          },
        },
      })
    : null;

  const membership =
    preferredMembership ??
    (await db.orgMember.findFirst({
      where: baseWhere,
      include: {
        org: {
          select: { id: true, name: true },
        },
      },
      orderBy: [{ joinedAt: "desc" }, { invitedAt: "desc" }],
    }));

  if (!membership) return null;

  return {
    userId: sessionUser.id,
    email: sessionUser.email,
    orgId: membership.orgId,
    orgName: membership.org.name,
    role: normalizeRole(membership.role),
  };
}

export function canManageOrganization(role: OrgRole): boolean {
  return role === "owner" || role === "admin";
}
