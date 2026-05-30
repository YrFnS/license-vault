import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

async function getUserOrg(session: any) {
  if (!session?.user?.email) return null;
  const member = await db.orgMember.findFirst({
    where: { email: session.user.email },
    orderBy: { invitedAt: 'desc' },
  });
  return member;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const member = await getUserOrg(session);
    if (!member) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    // Only owner can view hierarchy
    if (member.role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const org = await db.organization.findUnique({
      where: { id: member.orgId },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            tradeType: true,
            primaryState: true,
          },
        },
        subsidiaries: {
          include: {
            _count: { select: { licenses: true, members: true } },
            licenses: {
              select: { expirationDate: true },
            },
          },
        },
      },
    });

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Calculate compliance score for each subsidiary
    const subsidiariesWithStats = org.subsidiaries.map((sub) => {
      const totalLicenses = sub._count.licenses;
      const activeLicenses = sub.licenses.filter(
        (l) => new Date(l.expirationDate) > thirtyDaysFromNow
      ).length;
      const complianceScore = totalLicenses > 0 ? Math.round((activeLicenses / totalLicenses) * 100) : 100;

      return {
        id: sub.id,
        name: sub.name,
        tradeType: sub.tradeType,
        primaryState: sub.primaryState,
        licenseCount: totalLicenses,
        memberCount: sub._count.members,
        complianceScore,
      };
    });

    // Calculate compliance score for current org
    const currentOrgLicenses = await db.license.findMany({
      where: { orgId: org.id },
      select: { expirationDate: true },
    });
    const currentTotal = currentOrgLicenses.length;
    const currentActive = currentOrgLicenses.filter(
      (l) => new Date(l.expirationDate) > thirtyDaysFromNow
    ).length;
    const currentCompliance = currentTotal > 0 ? Math.round((currentActive / currentTotal) * 100) : 100;

    const currentMemberCount = await db.orgMember.count({ where: { orgId: org.id } });

    // Count projects for the org
    const projectCount = await db.project.count({ where: { orgId: org.id } });

    // Count API key usage: total API keys as a proxy for apiCallCount
    const apiCallCount = await db.apiKey.count({ where: { orgId: org.id, isActive: true } });

    return NextResponse.json({
      currentOrg: {
        id: org.id,
        name: org.name,
        tradeType: org.tradeType,
        primaryState: org.primaryState,
        licenseCount: currentTotal,
        memberCount: currentMemberCount,
        complianceScore: currentCompliance,
        parentId: org.parentId,
      },
      parent: org.parent,
      subsidiaries: subsidiariesWithStats,
      projectCount,
      apiCallCount,
    });
  } catch (error) {
    console.error('Error fetching org hierarchy:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
