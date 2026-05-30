import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import crypto from 'crypto';

// GET: List API keys for the org
export async function GET() {
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

    if (!['owner', 'admin'].includes(orgMember.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const apiKeys = await db.apiKey.findMany({
      where: { orgId: orgMember.orgId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        permissions: true,
        lastUsedAt: true,
        expiresAt: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ apiKeys });
  } catch (error) {
    console.error('Get API keys error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const createApiKeySchema = z.object({
  name: z.string().min(1, 'Key name is required'),
  permissions: z.enum(['read', 'write', 'admin']).default('read'),
  expiresAt: z.string().optional(),
});

// POST: Create an API key
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

    if (!['owner', 'admin'].includes(orgMember.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const result = createApiKeySchema.safeParse(body);

    if (!result.success) {
      const firstError = result.error.issues?.[0];
      return NextResponse.json(
        { error: firstError?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const { name, permissions, expiresAt } = result.data;

    // Generate API key
    const rawKey = `lv_live_${crypto.randomBytes(32).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.substring(0, 8);

    const apiKey = await db.apiKey.create({
      data: {
        orgId: orgMember.orgId,
        name,
        keyHash,
        keyPrefix,
        permissions,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    // Create audit log entry
    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'create',
        entityType: 'apiKey',
        entityId: apiKey.id,
        entityName: name,
        details: `Created API key: ${name}`,
      },
    });

    // Return the full key only once
    return NextResponse.json(
      {
        apiKey: {
          id: apiKey.id,
          name: apiKey.name,
          keyPrefix: apiKey.keyPrefix,
          permissions: apiKey.permissions,
          expiresAt: apiKey.expiresAt,
          isActive: apiKey.isActive,
          createdAt: apiKey.createdAt,
        },
        key: rawKey, // Full key - shown only once
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create API key error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
