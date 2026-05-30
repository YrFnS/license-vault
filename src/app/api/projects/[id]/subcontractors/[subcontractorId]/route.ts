import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// DELETE: Unlink a subcontractor from a project
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; subcontractorId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { id: projectId, subcontractorId } = await params;

    const orgMember = await db.orgMember.findFirst({
      where: { userId },
    });

    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    if (!['owner', 'admin'].includes(orgMember.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions.' },
        { status: 403 }
      );
    }

    const existing = await db.projectSubcontractor.findUnique({
      where: { projectId_subcontractorId: { projectId, subcontractorId } },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Subcontractor link not found' }, { status: 404 });
    }

    await db.projectSubcontractor.delete({
      where: { id: existing.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unlink subcontractor error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
