import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// Helper to compute compliance score
async function computeComplianceScore(projectId: string): Promise<number> {
  const projectLicenses = await db.projectLicense.findMany({
    where: { projectId },
    include: {
      license: { select: { expirationDate: true } },
    },
  });

  if (projectLicenses.length === 0) return 100;

  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  const compliant = projectLicenses.filter(
    (pl) => pl.license.expirationDate > thirtyDaysFromNow
  ).length;

  return Math.round((compliant / projectLicenses.length) * 100);
}

// DELETE: Unlink a license from a project
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; licenseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { id: projectId, licenseId } = await params;

    const orgMember = await db.orgMember.findFirst({
      where: { userId },
    });

    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    if (!['owner', 'admin'].includes(orgMember.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions.' },
        { status: 403 }
      );
    }

    const existing = await db.projectLicense.findUnique({
      where: { projectId_licenseId: { projectId, licenseId } },
    });

    if (!existing) {
      return NextResponse.json({ error: 'License link not found' }, { status: 404 });
    }

    await db.projectLicense.delete({
      where: { id: existing.id },
    });

    // Recalculate compliance score
    const complianceScore = await computeComplianceScore(projectId);
    await db.project.update({
      where: { id: projectId },
      data: { complianceScore },
    });

    return NextResponse.json({ success: true, complianceScore });
  } catch (error) {
    console.error('Unlink license error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
