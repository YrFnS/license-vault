import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// GET: List business entities with compliance scores
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
    const entityType = searchParams.get('entityType') || undefined;
    const entityStatus = searchParams.get('entityStatus') || undefined;

    const where: any = { orgId: orgMember.orgId };
    if (entityType) where.entityType = entityType;
    if (entityStatus) where.entityStatus = entityStatus;

    const entities = await db.businessEntity.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        parent: { select: { id: true, name: true } },
        subsidiaries: { select: { id: true, name: true } },
        _count: { select: { licenses: true } },
      },
    });

    const total = entities.length;
    const active = entities.filter(e => e.entityStatus === 'active').length;
    const atRisk = entities.filter(e => e.complianceScore < 80 && e.entityStatus === 'active').length;
    const inactive = entities.filter(e => e.entityStatus !== 'active').length;

    return NextResponse.json({
      entities,
      stats: { total, active, atRisk, inactive },
    });
  } catch (error) {
    console.error('Get business entities error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const createEntitySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  entityType: z.string().default('llc'),
  formationState: z.string().optional(),
  formationDate: z.string().optional(),
  ein: z.string().optional(),
  registeredAgent: z.string().optional(),
  registeredAgentState: z.string().optional(),
  entityStatus: z.string().default('active'),
  annualReportDue: z.string().optional(),
  annualReportFiled: z.string().optional(),
  franchiseTaxDue: z.string().optional(),
  franchiseTaxPaid: z.string().optional(),
  complianceScore: z.number().default(100),
  notes: z.string().optional(),
  parentId: z.string().optional(),
});

// POST: Create business entity
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
    const result = createEntitySchema.safeParse(body);

    if (!result.success) {
      const firstError = result.error.issues?.[0];
      return NextResponse.json(
        { error: firstError?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const data = result.data;

    const entity = await db.businessEntity.create({
      data: {
        orgId: orgMember.orgId,
        name: data.name,
        entityType: data.entityType || 'llc',
        formationState: data.formationState || null,
        formationDate: data.formationDate ? new Date(data.formationDate) : null,
        ein: data.ein || null,
        registeredAgent: data.registeredAgent || null,
        registeredAgentState: data.registeredAgentState || null,
        entityStatus: data.entityStatus || 'active',
        annualReportDue: data.annualReportDue ? new Date(data.annualReportDue) : null,
        annualReportFiled: data.annualReportFiled ? new Date(data.annualReportFiled) : null,
        franchiseTaxDue: data.franchiseTaxDue ? new Date(data.franchiseTaxDue) : null,
        franchiseTaxPaid: data.franchiseTaxPaid ? new Date(data.franchiseTaxPaid) : null,
        complianceScore: data.complianceScore ?? 100,
        notes: data.notes || null,
        parentId: data.parentId || null,
      },
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
        action: 'create',
        entityType: 'business_entity',
        entityId: entity.id,
        entityName: entity.name,
        details: `Created business entity: ${entity.name} (${entity.entityType})`,
      },
    });

    return NextResponse.json({ entity }, { status: 201 });
  } catch (error) {
    console.error('Create business entity error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
