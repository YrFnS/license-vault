import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// GET: Get project compliance details
export async function GET(
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

    const orgMember = await db.orgMember.findFirst({
      where: { userId },
    });

    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const project = await db.project.findFirst({
      where: { id, orgId: orgMember.orgId },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get linked licenses with details
    const projectLicenses = await db.projectLicense.findMany({
      where: { projectId: id },
      include: {
        license: true,
      },
    });

    // Get linked subcontractors with details
    const projectSubs = await db.projectSubcontractor.findMany({
      where: { projectId: id },
      include: {
        subcontractor: true,
      },
    });

    // Compute license compliance
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const licenseCompliance = projectLicenses.map((pl) => {
      const expirationDate = pl.license.expirationDate;
      let status = 'compliant';
      if (expirationDate <= now) {
        status = 'expired';
      } else if (expirationDate <= thirtyDaysFromNow) {
        status = 'expiring_soon';
      }

      return {
        id: pl.id,
        licenseId: pl.licenseId,
        licenseName: pl.license.name,
        licenseType: pl.license.type,
        licenseNumber: pl.license.licenseNumber,
        expirationDate: pl.license.expirationDate,
        status,
        required: pl.required,
        verified: pl.verified,
        notes: pl.notes,
      };
    });

    const compliantCount = licenseCompliance.filter((l) => l.status === 'compliant').length;
    const expiringCount = licenseCompliance.filter((l) => l.status === 'expiring_soon').length;
    const expiredCount = licenseCompliance.filter((l) => l.status === 'expired').length;

    // Compute subcontractor compliance
    const subCompliance = projectSubs.map((ps) => ({
      id: ps.id,
      subcontractorId: ps.subcontractorId,
      companyName: ps.subcontractor.companyName,
      complianceStatus: ps.complianceStatus,
      role: ps.role,
      licenseExpiry: ps.subcontractor.licenseExpiry,
      insuranceExpiry: ps.subcontractor.insuranceExpiry,
      insuranceStatus: ps.subcontractor.insuranceStatus,
    }));

    const compliantSubs = subCompliance.filter((s) => s.complianceStatus === 'compliant').length;
    const pendingSubs = subCompliance.filter((s) => s.complianceStatus === 'pending').length;
    const nonCompliantSubs = subCompliance.filter((s) => s.complianceStatus === 'non_compliant').length;

    // Overall compliance score
    const totalLicenses = licenseCompliance.length;
    const complianceScore = totalLicenses > 0
      ? Math.round((compliantCount / totalLicenses) * 100)
      : 100;

    // Update stored score
    await db.project.update({
      where: { id },
      data: { complianceScore },
    });

    return NextResponse.json({
      projectId: id,
      projectName: project.name,
      complianceScore,
      licenseCompliance: {
        total: totalLicenses,
        compliant: compliantCount,
        expiring: expiringCount,
        expired: expiredCount,
        licenses: licenseCompliance,
      },
      subcontractorCompliance: {
        total: subCompliance.length,
        compliant: compliantSubs,
        pending: pendingSubs,
        nonCompliant: nonCompliantSubs,
        subcontractors: subCompliance,
      },
    });
  } catch (error) {
    console.error('Get project compliance error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
