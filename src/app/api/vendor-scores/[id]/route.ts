import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';

// GET /api/vendor-scores/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const vendor = await db.vendorScore.findUnique({ where: { id } });
    if (!vendor) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(vendor);
  } catch (error) {
    console.error('Error fetching vendor score:', error);
    return NextResponse.json({ error: 'Failed to fetch vendor score' }, { status: 500 });
  }
}

// PUT /api/vendor-scores/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: { organizations: true },
    });

    if (!user?.organizations?.[0]) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const { id } = await params;
    const body = await req.json();
    const orgId = user.organizations[0].orgId;

    const existing = await db.vendorScore.findUnique({ where: { id } });
    if (!existing || existing.orgId !== orgId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Build update data from body
    const updateData: Record<string, unknown> = {};
    const allowedFields = [
      'vendorName', 'vendorEmail', 'subcontractorId',
      'licenseVerified', 'licenseExpiry', 'licenseState', 'licenseType',
      'insuranceVerified', 'insuranceExpiry', 'coiOnFile', 'endorsementStatus',
      'requiredDocs', 'submittedDocs', 'expiredDocs',
      'totalProjects', 'completedProjects', 'onTimeRate', 'avgRating',
      'avgResponseDays', 'docRequestCount', 'docResponseCount',
      'isFlagged', 'flagReason', 'notes',
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === 'licenseExpiry' || field === 'insuranceExpiry') {
          updateData[field] = body[field] ? new Date(body[field]) : null;
        } else {
          updateData[field] = body[field];
        }
      }
    }

    const vendor = await db.vendorScore.update({
      where: { id },
      data: updateData,
    });

    await db.auditLog.create({
      data: {
        orgId,
        userId: user.id,
        action: 'update',
        entityType: 'vendor_score',
        entityId: id,
        entityName: vendor.vendorName,
      },
    });

    return NextResponse.json(vendor);
  } catch (error) {
    console.error('Error updating vendor score:', error);
    return NextResponse.json({ error: 'Failed to update vendor score' }, { status: 500 });
  }
}

// DELETE /api/vendor-scores/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: { organizations: true },
    });

    if (!user?.organizations?.[0]) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const { id } = await params;
    const orgId = user.organizations[0].orgId;
    const existing = await db.vendorScore.findUnique({ where: { id } });
    if (!existing || existing.orgId !== orgId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await db.vendorScore.delete({ where: { id } });

    await db.auditLog.create({
      data: {
        orgId,
        userId: user.id,
        action: 'delete',
        entityType: 'vendor_score',
        entityId: id,
        entityName: existing.vendorName,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting vendor score:', error);
    return NextResponse.json({ error: 'Failed to delete vendor score' }, { status: 500 });
  }
}
