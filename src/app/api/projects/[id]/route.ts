import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// Helper to compute compliance score
async function computeComplianceScore(projectId: string): Promise<number> {
  const projectLicenses = await db.projectLicense.findMany({
    where: { projectId },
    include: {
      license: { select: { expirationDate: true } },
    },
  });

  if (projectLicenses.length === 0) return 100;

  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  const compliant = projectLicenses.filter(
    (pl) => pl.license.expirationDate > thirtyDaysFromNow
  ).length;

  return Math.round((compliant / projectLicenses.length) * 100);
}

// GET: Get single project with full details
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
    const { id } = await params;

    const orgMember = await db.orgMember.findFirst({
      where: { userId },
    });

    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const project = await db.project.findFirst({
      where: { id, orgId: orgMember.orgId },
      include: {
        projectLicenses: {
          include: {
            license: true,
          },
        },
        projectSubs: {
          include: {
            subcontractor: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Compute compliance score
    const complianceScore = await computeComplianceScore(id);

    // Update stored score
    await db.project.update({
      where: { id },
      data: { complianceScore },
    });

    return NextResponse.json({
      project: {
        ...project,
        complianceScore,
      },
    });
  } catch (error) {
    console.error('Get project error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const updateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').optional(),
  description: z.string().optional(),
  clientName: z.string().optional(),
  clientEmail: z.string().optional(),
  location: z.string().optional(),
  state: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(['active', 'completed', 'on_hold']).optional(),
  requiredLicenses: z.string().optional(),
  requiredInsurance: z.string().optional(),
});

// PUT: Update a project
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
    const { id } = await params;

    const orgMember = await db.orgMember.findFirst({
      where: { userId },
    });

    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    if (!['owner', 'admin'].includes(orgMember.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only owners and admins can update projects.' },
        { status: 403 }
      );
    }

    const existing = await db.project.findFirst({
      where: { id, orgId: orgMember.orgId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const body = await request.json();
    const result = updateProjectSchema.safeParse(body);

    if (!result.success) {
      const firstError = result.error.issues?.[0];
      return NextResponse.json(
        { error: firstError?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const data = result.data;

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description || null;
    if (data.clientName !== undefined) updateData.clientName = data.clientName || null;
    if (data.clientEmail !== undefined) updateData.clientEmail = data.clientEmail || null;
    if (data.location !== undefined) updateData.location = data.location || null;
    if (data.state !== undefined) updateData.state = data.state || null;
    if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.requiredLicenses !== undefined) updateData.requiredLicenses = data.requiredLicenses || null;
    if (data.requiredInsurance !== undefined) updateData.requiredInsurance = data.requiredInsurance || null;

    const project = await db.project.update({
      where: { id },
      data: updateData,
    });

    // Create audit log entry
    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'update',
        entityType: 'project',
        entityId: project.id,
        entityName: project.name,
        details: `Updated project: ${project.name}`,
      },
    });

    return NextResponse.json({ project });
  } catch (error) {
    console.error('Update project error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete a project
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
    const { id } = await params;

    const orgMember = await db.orgMember.findFirst({
      where: { userId },
    });

    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    if (!['owner', 'admin'].includes(orgMember.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only owners and admins can delete projects.' },
        { status: 403 }
      );
    }

    const existing = await db.project.findFirst({
      where: { id, orgId: orgMember.orgId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Delete linked ProjectLicense and ProjectSubcontractor entries
    await db.projectLicense.deleteMany({ where: { projectId: id } });
    await db.projectSubcontractor.deleteMany({ where: { projectId: id } });

    // Delete the project
    await db.project.delete({ where: { id } });

    // Create audit log entry
    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'delete',
        entityType: 'project',
        entityId: id,
        entityName: existing.name,
        details: `Deleted project: ${existing.name}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete project error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
