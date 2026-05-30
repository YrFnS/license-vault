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

// GET: Get single insurance/bond record
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

    const orgMember = await db.orgMember.findFirst({
      where: { userId },
    });

    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const record = await db.insuranceBond.findFirst({
      where: {
        id,
        orgId: orgMember.orgId,
      },
    });

    if (!record) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    const compliance = checkInsuranceCompliance(record);

    return NextResponse.json({
      record: {
        ...record,
        computedStatus: computeInsuranceStatus(record.expirationDate),
        compliance: {
          isCompliant: compliance.isCompliant,
          deficiencies: compliance.deficiencies,
          status: computeComplianceStatus(record),
        },
      },
    });
  } catch (error) {
    console.error('Get insurance record error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const updateInsuranceSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(['insurance', 'bond', 'certificate']).optional(),
  policyNumber: z.string().min(1).optional(),
  provider: z.string().min(1).optional(),
  coverageAmount: z.number().min(0).optional(),
  premiumAmount: z.number().min(0).optional(),
  issueDate: z.string().min(1).optional(),
  expirationDate: z.string().min(1).optional(),
  holderName: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
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

// PUT: Update insurance/bond record
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
    const { id } = await params;

    const orgMember = await db.orgMember.findFirst({
      where: { userId },
    });

    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    if (!['owner', 'admin'].includes(orgMember.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only owners and admins can update records.' },
        { status: 403 }
      );
    }

    const existingRecord = await db.insuranceBond.findFirst({
      where: { id, orgId: orgMember.orgId },
    });

    if (!existingRecord) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    const body = await request.json();
    const result = updateInsuranceSchema.safeParse(body);

    if (!result.success) {
      const firstError = result.error.issues?.[0];
      return NextResponse.json(
        { error: firstError?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    const {
      issueDate,
      expirationDate,
      endorsementTypes,
      requiredEndorsements,
      ...restFields
    } = result.data;

    Object.entries(restFields).forEach(([key, value]) => {
      if (value !== undefined) {
        // Sanitize string values
        if (typeof value === 'string') {
          updateData[key] = sanitizeString(value);
        } else {
          updateData[key] = value;
        }
      }
    });

    if (issueDate !== undefined) {
      updateData.issueDate = new Date(issueDate);
    }
    if (expirationDate !== undefined) {
      updateData.expirationDate = new Date(expirationDate);
    }
    if (endorsementTypes !== undefined) {
      updateData.endorsementTypes = endorsementTypes ? JSON.stringify(endorsementTypes) : null;
    }
    if (requiredEndorsements !== undefined) {
      updateData.requiredEndorsements = requiredEndorsements ? JSON.stringify(requiredEndorsements) : null;
    }

    // Recompute status if expiration date changed
    if (expirationDate !== undefined) {
      updateData.status = computeInsuranceStatus(new Date(expirationDate));
    }

    const record = await db.insuranceBond.update({
      where: { id },
      data: updateData,
    });

    // Recompute compliance status with merged data
    const mergedRecord = { ...existingRecord, ...updateData };
    const newComplianceStatus = computeComplianceStatus({
      coverageAmount: (mergedRecord.coverageAmount as number) ?? 0,
      perOccurrenceLimit: (mergedRecord.perOccurrenceLimit as number) ?? 0,
      aggregateLimit: (mergedRecord.aggregateLimit as number) ?? 0,
      additionalInsured: (mergedRecord.additionalInsured as boolean) ?? false,
      primaryNoncontrib: (mergedRecord.primaryNoncontrib as boolean) ?? false,
      waiverSubrogation: (mergedRecord.waiverSubrogation as boolean) ?? false,
      endorsementTypes: (mergedRecord.endorsementTypes as string) ?? null,
      requiredCoverage: (mergedRecord.requiredCoverage as number) ?? 0,
      requiredPerOccurrence: (mergedRecord.requiredPerOccurrence as number) ?? 0,
      requiredAggregate: (mergedRecord.requiredAggregate as number) ?? 0,
      requiredEndorsements: (mergedRecord.requiredEndorsements as string) ?? null,
      expirationDate: mergedRecord.expirationDate as Date,
      complianceStatus: mergedRecord.complianceStatus as string,
    });

    await db.insuranceBond.update({
      where: { id },
      data: { complianceStatus: newComplianceStatus },
    });

    // Create audit log entry
    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'update',
        entityType: 'insurance_bond',
        entityId: record.id,
        entityName: record.name,
        details: `Updated insurance/bond: ${record.name} (${record.policyNumber}). Compliance: ${newComplianceStatus}`,
      },
    });

    const finalRecord = { ...record, complianceStatus: newComplianceStatus };
    const compliance = checkInsuranceCompliance(finalRecord);

    // Fire webhook event (fire-and-forget)
    dispatchWebhook(orgMember.orgId, 'insurance.updated', {
      id: record.id,
      name: record.name,
      type: record.type,
      policyNumber: record.policyNumber,
      provider: record.provider,
      complianceStatus: newComplianceStatus,
    }).catch(console.error);

    return NextResponse.json({
      record: {
        ...finalRecord,
        computedStatus: computeInsuranceStatus(finalRecord.expirationDate),
        compliance: {
          isCompliant: compliance.isCompliant,
          deficiencies: compliance.deficiencies,
          status: newComplianceStatus,
        },
      },
    });
  } catch (error) {
    console.error('Update insurance error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH: Quick compliance verification
export async function PATCH(
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

    const orgMember = await db.orgMember.findFirst({
      where: { userId },
    });

    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const existingRecord = await db.insuranceBond.findFirst({
      where: { id, orgId: orgMember.orgId },
    });

    if (!existingRecord) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    // Recompute compliance status
    const complianceStatus = computeComplianceStatus(existingRecord);
    const compliance = checkInsuranceCompliance(existingRecord);

    // Update record with verification info
    const record = await db.insuranceBond.update({
      where: { id },
      data: {
        complianceStatus,
        lastVerified: new Date(),
      },
    });

    // Create audit log entry
    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'verify',
        entityType: 'insurance_bond',
        entityId: record.id,
        entityName: record.name,
        details: `Verified compliance for ${record.name}: ${complianceStatus}${compliance.deficiencies.length > 0 ? ` - Deficiencies: ${compliance.deficiencies.join('; ')}` : ''}`,
      },
    });

    return NextResponse.json({
      record: {
        ...record,
        computedStatus: computeInsuranceStatus(record.expirationDate),
        compliance: {
          isCompliant: compliance.isCompliant,
          deficiencies: compliance.deficiencies,
          status: complianceStatus,
        },
      },
    });
  } catch (error) {
    console.error('Verify insurance error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete insurance/bond record
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
    const { id } = await params;

    const orgMember = await db.orgMember.findFirst({
      where: { userId },
    });

    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    if (!['owner', 'admin'].includes(orgMember.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only owners and admins can delete records.' },
        { status: 403 }
      );
    }

    const existingRecord = await db.insuranceBond.findFirst({
      where: { id, orgId: orgMember.orgId },
    });

    if (!existingRecord) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    // Create audit log entry before deletion
    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'delete',
        entityType: 'insurance_bond',
        entityId: existingRecord.id,
        entityName: existingRecord.name,
        details: `Deleted insurance/bond: ${existingRecord.name} (${existingRecord.policyNumber})`,
      },
    });

    // Fire webhook event (fire-and-forget)
    dispatchWebhook(orgMember.orgId, 'insurance.deleted', {
      id: existingRecord.id,
      name: existingRecord.name,
      type: existingRecord.type,
      policyNumber: existingRecord.policyNumber,
    }).catch(console.error);

    await db.insuranceBond.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete insurance error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
