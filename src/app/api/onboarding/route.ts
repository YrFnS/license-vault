import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Find user's org membership
    const orgMember = await db.orgMember.findFirst({
      where: { userId },
    });

    if (!orgMember) {
      return NextResponse.json({ completed: false });
    }

    // Check if org has any licenses
    const licenseCount = await db.license.count({
      where: { orgId: orgMember.orgId },
    });

    return NextResponse.json({ completed: licenseCount > 0 });
  } catch (error) {
    console.error('Onboarding check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
