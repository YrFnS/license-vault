import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

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

const linkLicenseSchema = z.object({
  licenseId: z.string().min(1, 'License ID is required'),
  required: z.boolean().optional().default(true),
  notes: z.string().optional(),
});

// POST: Link a license to a project
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
    const { id: projectId } = await params;

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

    const project = await db.project.findFirst({
      where: { id: projectId, orgId: orgMember.orgId },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
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

    const { licenseId, required, notes } = result.data;

    // Verify license exists and belongs to org
    const license = await db.license.findFirst({
      where: { id: licenseId, orgId: orgMember.orgId },
    });

    if (!license) {
      return NextResponse.json({ error: 'License not found' }, { status: 404 });
    }

    // Check if already linked
    const existing = await db.projectLicense.findUnique({
      where: { projectId_licenseId: { projectId, licenseId } },
    });

    if (existing) {
      return NextResponse.json({ error: 'License already linked to this project' }, { status: 400 });
    }

    const projectLicense = await db.projectLicense.create({
      data: {
        projectId,
        licenseId,
        required,
        notes: notes || null,
      },
    });

    // Recalculate compliance score
    const complianceScore = await computeComplianceScore(projectId);
    await db.project.update({
      where: { id: projectId },
      data: { complianceScore },
    });

    return NextResponse.json({ projectLicense, complianceScore }, { status: 201 });
  } catch (error) {
    console.error('Link license error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
