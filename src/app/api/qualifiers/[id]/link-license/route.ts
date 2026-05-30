import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const linkLicenseSchema = z.object({
  licenseId: z.string().min(1, 'License ID is required'),
  role: z.string().default('qualifier'),
});

// POST: Link a qualifier to a license
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

    // Check qualifier belongs to user's org
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

    const { licenseId, role } = result.data;

    // Check license belongs to user's org
    const license = await db.license.findFirst({
      where: { id: licenseId, orgId: orgMember.orgId },
    });

    if (!license) {
      return NextResponse.json({ error: 'License not found' }, { status: 404 });
    }

    // Check if link already exists
    const existingLink = await db.qualifierLicense.findUnique({
      where: { qualifierId_licenseId: { qualifierId, licenseId } },
    });

    if (existingLink) {
      return NextResponse.json({ error: 'License is already linked to this qualifier' }, { status: 409 });
    }

    const qualifierLicense = await db.qualifierLicense.create({
      data: {
        qualifierId,
        licenseId,
        role,
      },
    });

    // Create audit log entry
    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'update',
        entityType: 'qualifier',
        entityId: qualifierId,
        entityName: `${qualifier.firstName} ${qualifier.lastName}`,
        details: `Linked license "${license.name}" to qualifier ${qualifier.firstName} ${qualifier.lastName}`,
      },
    });

    return NextResponse.json({ qualifierLicense }, { status: 201 });
  } catch (error) {
    console.error('Link license error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
