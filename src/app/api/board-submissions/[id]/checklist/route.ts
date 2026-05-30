import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const checklistSchema = z.object({
  checklistData: z.string(), // JSON: [{item, completed}]
});

// PUT: Update checklist items for a board submission
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
    const result = checklistSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid checklist data' }, { status: 400 });
    }

    // Update audit trail
    const currentTrail = existing.auditTrail ? JSON.parse(existing.auditTrail) : [];
    const newEntry = { action: 'checklist_updated', timestamp: new Date().toISOString(), userId, details: 'Updated checklist items' };

    const submission = await db.boardSubmission.update({
      where: { id },
      data: {
        checklistData: result.data.checklistData,
        auditTrail: JSON.stringify([...currentTrail, newEntry]),
      },
    });

    return NextResponse.json({ submission });
  } catch (error) {
    console.error('Update checklist error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
