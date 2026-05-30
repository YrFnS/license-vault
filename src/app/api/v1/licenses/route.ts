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

// GET /api/v1/licenses - List licenses
export async function GET(request: Request) {
  try {
    const auth = await authenticateApiKey();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized. Include a valid API key in the Authorization header.' }, { status: 401 });
    }

    if (!hasPermission(auth.permissions, 'read')) {
      return NextResponse.json({ error: 'Insufficient permissions. API key requires read access.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const status = searchParams.get('status') || undefined;

    const where: any = { orgId: auth.orgId };

    if (status === 'active' || status === 'expiring_soon' || status === 'expired') {
      const now = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      if (status === 'active') {
        where.expirationDate = { gt: thirtyDaysFromNow };
      } else if (status === 'expiring_soon') {
        where.expirationDate = { gt: now, lte: thirtyDaysFromNow };
      } else if (status === 'expired') {
        where.expirationDate = { lte: now };
      }
    }

    const total = await db.license.count({ where });

    const licenses = await db.license.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const data = licenses.map((license) => ({
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
      createdAt: license.createdAt,
      updatedAt: license.updatedAt,
    }));

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('API v1 list licenses error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
