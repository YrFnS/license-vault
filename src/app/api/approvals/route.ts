import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// GET: List approval workflows for the org
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Find user's org membership
    const orgMember = await db.orgMember.findFirst({
      where: { userId },
    });

    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const statusFilter = searchParams.get('status') || undefined;
    const typeFilter = searchParams.get('type') || undefined;
    const priorityFilter = searchParams.get('priority') || undefined;
    const search = searchParams.get('search') || undefined;

    // Build where clause
    const where: any = { orgId: orgMember.orgId };

    if (statusFilter) {
      where.status = statusFilter;
    }

    if (typeFilter) {
      where.type = typeFilter;
    }

    if (priorityFilter) {
      where.priority = priorityFilter;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const total = await db.approvalWorkflow.count({ where });

    const approvals = await db.approvalWorkflow.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Batch fetch requester names
    const requesterIds = [...new Set(approvals.map(a => a.requestedBy).filter(Boolean))];
    const requesters = await db.user.findMany({
      where: { id: { in: requesterIds } },
      select: { id: true, name: true, email: true },
    });
    const requesterMap = new Map(requesters.map(r => [r.id, r]));

    // Batch fetch reviewer names
    const reviewerIds = [...new Set(approvals.map(a => a.reviewedBy).filter(Boolean))];
    const reviewers = await db.user.findMany({
      where: { id: { in: reviewerIds } },
      select: { id: true, name: true, email: true },
    });
    const reviewerMap = new Map(reviewers.map(r => [r.id, r]));

    const approvalsEnriched = approvals.map(a => ({
      ...a,
      requesterName: a.requestedBy ? requesterMap.get(a.requestedBy)?.name || null : null,
      requesterEmail: a.requestedBy ? requesterMap.get(a.requestedBy)?.email || null : null,
      reviewerName: a.reviewedBy ? reviewerMap.get(a.reviewedBy)?.name || null : null,
      reviewerEmail: a.reviewedBy ? reviewerMap.get(a.reviewedBy)?.email || null : null,
    }));

    const totalPages = Math.ceil(total / limit);

    // Compute status counts for tabs
    const orgWhere = { orgId: orgMember.orgId };
    const [countPending, countApproved, countRejected] = await Promise.all([
      db.approvalWorkflow.count({ where: { ...orgWhere, status: 'pending' } }),
      db.approvalWorkflow.count({ where: { ...orgWhere, status: 'approved' } }),
      db.approvalWorkflow.count({ where: { ...orgWhere, status: 'rejected' } }),
    ]);

    return NextResponse.json({
      approvals: approvalsEnriched,
      pagination: { page, limit, total, totalPages },
      counts: { pending: countPending, approved: countApproved, rejected: countRejected },
    });
  } catch (error) {
    console.error('Get approvals error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const createApprovalSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  type: z.enum(['license_renewal', 'document_review', 'ce_verification', 'insurance_update', 'other']).default('other'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  entityId: z.string().optional(),
  entityType: z.string().optional(),
  requestData: z.string().optional(),
});

// POST: Create an approval workflow request
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const orgMember = await db.orgMember.findFirst({
      where: { userId },
    });

    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const body = await request.json();
    const result = createApprovalSchema.safeParse(body);

    if (!result.success) {
      const firstError = result.error.issues?.[0];
      return NextResponse.json(
        { error: firstError?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const { title, description, type, priority, entityId, entityType, requestData } = result.data;

    const approval = await db.approvalWorkflow.create({
      data: {
        orgId: orgMember.orgId,
        title,
        description: description || null,
        type,
        priority,
        entityId: entityId || null,
        entityType: entityType || null,
        requestData: requestData || null,
        requestedBy: userId,
        status: 'pending',
      },
    });

    // Create audit log entry
    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'create',
        entityType: 'approval',
        entityId: approval.id,
        entityName: approval.title,
        details: `Created approval request: ${approval.title} (${approval.type})`,
      },
    });

    return NextResponse.json({ approval }, { status: 201 });
  } catch (error) {
    console.error('Create approval error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
