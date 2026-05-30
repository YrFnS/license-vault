import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const createSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  category: z.string().min(1),
  config: z.string().optional(),
});

// GET: List all integrations for org
export async function GET() {
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

    const integrations = await db.integration.findMany({
      where: { orgId: orgMember.orgId, isActive: true },
      include: {
        syncLogs: {
          orderBy: { startedAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const stats = {
      total: integrations.length,
      connected: integrations.filter((i) => i.status === 'connected').length,
      disconnected: integrations.filter((i) => i.status === 'disconnected').length,
      error: integrations.filter((i) => i.status === 'error').length,
      syncing: integrations.filter((i) => i.status === 'syncing').length,
      lastSyncAt: integrations.reduce((latest: Date | null, i) => {
        if (!i.lastSyncAt) return latest;
        if (!latest) return i.lastSyncAt;
        return i.lastSyncAt > latest ? i.lastSyncAt : latest;
      }, null),
      totalSyncErrors: integrations.reduce((sum, i) => sum + i.errorCount, 0),
    };

    return NextResponse.json({ integrations, stats });
  } catch (error) {
    console.error('Error fetching integrations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create new integration (connect)
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
    const validated = createSchema.parse(body);

    // Check for duplicate type
    const existing = await db.integration.findFirst({
      where: { orgId: orgMember.orgId, type: validated.type, isActive: true },
    });
    if (existing) {
      return NextResponse.json({ error: 'Integration of this type already exists' }, { status: 409 });
    }

    const integration = await db.integration.create({
      data: {
        orgId: orgMember.orgId,
        name: validated.name,
        type: validated.type,
        category: validated.category,
        status: 'connected',
        config: validated.config || null,
        lastSyncAt: new Date(),
        lastSyncStatus: 'success',
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'integration_connected',
        entityType: 'integration',
        entityId: integration.id,
        entityName: integration.name,
        details: `Connected ${integration.name} (${integration.type})`,
      },
    });

    return NextResponse.json({ integration }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
    }
    console.error('Error creating integration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
