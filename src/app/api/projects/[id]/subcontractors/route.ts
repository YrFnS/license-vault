import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const linkSubcontractorSchema = z.object({
  subcontractorId: z.string().min(1, 'Subcontractor ID is required'),
  role: z.string().optional(),
});

// POST: Link a subcontractor to a project
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { id: projectId } = await params;

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

    const project = await db.project.findFirst({
      where: { id: projectId, orgId: orgMember.orgId },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const body = await request.json();
    const result = linkSubcontractorSchema.safeParse(body);

    if (!result.success) {
      const firstError = result.error.issues?.[0];
      return NextResponse.json(
        { error: firstError?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const { subcontractorId, role } = result.data;

    // Verify subcontractor exists and belongs to org
    const sub = await db.subcontractor.findFirst({
      where: { id: subcontractorId, orgId: orgMember.orgId },
    });

    if (!sub) {
      return NextResponse.json({ error: 'Subcontractor not found' }, { status: 404 });
    }

    // Check if already linked
    const existing = await db.projectSubcontractor.findUnique({
      where: { projectId_subcontractorId: { projectId, subcontractorId } },
    });

    if (existing) {
      return NextResponse.json({ error: 'Subcontractor already linked to this project' }, { status: 400 });
    }

    const projectSub = await db.projectSubcontractor.create({
      data: {
        projectId,
        subcontractorId,
        role: role || null,
      },
    });

    return NextResponse.json({ projectSub }, { status: 201 });
  } catch (error) {
    console.error('Link subcontractor error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
