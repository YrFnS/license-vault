import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// GET: Get application details
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
    const application = await db.licenseApplication.findFirst({
      where: { id, orgId: orgMember.orgId },
      include: { documents: true },
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    return NextResponse.json({ application });
  } catch (error) {
    console.error('Get license application error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const updateApplicationSchema = z.object({
  applicantName: z.string().optional(),
  businessName: z.string().optional(),
  applicationType: z.enum(['new', 'renewal', 'reciprocity']).optional(),
  status: z.enum(['draft', 'submitted', 'under_review', 'approved', 'denied', 'withdrawn']).optional(),
  boardName: z.string().optional(),
  boardUrl: z.string().optional(),
  targetDate: z.string().optional(),
  estimatedCost: z.number().optional(),
  actualCost: z.number().optional(),
  notes: z.string().optional(),
  denialReason: z.string().optional(),
  checklistData: z.string().optional(),
  formData: z.string().optional(),
  licenseType: z.string().optional(),
  state: z.string().optional(),
});

// PUT: Update application
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
    const existing = await db.licenseApplication.findFirst({
      where: { id, orgId: orgMember.orgId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const body = await request.json();
    const result = updateApplicationSchema.safeParse(body);
    if (!result.success) {
      const firstError = result.error.issues?.[0];
      return NextResponse.json({ error: firstError?.message || 'Validation failed' }, { status: 400 });
    }

    const data = result.data as any;

    // Handle status transitions
    if (data.status === 'submitted' && existing.status === 'draft') {
      data.submittedDate = new Date();
    }
    if (data.status === 'approved') {
      data.actualCost = data.actualCost ?? existing.estimatedCost;
    }

    const application = await db.licenseApplication.update({
      where: { id },
      data: {
        ...data,
        targetDate: data.targetDate ? new Date(data.targetDate) : undefined,
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: data.status ? 'update' : 'update',
        entityType: 'license_application',
        entityId: application.id,
        entityName: `${application.licenseType} - ${application.state}`,
        details: `Updated license application (status: ${application.status})`,
      },
    });

    return NextResponse.json({ application });
  } catch (error) {
    console.error('Update license application error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Withdraw/delete application
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
    const existing = await db.licenseApplication.findFirst({
      where: { id, orgId: orgMember.orgId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // If draft, delete it. Otherwise, mark as withdrawn
    if (existing.status === 'draft') {
      await db.licenseApplicationDocument.deleteMany({ where: { applicationId: id } });
      await db.licenseApplication.delete({ where: { id } });
    } else {
      await db.licenseApplication.update({
        where: { id },
        data: { status: 'withdrawn' },
      });
    }

    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: existing.status === 'draft' ? 'delete' : 'update',
        entityType: 'license_application',
        entityId: id,
        entityName: `${existing.licenseType} - ${existing.state}`,
        details: existing.status === 'draft' ? 'Deleted draft application' : 'Withdrawn application',
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete license application error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
