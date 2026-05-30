import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';

// GET /api/vendor-scores/risk-matrix - Risk distribution data
export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: { organizations: true },
    });

    if (!user?.organizations?.[0]) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const orgId = user.organizations[0].orgId;
    const vendors = await db.vendorScore.findMany({ where: { orgId } });

    const matrix = {
      critical: {
        count: vendors.filter(v => v.riskLevel === 'critical').length,
        avgScore: 0,
        vendors: vendors.filter(v => v.riskLevel === 'critical').map(v => ({
          id: v.id,
          name: v.vendorName,
          score: v.overallScore,
          isFlagged: v.isFlagged,
        })),
      },
      high: {
        count: vendors.filter(v => v.riskLevel === 'high').length,
        avgScore: 0,
        vendors: vendors.filter(v => v.riskLevel === 'high').map(v => ({
          id: v.id,
          name: v.vendorName,
          score: v.overallScore,
          isFlagged: v.isFlagged,
        })),
      },
      medium: {
        count: vendors.filter(v => v.riskLevel === 'medium').length,
        avgScore: 0,
        vendors: vendors.filter(v => v.riskLevel === 'medium').map(v => ({
          id: v.id,
          name: v.vendorName,
          score: v.overallScore,
          isFlagged: v.isFlagged,
        })),
      },
      low: {
        count: vendors.filter(v => v.riskLevel === 'low').length,
        avgScore: 0,
        vendors: vendors.filter(v => v.riskLevel === 'low').map(v => ({
          id: v.id,
          name: v.vendorName,
          score: v.overallScore,
          isFlagged: v.isFlagged,
        })),
      },
    };

    // Calculate avg scores
    for (const level of ['critical', 'high', 'medium', 'low'] as const) {
      const levelVendors = matrix[level].vendors;
      matrix[level].avgScore = levelVendors.length > 0
        ? Math.round((levelVendors.reduce((s, v) => s + v.score, 0) / levelVendors.length) * 100) / 100
        : 0;
    }

    return NextResponse.json(matrix);
  } catch (error) {
    console.error('Error fetching risk matrix:', error);
    return NextResponse.json({ error: 'Failed to fetch risk matrix' }, { status: 500 });
  }
}
