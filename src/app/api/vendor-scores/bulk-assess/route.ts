import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';
import { calculateScores } from '../route';

// POST /api/vendor-scores/bulk-assess - Reassess all vendors
export async function POST() {
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
    const vendors = await db.vendorScore.findMany({ where: { orgId } });

    let assessed = 0;
    const results: { id: string; name: string; oldScore: number; newScore: number; oldRisk: string; newRisk: string }[] = [];

    for (const vendor of vendors) {
      // Get latest compliance status from linked subcontractor
      let complianceStatus = 'unknown';
      if (vendor.subcontractorId) {
        const sub = await db.subcontractor.findUnique({
          where: { id: vendor.subcontractorId },
        });
        if (sub) complianceStatus = sub.complianceStatus || 'unknown';
      }

      const scores = calculateScores({
        licenseVerified: vendor.licenseVerified,
        licenseExpiry: vendor.licenseExpiry,
        insuranceVerified: vendor.insuranceVerified,
        coiOnFile: vendor.coiOnFile,
        endorsementStatus: vendor.endorsementStatus,
        requiredDocs: vendor.requiredDocs,
        submittedDocs: vendor.submittedDocs,
        expiredDocs: vendor.expiredDocs,
        complianceStatus,
        totalProjects: vendor.totalProjects,
        completedProjects: vendor.completedProjects,
        onTimeRate: vendor.onTimeRate,
        avgRating: vendor.avgRating,
        avgResponseDays: vendor.avgResponseDays,
        docRequestCount: vendor.docRequestCount,
        docResponseCount: vendor.docResponseCount,
      });

      const changes: string[] = [];
      if (scores.overallScore !== vendor.overallScore) changes.push(`Score: ${vendor.overallScore} → ${scores.overallScore}`);
      if (scores.riskLevel !== vendor.riskLevel) changes.push(`Risk: ${vendor.riskLevel} → ${scores.riskLevel}`);

      const prevHistory = vendor.assessmentHistory ? JSON.parse(vendor.assessmentHistory) : [];
      const newEntry = {
        date: new Date().toISOString(),
        score: scores.overallScore,
        changes: changes.length > 0 ? changes.join('; ') : 'No changes',
      };
      const updatedHistory = [...prevHistory, newEntry].slice(-20);

      await db.vendorScore.update({
        where: { id: vendor.id },
        data: {
          overallScore: scores.overallScore,
          riskLevel: scores.riskLevel,
          licenseScore: scores.licenseScore,
          insuranceScore: scores.insuranceScore,
          documentScore: scores.documentScore,
          complianceScore: scores.complianceScore,
          experienceScore: scores.experienceScore,
          responsivenessScore: scores.responsivenessScore,
          lastAssessment: new Date(),
          nextAssessment: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          assessmentHistory: JSON.stringify(updatedHistory),
        },
      });

      results.push({
        id: vendor.id,
        name: vendor.vendorName,
        oldScore: vendor.overallScore,
        newScore: scores.overallScore,
        oldRisk: vendor.riskLevel,
        newRisk: scores.riskLevel,
      });
      assessed++;
    }

    await db.auditLog.create({
      data: {
        orgId,
        userId: user.id,
        action: 'update',
        entityType: 'vendor_score',
        entityName: 'Bulk Assessment',
        details: `Bulk assessed ${assessed} vendors`,
      },
    });

    return NextResponse.json({
      total: vendors.length,
      assessed,
      results,
    });
  } catch (error) {
    console.error('Error running bulk assessment:', error);
    return NextResponse.json({ error: 'Failed to run bulk assessment' }, { status: 500 });
  }
}
