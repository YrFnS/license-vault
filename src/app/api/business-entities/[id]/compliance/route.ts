import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// GET: Detailed compliance check for entity
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
    const entity = await db.businessEntity.findFirst({
      where: { id, orgId: orgMember.orgId },
      include: {
        licenses: {
          include: {
            license: {
              select: {
                id: true,
                name: true,
                type: true,
                expirationDate: true,
                state: true,
              },
            },
          },
        },
      },
    });

    if (!entity) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
    }

    const now = new Date();
    const checks: {
      category: string;
      status: 'compliant' | 'warning' | 'critical' | 'info';
      label: string;
      detail: string;
    }[] = [];

    // Annual report check
    if (entity.annualReportDue) {
      const dueDate = new Date(entity.annualReportDue);
      if (entity.annualReportFiled && new Date(entity.annualReportFiled) >= dueDate) {
        checks.push({
          category: 'annual_report',
          status: 'compliant',
          label: 'Annual Report',
          detail: `Filed on ${new Date(entity.annualReportFiled).toLocaleDateString()}`,
        });
      } else if (dueDate < now) {
        checks.push({
          category: 'annual_report',
          status: 'critical',
          label: 'Annual Report',
          detail: `Overdue since ${dueDate.toLocaleDateString()}`,
        });
      } else {
        const daysLeft = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        checks.push({
          category: 'annual_report',
          status: daysLeft <= 30 ? 'warning' : 'info',
          label: 'Annual Report',
          detail: `Due in ${daysLeft} days (${dueDate.toLocaleDateString()})`,
        });
      }
    } else {
      checks.push({
        category: 'annual_report',
        status: 'info',
        label: 'Annual Report',
        detail: 'No due date set',
      });
    }

    // Franchise tax check
    if (entity.franchiseTaxDue) {
      const dueDate = new Date(entity.franchiseTaxDue);
      if (entity.franchiseTaxPaid && new Date(entity.franchiseTaxPaid) >= dueDate) {
        checks.push({
          category: 'franchise_tax',
          status: 'compliant',
          label: 'Franchise Tax',
          detail: `Paid on ${new Date(entity.franchiseTaxPaid).toLocaleDateString()}`,
        });
      } else if (dueDate < now) {
        checks.push({
          category: 'franchise_tax',
          status: 'critical',
          label: 'Franchise Tax',
          detail: `Overdue since ${dueDate.toLocaleDateString()}`,
        });
      } else {
        const daysLeft = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        checks.push({
          category: 'franchise_tax',
          status: daysLeft <= 30 ? 'warning' : 'info',
          label: 'Franchise Tax',
          detail: `Due in ${daysLeft} days (${dueDate.toLocaleDateString()})`,
        });
      }
    } else {
      checks.push({
        category: 'franchise_tax',
        status: 'info',
        label: 'Franchise Tax',
        detail: 'No due date set',
      });
    }

    // License status check
    const linkedLicenses = entity.licenses.map(el => el.license);
    const expiredLicenses = linkedLicenses.filter(l => new Date(l.expirationDate) < now);
    const expiringLicenses = linkedLicenses.filter(l => {
      const exp = new Date(l.expirationDate);
      return exp >= now && exp <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    });

    if (expiredLicenses.length > 0) {
      checks.push({
        category: 'license_status',
        status: 'critical',
        label: 'License Status',
        detail: `${expiredLicenses.length} expired license(s)`,
      });
    } else if (expiringLicenses.length > 0) {
      checks.push({
        category: 'license_status',
        status: 'warning',
        label: 'License Status',
        detail: `${expiringLicenses.length} license(s) expiring within 30 days`,
      });
    } else if (linkedLicenses.length > 0) {
      checks.push({
        category: 'license_status',
        status: 'compliant',
        label: 'License Status',
        detail: `${linkedLicenses.length} license(s) all active`,
      });
    } else {
      checks.push({
        category: 'license_status',
        status: 'info',
        label: 'License Status',
        detail: 'No licenses linked',
      });
    }

    // Registered agent check
    if (entity.registeredAgent) {
      checks.push({
        category: 'registered_agent',
        status: 'compliant',
        label: 'Registered Agent',
        detail: entity.registeredAgent + (entity.registeredAgentState ? ` (${entity.registeredAgentState})` : ''),
      });
    } else {
      checks.push({
        category: 'registered_agent',
        status: 'warning',
        label: 'Registered Agent',
        detail: 'No registered agent on file',
      });
    }

    // Entity status check
    if (entity.entityStatus === 'active') {
      checks.push({
        category: 'entity_status',
        status: 'compliant',
        label: 'Entity Status',
        detail: 'Active',
      });
    } else {
      checks.push({
        category: 'entity_status',
        status: 'critical',
        label: 'Entity Status',
        detail: entity.entityStatus.charAt(0).toUpperCase() + entity.entityStatus.slice(1),
      });
    }

    // Calculate compliance score
    const criticalCount = checks.filter(c => c.status === 'critical').length;
    const warningCount = checks.filter(c => c.status === 'warning').length;
    let calculatedScore = 100;
    calculatedScore -= criticalCount * 25;
    calculatedScore -= warningCount * 10;
    calculatedScore = Math.max(0, calculatedScore);

    return NextResponse.json({
      checks,
      calculatedScore,
      overallStatus: criticalCount > 0 ? 'critical' : warningCount > 0 ? 'warning' : 'compliant',
    });
  } catch (error) {
    console.error('Get entity compliance error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
