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

  // License status (30 points)
  if (contractor.licenseStatus === 'active') score += 30;
  else if (contractor.licenseStatus === 'expired') score += 10;
  // suspended/revoked/unknown = 0

  // Insurance status (25 points)
  if (contractor.insuranceStatus === 'compliant') score += 25;
  else if (contractor.insuranceStatus === 'deficient') score += 10;
  // expired/unknown = 0

  // Bonding capacity (15 points)
  if (contractor.bondingCapacity > 1000000) score += 15;
  else if (contractor.bondingCapacity > 500000) score += 10;
  else if (contractor.bondingCapacity > 100000) score += 5;

  // Project completion rate (15 points)
  if (contractor.totalProjects > 0) {
    const rate = contractor.completedProjects / contractor.totalProjects;
    score += rate * 15;
  }

  // Verification (10 points)
  if (contractor.isVerified) score += 10;

  // Rating (5 points)
  score += (contractor.rating / 5) * 5;

  return Math.round(Math.min(100, Math.max(0, score)));
}

// GET: List contractors with search/filter
export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const search = searchParams.get('search') || undefined;
    const tradeType = searchParams.get('tradeType') || undefined;
    const state = searchParams.get('state') || undefined;
    const licenseStatus = searchParams.get('licenseStatus') || undefined;
    const insuranceStatus = searchParams.get('insuranceStatus') || undefined;
    const minScore = searchParams.get('minScore') ? parseFloat(searchParams.get('minScore')!) : undefined;
    const maxScore = searchParams.get('maxScore') ? parseFloat(searchParams.get('maxScore')!) : undefined;
    const minRating = searchParams.get('minRating') ? parseFloat(searchParams.get('minRating')!) : undefined;
    const isVerified = searchParams.get('isVerified') === 'true' ? true : undefined;
    const isPreferred = searchParams.get('isPreferred') === 'true' ? true : undefined;
    const isBlacklisted = searchParams.get('isBlacklisted') === 'true' ? true : undefined;
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

    const where: any = { orgId: orgMember.orgId };

    if (search) {
      where.OR = [
        { companyName: { contains: search } },
        { contactName: { contains: search } },
        { contactEmail: { contains: search } },
        { licenseNumber: { contains: search } },
        { city: { contains: search } },
      ];
    }

    if (tradeType && tradeType !== 'all') where.tradeType = tradeType;
    if (state && state !== 'all') where.state = state;
    if (licenseStatus && licenseStatus !== 'all') where.licenseStatus = licenseStatus;
    if (insuranceStatus && insuranceStatus !== 'all') where.insuranceStatus = insuranceStatus;
    if (minScore !== undefined || maxScore !== undefined) {
      where.complianceScore = {};
      if (minScore !== undefined) where.complianceScore.gte = minScore;
      if (maxScore !== undefined) where.complianceScore.lte = maxScore;
    }
    if (minRating !== undefined) where.rating = { gte: minRating };
    if (isVerified !== undefined) where.isVerified = isVerified;
    if (isPreferred !== undefined) where.isPreferred = isPreferred;
    if (isBlacklisted !== undefined) where.isBlacklisted = isBlacklisted;

    const total = await db.contractorDirectory.count({ where });

    const contractors = await db.contractorDirectory.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Recalculate scores
    const enriched = contractors.map((c) => {
      const score = calculateComplianceScore(c);
      return { ...c, complianceScore: score };
    });

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      contractors: enriched,
      pagination: { page, limit, total, totalPages },
    });
  } catch (error) {
    console.error('Get contractor directory error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const createContractorSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  tradeType: z.string().min(1, 'Trade type is required'),
  licenseNumber: z.string().optional(),
  licenseState: z.string().optional(),
  licenseStatus: z.string().optional(),
  licenseExpiry: z.string().optional(),
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  website: z.string().optional(),
  insuranceProvider: z.string().optional(),
  insuranceExpiry: z.string().optional(),
  insuranceStatus: z.string().optional(),
  bondingCapacity: z.number().optional(),
  totalProjects: z.number().optional(),
  completedProjects: z.number().optional(),
  rating: z.number().min(0).max(5).optional(),
  specialties: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
  serviceAreas: z.array(z.string()).optional(),
  yearsInBusiness: z.number().optional(),
  employeeCount: z.string().optional(),
  isPreferred: z.boolean().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// POST: Create a contractor
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
    const result = createContractorSchema.safeParse(body);
    if (!result.success) {
      const firstError = result.error.issues?.[0];
      return NextResponse.json({ error: firstError?.message || 'Validation failed' }, { status: 400 });
    }

    const data = result.data;

    const contractorData: any = {
      orgId: orgMember.orgId,
      companyName: data.companyName,
      tradeType: data.tradeType,
      licenseNumber: data.licenseNumber || null,
      licenseState: data.licenseState || null,
      licenseStatus: data.licenseStatus || 'unknown',
      licenseExpiry: data.licenseExpiry ? new Date(data.licenseExpiry) : null,
      contactName: data.contactName || null,
      contactEmail: data.contactEmail || null,
      contactPhone: data.contactPhone || null,
      address: data.address || null,
      city: data.city || null,
      state: data.state || null,
      zip: data.zip || null,
      website: data.website || null,
      insuranceProvider: data.insuranceProvider || null,
      insuranceExpiry: data.insuranceExpiry ? new Date(data.insuranceExpiry) : null,
      insuranceStatus: data.insuranceStatus || 'unknown',
      bondingCapacity: data.bondingCapacity || 0,
      totalProjects: data.totalProjects || 0,
      completedProjects: data.completedProjects || 0,
      rating: data.rating || 0,
      specialties: data.specialties ? JSON.stringify(data.specialties) : null,
      certifications: data.certifications ? JSON.stringify(data.certifications) : null,
      serviceAreas: data.serviceAreas ? JSON.stringify(data.serviceAreas) : null,
      yearsInBusiness: data.yearsInBusiness || 0,
      employeeCount: data.employeeCount || null,
      isPreferred: data.isPreferred || false,
      notes: data.notes || null,
      tags: data.tags ? JSON.stringify(data.tags) : null,
    };

    // Calculate initial compliance score
    const score = calculateComplianceScore({
      licenseStatus: contractorData.licenseStatus,
      insuranceStatus: contractorData.insuranceStatus,
      bondingCapacity: contractorData.bondingCapacity,
      totalProjects: contractorData.totalProjects,
      completedProjects: contractorData.completedProjects,
      isVerified: false,
      rating: contractorData.rating,
    });
    contractorData.complianceScore = score;

    const contractor = await db.contractorDirectory.create({ data: contractorData });

    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'create',
        entityType: 'contractor_directory',
        entityId: contractor.id,
        entityName: contractor.companyName,
        details: `Added contractor: ${contractor.companyName}`,
      },
    });

    return NextResponse.json({ contractor }, { status: 201 });
  } catch (error) {
    console.error('Create contractor error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
