import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

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

const updateWebhookSchema = z.object({
  name: z.string().min(1, 'Webhook name is required').optional(),
  url: z.string().url('Must be a valid URL').refine(
    (url) => url.startsWith('https://'),
    { message: 'URL must start with https://' }
  ).optional(),
  events: z.string().min(1, 'At least one event is required').refine(
    (events) => {
      const eventList = events.split(',').map((e) => e.trim());
      return eventList.every((e) => VALID_EVENTS.includes(e));
    },
    { message: 'Invalid event type(s)' }
  ).optional(),
  isActive: z.boolean().optional(),
});

// PUT: Update a webhook
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
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const existingWebhook = await db.webhook.findUnique({
      where: { id },
    });

    if (!existingWebhook || existingWebhook.orgId !== orgMember.orgId) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    const body = await request.json();
    const result = updateWebhookSchema.safeParse(body);

    if (!result.success) {
      const firstError = result.error.issues?.[0];
      return NextResponse.json(
        { error: firstError?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const updateData: Record<string, any> = {};
    if (result.data.name !== undefined) updateData.name = result.data.name;
    if (result.data.url !== undefined) updateData.url = result.data.url;
    if (result.data.events !== undefined) updateData.events = result.data.events;
    if (result.data.isActive !== undefined) updateData.isActive = result.data.isActive;

    const webhook = await db.webhook.update({
      where: { id },
      data: updateData,
    });

    // Create audit log entry
    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'update',
        entityType: 'webhook',
        entityId: webhook.id,
        entityName: webhook.name,
        details: `Updated webhook: ${webhook.name}`,
      },
    });

    return NextResponse.json({ webhook });
  } catch (error) {
    console.error('Update webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete a webhook
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
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const existingWebhook = await db.webhook.findUnique({
      where: { id },
    });

    if (!existingWebhook || existingWebhook.orgId !== orgMember.orgId) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    await db.webhook.delete({
      where: { id },
    });

    // Create audit log entry
    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'delete',
        entityType: 'webhook',
        entityId: existingWebhook.id,
        entityName: existingWebhook.name,
        details: `Deleted webhook: ${existingWebhook.name}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
