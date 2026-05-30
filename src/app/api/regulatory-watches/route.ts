import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// GET: List watched states/license types
export async function GET(request: Request) {
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

    const watches = await db.regulatoryWatch.findMany({
      where: { orgId: orgMember.orgId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ watches });
  } catch (error) {
    console.error('Get regulatory watches error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const addWatchSchema = z.object({
  state: z.string().min(1, 'State is required'),
  licenseType: z.string().optional(),
});

// POST: Add a state/license type to watch
export async function POST(request: Request) {
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

    const body = await request.json();
    const result = addWatchSchema.safeParse(body);

    if (!result.success) {
      const firstError = result.error.issues?.[0];
      return NextResponse.json(
        { error: firstError?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const data = result.data;

    // Check for existing watch
    const existing = await db.regulatoryWatch.findFirst({
      where: {
        orgId: orgMember.orgId,
        state: data.state,
        licenseType: data.licenseType || null,
      },
    });

    if (existing) {
      // Reactivate if inactive
      if (!existing.isActive) {
        const updated = await db.regulatoryWatch.update({
          where: { id: existing.id },
          data: { isActive: true },
        });
        return NextResponse.json({ watch: updated });
      }
      return NextResponse.json({ error: 'Watch already exists' }, { status: 409 });
    }

    const watch = await db.regulatoryWatch.create({
      data: {
        orgId: orgMember.orgId,
        state: data.state,
        licenseType: data.licenseType || null,
      },
    });

    return NextResponse.json({ watch }, { status: 201 });
  } catch (error) {
    console.error('Add regulatory watch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Remove a watch
export async function DELETE(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Watch ID is required' }, { status: 400 });
    }

    const watch = await db.regulatoryWatch.findFirst({
      where: { id, orgId: orgMember.orgId },
    });

    if (!watch) {
      return NextResponse.json({ error: 'Watch not found' }, { status: 404 });
    }

    await db.regulatoryWatch.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete regulatory watch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
