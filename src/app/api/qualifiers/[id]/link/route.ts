import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const linkLicenseSchema = z.object({
  licenseId: z.string().min(1, 'License ID is required'),
  role: z.string().default('qualifier'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  notes: z.string().optional(),
});

// POST: Link qualifier to a license
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
    const { id: qualifierId } = await params;

    const orgMember = await db.orgMember.findFirst({
      where: { userId },
    });

    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    if (!['owner', 'admin'].includes(orgMember.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Verify qualifier exists and belongs to org
    const qualifier = await db.qualifier.findFirst({
      where: { id: qualifierId, orgId: orgMember.orgId },
    });

    if (!qualifier) {
      return NextResponse.json({ error: 'Qualifier not found' }, { status: 404 });
    }

    const body = await request.json();
    const result = linkLicenseSchema.safeParse(body);

    if (!result.success) {
      const firstError = result.error.issues?.[0];
      return NextResponse.json(
        { error: firstError?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const { licenseId, role, startDate, endDate, notes } = result.data;

    // Verify license exists and belongs to org
    const license = await db.license.findFirst({
      where: { id: licenseId, orgId: orgMember.orgId },
    });

    if (!license) {
      return NextResponse.json({ error: 'License not found' }, { status: 404 });
    }

    // Check if already linked
    const existingLink = await db.qualifierLicense.findUnique({
      where: { qualifierId_licenseId: { qualifierId, licenseId } },
    });

    if (existingLink) {
      return NextResponse.json({ error: 'Qualifier is already linked to this license' }, { status: 400 });
    }

    const qualifierLicense = await db.qualifierLicense.create({
      data: {
        qualifierId,
        licenseId,
        role,
        startDate: new Date(startDate),
        endDate: endDate && endDate.trim() !== '' ? new Date(endDate) : null,
        notes: notes || null,
      },
    });

    // Create audit log entry
    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'create',
        entityType: 'qualifier_license',
        entityId: qualifierLicense.id,
        entityName: `${qualifier.name} - ${license.name}`,
        details: `Linked qualifier ${qualifier.name} to license ${license.name}`,
      },
    });

    return NextResponse.json({ link: qualifierLicense }, { status: 201 });
  } catch (error) {
    console.error('Link qualifier error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
