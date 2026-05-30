import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/state-requirements
 *
 * Public reference endpoint - no auth required.
 * Supports optional filters:
 *   ?state=CA              - Filter by state code
 *   ?licenseType=electrical - Filter by license type
 *   ?action=reciprocity&state=CA  - Get reciprocity info for a state
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state');
    const licenseType = searchParams.get('licenseType');
    const action = searchParams.get('action');

    // Reciprocity action: returns detailed reciprocity info for a state
    if (action === 'reciprocity' && state) {
      const stateCode = state.toUpperCase();

      const requirements = await db.stateRequirement.findMany({
        where: { state: stateCode },
        orderBy: { licenseType: 'asc' },
      });

      if (requirements.length === 0) {
        return NextResponse.json({
          state: stateCode,
          hasData: false,
          reciprocityStates: [],
          licenseTypes: [],
        });
      }

      // Parse reciprocity states from JSON strings
      const allReciprocityStates = new Set<string>();
      const licenseTypes = requirements.map((req) => {
        const recipStates: string[] = req.reciprocityStates
          ? JSON.parse(req.reciprocityStates)
          : [];
        recipStates.forEach((s) => allReciprocityStates.add(s));
        return {
          licenseType: req.licenseType,
          reciprocityStates: recipStates,
          nasclaAccepted: req.nasclaAccepted,
          ceHoursRequired: req.ceHoursRequired,
          renewalFeeMin: req.renewalFeeMin,
          renewalFeeMax: req.renewalFeeMax,
          bondRequired: req.bondRequired,
          insuranceRequired: req.insuranceRequired,
        };
      });

      const nasclaAccepted = requirements.some((r) => r.nasclaAccepted);

      // Fetch board info from first record
      const firstReq = requirements[0];

      return NextResponse.json({
        state: stateCode,
        hasData: true,
        reciprocityStates: Array.from(allReciprocityStates),
        nasclaAccepted,
        licenseTypes,
        boardName: firstReq.boardName,
        boardUrl: firstReq.boardUrl,
        boardPhone: firstReq.boardPhone,
      });
    }

    // Default: return filtered list of requirements
    const where: Record<string, string> = {};
    if (state) where.state = state.toUpperCase();
    if (licenseType) where.licenseType = licenseType;

    const requirements = await db.stateRequirement.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: [{ state: 'asc' }, { licenseType: 'asc' }],
    });

    // Parse reciprocityStates JSON strings for convenience
    const parsed = requirements.map((req) => ({
      ...req,
      reciprocityStates: req.reciprocityStates
        ? JSON.parse(req.reciprocityStates)
        : [],
    }));

    return NextResponse.json({ requirements: parsed });
  } catch (error) {
    console.error('Get state requirements error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
