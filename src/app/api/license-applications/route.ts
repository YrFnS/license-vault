import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// GET: List license applications
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
    const statusFilter = searchParams.get('status') || undefined;
    const typeFilter = searchParams.get('applicationType') || undefined;
    const stateFilter = searchParams.get('state') || undefined;

    const where: any = { orgId: orgMember.orgId };
    if (statusFilter) where.status = statusFilter;
    if (typeFilter) where.applicationType = typeFilter;
    if (stateFilter) where.state = stateFilter;

    const applications = await db.licenseApplication.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        documents: {
          select: { id: true, fileName: true, category: true, required: true },
        },
      },
    });

    // Compute status counts
    const allApps = await db.licenseApplication.findMany({
      where: { orgId: orgMember.orgId },
      select: { status: true },
    });
    const counts = {
      total: allApps.length,
      draft: allApps.filter(a => a.status === 'draft').length,
      submitted: allApps.filter(a => a.status === 'submitted').length,
      under_review: allApps.filter(a => a.status === 'under_review').length,
      approved: allApps.filter(a => a.status === 'approved').length,
      denied: allApps.filter(a => a.status === 'denied').length,
      withdrawn: allApps.filter(a => a.status === 'withdrawn').length,
    };

    return NextResponse.json({ applications, counts });
  } catch (error) {
    console.error('Get license applications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const createApplicationSchema = z.object({
  licenseType: z.string().min(1, 'License type is required'),
  state: z.string().min(1, 'State is required'),
  applicantName: z.string().min(1, 'Applicant name is required'),
  businessName: z.string().optional(),
  applicationType: z.enum(['new', 'renewal', 'reciprocity']).default('new'),
  boardName: z.string().optional(),
  boardUrl: z.string().optional(),
  targetDate: z.string().optional(),
  estimatedCost: z.number().optional(),
  notes: z.string().optional(),
  checklistData: z.string().optional(),
  formData: z.string().optional(),
});

// POST: Create new license application
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
    const result = createApplicationSchema.safeParse(body);
    if (!result.success) {
      const firstError = result.error.issues?.[0];
      return NextResponse.json({ error: firstError?.message || 'Validation failed' }, { status: 400 });
    }

    const data = result.data;

    // Auto-populate board info from StateRequirement
    let boardName = data.boardName;
    let boardUrl = data.boardUrl;
    if (!boardName || !boardUrl) {
      const stateReq = await db.stateRequirement.findFirst({
        where: { state: data.state, licenseType: data.licenseType },
      });
      if (stateReq) {
        if (!boardName && stateReq.boardName) boardName = stateReq.boardName;
        if (!boardUrl && stateReq.boardUrl) boardUrl = stateReq.boardUrl;
      }
    }

    // Auto-generate checklist from state requirements if not provided
    let checklistData = data.checklistData;
    if (!checklistData) {
      const stateReq = await db.stateRequirement.findFirst({
        where: { state: data.state, licenseType: data.licenseType },
      });
      const items = [
        { id: '1', label: 'Complete application form', completed: false, required: true },
        { id: '2', label: 'Submit proof of experience', completed: false, required: true },
        { id: '3', label: 'Provide license fee payment', completed: false, required: true },
        { id: '4', label: 'Submit insurance documentation', completed: false, required: stateReq?.insuranceRequired || false },
        { id: '5', label: 'Submit bond documentation', completed: false, required: stateReq?.bondRequired || false },
        { id: '6', label: 'Complete CE hours verification', completed: false, required: (stateReq?.ceHoursRequired || 0) > 0 },
        { id: '7', label: 'Background check clearance', completed: false, required: false },
      ];
      checklistData = JSON.stringify({ items });
    }

    const application = await db.licenseApplication.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        licenseType: data.licenseType,
        state: data.state,
        applicantName: data.applicantName,
        businessName: data.businessName || null,
        applicationType: data.applicationType,
        boardName: boardName || null,
        boardUrl: boardUrl || null,
        targetDate: data.targetDate ? new Date(data.targetDate) : null,
        estimatedCost: data.estimatedCost || 0,
        notes: data.notes || null,
        checklistData,
        formData: data.formData || null,
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'create',
        entityType: 'license_application',
        entityId: application.id,
        entityName: `${data.licenseType} - ${data.state}`,
        details: `Created license application: ${data.licenseType} for ${data.state}`,
      },
    });

    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    console.error('Create license application error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
