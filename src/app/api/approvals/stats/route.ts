import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// GET: Get approval statistics
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const orgMember = await db.orgMember.findFirst({
      where: { userId },
    });

    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const orgWhere = { orgId: orgMember.orgId };

    // Counts by status
    const [pending, approved, rejected, cancelled] = await Promise.all([
      db.approvalWorkflow.count({ where: { ...orgWhere, status: 'pending' } }),
      db.approvalWorkflow.count({ where: { ...orgWhere, status: 'approved' } }),
      db.approvalWorkflow.count({ where: { ...orgWhere, status: 'rejected' } }),
      db.approvalWorkflow.count({ where: { ...orgWhere, status: 'cancelled' } }),
    ]);

    // Counts by type
    const typeCounts = await db.approvalWorkflow.groupBy({
      by: ['type'],
      where: orgWhere,
      _count: { type: true },
    });

    // Pending by priority
    const pendingByPriority = await db.approvalWorkflow.groupBy({
      by: ['priority'],
      where: { ...orgWhere, status: 'pending' },
      _count: { priority: true },
    });

    // Average review time (for approved/rejected items)
    const reviewedItems = await db.approvalWorkflow.findMany({
      where: {
        ...orgWhere,
        status: { in: ['approved', 'rejected'] },
        reviewedAt: { not: null },
      },
      select: { createdAt: true, reviewedAt: true },
    });

    let avgReviewTimeHours = 0;
    if (reviewedItems.length > 0) {
      const totalHours = reviewedItems.reduce((acc, item) => {
        if (item.reviewedAt) {
          const diff = item.reviewedAt.getTime() - item.createdAt.getTime();
          return acc + diff / (1000 * 60 * 60);
        }
        return acc;
      }, 0);
      avgReviewTimeHours = totalHours / reviewedItems.length;
    }

    return NextResponse.json({
      countsByStatus: { pending, approved, rejected, cancelled },
      countsByType: typeCounts.map(t => ({ type: t.type, count: t._count.type })),
      pendingByPriority: pendingByPriority.map(p => ({ priority: p.priority, count: p._count.priority })),
      avgReviewTimeHours: Math.round(avgReviewTimeHours * 10) / 10,
      total: pending + approved + rejected + cancelled,
    });
  } catch (error) {
    console.error('Get approval stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
