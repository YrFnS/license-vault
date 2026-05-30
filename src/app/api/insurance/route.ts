import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { checkInsuranceCompliance, computeComplianceStatus } from '@/lib/insurance-compliance';
import { sanitizeString } from '@/lib/sanitize';
import { dispatchWebhook } from '@/lib/webhook-delivery';

function computeInsuranceStatus(expirationDate: Date): string {
  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  if (expirationDate < now) return 'expired';
  if (expirationDate <= thirtyDaysFromNow) return 'expiring_soon';
  return 'active';
}

// GET: List insurance/bond records for the user's organization
export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const typeFilter = searchParams.get('type') || undefined;
    const statusFilter = searchParams.get('status') || undefined;
    const complianceFilter = searchParams.get('compliance') || undefined;

    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    // Build where clause
    const where: any = { orgId: orgMember.orgId };

    if (typeFilter && typeFilter !== 'both') {
      where.type = typeFilter;
    }

    if (statusFilter === 'active') {
      where.expirationDate = { gt: thirtyDaysFromNow };
    } else if (statusFilter === 'expiring_soon') {
      where.expirationDate = { gt: now, lte: thirtyDaysFromNow };
    } else if (statusFilter === 'expired') {
      where.expirationDate = { lte: now };
    }

    if (complianceFilter && ['compliant', 'deficient', 'expired', 'pending'].includes(complianceFilter)) {
      where.complianceStatus = complianceFilter;
    }

    const records = await db.insuranceBond.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Add computed status and compliance info to each record
    const recordsWithStatus = records.map((record) => {
      const compliance = checkInsuranceCompliance(record);
      return {
        ...record,
        computedStatus: computeInsuranceStatus(record.expirationDate),
        compliance: {
          isCompliant: compliance.isCompliant,
          deficiencies: compliance.deficiencies,
        },
      };
    });

    // Compute summary stats
    const allRecords = await db.insuranceBond.findMany({
      where: { orgId: orgMember.orgId },
    });

    const totalCount = allRecords.length;
    const activeCount = allRecords.filter((r) => computeInsuranceStatus(r.expirationDate) === 'active').length;
    const expiringCount = allRecords.filter((r) => computeInsuranceStatus(r.expirationDate) === 'expiring_soon').length;
    const expiredCount = allRecords.filter((r) => computeInsuranceStatus(r.expirationDate) === 'expired').length;
    const totalCoverage = allRecords.reduce((sum, r) => sum + r.coverageAmount, 0);
    const totalPremium = allRecords.reduce((sum, r) => sum + r.premiumAmount, 0);

    // Compute compliance summary
    const compliantCount = allRecords.filter((r) => computeComplianceStatus(r) === 'compliant').length;
    const deficientCount = allRecords.filter((r) => computeComplianceStatus(r) === 'deficient').length;
    const expiredComplianceCount = allRecords.filter((r) => computeComplianceStatus(r) === 'expired').length;
    const pendingCount = allRecords.filter((r) => computeComplianceStatus(r) === 'pending').length;

    return NextResponse.json({
      records: recordsWithStatus,
      summary: {
        total: totalCount,
        active: activeCount,
        expiring: expiringCount,
        expired: expiredCount,
        totalCoverage,
        totalPremium,
        compliant: compliantCount,
        deficient: deficientCount,
        expiredCompliance: expiredComplianceCount,
        pending: pendingCount,
      },
    });
  } catch (error) {
    console.error('Get insurance error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const createInsuranceSchema = z.object({
  name: z.string().min(1, 'Policy name is required'),
  type: z.enum(['insurance', 'bond', 'certificate']),
  policyNumber: z.string().min(1, 'Policy number is required'),
  provider: z.string().min(1, 'Provider is required'),
  coverageAmount: z.number().min(0, 'Coverage amount must be positive'),
  premiumAmount: z.number().min(0, 'Premium amount must be positive'),
  issueDate: z.string().min(1, 'Issue date is required'),
  expirationDate: z.string().min(1, 'Expiration date is required'),
  holderName: z.string().optional(),
  notes: z.string().optional(),
  autoRenew: z.boolean().optional(),
  additionalInsured: z.boolean().optional(),
  primaryNoncontrib: z.boolean().optional(),
  waiverSubrogation: z.boolean().optional(),
  perOccurrenceLimit: z.number().min(0).optional(),
  aggregateLimit: z.number().min(0).optional(),
  deductible: z.number().min(0).optional(),
  endorsementTypes: z.array(z.string()).optional(),
  requiredCoverage: z.number().min(0).optional(),
  requiredPerOccurrence: z.number().min(0).optional(),
  requiredAggregate: z.number().min(0).optional(),
  requiredEndorsements: z.array(z.string()).optional(),
});

