import { NextResponse } from 'next/server';
import { authenticateApiKey, hasPermission } from '@/lib/api-auth';
import { db } from '@/lib/db';

function computeLicenseStatus(expirationDate: Date): string {
  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  if (expirationDate < now) return 'expired';
  if (expirationDate <= thirtyDaysFromNow) return 'expiring_soon';
  return 'active';
}

// GET /api/v1/licenses/:id - Get license details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateApiKey();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized. Include a valid API key in the Authorization header.' }, { status: 401 });
    }

    if (!hasPermission(auth.permissions, 'read')) {
      return NextResponse.json({ error: 'Insufficient permissions. API key requires read access.' }, { status: 403 });
    }

    const { id } = await params;

    const license = await db.license.findUnique({
      where: { id },
    });

    if (!license || license.orgId !== auth.orgId) {
      return NextResponse.json({ error: 'License not found' }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        id: license.id,
        name: license.name,
        type: license.type,
        licenseNumber: license.licenseNumber,
        issuedBy: license.issuedBy,
        state: license.state,
        issueDate: license.issueDate,
        expirationDate: license.expirationDate,
        status: computeLicenseStatus(license.expirationDate),
        isRenewed: license.isRenewed,
        autoRenew: license.autoRenew,
        notes: license.notes,
        createdAt: license.createdAt,
        updatedAt: license.updatedAt,
      },
    });
  } catch (error) {
    console.error('API v1 get license error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
