import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import crypto from 'crypto';

const VALID_EVENTS = [
  'license.created',
  'license.updated',
  'license.deleted',
  'license.renewed',
  'license.expiring',
  'license.expired',
  'insurance.created',
  'insurance.updated',
  'insurance.deleted',
  'insurance.expiring',
  'insurance.expired',
  'compliance.changed',
  'approval.created',
  'approval.approved',
  'approval.rejected',
];

// GET: List webhooks for the org
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

    const webhooks = await db.webhook.findMany({
      where: { orgId: orgMember.orgId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ webhooks });
  } catch (error) {
    console.error('Get webhooks error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const createWebhookSchema = z.object({
  name: z.string().min(1, 'Webhook name is required'),
  url: z.string().url('Must be a valid URL').refine(
    (url) => url.startsWith('https://'),
    { message: 'URL must start with https://' }
  ),
  events: z.string().min(1, 'At least one event is required').refine(
    (events) => {
      const eventList = events.split(',').map((e) => e.trim());
      return eventList.every((e) => VALID_EVENTS.includes(e));
    },
    { message: 'Invalid event type(s)' }
  ),
});

// POST: Create a webhook
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
    const result = createWebhookSchema.safeParse(body);

    if (!result.success) {
      const firstError = result.error.issues?.[0];
      return NextResponse.json(
        { error: firstError?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const { name, url, events } = result.data;

    // Generate webhook secret
    const secret = `whsec_${crypto.randomBytes(24).toString('hex')}`;

    const webhook = await db.webhook.create({
      data: {
        orgId: orgMember.orgId,
        name,
        url,
        events,
        secret,
      },
    });

    // Create audit log entry
    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'create',
        entityType: 'webhook',
        entityId: webhook.id,
        entityName: name,
        details: `Created webhook: ${name} -> ${url}`,
      },
    });

    return NextResponse.json({ webhook }, { status: 201 });
  } catch (error) {
    console.error('Create webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
