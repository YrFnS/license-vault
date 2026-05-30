import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateLicenseReport } from '@/lib/pdf-report';

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

    // Get license with documents and CE records
    const license = await db.license.findUnique({
      where: { id },
      include: {
        documents: {
          orderBy: { createdAt: 'desc' },
        },
        ceTrackings: {
          orderBy: { completionDate: 'desc' },
        },
      },
    });

    if (!license) {
      return NextResponse.json({ error: 'License not found' }, { status: 404 });
    }

    // Check org membership
    const orgMember = await db.orgMember.findFirst({
      where: { userId },
    });

    if (!orgMember || license.orgId !== orgMember.orgId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get org info
    const org = await db.organization.findUnique({
      where: { id: license.orgId },
    });

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Parse renewal history
    let renewalHistory: Array<{ date: string; notes: string; renewedBy: string }> = [];
    if (license.renewalHistory) {
      try {
        renewalHistory = JSON.parse(license.renewalHistory);
      } catch {
        renewalHistory = [];
      }
    }

    // Determine license status
    const now = new Date();
    const exp = new Date(license.expirationDate);
    const daysUntil = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const status = daysUntil < 0 ? 'expired' : daysUntil <= 60 ? 'expiring_soon' : 'active';

    // Generate PDF using the utility
    const pdfBuffer = generateLicenseReport({
      license: {
        id: license.id,
        name: license.name,
        type: license.type,
        licenseNumber: license.licenseNumber,
        issuedBy: license.issuedBy,
        issueDate: license.issueDate,
        expirationDate: license.expirationDate,
        notes: license.notes,
        isRenewed: license.isRenewed,
        renewalDate: license.renewalDate,
        autoRenew: license.autoRenew,
        renewalHistory: license.renewalHistory,
        status,
      },
      org: {
        name: org.name,
        tradeType: org.tradeType,
        primaryState: org.primaryState,
      },
      renewalHistory,
      ceRecords: license.ceTrackings.map((ce) => ({
        courseName: ce.courseName,
        provider: ce.provider,
        hoursEarned: ce.hoursEarned,
        hoursRequired: ce.hoursRequired,
        completionDate: ce.completionDate,
        category: ce.category,
      })),
      documents: license.documents.map((doc) => ({
        fileName: doc.fileName,
        category: doc.category,
        createdAt: doc.createdAt,
      })),
    });

    // Audit log the report generation
    await db.auditLog.create({
      data: {
        orgId: license.orgId,
        userId,
        action: 'generate_report',
        entityType: 'license',
        entityId: license.id,
        entityName: license.name,
        details: 'Generated PDF compliance report',
      },
    });

    return new NextResponse(pdfBuffer as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="compliance-report-${license.licenseNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
