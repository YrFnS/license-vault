import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/automation/history — Get automation run history
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

    if (!['owner', 'admin'].includes(orgMember.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const orgId = orgMember.orgId;

    const runs = await db.automationRun.findMany({
      where: { orgId },
      orderBy: { startedAt: 'desc' },
      take: 20,
    });

    const formatted = runs.map((run) => {
      let parsedResults = null;
      try {
        parsedResults = run.results ? JSON.parse(run.results) : null;
      } catch {
        parsedResults = null;
      }

      return {
        id: run.id,
        type: run.type,
        status: run.status,
        results: parsedResults,
        startedAt: run.startedAt.toISOString(),
        completedAt: run.completedAt?.toISOString() || null,
        duration: run.completedAt
          ? run.completedAt.getTime() - run.startedAt.getTime()
          : null,
      };
    });

    return NextResponse.json({ runs: formatted });
  } catch (error) {
    console.error('Automation history error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
