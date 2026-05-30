import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import crypto from 'crypto';

// GET: List signature requests for the org
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
    const status = searchParams.get('status') || undefined;
    const documentType = searchParams.get('documentType') || undefined;

    const where: any = { orgId: orgMember.orgId };
    if (status) where.status = status;
    if (documentType) where.documentType = documentType;

    const requests = await db.signatureRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Calculate stats
    const total = requests.length;
    const pending = requests.filter(r => r.status === 'pending').length;
    const signed = requests.filter(r => r.status === 'signed').length;
    const declined = requests.filter(r => r.status === 'declined').length;
    const expired = requests.filter(r => r.status === 'expired').length;
    const cancelled = requests.filter(r => r.status === 'cancelled').length;

    return NextResponse.json({
      requests,
      stats: { total, pending, signed, declined, expired, cancelled },
    });
  } catch (error) {
    console.error('Get signatures error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const createSignatureSchema = z.object({
  documentTitle: z.string().min(1, 'Document title is required'),
  documentType: z.string().default('general'),
  documentUrl: z.string().optional(),
  documentContent: z.string().optional(),
  requestedToName: z.string().min(1, 'Signer name is required'),
  requestedToEmail: z.string().email('Valid signer email is required'),
  message: z.string().optional(),
  expiresAt: z.string().optional(),
  witnessName: z.string().optional(),
  witnessEmail: z.string().email('Invalid witness email').optional().or(z.literal('')),
});

// POST: Create a new signature request
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
    const result = createSignatureSchema.safeParse(body);

    if (!result.success) {
      const firstError = result.error.issues?.[0];
      return NextResponse.json(
        { error: firstError?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const data = result.data;
    const signingToken = crypto.randomBytes(32).toString('hex');

    const auditTrail = JSON.stringify([
      { action: 'created', timestamp: new Date().toISOString(), ip: '', userAgent: '' }
    ]);

    const sigRequest = await db.signatureRequest.create({
      data: {
        orgId: orgMember.orgId,
        documentTitle: data.documentTitle,
        documentType: data.documentType || 'general',
        documentUrl: data.documentUrl || null,
        documentContent: data.documentContent || null,
        requestedById: userId,
        requestedToName: data.requestedToName,
        requestedToEmail: data.requestedToEmail,
        message: data.message || null,
        status: 'pending',
        signingToken,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
        witnessName: data.witnessName || null,
        witnessEmail: data.witnessEmail || null,
        auditTrail,
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'create',
        entityType: 'signature_request',
        entityId: sigRequest.id,
        entityName: sigRequest.documentTitle,
        details: `Created signature request: ${sigRequest.documentTitle} for ${sigRequest.requestedToName}`,
      },
    });

    return NextResponse.json({ request: sigRequest }, { status: 201 });
  } catch (error) {
    console.error('Create signature error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
