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

    // Only owner can view cross-compliance
    if (member.role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const org = await db.organization.findUnique({
      where: { id: member.orgId },
      include: {
        subsidiaries: true,
      },
    });

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const fiveDaysFromNow = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

    // Get compliance data for current org
    const currentLicenses = await db.license.findMany({
      where: { orgId: org.id },
      select: { expirationDate: true },
    });

    const currentTotal = currentLicenses.length;
    const currentActive = currentLicenses.filter((l) => new Date(l.expirationDate) > thirtyDaysFromNow).length;
    const currentExpiring = currentLicenses.filter(
      (l) => new Date(l.expirationDate) > now && new Date(l.expirationDate) <= thirtyDaysFromNow
    ).length;
    const currentExpired = currentLicenses.filter((l) => new Date(l.expirationDate) <= now).length;
    const currentAtRisk = currentExpiring + currentExpired;
    const currentCompliance = currentTotal > 0 ? Math.round((currentActive / currentTotal) * 100) : 100;

    const currentOrgData = {
      id: org.id,
      name: org.name,
      totalLicenses: currentTotal,
      activeLicenses: currentActive,
      expiringLicenses: currentExpiring,
      expiredLicenses: currentExpired,
      atRisk: currentAtRisk,
      complianceRate: currentCompliance,
    };

    // Get compliance data for subsidiaries
    const subsidiariesData = await Promise.all(
      org.subsidiaries.map(async (sub) => {
        const subLicenses = await db.license.findMany({
          where: { orgId: sub.id },
          select: { expirationDate: true },
        });

        const total = subLicenses.length;
        const active = subLicenses.filter((l) => new Date(l.expirationDate) > thirtyDaysFromNow).length;
        const expiring = subLicenses.filter(
          (l) => new Date(l.expirationDate) > now && new Date(l.expirationDate) <= thirtyDaysFromNow
        ).length;
        const expired = subLicenses.filter((l) => new Date(l.expirationDate) <= now).length;
        const atRisk = expiring + expired;
        const complianceRate = total > 0 ? Math.round((active / total) * 100) : 100;

        return {
          id: sub.id,
          name: sub.name,
          totalLicenses: total,
          activeLicenses: active,
          expiringLicenses: expiring,
          expiredLicenses: expired,
          atRisk,
          complianceRate,
        };
      })
    );

    const allOrgs = [currentOrgData, ...subsidiariesData];
    const totalOrgs = allOrgs.length;
    const combinedLicenses = allOrgs.reduce((sum, o) => sum + o.totalLicenses, 0);
    const combinedActive = allOrgs.reduce((sum, o) => sum + o.activeLicenses, 0);
    const combinedAtRisk = allOrgs.reduce((sum, o) => sum + o.atRisk, 0);
    const combinedCompliance = combinedLicenses > 0
      ? Math.round((combinedActive / combinedLicenses) * 100)
      : 100;

    return NextResponse.json({
      summary: {
        totalOrgs,
        combinedCompliance,
        totalLicenses: combinedLicenses,
        atRisk: combinedAtRisk,
      },
      organizations: allOrgs,
    });
  } catch (error) {
    console.error('Error fetching cross-compliance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
