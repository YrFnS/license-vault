import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

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

// GET: Get a single contractor
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

    const score = calculateComplianceScore(contractor);
    return NextResponse.json({ contractor: { ...contractor, complianceScore: score } });
  } catch (error) {
    console.error('Get contractor error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const updateContractorSchema = z.object({
  companyName: z.string().min(1).optional(),
  tradeType: z.string().optional(),
  licenseNumber: z.string().nullable().optional(),
  licenseState: z.string().nullable().optional(),
  licenseStatus: z.string().optional(),
  licenseExpiry: z.string().nullable().optional(),
  contactName: z.string().nullable().optional(),
  contactEmail: z.string().email().nullable().optional().or(z.literal('')),
  contactPhone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  zip: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  insuranceProvider: z.string().nullable().optional(),
  insuranceExpiry: z.string().nullable().optional(),
  insuranceStatus: z.string().optional(),
  bondingCapacity: z.number().optional(),
  totalProjects: z.number().optional(),
  completedProjects: z.number().optional(),
  rating: z.number().min(0).max(5).optional(),
  specialties: z.array(z.string()).nullable().optional(),
  certifications: z.array(z.string()).nullable().optional(),
  serviceAreas: z.array(z.string()).nullable().optional(),
  yearsInBusiness: z.number().optional(),
  employeeCount: z.string().nullable().optional(),
  isPreferred: z.boolean().optional(),
  isBlacklisted: z.boolean().optional(),
  notes: z.string().nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
});

// PUT: Update a contractor
export async function PUT(
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

    const body = await request.json();
    const result = updateContractorSchema.safeParse(body);
    if (!result.success) {
      const firstError = result.error.issues?.[0];
      return NextResponse.json({ error: firstError?.message || 'Validation failed' }, { status: 400 });
    }

    const data = result.data;
    const updateData: any = {};

    for (const [key, value] of Object.entries(data)) {
      if (value === undefined) continue;
      if (key === 'licenseExpiry') {
        updateData[key] = value ? new Date(value as string) : null;
      } else if (key === 'insuranceExpiry') {
        updateData[key] = value ? new Date(value as string) : null;
      } else if (key === 'specialties' || key === 'certifications' || key === 'serviceAreas' || key === 'tags') {
        updateData[key] = value ? JSON.stringify(value) : null;
      } else if (key === 'contactEmail' && value === '') {
        updateData[key] = null;
      } else {
        updateData[key] = value;
      }
    }

    // Recalculate score with updated fields
    const merged = { ...existing, ...updateData };
    updateData.complianceScore = calculateComplianceScore({
      licenseStatus: merged.licenseStatus,
      insuranceStatus: merged.insuranceStatus,
      bondingCapacity: merged.bondingCapacity,
      totalProjects: merged.totalProjects,
      completedProjects: merged.completedProjects,
      isVerified: merged.isVerified,
      rating: merged.rating,
    });

    const contractor = await db.contractorDirectory.update({
      where: { id },
      data: updateData,
    });

    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'update',
        entityType: 'contractor_directory',
        entityId: contractor.id,
        entityName: contractor.companyName,
        details: `Updated contractor: ${contractor.companyName}`,
      },
    });

    return NextResponse.json({ contractor });
  } catch (error) {
    console.error('Update contractor error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete a contractor
export async function DELETE(
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

    await db.contractorDirectory.delete({ where: { id } });

    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'delete',
        entityType: 'contractor_directory',
        entityId: id,
        entityName: existing.companyName,
        details: `Deleted contractor: ${existing.companyName}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete contractor error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