// POST: Create a new insurance/bond record
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

    if (!['owner', 'admin'].includes(orgMember.role as string)) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only owners and admins can create records.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const result = createInsuranceSchema.safeParse(body);

    if (!result.success) {
      const firstError = result.error.issues?.[0];
      return NextResponse.json(
        { error: firstError?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const {
      name,
      type,
      policyNumber,
      provider,
      coverageAmount,
      premiumAmount,
      issueDate,
      expirationDate,
      holderName,
      notes,
      autoRenew,
      additionalInsured,
      primaryNoncontrib,
      waiverSubrogation,
      perOccurrenceLimit,
      aggregateLimit,
      deductible,
      endorsementTypes,
      requiredCoverage,
      requiredPerOccurrence,
      requiredAggregate,
      requiredEndorsements,
    } = result.data;

    // Sanitize string inputs
    const sanitizedName = sanitizeString(name);
    const sanitizedPolicyNumber = sanitizeString(policyNumber);
    const sanitizedProvider = sanitizeString(provider);
    const sanitizedHolderName = holderName ? sanitizeString(holderName) : undefined;
    const sanitizedNotes = notes ? sanitizeString(notes) : undefined;

    // Compute status based on expiration date
    const expDate = new Date(expirationDate);
    const computedStatus = computeInsuranceStatus(expDate);

    // Build record data for compliance check
    const recordForCompliance = {
      coverageAmount,
      perOccurrenceLimit: perOccurrenceLimit || 0,
      aggregateLimit: aggregateLimit || 0,
      additionalInsured: additionalInsured || false,
      primaryNoncontrib: primaryNoncontrib || false,
      waiverSubrogation: waiverSubrogation || false,
      endorsementTypes: endorsementTypes ? JSON.stringify(endorsementTypes) : null,
      requiredCoverage: requiredCoverage || 0,
      requiredPerOccurrence: requiredPerOccurrence || 0,
      requiredAggregate: requiredAggregate || 0,
      requiredEndorsements: requiredEndorsements ? JSON.stringify(requiredEndorsements) : null,
      expirationDate: expDate,
      complianceStatus: 'pending',
    };

    const complianceStatus = computeComplianceStatus(recordForCompliance);

    const record = await db.insuranceBond.create({
      data: {
        orgId: orgMember.orgId,
        name: sanitizedName,
        type,
        policyNumber: sanitizedPolicyNumber,
        provider: sanitizedProvider,
        coverageAmount,
        premiumAmount,
        issueDate: new Date(issueDate),
        expirationDate: expDate,
        status: computedStatus,
        holderName: sanitizedHolderName,
        notes: sanitizedNotes,
        autoRenew: autoRenew || false,
        additionalInsured: additionalInsured || false,
        primaryNoncontrib: primaryNoncontrib || false,
        waiverSubrogation: waiverSubrogation || false,
        perOccurrenceLimit: perOccurrenceLimit || 0,
        aggregateLimit: aggregateLimit || 0,
        deductible: deductible || 0,
        endorsementTypes: endorsementTypes ? JSON.stringify(endorsementTypes) : null,
        requiredCoverage: requiredCoverage || 0,
        requiredPerOccurrence: requiredPerOccurrence || 0,
        requiredAggregate: requiredAggregate || 0,
        requiredEndorsements: requiredEndorsements ? JSON.stringify(requiredEndorsements) : null,
        complianceStatus,
      },
    });

    // Create audit log entry
    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'create',
        entityType: 'insurance_bond',
        entityId: record.id,
        entityName: record.name,
        details: `Created insurance/bond: ${record.name} (${record.policyNumber}) with compliance status: ${complianceStatus}`,
      },
    });

    const compliance = checkInsuranceCompliance(record);

    // Fire webhook event (fire-and-forget)
    dispatchWebhook(orgMember.orgId, 'insurance.created', {
      id: record.id,
      name: record.name,
      type: record.type,
      policyNumber: record.policyNumber,
      provider: record.provider,
      coverageAmount: record.coverageAmount,
      expirationDate: record.expirationDate,
      complianceStatus,
    }).catch(console.error);

    return NextResponse.json(
      {
        record: {
          ...record,
          computedStatus,
          compliance: {
            isCompliant: compliance.isCompliant,
            deficiencies: compliance.deficiencies,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create insurance error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
