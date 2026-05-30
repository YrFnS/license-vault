import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const linkLicenseSchema = z.object({
  licenseId: z.string().min(1, 'License ID is required'),
  role: z.string().default('holder'),
});

// POST: Link license to entity
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
    const entity = await db.businessEntity.findFirst({
      where: { id, orgId: orgMember.orgId },
    });

    if (!entity) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
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

    // Verify license belongs to org
    const license = await db.license.findFirst({
      where: { id: licenseId, orgId: orgMember.orgId },
    });

    if (!license) {
      return NextResponse.json({ error: 'License not found in your organization' }, { status: 404 });
    }

    // Check if already linked
    const existing = await db.entityLicense.findUnique({
      where: { entityId_licenseId: { entityId: id, licenseId } },
    });

    if (existing) {
      return NextResponse.json({ error: 'License already linked to this entity' }, { status: 400 });
    }

    const link = await db.entityLicense.create({
      data: { entityId: id, licenseId, role },
      include: {
        license: { select: { id: true, name: true, type: true, licenseNumber: true } },
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'create',
        entityType: 'entity_license',
        entityId: link.id,
        entityName: `${entity.name} - ${license.name}`,
        details: `Linked license "${license.name}" to entity "${entity.name}" as ${role}`,
      },
    });

    return NextResponse.json({ link }, { status: 201 });
  } catch (error) {
    console.error('Link license error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Unlink license
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
    const { searchParams } = new URL(request.url);
    const licenseId = searchParams.get('licenseId');

    if (!licenseId) {
      return NextResponse.json({ error: 'License ID is required' }, { status: 400 });
    }

    const link = await db.entityLicense.findUnique({
      where: { entityId_licenseId: { entityId: id, licenseId } },
    });

    if (!link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    await db.entityLicense.delete({
      where: { entityId_licenseId: { entityId: id, licenseId } },
    });

    // Create audit log
    const entity = await db.businessEntity.findFirst({ where: { id } });
    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'delete',
        entityType: 'entity_license',
        entityId: link.id,
        entityName: entity?.name || 'Unknown',
        details: `Unlinked license from entity "${entity?.name}"`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unlink license error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
