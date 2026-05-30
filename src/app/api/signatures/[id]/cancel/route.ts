import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// POST: Cancel a signature request
export async function POST(
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
    const existing = await db.signatureRequest.findFirst({
      where: { id, orgId: orgMember.orgId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Signature request not found' }, { status: 404 });
    }

    if (existing.status === 'signed') {
      return NextResponse.json({ error: 'Cannot cancel a signed request' }, { status: 400 });
    }

    if (existing.status === 'cancelled') {
      return NextResponse.json({ error: 'Request already cancelled' }, { status: 400 });
    }

    // Update audit trail
    const trail = existing.auditTrail ? JSON.parse(existing.auditTrail) : [];
    trail.push({ action: 'cancelled', timestamp: new Date().toISOString(), ip: '', userAgent: '' });

    const updated = await db.signatureRequest.update({
      where: { id },
      data: {
        status: 'cancelled',
        auditTrail: JSON.stringify(trail),
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'update',
        entityType: 'signature_request',
        entityId: id,
        entityName: existing.documentTitle,
        details: `Cancelled signature request: ${existing.documentTitle}`,
      },
    });

    return NextResponse.json({ request: updated });
  } catch (error) {
    console.error('Cancel signature error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
