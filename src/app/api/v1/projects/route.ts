import { NextResponse } from 'next/server';
import { authenticateApiKey, hasPermission } from '@/lib/api-auth';
import { db } from '@/lib/db';

// GET /api/v1/projects - List projects
export async function GET(request: Request) {
  try {
    const auth = await authenticateApiKey();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized. Include a valid API key in the Authorization header.' }, { status: 401 });
    }

    if (!hasPermission(auth.permissions, 'read')) {
      return NextResponse.json({ error: 'Insufficient permissions. API key requires read access.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const status = searchParams.get('status') || undefined;

    const where: any = { orgId: auth.orgId };
    if (status) where.status = status;

    const total = await db.project.count({ where });

    const projects = await db.project.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const data = projects.map((project) => ({
      id: project.id,
      name: project.name,
      description: project.description,
      clientName: project.clientName,
      location: project.location,
      state: project.state,
      startDate: project.startDate,
      endDate: project.endDate,
      status: project.status,
      complianceScore: project.complianceScore,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    }));

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('API v1 list projects error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
