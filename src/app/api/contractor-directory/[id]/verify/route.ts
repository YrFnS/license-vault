import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// POST: Verify a contractor
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

    if (!['owner', 'admin'].includes(orgMember.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { id } = await params;
    const existing = await db.contractorDirectory.findFirst({
      where: { id, orgId: orgMember.orgId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Contractor not found' }, { status: 404 });
    }

    const contractor = await db.contractorDirectory.update({
      where: { id },
      data: {
        isVerified: true,
        lastVerifiedAt: new Date(),
      },
    });

    // Recalculate score
    let score = 0;
    if (contractor.licenseStatus === 'active') score += 30;
    else if (contractor.licenseStatus === 'expired') score += 10;
    if (contractor.insuranceStatus === 'compliant') score += 25;
    else if (contractor.insuranceStatus === 'deficient') score += 10;
    if (contractor.bondingCapacity > 1000000) score += 15;
    else if (contractor.bondingCapacity > 500000) score += 10;
    else if (contractor.bondingCapacity > 100000) score += 5;
    if (contractor.totalProjects > 0) score += (contractor.completedProjects / contractor.totalProjects) * 15;
    score += 10; // isVerified is now true
    score += (contractor.rating / 5) * 5;
    score = Math.round(Math.min(100, Math.max(0, score)));

    await db.contractorDirectory.update({
      where: { id },
      data: { complianceScore: score },
    });

    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'update',
        entityType: 'contractor_directory',
        entityId: contractor.id,
        entityName: contractor.companyName,
        details: `Verified contractor: ${contractor.companyName}`,
      },
    });

    return NextResponse.json({ contractor: { ...contractor, isVerified: true, complianceScore: score } });
  } catch (error) {
    console.error('Verify contractor error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
