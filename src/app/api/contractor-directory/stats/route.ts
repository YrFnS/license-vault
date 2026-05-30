import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// GET: Directory stats
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const orgMember = await db.orgMember.findFirst({ where: { userId } });
    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const orgWhere = { orgId: orgMember.orgId };

    const [
      totalContractors,
      verifiedCount,
      preferredCount,
      blacklistedCount,
      avgScoreResult,
      tradeTypeBreakdown,
      stateBreakdown,
    ] = await Promise.all([
      db.contractorDirectory.count({ where: orgWhere }),
      db.contractorDirectory.count({ where: { ...orgWhere, isVerified: true } }),
      db.contractorDirectory.count({ where: { ...orgWhere, isPreferred: true } }),
      db.contractorDirectory.count({ where: { ...orgWhere, isBlacklisted: true } }),
      db.contractorDirectory.aggregate({
        where: orgWhere,
        _avg: { complianceScore: true },
      }),
      db.contractorDirectory.groupBy({
        by: ['tradeType'],
        where: orgWhere,
        _count: { id: true },
      }),
      db.contractorDirectory.groupBy({
        by: ['state'],
        where: { ...orgWhere, state: { not: null } },
        _count: { id: true },
      }),
    ]);

    return NextResponse.json({
      totalContractors,
      verifiedCount,
      preferredCount,
      blacklistedCount,
      avgScore: Math.round(avgScoreResult._avg.complianceScore || 0),
      tradeTypeBreakdown: tradeTypeBreakdown.map((t) => ({
        tradeType: t.tradeType,
        count: t._count.id,
      })),
      stateBreakdown: stateBreakdown.map((s) => ({
        state: s.state,
        count: s._count.id,
      })),
    });
  } catch (error) {
    console.error('Get contractor stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
