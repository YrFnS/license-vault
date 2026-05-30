import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';

// Helper: calculate scores
function calculateScores(data: {
  licenseVerified: boolean;
  licenseExpiry: Date | null;
  insuranceVerified: boolean;
  coiOnFile: boolean;
  endorsementStatus: string;
  requiredDocs: number;
  submittedDocs: number;
  expiredDocs: number;
  complianceStatus?: string;
  totalProjects: number;
  completedProjects: number;
  onTimeRate: number;
  avgRating: number;
  avgResponseDays: number;
  docRequestCount: number;
  docResponseCount: number;
}) {
  // License Score (25% weight)
  let licenseScore = 0;
  if (data.licenseVerified) {
    licenseScore = 100;
  } else if (data.licenseExpiry) {
    const now = new Date();
    if (data.licenseExpiry > now) {
      licenseScore = 80; // active license but not verified
    } else {
      licenseScore = 30; // expired license
    }
  }

  // Insurance Score (25% weight)
  let insuranceScore = 0;
  if (data.coiOnFile && data.endorsementStatus === 'compliant' && data.insuranceVerified) {
    insuranceScore = 100;
  } else if (data.endorsementStatus === 'compliant') {
    insuranceScore = 80;
  } else if (data.endorsementStatus === 'deficient') {
    insuranceScore = 40;
  } else if (data.coiOnFile) {
    insuranceScore = 60;
  }

  // Document Score (15% weight)
  let documentScore = 0;
  if (data.requiredDocs > 0) {
    documentScore = (data.submittedDocs / data.requiredDocs) * 100;
    documentScore = Math.max(0, documentScore - (data.expiredDocs * 10));
  }

  // Compliance Score (15% weight)
  let complianceScore = 0;
  if (data.complianceStatus === 'compliant') {
    complianceScore = 100;
  } else if (data.complianceStatus === 'pending') {
    complianceScore = 50;
  } else if (data.complianceStatus === 'non-compliant') {
    complianceScore = 10;
  } else {
    complianceScore = 30; // unknown
  }

  // Experience Score (10% weight)
  let experienceScore = 0;
  if (data.totalProjects > 0) {
    const completionRate = data.completedProjects / data.totalProjects;
    const ratingNorm = Math.min(data.avgRating / 5, 1);
    const onTimeNorm = Math.min(data.onTimeRate / 100, 1);
    experienceScore = (completionRate * 0.4 + onTimeNorm * 0.3 + ratingNorm * 0.3) * 100;
  }

  // Responsiveness Score (10% weight)
  let responsivenessScore = 0;
  if (data.docRequestCount > 0) {
    const responseRate = data.docResponseCount / data.docRequestCount;
    const speedScore = Math.max(0, 100 - (data.avgResponseDays * 10));
    responsivenessScore = (responseRate * 0.6 + (speedScore / 100) * 0.4) * 100;
  }

  // Overall weighted score
  const overallScore = (
    licenseScore * 0.25 +
    insuranceScore * 0.25 +
    documentScore * 0.15 +
    complianceScore * 0.15 +
    experienceScore * 0.10 +
    responsivenessScore * 0.10
  );

  // Determine risk level
  let riskLevel = 'medium';
  if (overallScore >= 75) riskLevel = 'low';
  else if (overallScore >= 50) riskLevel = 'medium';
  else if (overallScore >= 25) riskLevel = 'high';
  else riskLevel = 'critical';

  return {
    licenseScore: Math.round(licenseScore * 100) / 100,
    insuranceScore: Math.round(insuranceScore * 100) / 100,
    documentScore: Math.round(documentScore * 100) / 100,
    complianceScore: Math.round(complianceScore * 100) / 100,
    experienceScore: Math.round(experienceScore * 100) / 100,
    responsivenessScore: Math.round(responsivenessScore * 100) / 100,
    overallScore: Math.round(overallScore * 100) / 100,
    riskLevel,
  };
}

export { calculateScores };

