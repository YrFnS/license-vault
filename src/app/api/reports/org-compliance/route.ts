import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateOrgComplianceReport } from '@/lib/pdf-report';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    // Check org membership - owner/admin only
    const orgMember = await db.orgMember.findFirst({
      where: { userId },
    });

    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    if (userRole !== 'owner' && userRole !== 'admin') {
      return NextResponse.json({ error: 'Access denied. Owner or Admin role required.' }, { status: 403 });
    }

    const orgId = orgMember.orgId;

    // Get organization
    const org = await db.organization.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Get all licenses
    const licenses = await db.license.findMany({
      where: { orgId },
      orderBy: { expirationDate: 'asc' },
    });

    // Compute status for each license
    const now = new Date();
    const licensesWithStatus = licenses.map((l) => {
      const exp = new Date(l.expirationDate);
      const daysUntil = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const status = daysUntil < 0 ? 'expired' : daysUntil <= 60 ? 'expiring_soon' : 'active';
      return { ...l, status };
    });

    // Get all insurance/bonds
    const insurance = await db.insuranceBond.findMany({
      where: { orgId },
      orderBy: { expirationDate: 'asc' },
    });

    const insuranceWithStatus = insurance.map((i) => {
      const exp = new Date(i.expirationDate);
      const daysUntil = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const status = daysUntil < 0 ? 'expired' : daysUntil <= 60 ? 'expiring_soon' : 'active';
      return { ...i, status };
    });

    // Get all CE records
    const ceRecords = await db.cETracking.findMany({
      where: { orgId },
    });

    // Get team members
    const teamMembers = await db.orgMember.findMany({
      where: { orgId },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });

    // Calculate compliance score
    const totalItems = licensesWithStatus.length + insuranceWithStatus.length;
    const activeItems = licensesWithStatus.filter((l) => l.status === 'active').length +
      insuranceWithStatus.filter((i) => i.status === 'active').length;
    const complianceScore = totalItems > 0 ? Math.round((activeItems / totalItems) * 100) : 100;

    // Generate PDF
    const pdfBuffer = generateOrgComplianceReport({
      org: {
        name: org.name,
        tradeType: org.tradeType,
        primaryState: org.primaryState,
      },
      licenses: licensesWithStatus.map((l) => ({
        id: l.id,
        name: l.name,
        type: l.type,
        licenseNumber: l.licenseNumber,
        issuedBy: l.issuedBy,
        expirationDate: l.expirationDate,
        status: l.status,
      })),
      insurance: insuranceWithStatus.map((i) => ({
        name: i.name,
        type: i.type,
        provider: i.provider,
        expirationDate: i.expirationDate,
        status: i.status,
      })),
      ceRecords: ceRecords.map((ce) => ({
        courseName: ce.courseName,
        hoursEarned: ce.hoursEarned,
        hoursRequired: ce.hoursRequired,
      })),
      users: teamMembers.map((m) => ({
        name: m.user?.name || m.fullName || m.email,
        email: m.email,
        role: m.role,
      })),
      complianceScore,
    });

    // Audit log the report generation
    await db.auditLog.create({
      data: {
        orgId,
        userId,
        action: 'generate_report',
        entityType: 'organization',
        entityId: orgId,
        entityName: org.name,
        details: 'Generated organization compliance PDF report',
      },
    });

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="org-compliance-report-${org.name.replace(/\s+/g, '-').toLowerCase()}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Org report generation error:', error);
    return NextResponse.json({ error: 'Failed to generate organization report' }, { status: 500 });
  }
}
