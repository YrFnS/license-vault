import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';
import { calculateScores } from '../../route';

// POST /api/vendor-scores/[id]/assess - Run assessment
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const orgId = user.organizations[0].orgId;
    const existing = await db.vendorScore.findUnique({ where: { id } });
    if (!existing || existing.orgId !== orgId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Check if linked to subcontractor - get latest compliance status
    let complianceStatus = 'unknown';
    if (existing.subcontractorId) {
      const sub = await db.subcontractor.findUnique({
        where: { id: existing.subcontractorId },
      });
      if (sub) {
        complianceStatus = sub.complianceStatus || 'unknown';
      }
    }

    // Recalculate scores
    const scores = calculateScores({
      licenseVerified: existing.licenseVerified,
      licenseExpiry: existing.licenseExpiry,
      insuranceVerified: existing.insuranceVerified,
      coiOnFile: existing.coiOnFile,
      endorsementStatus: existing.endorsementStatus,
      requiredDocs: existing.requiredDocs,
      submittedDocs: existing.submittedDocs,
      expiredDocs: existing.expiredDocs,
      complianceStatus,
      totalProjects: existing.totalProjects,
      completedProjects: existing.completedProjects,
      onTimeRate: existing.onTimeRate,
      avgRating: existing.avgRating,
      avgResponseDays: existing.avgResponseDays,
      docRequestCount: existing.docRequestCount,
      docResponseCount: existing.docResponseCount,
    });

    // Build assessment history
    const prevHistory = existing.assessmentHistory
      ? JSON.parse(existing.assessmentHistory)
      : [];
    const changes: string[] = [];
    if (scores.overallScore !== existing.overallScore) changes.push(`Score: ${existing.overallScore} → ${scores.overallScore}`);
    if (scores.riskLevel !== existing.riskLevel) changes.push(`Risk: ${existing.riskLevel} → ${scores.riskLevel}`);
    if (scores.licenseScore !== existing.licenseScore) changes.push(`License: ${existing.licenseScore} → ${scores.licenseScore}`);
    if (scores.insuranceScore !== existing.insuranceScore) changes.push(`Insurance: ${existing.insuranceScore} → ${scores.insuranceScore}`);
    if (scores.documentScore !== existing.documentScore) changes.push(`Documents: ${existing.documentScore} → ${scores.documentScore}`);
    if (scores.complianceScore !== existing.complianceScore) changes.push(`Compliance: ${existing.complianceScore} → ${scores.complianceScore}`);

    const newEntry = {
      date: new Date().toISOString(),
      score: scores.overallScore,
      changes: changes.length > 0 ? changes.join('; ') : 'No changes',
    };

    const updatedHistory = [...prevHistory, newEntry].slice(-20); // Keep last 20

    // Generate findings
    const findings: { status: string; message: string }[] = [];
    if (scores.licenseScore >= 80) findings.push({ status: 'passed', message: 'License is verified and active' });
    else if (scores.licenseScore >= 50) findings.push({ status: 'needsAttention', message: 'License needs verification' });
    else findings.push({ status: 'failed', message: 'License is missing or expired' });

    if (scores.insuranceScore >= 80) findings.push({ status: 'passed', message: 'Insurance is compliant' });
    else if (scores.insuranceScore >= 50) findings.push({ status: 'needsAttention', message: 'Insurance needs attention' });
    else findings.push({ status: 'failed', message: 'Insurance is deficient or missing' });

    if (scores.documentScore >= 80) findings.push({ status: 'passed', message: 'Documents are up to date' });
    else if (scores.documentScore >= 50) findings.push({ status: 'needsAttention', message: 'Some documents are missing or expired' });
    else findings.push({ status: 'failed', message: 'Critical document gaps' });

    if (scores.complianceScore >= 80) findings.push({ status: 'passed', message: 'Compliance status is good' });
    else if (scores.complianceScore >= 50) findings.push({ status: 'needsAttention', message: 'Compliance pending review' });
    else findings.push({ status: 'failed', message: 'Non-compliant status' });

    if (scores.experienceScore >= 70) findings.push({ status: 'passed', message: 'Strong project experience' });
    else findings.push({ status: 'needsAttention', message: 'Limited project experience' });

    if (scores.responsivenessScore >= 70) findings.push({ status: 'passed', message: 'Good response rate' });
    else findings.push({ status: 'needsAttention', message: 'Slow response to document requests' });

    // Generate recommendations
    const recommendations: string[] = [];
    if (scores.licenseScore < 80) recommendations.push('Verify and update license information');
    if (scores.insuranceScore < 80) recommendations.push('Request updated Certificate of Insurance');
    if (scores.documentScore < 80) recommendations.push('Submit missing required documents');
    if (scores.complianceScore < 80) recommendations.push('Address compliance issues');
    if (scores.experienceScore < 70) recommendations.push('Build more project track record');
    if (scores.responsivenessScore < 70) recommendations.push('Improve response time to document requests');
    if (scores.overallScore < 50) recommendations.push('Schedule immediate compliance review');

    const vendor = await db.vendorScore.update({
      where: { id },
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

    await db.auditLog.create({
      data: {
        orgId,
        userId: user.id,
        action: 'update',
        entityType: 'vendor_score',
        entityId: id,
        entityName: existing.vendorName,
        details: `Assessment completed: score ${scores.overallScore}, risk ${scores.riskLevel}`,
      },
    });

    return NextResponse.json({
      vendor,
      findings,
      recommendations,
      history: updatedHistory,
    });
  } catch (error) {
    console.error('Error running assessment:', error);
    return NextResponse.json({ error: 'Failed to run assessment' }, { status: 500 });
  }
}
