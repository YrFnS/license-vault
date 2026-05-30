import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const statesParam = searchParams.get('states');
    
    if (!statesParam) {
      return NextResponse.json({ error: 'Missing states parameter' }, { status: 400 });
    }

    const states = statesParam.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
    
    if (states.length < 2) {
      return NextResponse.json({ error: 'At least 2 states required' }, { status: 400 });
    }

    const requirements = await db.stateRequirement.findMany({
      where: { state: { in: states } },
      orderBy: [{ state: 'asc' }, { licenseType: 'asc' }],
    });

    // Group by license type for comparison
    const allLicenseTypes = [...new Set(requirements.map(r => r.licenseType))];
    
    const comparison = allLicenseTypes.map(lt => {
      const typeRequirements = requirements.filter(r => r.licenseType === lt);
      const stateData: Record<string, {
        renewPeriodMonths: number;
        ceHoursRequired: number;
        renewalFeeMin: number;
        renewalFeeMax: number;
        bondRequired: boolean;
        bondAmountMin: number;
        insuranceRequired: boolean;
        boardName: string | null;
        boardUrl: string | null;
        boardPhone: string | null;
        notes: string | null;
      }> = {};

      for (const state of states) {
        const req = typeRequirements.find(r => r.state === state);
        if (req) {
          stateData[state] = {
            renewPeriodMonths: req.renewPeriodMonths,
            ceHoursRequired: req.ceHoursRequired,
            renewalFeeMin: req.renewalFeeMin,
            renewalFeeMax: req.renewalFeeMax,
            bondRequired: req.bondRequired,
            bondAmountMin: req.bondAmountMin,
            insuranceRequired: req.insuranceRequired,
            boardName: req.boardName,
            boardUrl: req.boardUrl,
            boardPhone: req.boardPhone,
            notes: req.notes,
          };
        } else {
          stateData[state] = {
            renewPeriodMonths: 0,
            ceHoursRequired: 0,
            renewalFeeMin: 0,
            renewalFeeMax: 0,
            bondRequired: false,
            bondAmountMin: 0,
            insuranceRequired: false,
            boardName: null,
            boardUrl: null,
            boardPhone: null,
            notes: null,
          };
        }
      }

      return {
        licenseType: lt,
        states: stateData,
      };
    });

    return NextResponse.json({
      states,
      licenseTypes: allLicenseTypes,
      comparison,
    });
  } catch (error) {
    console.error('State comparison API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
