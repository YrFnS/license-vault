import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// POST: Submit a board submission to the board (simulated)
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

    if (!['draft', 'ready'].includes(existing.status)) {
      return NextResponse.json({ error: 'Only draft or ready submissions can be submitted' }, { status: 400 });
    }

    // Generate tracking number
    const trackingNumber = `EFL-${existing.state}-${Date.now().toString(36).toUpperCase()}`;

    // Update audit trail
    const currentTrail = existing.auditTrail ? JSON.parse(existing.auditTrail) : [];
    const newEntry = {
      action: 'submitted',
      timestamp: new Date().toISOString(),
      userId,
      details: `Submitted to ${existing.boardName}. Tracking: ${trackingNumber}`,
    };

    const submission = await db.boardSubmission.update({
      where: { id },
      data: {
        status: 'submitted',
        submittedAt: new Date(),
        trackingNumber,
        auditTrail: JSON.stringify([...currentTrail, newEntry]),
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
        details: `Submitted to board: ${submission.boardName}. Tracking: ${trackingNumber}`,
      },
    });

    return NextResponse.json({ submission, message: 'Submission sent to board successfully' });
  } catch (error) {
    console.error('Submit board submission error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
