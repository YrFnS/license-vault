import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// GET: List last 20 generated documents for the org
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

    const documents = await db.generatedDocument.findMany({
      where: { orgId: orgMember.orgId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        template: true,
        inputData: true,
        format: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error('Get document history error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
