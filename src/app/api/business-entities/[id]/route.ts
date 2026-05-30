import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// GET: Get entity with licenses, compliance details
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
    const entity = await db.businessEntity.findFirst({
      where: { id, orgId: orgMember.orgId },
      include: {
        parent: { select: { id: true, name: true, entityType: true } },
        subsidiaries: { select: { id: true, name: true, entityType: true, entityStatus: true, complianceScore: true } },
        licenses: {
          include: {
            license: {
              select: { id: true, name: true, type: true, licenseNumber: true, state: true, expirationDate: true },
            },
          },
        },
      },
    });

    if (!entity) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
    }

    return NextResponse.json({ entity });
  } catch (error) {
    console.error('Get business entity error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const updateEntitySchema = z.object({
  name: z.string().optional(),
  entityType: z.string().optional(),
  formationState: z.string().nullable().optional(),
  formationDate: z.string().nullable().optional(),
  ein: z.string().nullable().optional(),
  registeredAgent: z.string().nullable().optional(),
  registeredAgentState: z.string().nullable().optional(),
  entityStatus: z.string().optional(),
  annualReportDue: z.string().nullable().optional(),
  annualReportFiled: z.string().nullable().optional(),
  franchiseTaxDue: z.string().nullable().optional(),
  franchiseTaxPaid: z.string().nullable().optional(),
  complianceScore: z.number().optional(),
  notes: z.string().nullable().optional(),
  parentId: z.string().nullable().optional(),
});

// PUT: Update entity
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
    const body = await request.json();
    const result = updateEntitySchema.safeParse(body);

    if (!result.success) {
      const firstError = result.error.issues?.[0];
      return NextResponse.json(
        { error: firstError?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const data = result.data as any;

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.entityType !== undefined) updateData.entityType = data.entityType;
    if (data.formationState !== undefined) updateData.formationState = data.formationState;
    if (data.formationDate !== undefined) updateData.formationDate = data.formationDate ? new Date(data.formationDate) : null;
    if (data.ein !== undefined) updateData.ein = data.ein;
    if (data.registeredAgent !== undefined) updateData.registeredAgent = data.registeredAgent;
    if (data.registeredAgentState !== undefined) updateData.registeredAgentState = data.registeredAgentState;
    if (data.entityStatus !== undefined) updateData.entityStatus = data.entityStatus;
    if (data.annualReportDue !== undefined) updateData.annualReportDue = data.annualReportDue ? new Date(data.annualReportDue) : null;
    if (data.annualReportFiled !== undefined) updateData.annualReportFiled = data.annualReportFiled ? new Date(data.annualReportFiled) : null;
    if (data.franchiseTaxDue !== undefined) updateData.franchiseTaxDue = data.franchiseTaxDue ? new Date(data.franchiseTaxDue) : null;
    if (data.franchiseTaxPaid !== undefined) updateData.franchiseTaxPaid = data.franchiseTaxPaid ? new Date(data.franchiseTaxPaid) : null;
    if (data.complianceScore !== undefined) updateData.complianceScore = data.complianceScore;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.parentId !== undefined) updateData.parentId = data.parentId;

    const entity = await db.businessEntity.update({
      where: { id },
      data: updateData,
      include: {
        parent: { select: { id: true, name: true } },
        subsidiaries: { select: { id: true, name: true } },
        _count: { select: { licenses: true } },
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'update',
        entityType: 'business_entity',
        entityId: entity.id,
        entityName: entity.name,
        details: `Updated business entity: ${entity.name}`,
      },
    });

    return NextResponse.json({ entity });
  } catch (error) {
    console.error('Update business entity error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete entity
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
    const entity = await db.businessEntity.findFirst({
      where: { id, orgId: orgMember.orgId },
    });

    if (!entity) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
    }

    await db.businessEntity.delete({ where: { id } });

    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'delete',
        entityType: 'business_entity',
        entityId: id,
        entityName: entity.name,
        details: `Deleted business entity: ${entity.name}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete business entity error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
