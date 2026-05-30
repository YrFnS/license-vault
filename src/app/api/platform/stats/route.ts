import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET: Public platform stats (no auth required)
export async function GET() {
  try {
    // Count total licenses across all orgs
    const totalLicenses = await db.license.count();

    // Count total organizations
    const totalOrgs = await db.organization.count();

    // Count total users
    const totalUsers = await db.user.count();

    // Count distinct states covered from licenses
    const stateResults = await db.license.findMany({
      where: { state: { not: null } },
      select: { state: true },
      distinct: ['state'],
    });
    const statesCovered = stateResults.length;

    return NextResponse.json({
      totalLicenses,
      totalOrgs,
      totalUsers,
      statesCovered,
    });
  } catch (error) {
    console.error('Error fetching platform stats:', error);
    // Return sensible defaults on error so the landing page still works
    return NextResponse.json({
      totalLicenses: 0,
      totalOrgs: 0,
      totalUsers: 0,
      statesCovered: 0,
    });
  }
}
