import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { sanitizeString } from '@/lib/sanitize';

// GET: List projects for the user's organization
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
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const statusFilter = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;

    // Build where clause
    const where: any = { orgId: orgMember.orgId };

    if (statusFilter) {
      where.status = statusFilter;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { clientName: { contains: search } },
        { location: { contains: search } },
      ];
    }

    const total = await db.project.count({ where });

    const projects = await db.project.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        _count: {
          select: {
            projectLicenses: true,
            projectSubs: true,
          },
        },
      },
    });

    // Compute compliance score for each project
    const projectsWithScore = await Promise.all(
      projects.map(async (project) => {
        const projectLicenses = await db.projectLicense.findMany({
          where: { projectId: project.id },
          include: {
            license: {
              select: {
                expirationDate: true,
              },
            },
          },
        });

        let complianceScore = project.complianceScore;
        if (projectLicenses.length > 0) {
          const now = new Date();
          const thirtyDaysFromNow = new Date();
          thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
          const compliant = projectLicenses.filter(
            (pl) => pl.license.expirationDate > thirtyDaysFromNow
          ).length;
          complianceScore = Math.round((compliant / projectLicenses.length) * 100);
        } else {
          complianceScore = 100; // No licenses linked = fully compliant
        }

        return {
          ...project,
          complianceScore,
          licenseCount: project._count.projectLicenses,
          subcontractorCount: project._count.projectSubs,
        };
      })
    );

    // Compute counts
    const orgWhere = { orgId: orgMember.orgId };
    const [countAll, countActive, countCompleted, countOnHold] = await Promise.all([
      db.project.count({ where: orgWhere }),
      db.project.count({ where: { ...orgWhere, status: 'active' } }),
      db.project.count({ where: { ...orgWhere, status: 'completed' } }),
      db.project.count({ where: { ...orgWhere, status: 'on_hold' } }),
    ]);

    // Compute average compliance score
    const allProjects = await db.project.findMany({
      where: orgWhere,
      include: {
        projectLicenses: {
          include: {
            license: { select: { expirationDate: true } },
          },
        },
      },
    });

    let avgCompliance = 100;
    let atRiskCount = 0;
    if (allProjects.length > 0) {
      const scores = allProjects.map((p) => {
        if (p.projectLicenses.length === 0) return 100;
        const now = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        const compliant = p.projectLicenses.filter(
          (pl) => pl.license.expirationDate > thirtyDaysFromNow
        ).length;
        return Math.round((compliant / p.projectLicenses.length) * 100);
      });
      avgCompliance = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      atRiskCount = scores.filter((s) => s < 60).length;
    }

    return NextResponse.json({
      projects: projectsWithScore,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      counts: {
        all: countAll,
        active: countActive,
        completed: countCompleted,
        on_hold: countOnHold,
      },
      stats: {
        avgCompliance,
        atRiskCount,
      },
    });
  } catch (error) {
    console.error('Get projects error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  clientName: z.string().optional(),
  clientEmail: z.string().optional(),
  location: z.string().optional(),
  state: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(['active', 'completed', 'on_hold']).optional().default('active'),
  requiredLicenses: z.string().optional(),
  requiredInsurance: z.string().optional(),
});

// POST: Create a new project
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
        { error: 'Insufficient permissions. Only owners and admins can create projects.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const result = createProjectSchema.safeParse(body);

    if (!result.success) {
      const firstError = result.error.issues?.[0];
      return NextResponse.json(
        { error: firstError?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const data = result.data;

    // Sanitize string inputs
    const sanitizedName = sanitizeString(data.name);
    const sanitizedDescription = data.description ? sanitizeString(data.description) : null;
    const sanitizedClientName = data.clientName ? sanitizeString(data.clientName) : null;
    const sanitizedClientEmail = data.clientEmail || null;
    const sanitizedLocation = data.location ? sanitizeString(data.location) : null;
    const sanitizedState = data.state ? sanitizeString(data.state) : null;
    const sanitizedRequiredLicenses = data.requiredLicenses ? sanitizeString(data.requiredLicenses) : null;
    const sanitizedRequiredInsurance = data.requiredInsurance ? sanitizeString(data.requiredInsurance) : null;

    const project = await db.project.create({
      data: {
        orgId: orgMember.orgId,
        name: sanitizedName,
        description: sanitizedDescription,
        clientName: sanitizedClientName,
        clientEmail: sanitizedClientEmail,
        location: sanitizedLocation,
        state: sanitizedState,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        status: data.status,
        requiredLicenses: sanitizedRequiredLicenses,
        requiredInsurance: sanitizedRequiredInsurance,
        complianceScore: 100,
      },
    });

    // Create audit log entry
    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'create',
        entityType: 'project',
        entityId: project.id,
        entityName: project.name,
        details: `Created project: ${project.name}`,
      },
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error('Create project error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