// GET /api/vendor-scores - List vendor scores with stats
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: { organizations: true },
    });

    if (!user?.organizations?.[0]) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const orgId = user.organizations[0].orgId;
    const { searchParams } = new URL(req.url);
    const riskLevel = searchParams.get('riskLevel');
    const flagged = searchParams.get('flagged');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = { orgId };
    if (riskLevel) where.riskLevel = riskLevel;
    if (flagged === 'true') where.isFlagged = true;
    if (search) {
      where.OR = [
        { vendorName: { contains: search } },
        { vendorEmail: { contains: search } },
      ];
    }

    const vendors = await db.vendorScore.findMany({
      where,
      orderBy: { overallScore: 'asc' },
    });

    // Stats
    const totalVendors = vendors.length;
    const avgScore = totalVendors > 0
      ? Math.round((vendors.reduce((sum, v) => sum + v.overallScore, 0) / totalVendors) * 100) / 100
      : 0;
    const highRiskCount = vendors.filter(v => v.riskLevel === 'high' || v.riskLevel === 'critical').length;
    const flaggedCount = vendors.filter(v => v.isFlagged).length;

    // Risk distribution
    const riskDistribution = {
      critical: vendors.filter(v => v.riskLevel === 'critical').length,
      high: vendors.filter(v => v.riskLevel === 'high').length,
      medium: vendors.filter(v => v.riskLevel === 'medium').length,
      low: vendors.filter(v => v.riskLevel === 'low').length,
    };

    // Score distribution
    const scoreDistribution = {
      '0-25': vendors.filter(v => v.overallScore >= 0 && v.overallScore < 25).length,
      '25-50': vendors.filter(v => v.overallScore >= 25 && v.overallScore < 50).length,
      '50-75': vendors.filter(v => v.overallScore >= 50 && v.overallScore < 75).length,
      '75-100': vendors.filter(v => v.overallScore >= 75 && v.overallScore <= 100).length,
    };

    return NextResponse.json({
      vendors,
      stats: { totalVendors, avgScore, highRiskCount, flaggedCount },
      riskDistribution,
      scoreDistribution,
    });
  } catch (error) {
    console.error('Error fetching vendor scores:', error);
    return NextResponse.json({ error: 'Failed to fetch vendor scores' }, { status: 500 });
  }
}

// POST /api/vendor-scores - Create vendor score
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: { organizations: true },
    });

    if (!user?.organizations?.[0]) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const orgId = user.organizations[0].orgId;
    const body = await req.json();

    const {
      vendorName,
      vendorEmail,
      subcontractorId,
      licenseVerified = false,
      licenseExpiry,
      licenseState,
      licenseType,
      insuranceVerified = false,
      insuranceExpiry,
      coiOnFile = false,
      endorsementStatus = 'unknown',
      requiredDocs = 0,
      submittedDocs = 0,
      expiredDocs = 0,
      totalProjects = 0,
      completedProjects = 0,
      onTimeRate = 0,
      avgRating = 0,
      avgResponseDays = 0,
      docRequestCount = 0,
      docResponseCount = 0,
      notes,
      autoAssess = true,
    } = body;

    // Look up subcontractor compliance status if linked
    let complianceStatus = 'unknown';
    if (subcontractorId) {
      const sub = await db.subcontractor.findUnique({
        where: { id: subcontractorId },
      });
      if (sub) {
        complianceStatus = sub.complianceStatus || 'unknown';
      }
    }

    const scores = autoAssess
      ? calculateScores({
          licenseVerified,
          licenseExpiry: licenseExpiry ? new Date(licenseExpiry) : null,
          insuranceVerified,
          coiOnFile,
          endorsementStatus,
          requiredDocs,
          submittedDocs,
          expiredDocs,
          complianceStatus,
          totalProjects,
          completedProjects,
          onTimeRate,
          avgRating,
          avgResponseDays,
          docRequestCount,
          docResponseCount,
        })
      : {
          licenseScore: 0,
          insuranceScore: 0,
          documentScore: 0,
          complianceScore: 0,
          experienceScore: 0,
          responsivenessScore: 0,
          overallScore: 0,
          riskLevel: 'medium',
        };

    const vendor = await db.vendorScore.create({
      data: {
        orgId,
        vendorName,
        vendorEmail: vendorEmail || null,
        subcontractorId: subcontractorId || null,
        overallScore: scores.overallScore,
        riskLevel: scores.riskLevel,
        licenseScore: scores.licenseScore,
        insuranceScore: scores.insuranceScore,
        documentScore: scores.documentScore,
        complianceScore: scores.complianceScore,
        experienceScore: scores.experienceScore,
        responsivenessScore: scores.responsivenessScore,
        licenseVerified,
        licenseExpiry: licenseExpiry ? new Date(licenseExpiry) : null,
        licenseState: licenseState || null,
        licenseType: licenseType || null,
        insuranceVerified,
        insuranceExpiry: insuranceExpiry ? new Date(insuranceExpiry) : null,
        coiOnFile,
        endorsementStatus,
        requiredDocs,
        submittedDocs,
        expiredDocs,
        totalProjects,
        completedProjects,
        onTimeRate,
        avgRating,
        avgResponseDays,
        docRequestCount,
        docResponseCount,
        lastAssessment: autoAssess ? new Date() : null,
        nextAssessment: autoAssess ? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) : null,
        assessmentHistory: autoAssess
          ? JSON.stringify([{ date: new Date().toISOString(), score: scores.overallScore, changes: 'Initial assessment' }])
          : null,
        notes: notes || null,
      },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        orgId,
        userId: user.id,
        action: 'create',
        entityType: 'vendor_score',
        entityId: vendor.id,
        entityName: vendorName,
      },
    });

    return NextResponse.json(vendor, { status: 201 });
  } catch (error) {
    console.error('Error creating vendor score:', error);
    return NextResponse.json({ error: 'Failed to create vendor score' }, { status: 500 });
  }
}
