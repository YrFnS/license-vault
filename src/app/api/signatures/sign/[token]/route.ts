import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// GET: Public - view signature request for signing (no auth required)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const sigRequest = await db.signatureRequest.findUnique({
      where: { signingToken: token },
      include: { org: { select: { name: true, tradeType: true } } },
    });

    if (!sigRequest) {
      return NextResponse.json({ error: 'Signature request not found' }, { status: 404 });
    }

    // Check if expired
    if (sigRequest.expiresAt && new Date() > sigRequest.expiresAt && sigRequest.status !== 'signed') {
      // Auto-update to expired
      const trail = sigRequest.auditTrail ? JSON.parse(sigRequest.auditTrail) : [];
      trail.push({ action: 'expired', timestamp: new Date().toISOString(), ip: '', userAgent: '' });

      await db.signatureRequest.update({
        where: { id: sigRequest.id },
        data: { status: 'expired', auditTrail: JSON.stringify(trail) },
      });

      return NextResponse.json({
        request: { ...sigRequest, status: 'expired' },
        org: sigRequest.org,
        expired: true,
      });
    }

    // Update status to viewed if still pending
    if (sigRequest.status === 'pending') {
      const trail = sigRequest.auditTrail ? JSON.parse(sigRequest.auditTrail) : [];
      trail.push({ action: 'viewed', timestamp: new Date().toISOString(), ip: request.headers.get('x-forwarded-for') || '', userAgent: request.headers.get('user-agent') || '' });

      await db.signatureRequest.update({
        where: { id: sigRequest.id },
        data: { status: 'viewed', auditTrail: JSON.stringify(trail) },
      });
    }

    return NextResponse.json({
      request: { ...sigRequest, status: sigRequest.status === 'pending' ? 'viewed' : sigRequest.status },
      org: sigRequest.org,
    });
  } catch (error) {
    console.error('Get signature by token error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const signDocumentSchema = z.object({
  signatureType: z.enum(['draw', 'type']),
  signatureValue: z.string().min(1, 'Signature is required'),
  signerName: z.string().min(1, 'Signer name is required'),
  signerTitle: z.string().optional(),
});

// POST: Public - submit signature (no auth required)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const sigRequest = await db.signatureRequest.findUnique({
      where: { signingToken: token },
    });

    if (!sigRequest) {
      return NextResponse.json({ error: 'Signature request not found' }, { status: 404 });
    }

    if (sigRequest.status === 'signed') {
      return NextResponse.json({ error: 'Document already signed' }, { status: 400 });
    }

    if (sigRequest.status === 'cancelled') {
      return NextResponse.json({ error: 'Request has been cancelled' }, { status: 400 });
    }

    if (sigRequest.status === 'declined') {
      return NextResponse.json({ error: 'Request has been declined' }, { status: 400 });
    }

    if (sigRequest.expiresAt && new Date() > sigRequest.expiresAt) {
      return NextResponse.json({ error: 'Signature request has expired' }, { status: 400 });
    }

    const body = await request.json();

    // Check if this is a decline
    if (body.action === 'decline') {
      const trail = sigRequest.auditTrail ? JSON.parse(sigRequest.auditTrail) : [];
      trail.push({ action: 'declined', timestamp: new Date().toISOString(), ip: request.headers.get('x-forwarded-for') || '', userAgent: request.headers.get('user-agent') || '' });

      const updated = await db.signatureRequest.update({
        where: { id: sigRequest.id },
        data: {
          status: 'declined',
          declinedAt: new Date(),
          declinedReason: body.reason || null,
          auditTrail: JSON.stringify(trail),
        },
      });

      return NextResponse.json({ request: updated, declined: true });
    }

    // Validate signing data
    const result = signDocumentSchema.safeParse(body);
    if (!result.success) {
      const firstError = result.error.issues?.[0];
      return NextResponse.json(
        { error: firstError?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const data = result.data;
    const ipAddress = request.headers.get('x-forwarded-for') || '';
    const userAgent = request.headers.get('user-agent') || '';

    const signatureData = JSON.stringify({
      type: data.signatureType,
      value: data.signatureValue,
      signedAt: new Date().toISOString(),
      ipAddress,
    });

    const trail = sigRequest.auditTrail ? JSON.parse(sigRequest.auditTrail) : [];
    trail.push({ action: 'signed', timestamp: new Date().toISOString(), ip: ipAddress, userAgent });

    const updated = await db.signatureRequest.update({
      where: { id: sigRequest.id },
      data: {
        status: 'signed',
        signedAt: new Date(),
        signatureData,
        signerName: data.signerName,
        signerTitle: data.signerTitle || null,
        auditTrail: JSON.stringify(trail),
      },
    });

    // Create audit log in org
    await db.auditLog.create({
      data: {
        orgId: sigRequest.orgId,
        userId: sigRequest.requestedById,
        action: 'sign',
        entityType: 'signature_request',
        entityId: sigRequest.id,
        entityName: sigRequest.documentTitle,
        details: `Document signed: ${sigRequest.documentTitle} by ${data.signerName}`,
      },
    });

    return NextResponse.json({ request: updated, signed: true });
  } catch (error) {
    console.error('Sign document error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
