import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { checkInsuranceCompliance, computeComplianceStatus } from '@/lib/insurance-compliance';

// POST: Verify all insurance records for the org
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const orgMember = await db.orgMember.findFirst({
      where: { userId },
    });

    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    if (!['owner', 'admin'].includes(orgMember.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only owners and admins can verify compliance.' },
        { status: 403 }
      );
    }

    // Fetch all insurance records for the org
    const records = await db.insuranceBond.findMany({
      where: { orgId: orgMember.orgId },
    });

    const results = {
      total: records.length,
      compliant: 0,
      deficient: 0,
      expired: 0,
      pending: 0,
      details: [] as Array<{
        id: string;
        name: string;
        policyNumber: string;
        complianceStatus: string;
        deficiencies: string[];
      }>,
    };

    // Process each record
    for (const record of records) {
      const complianceStatus = computeComplianceStatus(record);
      const compliance = checkInsuranceCompliance(record);

      // Update the record in the database
      await db.insuranceBond.update({
        where: { id: record.id },
        data: {
          complianceStatus,
          lastVerified: new Date(),
        },
      });

      // Count by status
      switch (complianceStatus) {
        case 'compliant':
          results.compliant++;
          break;
        case 'deficient':
          results.deficient++;
          break;
        case 'expired':
          results.expired++;
          break;
        case 'pending':
          results.pending++;
          break;
      }

      results.details.push({
        id: record.id,
        name: record.name,
        policyNumber: record.policyNumber,
        complianceStatus,
        deficiencies: compliance.deficiencies,
      });
    }

    // Create audit log entry
    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'verify_all',
        entityType: 'insurance_bond',
        details: `Verified compliance for all ${records.length} insurance records. Compliant: ${results.compliant}, Deficient: ${results.deficient}, Expired: ${results.expired}, Pending: ${results.pending}`,
      },
    });

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error('Verify all insurance error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
