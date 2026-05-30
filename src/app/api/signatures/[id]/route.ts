import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// GET: Get a specific signature request
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
    const sigRequest = await db.signatureRequest.findFirst({
      where: { id, orgId: orgMember.orgId },
      include: { org: { select: { name: true } } },
    });

    if (!sigRequest) {
      return NextResponse.json({ error: 'Signature request not found' }, { status: 404 });
    }

    return NextResponse.json({ request: sigRequest });
  } catch (error) {
    console.error('Get signature error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Update a signature request
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

    const existing = await db.signatureRequest.findFirst({
      where: { id, orgId: orgMember.orgId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Signature request not found' }, { status: 404 });
    }

    if (existing.status === 'signed') {
      return NextResponse.json({ error: 'Cannot modify a signed request' }, { status: 400 });
    }

    const updated = await db.signatureRequest.update({
      where: { id },
      data: {
        documentTitle: body.documentTitle ?? existing.documentTitle,
        documentType: body.documentType ?? existing.documentType,
        documentContent: body.documentContent ?? existing.documentContent,
        documentUrl: body.documentUrl ?? existing.documentUrl,
        requestedToName: body.requestedToName ?? existing.requestedToName,
        requestedToEmail: body.requestedToEmail ?? existing.requestedToEmail,
        message: body.message ?? existing.message,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : existing.expiresAt,
      },
    });

    return NextResponse.json({ request: updated });
  } catch (error) {
    console.error('Update signature error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete a signature request
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
    const existing = await db.signatureRequest.findFirst({
      where: { id, orgId: orgMember.orgId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Signature request not found' }, { status: 404 });
    }

    if (existing.status === 'signed') {
      return NextResponse.json({ error: 'Cannot delete a signed request' }, { status: 400 });
    }

    await db.signatureRequest.delete({ where: { id } });

    // Create audit log
    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'delete',
        entityType: 'signature_request',
        entityId: id,
        entityName: existing.documentTitle,
        details: `Deleted signature request: ${existing.documentTitle}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete signature error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
