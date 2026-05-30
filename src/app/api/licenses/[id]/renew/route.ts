import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { dispatchWebhook } from '@/lib/webhook-delivery';

function computeLicenseStatus(expirationDate: Date): string {
  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  if (expirationDate < now) return 'expired';
  if (expirationDate <= thirtyDaysFromNow) return 'expiring_soon';
  return 'active';
}

const renewLicenseSchema = z.object({
  notes: z.string().optional(),
});

// POST: Renew a license
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
    const { id } = await params;

    // Find user's org membership
    const orgMember = await db.orgMember.findFirst({
      where: { userId },
    });

    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    if (!['owner', 'admin'].includes(orgMember.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only owners and admins can renew licenses.' },
        { status: 403 }
      );
    }

    // Check license exists and belongs to org
    const existingLicense = await db.license.findFirst({
      where: { id, orgId: orgMember.orgId },
    });

    if (!existingLicense) {
      return NextResponse.json({ error: 'License not found' }, { status: 404 });
    }

    const body = await request.json();
    const result = renewLicenseSchema.safeParse(body);

    if (!result.success) {
      const firstError = result.error.issues?.[0];
      return NextResponse.json(
        { error: firstError?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    // Calculate new expiration date: 1 year from current expiration date
    const currentExpiration = new Date(existingLicense.expirationDate);
    const newExpirationDate = new Date(currentExpiration);
    newExpirationDate.setFullYear(newExpirationDate.getFullYear() + 1);

    // Build renewal history entry
    const renewalEntry = {
      date: new Date().toISOString(),
      notes: result.data.notes || '',
      renewedBy: session.user.name || session.user.email || 'Unknown',
    };

    // Parse existing renewal history or start fresh
    let history: Array<{ date: string; notes: string; renewedBy: string }> = [];
    if (existingLicense.renewalHistory) {
      try {
        history = JSON.parse(existingLicense.renewalHistory);
      } catch {
        history = [];
      }
    }
    history.push(renewalEntry);

    // Update the license
    const license = await db.license.update({
      where: { id },
      data: {
        isRenewed: true,
        expirationDate: newExpirationDate,
        renewalDate: new Date(),
        renewalHistory: JSON.stringify(history),
      },
    });

    // Create audit log entry
    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'renew',
        entityType: 'license',
        entityId: license.id,
        entityName: license.name,
        details: `Renewed license: ${license.name} (${license.licenseNumber}). New expiration: ${newExpirationDate.toLocaleDateString()}`,
      },
    });

    // Fire webhook event (fire-and-forget)
    dispatchWebhook(orgMember.orgId, 'license.renewed', {
      id: license.id,
      name: license.name,
      licenseNumber: license.licenseNumber,
      previousExpiration: existingLicense.expirationDate,
      newExpiration: newExpirationDate,
    }).catch(console.error);

    return NextResponse.json({
      license: {
        ...license,
        status: computeLicenseStatus(license.expirationDate),
      },
    });
  } catch (error) {
    console.error('Renew license error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
