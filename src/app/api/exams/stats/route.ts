import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// GET: Aggregated exam stats
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

    const exams = await db.examTracking.findMany({
      where: { orgId: orgMember.orgId },
    });

    const total = exams.length;
    const passed = exams.filter(e => e.status === 'passed').length;
    const failed = exams.filter(e => e.status === 'failed').length;
    const scheduled = exams.filter(e => e.status === 'scheduled').length;
    const passRate = passed + failed > 0 ? Math.round((passed / (passed + failed)) * 100) : 0;

    // Upcoming exams (scheduled with future date)
    const now = new Date();
    const upcoming = exams
      .filter(e => e.status === 'scheduled' && e.examDate && new Date(e.examDate) > now)
      .sort((a, b) => {
        if (!a.examDate) return 1;
        if (!b.examDate) return -1;
        return new Date(a.examDate).getTime() - new Date(b.examDate).getTime();
      })
      .slice(0, 5);

    // Average study hours
    const examsWithHours = exams.filter(e => e.studyHours > 0);
    const avgStudyHours = examsWithHours.length > 0
      ? Math.round((examsWithHours.reduce((sum, e) => sum + e.studyHours, 0) / examsWithHours.length) * 10) / 10
      : 0;

    // Exams by state
    const byState: Record<string, number> = {};
    exams.forEach(e => {
      if (e.state) {
        byState[e.state] = (byState[e.state] || 0) + 1;
      }
    });

    // Exams by type
    const byType: Record<string, { total: number; passed: number; failed: number }> = {};
    exams.forEach(e => {
      if (!byType[e.examType]) {
        byType[e.examType] = { total: 0, passed: 0, failed: 0 };
      }
      byType[e.examType].total++;
      if (e.status === 'passed') byType[e.examType].passed++;
      if (e.status === 'failed') byType[e.examType].failed++;
    });

    return NextResponse.json({
      stats: { total, passed, failed, scheduled, passRate, avgStudyHours },
      upcoming,
      byState,
      byType,
    });
  } catch (error) {
    console.error('Get exam stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
