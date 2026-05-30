import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// GET: Get a single board submission
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const userId = (session.user as any).id;
    const orgMember = await db.orgMember.findFirst({ where: { userId } });
    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const submission = await db.boardSubmission.findFirst({
      where: { id, orgId: orgMember.orgId },
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    return NextResponse.json({ submission });
  } catch (error) {
    console.error('Get board submission error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const updateSchema = z.object({
  submissionType: z.string().optional(),
  licenseId: z.string().nullable().optional(),
  qualifierId: z.string().nullable().optional(),
  state: z.string().optional(),
  boardName: z.string().optional(),
  boardEmail: z.string().nullable().optional(),
  boardPortalUrl: z.string().nullable().optional(),
  applicationForm: z.string().nullable().optional(),
  supportingDocs: z.string().nullable().optional(),
  coverLetter: z.string().nullable().optional(),
  submissionData: z.string().nullable().optional(),
  status: z.string().optional(),
  trackingNumber: z.string().nullable().optional(),
  boardResponse: z.string().nullable().optional(),
  filingFee: z.number().optional(),
  feePaid: z.boolean().optional(),
  paymentRef: z.string().nullable().optional(),
  estimatedDays: z.number().optional(),
  priority: z.string().optional(),
  notes: z.string().nullable().optional(),
  checklistData: z.string().nullable().optional(),
  auditTrail: z.string().nullable().optional(),
});

// PUT: Update a board submission
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const userId = (session.user as any).id;
    const orgMember = await db.orgMember.findFirst({ where: { userId } });
    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const existing = await db.boardSubmission.findFirst({
      where: { id, orgId: orgMember.orgId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const body = await request.json();
    const result = updateSchema.safeParse(body);
    if (!result.success) {
      const firstError = result.error.issues?.[0];
      return NextResponse.json({ error: firstError?.message || 'Validation failed' }, { status: 400 });
    }

    // Update audit trail
    const currentTrail = existing.auditTrail ? JSON.parse(existing.auditTrail) : [];
    const newEntry = { action: 'updated', timestamp: new Date().toISOString(), userId, details: `Updated submission fields` };
    const updatedTrail = [...currentTrail, newEntry];

    const submission = await db.boardSubmission.update({
      where: { id },
      data: {
        ...result.data,
        auditTrail: JSON.stringify(updatedTrail),
        reviewedAt: result.data.status && ['approved', 'rejected', 'returned'].includes(result.data.status) ? new Date() : existing.reviewedAt,
        responseDate: result.data.status && ['approved', 'rejected', 'returned'].includes(result.data.status) ? new Date() : existing.responseDate,
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'update',
        entityType: 'board_submission',
        entityId: submission.id,
        entityName: `${submission.submissionType} - ${submission.state}`,
        details: `Updated board submission: ${submission.boardName}`,
      },
    });

    return NextResponse.json({ submission });
  } catch (error) {
    console.error('Update board submission error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete a board submission
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const userId = (session.user as any).id;
    const orgMember = await db.orgMember.findFirst({ where: { userId } });
    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    if (!['owner', 'admin'].includes(orgMember.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const existing = await db.boardSubmission.findFirst({
      where: { id, orgId: orgMember.orgId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    await db.boardSubmission.delete({ where: { id } });

    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'delete',
        entityType: 'board_submission',
        entityId: id,
        entityName: `${existing.submissionType} - ${existing.state}`,
        details: `Deleted board submission: ${existing.boardName}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete board submission error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
