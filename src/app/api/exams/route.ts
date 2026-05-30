import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// GET: List exams with filtering and stats
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

    const { searchParams } = new URL(request.url);
    const examType = searchParams.get('examType') || undefined;
    const status = searchParams.get('status') || undefined;
    const state = searchParams.get('state') || undefined;
    const qualifierId = searchParams.get('qualifierId') || undefined;

    const where: any = { orgId: orgMember.orgId };
    if (examType) where.examType = examType;
    if (status) where.status = status;
    if (state) where.state = state;
    if (qualifierId) where.qualifierId = qualifierId;

    const exams = await db.examTracking.findMany({
      where,
      orderBy: { examDate: 'desc' },
      include: {
        qualifier: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    // Calculate stats
    const total = exams.length;
    const passed = exams.filter(e => e.status === 'passed').length;
    const failed = exams.filter(e => e.status === 'failed').length;
    const scheduled = exams.filter(e => e.status === 'scheduled').length;
    const passRate = passed + failed > 0 ? Math.round((passed / (passed + failed)) * 100) : 0;

    return NextResponse.json({
      exams,
      stats: { total, passed, failed, scheduled, passRate },
    });
  } catch (error) {
    console.error('Get exams error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const createExamSchema = z.object({
  qualifierId: z.string().optional(),
  examType: z.string().min(1, 'Exam type is required'),
  examName: z.string().min(1, 'Exam name is required'),
  examProvider: z.string().optional(),
  state: z.string().optional(),
  status: z.string().default('scheduled'),
  examDate: z.string().optional(),
  score: z.number().optional(),
  passingScore: z.number().optional(),
  resultsReceived: z.string().optional(),
  registrationId: z.string().optional(),
  studyHours: z.number().default(0),
  notes: z.string().optional(),
  certificateUrl: z.string().optional(),
});

// POST: Create exam entry
export async function POST(request: Request) {
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

    const body = await request.json();
    const result = createExamSchema.safeParse(body);

    if (!result.success) {
      const firstError = result.error.issues?.[0];
      return NextResponse.json(
        { error: firstError?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const data = result.data;

    const exam = await db.examTracking.create({
      data: {
        orgId: orgMember.orgId,
        qualifierId: data.qualifierId || null,
        examType: data.examType,
        examName: data.examName,
        examProvider: data.examProvider || null,
        state: data.state || null,
        status: data.status || 'scheduled',
        examDate: data.examDate ? new Date(data.examDate) : null,
        score: data.score ?? null,
        passingScore: data.passingScore ?? null,
        resultsReceived: data.resultsReceived ? new Date(data.resultsReceived) : null,
        registrationId: data.registrationId || null,
        studyHours: data.studyHours ?? 0,
        notes: data.notes || null,
        certificateUrl: data.certificateUrl || null,
      },
      include: {
        qualifier: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'create',
        entityType: 'exam_tracking',
        entityId: exam.id,
        entityName: exam.examName,
        details: `Created exam: ${exam.examName} (${exam.examType})`,
      },
    });

    return NextResponse.json({ exam }, { status: 201 });
  } catch (error) {
    console.error('Create exam error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
