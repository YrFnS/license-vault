import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

function calculateScoreBreakdown(contractor: {
  licenseStatus: string;
  insuranceStatus: string;
  bondingCapacity: number;
  totalProjects: number;
  completedProjects: number;
  isVerified: boolean;
  rating: number;
}) {
  const licensePoints = contractor.licenseStatus === 'active' ? 30
    : contractor.licenseStatus === 'expired' ? 10 : 0;

  const insurancePoints = contractor.insuranceStatus === 'compliant' ? 25
    : contractor.insuranceStatus === 'deficient' ? 10 : 0;

  const bondingPoints = contractor.bondingCapacity > 1000000 ? 15
    : contractor.bondingCapacity > 500000 ? 10
    : contractor.bondingCapacity > 100000 ? 5 : 0;

  const projectPoints = contractor.totalProjects > 0
    ? Math.round((contractor.completedProjects / contractor.totalProjects) * 15)
    : 0;

  const verificationPoints = contractor.isVerified ? 10 : 0;

  const ratingPoints = Math.round((contractor.rating / 5) * 5);

  const total = licensePoints + insurancePoints + bondingPoints + projectPoints + verificationPoints + ratingPoints;

  return {
    licensePoints,
    insurancePoints,
    bondingPoints,
    projectPoints,
    verificationPoints,
    ratingPoints,
    total: Math.min(100, Math.max(0, total)),
    maxTotal: 100,
  };
}

// GET: Calculate and return compliance score breakdown
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
    const orgMember = await db.orgMember.findFirst({ where: { userId } });
    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const { id } = await params;
    const contractor = await db.contractorDirectory.findFirst({
      where: { id, orgId: orgMember.orgId },
    });
    if (!contractor) {
      return NextResponse.json({ error: 'Contractor not found' }, { status: 404 });
    }

    const breakdown = calculateScoreBreakdown(contractor);

    // Update the score in the database
    await db.contractorDirectory.update({
      where: { id },
      data: { complianceScore: breakdown.total },
    });

    return NextResponse.json({ breakdown });
  } catch (error) {
    console.error('Get contractor score error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
