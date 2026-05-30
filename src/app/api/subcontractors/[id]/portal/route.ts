import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// GET: Get subcontractor by portal token (public, no auth)
// Uses uploadToken as the portal token since it's auto-generated on creation
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // id here is the upload token (used as portal token)
    const subcontractor = await db.subcontractor.findUnique({
      where: { uploadToken: id },
      include: {
        documents: {
          orderBy: { createdAt: 'desc' },
        },
        org: {
          select: { name: true, tradeType: true },
        },
      },
    });

    if (!subcontractor) {
      return NextResponse.json({ error: 'Invalid portal link' }, { status: 404 });
    }

    // Check if portal link has expired
    if (subcontractor.portalExpiresAt && new Date() > subcontractor.portalExpiresAt) {
      return NextResponse.json({ error: 'Portal link has expired' }, { status: 410 });
    }

    return NextResponse.json({
      subcontractor: {
        id: subcontractor.id,
        name: subcontractor.contactName,
        company: subcontractor.companyName,
        email: subcontractor.email,
        phone: subcontractor.phone,
        tradeType: subcontractor.tradeType,
        licenseNumber: subcontractor.licenseNumber,
        licenseState: subcontractor.licenseState,
        licenseExpiry: subcontractor.licenseExpiry?.toISOString() || null,
        insuranceProvider: subcontractor.insuranceProvider,
        insuranceExpiry: subcontractor.insuranceExpiry?.toISOString() || null,
        insuranceAmount: subcontractor.insuranceAmount,
        complianceStatus: subcontractor.complianceStatus,
        orgName: subcontractor.org.name,
        documents: subcontractor.documents.map((doc) => ({
          id: doc.id,
          fileName: doc.fileName,
          fileType: doc.fileType,
          fileSize: doc.fileSize,
          category: doc.category,
          reviewStatus: doc.reviewStatus,
          reviewedBy: doc.reviewedBy,
          reviewedAt: doc.reviewedAt?.toISOString() || null,
          reviewNotes: doc.reviewNotes,
          createdAt: doc.createdAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error('Get subcontractor portal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const updatePortalSchema = z.object({
  licenseNumber: z.string().optional(),
  licenseState: z.string().optional(),
  licenseExpiry: z.string().nullable().optional(),
  insuranceProvider: z.string().optional(),
  insuranceExpiry: z.string().nullable().optional(),
  insuranceAmount: z.number().optional(),
  phone: z.string().optional(),
});

// PUT: Update subcontractor info from portal (public, uses upload token)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const subcontractor = await db.subcontractor.findUnique({
      where: { uploadToken: id },
    });

    if (!subcontractor) {
      return NextResponse.json({ error: 'Invalid portal link' }, { status: 404 });
    }

    if (subcontractor.portalExpiresAt && new Date() > subcontractor.portalExpiresAt) {
      return NextResponse.json({ error: 'Portal link has expired' }, { status: 410 });
    }

    const body = await request.json();
    const result = updatePortalSchema.safeParse(body);

    if (!result.success) {
      const firstError = result.error.issues?.[0];
      return NextResponse.json(
        { error: firstError?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const data: any = { ...result.data };

    if (data.licenseExpiry !== undefined) {
      data.licenseExpiry = data.licenseExpiry && data.licenseExpiry.trim() !== '' ? new Date(data.licenseExpiry) : null;
    }
    if (data.insuranceExpiry !== undefined) {
      data.insuranceExpiry = data.insuranceExpiry && data.insuranceExpiry.trim() !== '' ? new Date(data.insuranceExpiry) : null;
    }

    // Update compliance status to pending when info is updated
    data.complianceStatus = 'pending';
    data.lastSubmittedAt = new Date();

    const updated = await db.subcontractor.update({
      where: { id: subcontractor.id },
      data,
    });

    return NextResponse.json({
      subcontractor: {
        id: updated.id,
        name: updated.contactName,
        company: updated.companyName,
        email: updated.email,
        phone: updated.phone,
        tradeType: updated.tradeType,
        licenseNumber: updated.licenseNumber,
        licenseState: updated.licenseState,
        licenseExpiry: updated.licenseExpiry?.toISOString() || null,
        insuranceProvider: updated.insuranceProvider,
        insuranceExpiry: updated.insuranceExpiry?.toISOString() || null,
        insuranceAmount: updated.insuranceAmount,
        complianceStatus: updated.complianceStatus,
      },
    });
  } catch (error) {
    console.error('Update subcontractor portal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
