import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// GET: List board submissions with filters and stats
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
    const status = searchParams.get('status') || undefined;
    const submissionType = searchParams.get('submissionType') || undefined;
    const state = searchParams.get('state') || undefined;
    const priority = searchParams.get('priority') || undefined;
    const search = searchParams.get('search') || undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

    const where: any = { orgId: orgMember.orgId };

    if (status) where.status = status;
    if (submissionType) where.submissionType = submissionType;
    if (state) where.state = state;
    if (priority) where.priority = priority;
    if (search) {
      where.OR = [
        { boardName: { contains: search } },
        { trackingNumber: { contains: search } },
        { state: { contains: search } },
      ];
    }

    const [submissions, total] = await Promise.all([
      db.boardSubmission.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.boardSubmission.count({ where }),
    ]);

    // Get stats
    const statsWhere = { orgId: orgMember.orgId };
    const [totalSubmissions, pendingReview, approved, rejected] = await Promise.all([
      db.boardSubmission.count({ where: statsWhere }),
      db.boardSubmission.count({ where: { ...statsWhere, status: { in: ['submitted', 'under_review'] } } }),
      db.boardSubmission.count({ where: { ...statsWhere, status: 'approved' } }),
      db.boardSubmission.count({ where: { ...statsWhere, status: 'rejected' } }),
    ]);

    // Status counts for tabs
    const statusCounts = {
      all: totalSubmissions,
      draft: await db.boardSubmission.count({ where: { ...statsWhere, status: 'draft' } }),
      ready: await db.boardSubmission.count({ where: { ...statsWhere, status: 'ready' } }),
      submitted: await db.boardSubmission.count({ where: { ...statsWhere, status: 'submitted' } }),
      under_review: await db.boardSubmission.count({ where: { ...statsWhere, status: 'under_review' } }),
      approved,
      rejected,
      returned: await db.boardSubmission.count({ where: { ...statsWhere, status: 'returned' } }),
    };

    return NextResponse.json({
      submissions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      stats: { totalSubmissions, pendingReview, approved, rejected },
      statusCounts,
    });
  } catch (error) {
    console.error('Get board submissions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const createSchema = z.object({
  submissionType: z.string().min(1),
  licenseId: z.string().optional(),
  qualifierId: z.string().optional(),
  state: z.string().min(1),
  boardName: z.string().min(1),
  boardEmail: z.string().optional(),
  boardPortalUrl: z.string().optional(),
  applicationForm: z.string().optional(),
  supportingDocs: z.string().optional(),
  coverLetter: z.string().optional(),
  submissionData: z.string().optional(),
  filingFee: z.number().default(0),
  priority: z.string().default('normal'),
  notes: z.string().optional(),
  checklistData: z.string().optional(),
  estimatedDays: z.number().default(30),
});

// POST: Create a new board submission
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
    const result = createSchema.safeParse(body);
    if (!result.success) {
      const firstError = result.error.issues?.[0];
      return NextResponse.json({ error: firstError?.message || 'Validation failed' }, { status: 400 });
    }

    const data = result.data;
    const auditTrail = JSON.stringify([{ action: 'created', timestamp: new Date().toISOString(), userId, details: 'Submission created' }]);

    const submission = await db.boardSubmission.create({
      data: {
        orgId: orgMember.orgId,
        submissionType: data.submissionType,
        licenseId: data.licenseId || null,
        qualifierId: data.qualifierId || null,
        state: data.state,
        boardName: data.boardName,
        boardEmail: data.boardEmail || null,
        boardPortalUrl: data.boardPortalUrl || null,
        applicationForm: data.applicationForm || null,
        supportingDocs: data.supportingDocs || null,
        coverLetter: data.coverLetter || null,
        submissionData: data.submissionData || null,
        filingFee: data.filingFee,
        priority: data.priority,
        notes: data.notes || null,
        checklistData: data.checklistData || null,
        estimatedDays: data.estimatedDays,
        auditTrail,
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'create',
        entityType: 'board_submission',
        entityId: submission.id,
        entityName: `${data.submissionType} - ${data.state}`,
        details: `Created board submission: ${data.boardName}`,
      },
    });

    return NextResponse.json({ submission }, { status: 201 });
  } catch (error) {
    console.error('Create board submission error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
