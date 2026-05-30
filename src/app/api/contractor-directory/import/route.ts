import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

function calculateComplianceScore(contractor: {
  licenseStatus: string;
  insuranceStatus: string;
  bondingCapacity: number;
  totalProjects: number;
  completedProjects: number;
  isVerified: boolean;
  rating: number;
}): number {
  let score = 0;
  if (contractor.licenseStatus === 'active') score += 30;
  else if (contractor.licenseStatus === 'expired') score += 10;
  if (contractor.insuranceStatus === 'compliant') score += 25;
  else if (contractor.insuranceStatus === 'deficient') score += 10;
  if (contractor.bondingCapacity > 1000000) score += 15;
  else if (contractor.bondingCapacity > 500000) score += 10;
  else if (contractor.bondingCapacity > 100000) score += 5;
  if (contractor.totalProjects > 0) score += (contractor.completedProjects / contractor.totalProjects) * 15;
  if (contractor.isVerified) score += 10;
  score += (contractor.rating / 5) * 5;
  return Math.round(Math.min(100, Math.max(0, score)));
}

// POST: Bulk import contractors from CSV data
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

    if (!['owner', 'admin'].includes(orgMember.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { contractors } = body as { contractors: any[] };

    if (!Array.isArray(contractors) || contractors.length === 0) {
      return NextResponse.json({ error: 'No contractors data provided' }, { status: 400 });
    }

    let imported = 0;
    let errors = 0;
    const errorRows: string[] = [];

    for (let i = 0; i < contractors.length; i++) {
      const row = contractors[i];
      try {
        if (!row.companyName || !row.tradeType) {
          errorRows.push(`Row ${i + 1}: Missing required fields (companyName, tradeType)`);
          errors++;
          continue;
        }

        const data: any = {
          orgId: orgMember.orgId,
          companyName: row.companyName,
          tradeType: row.tradeType,
          licenseNumber: row.licenseNumber || null,
          licenseState: row.licenseState || null,
          licenseStatus: row.licenseStatus || 'unknown',
          licenseExpiry: row.licenseExpiry ? new Date(row.licenseExpiry) : null,
          contactName: row.contactName || null,
          contactEmail: row.contactEmail || null,
          contactPhone: row.contactPhone || null,
          address: row.address || null,
          city: row.city || null,
          state: row.state || null,
          zip: row.zip || null,
          website: row.website || null,
          insuranceProvider: row.insuranceProvider || null,
          insuranceExpiry: row.insuranceExpiry ? new Date(row.insuranceExpiry) : null,
          insuranceStatus: row.insuranceStatus || 'unknown',
          bondingCapacity: parseFloat(row.bondingCapacity) || 0,
          totalProjects: parseInt(row.totalProjects) || 0,
          completedProjects: parseInt(row.completedProjects) || 0,
          rating: parseFloat(row.rating) || 0,
          specialties: row.specialties ? JSON.stringify(row.specialties) : null,
          certifications: row.certifications ? JSON.stringify(row.certifications) : null,
          serviceAreas: row.serviceAreas ? JSON.stringify(row.serviceAreas) : null,
          yearsInBusiness: parseInt(row.yearsInBusiness) || 0,
          employeeCount: row.employeeCount || null,
          notes: row.notes || null,
          tags: row.tags ? JSON.stringify(row.tags) : null,
        };

        data.complianceScore = calculateComplianceScore({
          licenseStatus: data.licenseStatus,
          insuranceStatus: data.insuranceStatus,
          bondingCapacity: data.bondingCapacity,
          totalProjects: data.totalProjects,
          completedProjects: data.completedProjects,
          isVerified: false,
          rating: data.rating,
        });

        await db.contractorDirectory.create({ data });
        imported++;
      } catch (err) {
        errorRows.push(`Row ${i + 1}: ${(err as Error).message}`);
        errors++;
      }
    }

    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'import',
        entityType: 'contractor_directory',
        entityName: 'Bulk Import',
        details: `Imported ${imported} contractors (${errors} errors)`,
      },
    });

    return NextResponse.json({
      imported,
      errors,
      errorRows: errorRows.slice(0, 20),
    });
  } catch (error) {
    console.error('Import contractors error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
