import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// GET: Get exam details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const exam = await db.examTracking.findFirst({
      where: { id, orgId: orgMember.orgId },
      include: {
        qualifier: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    return NextResponse.json({ exam });
  } catch (error) {
    console.error('Get exam error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const updateExamSchema = z.object({
  qualifierId: z.string().nullable().optional(),
  examType: z.string().optional(),
  examName: z.string().optional(),
  examProvider: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  status: z.string().optional(),
  examDate: z.string().nullable().optional(),
  score: z.number().nullable().optional(),
  passingScore: z.number().nullable().optional(),
  resultsReceived: z.string().nullable().optional(),
  registrationId: z.string().nullable().optional(),
  studyHours: z.number().optional(),
  notes: z.string().nullable().optional(),
  certificateUrl: z.string().nullable().optional(),
});

// PUT: Update exam
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();
    const result = updateExamSchema.safeParse(body);

    if (!result.success) {
      const firstError = result.error.issues?.[0];
      return NextResponse.json(
        { error: firstError?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const data = result.data as any;

    // Build update data with proper date handling
    const updateData: any = {};
    if (data.qualifierId !== undefined) updateData.qualifierId = data.qualifierId;
    if (data.examType !== undefined) updateData.examType = data.examType;
    if (data.examName !== undefined) updateData.examName = data.examName;
    if (data.examProvider !== undefined) updateData.examProvider = data.examProvider;
    if (data.state !== undefined) updateData.state = data.state;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.examDate !== undefined) updateData.examDate = data.examDate ? new Date(data.examDate) : null;
    if (data.score !== undefined) updateData.score = data.score;
    if (data.passingScore !== undefined) updateData.passingScore = data.passingScore;
    if (data.resultsReceived !== undefined) updateData.resultsReceived = data.resultsReceived ? new Date(data.resultsReceived) : null;
    if (data.registrationId !== undefined) updateData.registrationId = data.registrationId;
    if (data.studyHours !== undefined) updateData.studyHours = data.studyHours;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.certificateUrl !== undefined) updateData.certificateUrl = data.certificateUrl;

    const exam = await db.examTracking.update({
      where: { id },
      data: updateData,
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
        action: 'update',
        entityType: 'exam_tracking',
        entityId: exam.id,
        entityName: exam.examName,
        details: `Updated exam: ${exam.examName} (status: ${exam.status})`,
      },
    });

    return NextResponse.json({ exam });
  } catch (error) {
    console.error('Update exam error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete exam entry
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    const exam = await db.examTracking.findFirst({
      where: { id, orgId: orgMember.orgId },
    });

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    await db.examTracking.delete({ where: { id } });

    // Create audit log
    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'delete',
        entityType: 'exam_tracking',
        entityId: id,
        entityName: exam.examName,
        details: `Deleted exam: ${exam.examName}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete exam error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
