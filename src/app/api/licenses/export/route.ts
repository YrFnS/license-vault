import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

function computeLicenseStatus(expirationDate: Date): string {
  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  if (expirationDate < now) return 'expired';
  if (expirationDate <= thirtyDaysFromNow) return 'expiring_soon';
  return 'active';
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'active': return 'Active';
    case 'expiring_soon': return 'Expiring Soon';
    case 'expired': return 'Expired';
    default: return status;
  }
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// GET: Export licenses as CSV
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const orgMember = await db.orgMember.findFirst({
      where: { userId },
    });

    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const licenses = await db.license.findMany({
      where: { orgId: orgMember.orgId },
      orderBy: { createdAt: 'desc' },
    });

    // Build CSV
    const headers = ['Name', 'Type', 'License Number', 'Issued By', 'Issue Date', 'Expiration Date', 'Status', 'Notes'];
    const rows = licenses.map((license) => {
      const status = computeLicenseStatus(license.expirationDate);
      return [
        escapeCSV(license.name),
        escapeCSV(license.type),
        escapeCSV(license.licenseNumber),
        escapeCSV(license.issuedBy),
        formatDate(license.issueDate),
        formatDate(license.expirationDate),
        getStatusLabel(status),
        escapeCSV(license.notes || ''),
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="licenses-export.csv"',
      },
    });
  } catch (error) {
    console.error('Export licenses error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
