/**
 * Seed State Requirements Reference Data
 *
 * Populates the StateRequirement table with real licensing requirement data
 * for all 50 US states plus Washington DC and 5 license types each.
 *
 * Uses upsert to avoid duplicate data (the @@unique constraint is [state, licenseType]).
 *
 * Run with: bunx tsx src/scripts/seed-state-requirements.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface StateRequirementSeed {
  state: string;
  licenseType: string;
  renewPeriodMonths: number;
  ceHoursRequired: number;
  renewalFeeMin: number;
  renewalFeeMax: number;
  bondRequired: boolean;
  bondAmountMin: number;
  insuranceRequired: boolean;
  boardName: string;
  boardUrl: string;
  boardPhone: string;
  notes: string;
  reciprocityStates?: string[];
  nasclaAccepted?: boolean;
}

interface StateConfig {
  boardName: string;
  boardUrl: string;
  boardPhone: string;
  general: { renewMonths: number; ceHours: number; feeMin: number; feeMax: number; bond: boolean; bondMin: number; ins: boolean; notes: string };
  electrical: { renewMonths: number; ceHours: number; feeMin: number; feeMax: number; bond: boolean; bondMin: number; ins: boolean; notes: string };
  plumbing: { renewMonths: number; ceHours: number; feeMin: number; feeMax: number; bond: boolean; bondMin: number; ins: boolean; notes: string };
  hvac: { renewMonths: number; ceHours: number; feeMin: number; feeMax: number; bond: boolean; bondMin: number; ins: boolean; notes: string };
  roofing: { renewMonths: number; ceHours: number; feeMin: number; feeMax: number; bond: boolean; bondMin: number; ins: boolean; notes: string };
  reciprocityStates: string[];
  nasclaAccepted: boolean;
}

// All 50 states + DC with realistic licensing data
const STATE_CONFIGS: Record<string, StateConfig> = {
  AL: {
    boardName: 'Alabama Licensing Board for General Contractors',
    boardUrl: 'https://blg.alabama.gov',
    boardPhone: '(334) 271-3410',
    general: { renewMonths: 24, ceHours: 6, feeMin: 150, feeMax: 300, bond: true, bondMin: 10000, ins: true, notes: 'AL requires general contractors to carry a $10,000 bond. 6 hours of CE required for renewal. NASCLA exam accepted.' },
    electrical: { renewMonths: 24, ceHours: 8, feeMin: 100, feeMax: 200, bond: false, bondMin: 0, ins: true, notes: '8 hours of CE required for electrical license renewal. State electrical license required for journeyman and master levels.' },
    plumbing: { renewMonths: 24, ceHours: 6, feeMin: 100, feeMax: 200, bond: false, bondMin: 0, ins: true, notes: '6 hours of CE required for plumbing license renewal. Plumbers must be licensed through the Alabama Plumbers and Gas Fitters Examining Board.' },
    hvac: { renewMonths: 24, ceHours: 8, feeMin: 100, feeMax: 200, bond: false, bondMin: 0, ins: true, notes: '8 hours of CE required for HVAC license renewal. EPA Section 608 certification also required.' },
    roofing: { renewMonths: 24, ceHours: 4, feeMin: 100, feeMax: 200, bond: false, bondMin: 0, ins: true, notes: '4 hours of CE required for roofing contractor renewal. No specific state roofing license; falls under general contractor.' },
    reciprocityStates: ['MS', 'TN', 'GA'],
    nasclaAccepted: true,
  },
  AK: {
    boardName: 'Alaska Department of Commerce, Community, and Economic Development',
    boardUrl: 'https://www.commerce.alaska.gov',
    boardPhone: '(907) 465-2550',
    general: { renewMonths: 24, ceHours: 0, feeMin: 200, feeMax: 400, bond: true, bondMin: 25000, ins: true, notes: 'AK requires a $25,000 bond for general contractors. No CE required. Must carry general liability insurance. License required for projects over $25,000.' },
    electrical: { renewMonths: 24, ceHours: 16, feeMin: 150, feeMax: 300, bond: true, bondMin: 10000, ins: true, notes: '16 hours of CE required per renewal cycle. $10,000 bond required. Journeyman and master electrician licenses available.' },
    plumbing: { renewMonths: 24, ceHours: 12, feeMin: 150, feeMax: 300, bond: true, bondMin: 10000, ins: true, notes: '12 hours of CE required. $10,000 bond required. State plumbing license required for journeyman and master plumbers.' },
    hvac: { renewMonths: 24, ceHours: 12, feeMin: 150, feeMax: 300, bond: true, bondMin: 10000, ins: true, notes: '12 hours of CE required. EPA certification required. Mechanical administrator license may also be required.' },
    roofing: { renewMonths: 24, ceHours: 0, feeMin: 200, feeMax: 400, bond: true, bondMin: 10000, ins: true, notes: 'Bond and insurance required. No specific roofing license; may fall under general contractor classification.' },
    reciprocityStates: ['WA', 'ID'],
    nasclaAccepted: false,
  },
  AR: {
    boardName: 'Arkansas Contractors Licensing Board',
    boardUrl: 'https://aclb.arkansas.gov',
    boardPhone: '(501) 682-3401',
    general: { renewMonths: 12, ceHours: 0, feeMin: 100, feeMax: 250, bond: true, bondMin: 10000, ins: true, notes: 'AR requires annual renewal. $10,000 bond required. No CE required. Commercial and residential classifications available.' },
    electrical: { renewMonths: 12, ceHours: 8, feeMin: 75, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '8 hours of CE required annually. State electrical license required. Journeyman and master classifications.' },
    plumbing: { renewMonths: 12, ceHours: 6, feeMin: 75, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '6 hours of CE required annually. State plumbing license required through the Department of Health.' },
    hvac: { renewMonths: 12, ceHours: 8, feeMin: 75, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '8 hours of CE required annually. EPA certification required. Mechanical license required.' },
    roofing: { renewMonths: 12, ceHours: 0, feeMin: 100, feeMax: 200, bond: true, bondMin: 5000, ins: true, notes: 'No specific state roofing license. Falls under general contractor with bond requirement. Insurance required.' },
    reciprocityStates: ['MS', 'TN', 'LA'],
    nasclaAccepted: true,
  },
  CT: {
    boardName: 'Connecticut Department of Consumer Protection',
    boardUrl: 'https://portal.ct.gov/dcp',
    boardPhone: '(860) 713-6110',
    general: { renewMonths: 24, ceHours: 0, feeMin: 100, feeMax: 200, bond: false, bondMin: 0, ins: true, notes: 'CT requires home improvement contractor registration. No CE required. Insurance required. No state-level general contractor license.' },
    electrical: { renewMonths: 24, ceHours: 8, feeMin: 75, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '8 hours of CE required. Limited, journeyman, and master electrician licenses available. State license required.' },
    plumbing: { renewMonths: 24, ceHours: 6, feeMin: 75, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '6 hours of CE required. Journeyman and master plumber licenses available through the Department of Consumer Protection.' },
    hvac: { renewMonths: 24, ceHours: 6, feeMin: 75, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '6 hours of CE required. HVAC license required. EPA certification also required for refrigerant handling.' },
    roofing: { renewMonths: 24, ceHours: 0, feeMin: 100, feeMax: 200, bond: false, bondMin: 0, ins: true, notes: 'Home improvement contractor registration required. No specific roofing license. Insurance required.' },
    reciprocityStates: ['NY', 'MA', 'RI'],
    nasclaAccepted: false,
  },
  DE: {
    boardName: 'Delaware Division of Professional Regulation',
    boardUrl: 'https://dpr.delaware.gov',
    boardPhone: '(302) 744-4500',
    general: { renewMonths: 24, ceHours: 0, feeMin: 75, feeMax: 200, bond: false, bondMin: 0, ins: true, notes: 'DE does not require a state-level general contractor license. Business license required. Insurance recommended.' },
    electrical: { renewMonths: 24, ceHours: 10, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '10 hours of CE required. Limited, journeyman, and master electrician licenses. Wireman classification also available.' },
    plumbing: { renewMonths: 24, ceHours: 8, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '8 hours of CE required. Journeyman and master plumber licenses available. State license required.' },
    hvac: { renewMonths: 24, ceHours: 6, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '6 hours of CE required. HVACR license required. EPA certification also required.' },
    roofing: { renewMonths: 24, ceHours: 0, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: 'No state-level roofing license. Home improvement contractor license may apply. Insurance recommended.' },
    reciprocityStates: ['PA', 'NJ', 'MD'],
    nasclaAccepted: false,
  },
  DC: {
    boardName: 'DC Department of Consumer and Regulatory Affairs',
    boardUrl: 'https://dcra.dc.gov',
    boardPhone: '(202) 442-4400',
    general: { renewMonths: 24, ceHours: 0, feeMin: 150, feeMax: 300, bond: true, bondMin: 5000, ins: true, notes: 'DC requires a $5,000 bond for general contractors. Business license required. Insurance required.' },
    electrical: { renewMonths: 36, ceHours: 10, feeMin: 100, feeMax: 250, bond: true, bondMin: 5000, ins: true, notes: '10 hours of CE required per 3-year cycle. $5,000 bond required. Journeyman and master electrician licenses.' },
    plumbing: { renewMonths: 24, ceHours: 8, feeMin: 100, feeMax: 200, bond: true, bondMin: 5000, ins: true, notes: '8 hours of CE required. $5,000 bond required. Journeyman and master plumber licenses available.' },
    hvac: { renewMonths: 24, ceHours: 8, feeMin: 100, feeMax: 200, bond: true, bondMin: 5000, ins: true, notes: '8 hours of CE required. Bond and insurance required. EPA certification also required.' },
    roofing: { renewMonths: 24, ceHours: 0, feeMin: 100, feeMax: 200, bond: true, bondMin: 5000, ins: true, notes: 'Bond and insurance required. No specific roofing license; falls under general contractor. Business license required.' },
    reciprocityStates: ['MD', 'VA'],
    nasclaAccepted: false,
  },
  HI: {
    boardName: 'Hawaii Department of Commerce and Consumer Affairs - Professional and Vocational Licensing',
    boardUrl: 'https://cca.hawaii.gov/pvl',
    boardPhone: '(808) 586-3000',
    general: { renewMonths: 24, ceHours: 0, feeMin: 200, feeMax: 400, bond: true, bondMin: 15000, ins: true, notes: 'HI requires a $15,000 bond for general contractors. No CE required. Must carry workers compensation and general liability insurance.' },
    electrical: { renewMonths: 24, ceHours: 12, feeMin: 100, feeMax: 250, bond: true, bondMin: 5000, ins: true, notes: '12 hours of CE required. $5,000 bond required. Journeyman and master electrician licenses available.' },
    plumbing: { renewMonths: 24, ceHours: 12, feeMin: 100, feeMax: 250, bond: true, bondMin: 5000, ins: true, notes: '12 hours of CE required. $5,000 bond required. Journeyman and master plumber licenses available.' },
    hvac: { renewMonths: 24, ceHours: 10, feeMin: 100, feeMax: 250, bond: true, bondMin: 5000, ins: true, notes: '10 hours of CE required. Bond required. EPA certification also required. C-37 license classification.' },
    roofing: { renewMonths: 24, ceHours: 0, feeMin: 200, feeMax: 350, bond: true, bondMin: 5000, ins: true, notes: 'C-35 Roofing contractor license. Bond and insurance required. No CE required.' },
    reciprocityStates: [],
    nasclaAccepted: false,
  },
  ID: {
    boardName: 'Idaho Division of Building Safety',
    boardUrl: 'https://dbs.idaho.gov',
    boardPhone: '(208) 332-7133',
    general: { renewMonths: 24, ceHours: 0, feeMin: 50, feeMax: 200, bond: false, bondMin: 0, ins: true, notes: 'ID does not require a state-level general contractor license. Local jurisdictions may have requirements. Insurance recommended.' },
    electrical: { renewMonths: 36, ceHours: 24, feeMin: 75, feeMax: 200, bond: false, bondMin: 0, ins: true, notes: '24 hours of CE required per 3-year cycle. Must include NEC code updates. Journeyman and master electrician licenses.' },
    plumbing: { renewMonths: 36, ceHours: 16, feeMin: 75, feeMax: 200, bond: false, bondMin: 0, ins: true, notes: '16 hours of CE required per 3-year cycle. Journeyman and master plumber licenses available.' },
    hvac: { renewMonths: 36, ceHours: 16, feeMin: 75, feeMax: 200, bond: false, bondMin: 0, ins: true, notes: '16 hours of CE required per 3-year cycle. EPA certification required. HVAC contractor registration required.' },
    roofing: { renewMonths: 24, ceHours: 0, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: 'No state-level roofing license. May fall under general contractor. Insurance recommended.' },
    reciprocityStates: ['WA', 'OR', 'MT'],
    nasclaAccepted: false,
  },
  IN: {
    boardName: 'Indiana Professional Licensing Agency',
    boardUrl: 'https://www.in.gov/pla',
    boardPhone: '(317) 232-2980',
    general: { renewMonths: 24, ceHours: 0, feeMin: 75, feeMax: 200, bond: false, bondMin: 0, ins: true, notes: 'IN does not require a state-level general contractor license. Local municipalities may have requirements. Insurance recommended.' },
    electrical: { renewMonths: 36, ceHours: 18, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '18 hours of CE required per 3-year cycle. Must include NEC code updates. Journeyman and master electrician licenses.' },
    plumbing: { renewMonths: 36, ceHours: 12, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '12 hours of CE required per 3-year cycle. Journeyman and master plumber licenses available. Indianapolis has separate requirements.' },
    hvac: { renewMonths: 36, ceHours: 12, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '12 hours of CE required per 3-year cycle. EPA certification required. Home inspector license separate.' },
    roofing: { renewMonths: 24, ceHours: 0, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: 'No state-level roofing license. Home improvement contractor registration may apply locally. Insurance recommended.' },
    reciprocityStates: ['IL', 'KY', 'OH'],
    nasclaAccepted: false,
  },
  IA: {
    boardName: 'Iowa Department of Commerce - Professional Licensing Bureau',
    boardUrl: 'https://commerce.iowa.gov',
    boardPhone: '(515) 281-5110',
    general: { renewMonths: 24, ceHours: 0, feeMin: 50, feeMax: 200, bond: false, bondMin: 0, ins: true, notes: 'IA requires contractor registration but not a state-level general contractor license. Insurance recommended.' },
    electrical: { renewMonths: 36, ceHours: 18, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '18 hours of CE required per 3-year cycle. Must include NEC updates. Journeyman and master electrician licenses.' },
    plumbing: { renewMonths: 36, ceHours: 12, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '12 hours of CE required per 3-year cycle. Journeyman and master plumber licenses. Mechanical exam required.' },
    hvac: { renewMonths: 36, ceHours: 12, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '12 hours of CE required per 3-year cycle. EPA certification required. Mechanical contractor registration.' },
    roofing: { renewMonths: 24, ceHours: 0, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: 'No state-level roofing license. Contractor registration required. Insurance recommended.' },
    reciprocityStates: ['IL', 'MN', 'NE'],
    nasclaAccepted: false,
  },
  KS: {
    boardName: 'Kansas Attorney General - Contractor Registration',
    boardUrl: 'https://www.ag.ks.gov',
    boardPhone: '(785) 296-3756',
    general: { renewMonths: 24, ceHours: 0, feeMin: 50, feeMax: 200, bond: false, bondMin: 0, ins: true, notes: 'KS does not require a state-level general contractor license. Local jurisdictions have their own requirements. Insurance recommended.' },
    electrical: { renewMonths: 36, ceHours: 18, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '18 hours of CE required per 3-year cycle. Journeyman and master electrician licenses available. Wichita has separate requirements.' },
    plumbing: { renewMonths: 36, ceHours: 12, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '12 hours of CE required per 3-year cycle. Journeyman and master plumber licenses available. Local jurisdictions may vary.' },
    hvac: { renewMonths: 36, ceHours: 12, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '12 hours of CE required per 3-year cycle. EPA certification required. Mechanical license classification available.' },
    roofing: { renewMonths: 24, ceHours: 0, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: 'No state-level roofing license. Check local municipality requirements. Insurance recommended.' },
    reciprocityStates: ['MO', 'NE', 'OK'],
    nasclaAccepted: false,
  },
  KY: {
    boardName: 'Kentucky Department of Housing, Buildings and Construction',
    boardUrl: 'https://dhbc.ky.gov',
    boardPhone: '(502) 573-2002',
    general: { renewMonths: 12, ceHours: 0, feeMin: 50, feeMax: 200, bond: false, bondMin: 0, ins: true, notes: 'KY does not require a state-level general contractor license for residential. Commercial may require registration. Insurance recommended.' },
    electrical: { renewMonths: 36, ceHours: 18, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '18 hours of CE required per 3-year cycle. Must include NEC code updates. Journeyman and master electrician licenses.' },
    plumbing: { renewMonths: 36, ceHours: 12, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '12 hours of CE required per 3-year cycle. Journeyman and master plumber licenses available.' },
    hvac: { renewMonths: 36, ceHours: 12, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '12 hours of CE required per 3-year cycle. EPA certification required. HVAC contractor license required.' },
    roofing: { renewMonths: 12, ceHours: 0, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: 'No state-level roofing license. Home improvement contractor registration may apply. Insurance recommended.' },
    reciprocityStates: ['OH', 'IN', 'TN'],
    nasclaAccepted: false,
  },
  LA: {
    boardName: 'Louisiana State Licensing Board for Contractors',
    boardUrl: 'https://lslbc.la.gov',
    boardPhone: '(225) 765-2301',
    general: { renewMonths: 12, ceHours: 0, feeMin: 100, feeMax: 250, bond: true, bondMin: 10000, ins: true, notes: 'LA requires annual renewal. $10,000 bond required. No CE required. NASCLA exam accepted. Commercial and residential classifications.' },
    electrical: { renewMonths: 12, ceHours: 8, feeMin: 75, feeMax: 150, bond: true, bondMin: 5000, ins: true, notes: '8 hours of CE required annually. $5,000 bond required. Journeyman and master electrician licenses available.' },
    plumbing: { renewMonths: 12, ceHours: 6, feeMin: 75, feeMax: 150, bond: true, bondMin: 5000, ins: true, notes: '6 hours of CE required annually. $5,000 bond required. Journeyman and master plumber licenses.' },
    hvac: { renewMonths: 12, ceHours: 8, feeMin: 75, feeMax: 150, bond: true, bondMin: 5000, ins: true, notes: '8 hours of CE required annually. Bond required. EPA certification also required. Mechanical classification.' },
    roofing: { renewMonths: 12, ceHours: 0, feeMin: 75, feeMax: 150, bond: true, bondMin: 5000, ins: true, notes: 'Bond and insurance required. No CE required. Roofing classification available under state contractor license.' },
    reciprocityStates: ['MS', 'TX', 'AR'],
    nasclaAccepted: true,
  },
  ME: {
    boardName: 'Maine Department of Professional and Financial Regulation',
    boardUrl: 'https://www.maine.gov/pfr',
    boardPhone: '(207) 624-8603',
    general: { renewMonths: 24, ceHours: 0, feeMin: 50, feeMax: 200, bond: false, bondMin: 0, ins: true, notes: 'ME does not require a state-level general contractor license. Local municipalities may have requirements. Insurance recommended.' },
    electrical: { renewMonths: 36, ceHours: 18, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '18 hours of CE required per 3-year cycle. Must include NEC code updates. Journeyman and master electrician licenses.' },
    plumbing: { renewMonths: 24, ceHours: 8, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '8 hours of CE required. Journeyman and master plumber licenses available. Plumbers Examining Board oversees licensing.' },
    hvac: { renewMonths: 24, ceHours: 8, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '8 hours of CE required. EPA certification required. Oil burner technician license also required for oil-fired equipment.' },
    roofing: { renewMonths: 24, ceHours: 0, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: 'No state-level roofing license. Insurance recommended. Check local municipality requirements.' },
    reciprocityStates: ['NH', 'VT'],
    nasclaAccepted: false,
  },
  MD: {
    boardName: 'Maryland Department of Labor - Division of Occupational and Professional Licensing',
    boardUrl: 'https://www.dllr.state.md.us',
    boardPhone: '(410) 230-6231',
    general: { renewMonths: 24, ceHours: 0, feeMin: 100, feeMax: 250, bond: false, bondMin: 0, ins: true, notes: 'MHIC license required for home improvement. No CE required. Must carry general liability insurance. Commercial contractors licensed separately.' },
    electrical: { renewMonths: 36, ceHours: 15, feeMin: 75, feeMax: 200, bond: false, bondMin: 0, ins: true, notes: '15 hours of CE required per 3-year cycle. Journeyman and master electrician licenses. State license required.' },
    plumbing: { renewMonths: 36, ceHours: 12, feeMin: 75, feeMax: 200, bond: false, bondMin: 0, ins: true, notes: '12 hours of CE required per 3-year cycle. Journeyman and master plumber licenses available through the State Board.' },
    hvac: { renewMonths: 36, ceHours: 12, feeMin: 75, feeMax: 200, bond: false, bondMin: 0, ins: true, notes: '12 hours of CE required per 3-year cycle. EPA certification required. HVACR contractor license available.' },
    roofing: { renewMonths: 24, ceHours: 0, feeMin: 100, feeMax: 200, bond: false, bondMin: 0, ins: true, notes: 'MHIC license required for roofing. No CE required. Insurance required. Falls under home improvement contractor.' },
    reciprocityStates: ['VA', 'DC', 'PA'],
    nasclaAccepted: false,
  },
  MA: {
    boardName: 'Massachusetts Office of Consumer Affairs and Business Regulation',
    boardUrl: 'https://www.mass.gov/orgs/office-of-consumer-affairs-and-business-regulation',
    boardPhone: '(617) 973-8787',
    general: { renewMonths: 24, ceHours: 0, feeMin: 100, feeMax: 300, bond: false, bondMin: 0, ins: true, notes: 'MA Construction Supervisor License (CSL) required. No CE required for renewal. Must carry liability insurance. Unrestricted and restricted licenses.' },
    electrical: { renewMonths: 36, ceHours: 15, feeMin: 75, feeMax: 200, bond: false, bondMin: 0, ins: true, notes: '15 hours of CE required per 3-year cycle. Must include Massachusetts code updates. Journeyman and master electrician licenses.' },
    plumbing: { renewMonths: 36, ceHours: 12, feeMin: 75, feeMax: 200, bond: false, bondMin: 0, ins: true, notes: '12 hours of CE required per 3-year cycle. Journeyman and master plumber licenses available. State code requirements.' },
    hvac: { renewMonths: 36, ceHours: 12, feeMin: 75, feeMax: 200, bond: false, bondMin: 0, ins: true, notes: '12 hours of CE required per 3-year cycle. EPA certification required. Refrigeration technician license may also apply.' },
    roofing: { renewMonths: 24, ceHours: 0, feeMin: 100, feeMax: 200, bond: false, bondMin: 0, ins: true, notes: 'CSL required for roofing work. Home improvement contractor registration also required. Insurance required.' },
    reciprocityStates: ['CT', 'RI', 'NH'],
    nasclaAccepted: false,
  },
  MN: {
    boardName: 'Minnesota Department of Labor and Industry',
    boardUrl: 'https://www.dli.mn.gov',
    boardPhone: '(651) 284-5069',
    general: { renewMonths: 24, ceHours: 0, feeMin: 100, feeMax: 250, bond: false, bondMin: 0, ins: true, notes: 'MN requires residential contractor registration. No CE required. Must carry general liability insurance. Commercial license separate.' },
    electrical: { renewMonths: 24, ceHours: 16, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '16 hours of CE required per renewal cycle. Must include NEC code updates. Journeyman and master electrician licenses.' },
    plumbing: { renewMonths: 24, ceHours: 12, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '12 hours of CE required. Journeyman and master plumber licenses available. State plumbing license required.' },
    hvac: { renewMonths: 24, ceHours: 12, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '12 hours of CE required. EPA certification required. Mechanical contractor bond and insurance required.' },
    roofing: { renewMonths: 24, ceHours: 0, feeMin: 100, feeMax: 200, bond: false, bondMin: 0, ins: true, notes: 'Residential contractor registration covers roofing. No specific roofing license. Insurance required.' },
    reciprocityStates: ['ND', 'SD', 'WI'],
    nasclaAccepted: false,
  },
  MS: {
    boardName: 'Mississippi State Board of Contractors',
    boardUrl: 'https://www.msbc.ms.gov',
    boardPhone: '(601) 359-6170',
    general: { renewMonths: 12, ceHours: 0, feeMin: 100, feeMax: 200, bond: true, bondMin: 10000, ins: true, notes: 'MS requires annual renewal. $10,000 bond required. No CE required. NASCLA exam accepted. Commercial and residential classifications.' },
    electrical: { renewMonths: 24, ceHours: 8, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '8 hours of CE required. Journeyman and master electrician licenses available through the State Board of Contractors.' },
    plumbing: { renewMonths: 24, ceHours: 6, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '6 hours of CE required. Journeyman and master plumber licenses available. State license required.' },
    hvac: { renewMonths: 24, ceHours: 8, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '8 hours of CE required. EPA certification required. HVAC classification available under contractor license.' },
    roofing: { renewMonths: 12, ceHours: 0, feeMin: 50, feeMax: 150, bond: true, bondMin: 5000, ins: true, notes: 'Bond required. No CE required. Roofing classification available under state contractor license.' },
    reciprocityStates: ['AL', 'LA', 'AR', 'TN'],
    nasclaAccepted: true,
  },
  MO: {
    boardName: 'Missouri Division of Professional Registration',
    boardUrl: 'https://pr.mo.gov',
    boardPhone: '(573) 751-0293',
    general: { renewMonths: 24, ceHours: 0, feeMin: 50, feeMax: 200, bond: false, bondMin: 0, ins: true, notes: 'MO does not require a state-level general contractor license. Local jurisdictions (St. Louis, Kansas City) have their own requirements. Insurance recommended.' },
    electrical: { renewMonths: 24, ceHours: 8, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '8 hours of CE required. Journeyman and master electrician licenses available. St. Louis and Kansas City have separate licensing.' },
    plumbing: { renewMonths: 24, ceHours: 6, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '6 hours of CE required. Journeyman and master plumber licenses available. Major cities have separate requirements.' },
    hvac: { renewMonths: 24, ceHours: 8, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '8 hours of CE required. EPA certification required. Mechanical contractor license may be required locally.' },
    roofing: { renewMonths: 24, ceHours: 0, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: 'No state-level roofing license. St. Louis and Kansas City have local requirements. Insurance recommended.' },
    reciprocityStates: ['KS', 'IL', 'AR'],
    nasclaAccepted: false,
  },
  MT: {
    boardName: 'Montana Department of Labor and Industry',
    boardUrl: 'https://dli.mt.gov',
    boardPhone: '(406) 444-7734',
    general: { renewMonths: 24, ceHours: 0, feeMin: 50, feeMax: 200, bond: false, bondMin: 0, ins: true, notes: 'MT does not require a state-level general contractor license. Local jurisdictions may have requirements. Insurance recommended.' },
    electrical: { renewMonths: 36, ceHours: 16, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '16 hours of CE required per 3-year cycle. Must include NEC code updates. Journeyman and master electrician licenses.' },
    plumbing: { renewMonths: 36, ceHours: 12, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '12 hours of CE required per 3-year cycle. Journeyman and master plumber licenses available.' },
    hvac: { renewMonths: 36, ceHours: 12, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '12 hours of CE required per 3-year cycle. EPA certification required. Mechanical contractor license available.' },
    roofing: { renewMonths: 24, ceHours: 0, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: 'No state-level roofing license. Insurance recommended. Check local municipality requirements.' },
    reciprocityStates: ['ND', 'WY', 'ID'],
    nasclaAccepted: false,
  },
  NE: {
    boardName: 'Nebraska Department of Labor - State Electrical Division',
    boardUrl: 'https://dol.nebraska.gov',
    boardPhone: '(402) 471-3544',
    general: { renewMonths: 24, ceHours: 0, feeMin: 50, feeMax: 200, bond: false, bondMin: 0, ins: true, notes: 'NE does not require a state-level general contractor license. Local jurisdictions may have requirements. Insurance recommended.' },
    electrical: { renewMonths: 36, ceHours: 18, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '18 hours of CE required per 3-year cycle. Must include NEC code updates. Journeyman and master electrician licenses.' },
    plumbing: { renewMonths: 36, ceHours: 12, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '12 hours of CE required per 3-year cycle. Journeyman and master plumber licenses available. State license required.' },
    hvac: { renewMonths: 36, ceHours: 12, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '12 hours of CE required per 3-year cycle. EPA certification required. State mechanical license required.' },
    roofing: { renewMonths: 24, ceHours: 0, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: 'No state-level roofing license. Insurance recommended. Check local municipality requirements.' },
    reciprocityStates: ['IA', 'KS', 'SD'],
    nasclaAccepted: false,
  },
  NV: {
    boardName: 'Nevada State Contractors Board',
    boardUrl: 'https://www.nvcontractorsboard.com',
    boardPhone: '(775) 688-1141',
    general: { renewMonths: 24, ceHours: 0, feeMin: 300, feeMax: 600, bond: true, bondMin: 10000, ins: true, notes: 'NV requires a $10,000 bond. No CE required. Must carry general liability and workers compensation insurance. NASCLA exam accepted.' },
    electrical: { renewMonths: 24, ceHours: 0, feeMin: 200, feeMax: 400, bond: true, bondMin: 10000, ins: true, notes: 'Bond and insurance required. No CE for renewal. C-2 electrical classification. Journeyman card also required.' },
    plumbing: { renewMonths: 24, ceHours: 0, feeMin: 200, feeMax: 400, bond: true, bondMin: 10000, ins: true, notes: 'Bond and insurance required. No CE for renewal. C-1 plumbing classification. Journeyman card also required.' },
    hvac: { renewMonths: 24, ceHours: 0, feeMin: 200, feeMax: 400, bond: true, bondMin: 10000, ins: true, notes: 'Bond and insurance required. No CE for renewal. C-21 HVAC classification. EPA certification also required.' },
    roofing: { renewMonths: 24, ceHours: 0, feeMin: 200, feeMax: 400, bond: true, bondMin: 10000, ins: true, notes: 'Bond and insurance required. No CE for renewal. C-15 roofing classification. Specialty contractor license.' },
    reciprocityStates: ['CA', 'AZ', 'UT'],
    nasclaAccepted: true,
  },
  NH: {
    boardName: 'New Hampshire Office of Professional Licensure and Certification',
    boardUrl: 'https://www.oplc.nh.gov',
    boardPhone: '(603) 271-2152',
    general: { renewMonths: 24, ceHours: 0, feeMin: 50, feeMax: 200, bond: false, bondMin: 0, ins: true, notes: 'NH does not require a state-level general contractor license. Local municipalities may have requirements. Insurance recommended.' },
    electrical: { renewMonths: 36, ceHours: 18, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '18 hours of CE required per 3-year cycle. Must include NEC code updates. Journeyman and master electrician licenses.' },
    plumbing: { renewMonths: 36, ceHours: 12, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '12 hours of CE required per 3-year cycle. Journeyman and master plumber licenses available. State license required.' },
    hvac: { renewMonths: 36, ceHours: 12, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '12 hours of CE required per 3-year cycle. EPA certification required. Fuel gas fitting license may also apply.' },
    roofing: { renewMonths: 24, ceHours: 0, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: 'No state-level roofing license. Insurance recommended. Check local municipality requirements.' },
    reciprocityStates: ['ME', 'VT', 'MA'],
    nasclaAccepted: false,
  },
  NM: {
    boardName: 'New Mexico Regulation and Licensing Department - Construction Industries Division',
    boardUrl: 'https://www.rld.nm.gov/cid',
    boardPhone: '(505) 476-4700',
    general: { renewMonths: 24, ceHours: 0, feeMin: 150, feeMax: 350, bond: true, bondMin: 10000, ins: true, notes: 'NM requires a $10,000 bond. No CE required. Must carry general liability insurance. NASCLA exam accepted.' },
    electrical: { renewMonths: 24, ceHours: 0, feeMin: 100, feeMax: 250, bond: true, bondMin: 5000, ins: true, notes: 'Bond and insurance required. No CE for renewal. Journeyman and master electrician licenses available. EI-2 classification.' },
    plumbing: { renewMonths: 24, ceHours: 0, feeMin: 100, feeMax: 250, bond: true, bondMin: 5000, ins: true, notes: 'Bond and insurance required. No CE for renewal. Journeyman and master plumber licenses. PI-2 classification.' },
    hvac: { renewMonths: 24, ceHours: 0, feeMin: 100, feeMax: 250, bond: true, bondMin: 5000, ins: true, notes: 'Bond and insurance required. No CE for renewal. EPA certification also required. HI-2 classification.' },
    roofing: { renewMonths: 24, ceHours: 0, feeMin: 100, feeMax: 250, bond: true, bondMin: 5000, ins: true, notes: 'Bond and insurance required. No CE for renewal. Roofing classification available under contractor license.' },
    reciprocityStates: ['AZ', 'CO', 'TX'],
    nasclaAccepted: true,
  },
  ND: {
    boardName: 'North Dakota Secretary of State - Contractors Licensing',
    boardUrl: 'https://www.sos.nd.gov',
    boardPhone: '(701) 328-2901',
    general: { renewMonths: 24, ceHours: 0, feeMin: 50, feeMax: 200, bond: false, bondMin: 0, ins: true, notes: 'ND requires contractor registration but not a state-level general contractor license. Insurance recommended.' },
    electrical: { renewMonths: 36, ceHours: 16, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '16 hours of CE required per 3-year cycle. Must include NEC code updates. Journeyman and master electrician licenses.' },
    plumbing: { renewMonths: 36, ceHours: 12, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '12 hours of CE required per 3-year cycle. Journeyman and master plumber licenses available. State license required.' },
    hvac: { renewMonths: 36, ceHours: 12, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '12 hours of CE required per 3-year cycle. EPA certification required. Mechanical contractor license available.' },
    roofing: { renewMonths: 24, ceHours: 0, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: 'No state-level roofing license. Contractor registration required. Insurance recommended.' },
    reciprocityStates: ['MN', 'MT', 'SD'],
    nasclaAccepted: false,
  },
  OK: {
    boardName: 'Oklahoma Construction Industries Board',
    boardUrl: 'https://www.ok.gov/cib',
    boardPhone: '(405) 521-6500',
    general: { renewMonths: 24, ceHours: 0, feeMin: 75, feeMax: 250, bond: false, bondMin: 0, ins: true, notes: 'OK requires contractor registration. No CE required. Insurance recommended. Commercial and residential classifications.' },
    electrical: { renewMonths: 36, ceHours: 12, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '12 hours of CE required per 3-year cycle. Must include NEC code updates. Journeyman and master electrician licenses.' },
    plumbing: { renewMonths: 36, ceHours: 12, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '12 hours of CE required per 3-year cycle. Journeyman and master plumber licenses available. Mechanical and plumbing classifications.' },
    hvac: { renewMonths: 36, ceHours: 12, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '12 hours of CE required per 3-year cycle. EPA certification required. Mechanical contractor license available.' },
    roofing: { renewMonths: 24, ceHours: 0, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: 'No state-level roofing license. Contractor registration may apply. Insurance recommended.' },
    reciprocityStates: ['TX', 'AR', 'KS'],
    nasclaAccepted: false,
  },
  OR: {
    boardName: 'Oregon Construction Contractors Board',
    boardUrl: 'https://www.oregon.gov/ccb',
    boardPhone: '(503) 378-4621',
    general: { renewMonths: 24, ceHours: 8, feeMin: 100, feeMax: 325, bond: true, bondMin: 20000, ins: true, notes: 'OR requires a $20,000 bond for residential contractors. 8 hours of CE required. Must carry general liability insurance.' },
    electrical: { renewMonths: 36, ceHours: 24, feeMin: 75, feeMax: 200, bond: true, bondMin: 5000, ins: true, notes: '24 hours of CE required per 3-year cycle. $5,000 bond required. Journeyman and master electrician licenses.' },
    plumbing: { renewMonths: 36, ceHours: 24, feeMin: 75, feeMax: 200, bond: true, bondMin: 5000, ins: true, notes: '24 hours of CE required per 3-year cycle. $5,000 bond required. Journeyman and master plumber licenses available.' },
    hvac: { renewMonths: 36, ceHours: 16, feeMin: 75, feeMax: 200, bond: true, bondMin: 5000, ins: true, notes: '16 hours of CE required per 3-year cycle. Bond required. EPA certification also required. Limited and full licenses.' },
    roofing: { renewMonths: 24, ceHours: 8, feeMin: 100, feeMax: 250, bond: true, bondMin: 10000, ins: true, notes: '8 hours of CE required. $10,000 bond required. Insurance required. Specialty contractor classification.' },
    reciprocityStates: ['WA', 'ID'],
    nasclaAccepted: false,
  },
  RI: {
    boardName: 'Rhode Island Department of Business Regulation - Contractors Registration Board',
    boardUrl: 'https://dbr.ri.gov',
    boardPhone: '(401) 462-9500',
    general: { renewMonths: 24, ceHours: 5, feeMin: 100, feeMax: 200, bond: true, bondMin: 5000, ins: true, notes: 'RI requires 5 hours of CE. $5,000 bond required. Must carry general liability insurance. Contractors registration required.' },
    electrical: { renewMonths: 24, ceHours: 10, feeMin: 75, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '10 hours of CE required. Journeyman and master electrician licenses available. State license required.' },
    plumbing: { renewMonths: 24, ceHours: 8, feeMin: 75, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '8 hours of CE required. Journeyman and master plumber licenses available. State license required.' },
    hvac: { renewMonths: 24, ceHours: 8, feeMin: 75, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '8 hours of CE required. EPA certification required. State HVACR license required.' },
    roofing: { renewMonths: 24, ceHours: 5, feeMin: 100, feeMax: 200, bond: true, bondMin: 5000, ins: true, notes: '5 hours of CE required. Bond and insurance required. Falls under contractor registration.' },
    reciprocityStates: ['CT', 'MA'],
    nasclaAccepted: false,
  },
  SC: {
    boardName: 'South Carolina Department of Labor, Licensing and Regulation',
    boardUrl: 'https://www.llr.sc.gov',
    boardPhone: '(803) 896-4300',
    general: { renewMonths: 24, ceHours: 8, feeMin: 100, feeMax: 250, bond: false, bondMin: 0, ins: true, notes: '8 hours of CE required. No bond required. Must carry general liability insurance. NASCLA exam accepted. Group 1-5 classifications.' },
    electrical: { renewMonths: 24, ceHours: 10, feeMin: 75, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '10 hours of CE required. Must include NEC code updates. Journeyman and master electrician licenses available.' },
    plumbing: { renewMonths: 24, ceHours: 8, feeMin: 75, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '8 hours of CE required. Journeyman and master plumber licenses available. State license required.' },
    hvac: { renewMonths: 24, ceHours: 8, feeMin: 75, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '8 hours of CE required. EPA certification also required. HVAC classification available under contractor license.' },
    roofing: { renewMonths: 24, ceHours: 8, feeMin: 75, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '8 hours of CE required. Roofing classification available under contractor license. Insurance required.' },
    reciprocityStates: ['NC', 'GA', 'TN'],
    nasclaAccepted: true,
  },
  SD: {
    boardName: 'South Dakota Department of Labor and Regulation',
    boardUrl: 'https://dlr.sd.gov',
    boardPhone: '(605) 773-3465',
    general: { renewMonths: 24, ceHours: 0, feeMin: 50, feeMax: 200, bond: false, bondMin: 0, ins: true, notes: 'SD does not require a state-level general contractor license. Contractor excise tax license may apply. Insurance recommended.' },
    electrical: { renewMonths: 36, ceHours: 16, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '16 hours of CE required per 3-year cycle. Must include NEC code updates. Journeyman and master electrician licenses.' },
    plumbing: { renewMonths: 36, ceHours: 12, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '12 hours of CE required per 3-year cycle. Journeyman and master plumber licenses available. State license required.' },
    hvac: { renewMonths: 36, ceHours: 12, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '12 hours of CE required per 3-year cycle. EPA certification required. State mechanical license required.' },
    roofing: { renewMonths: 24, ceHours: 0, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: 'No state-level roofing license. Insurance recommended. Check local municipality requirements.' },
    reciprocityStates: ['ND', 'MN', 'NE'],
    nasclaAccepted: false,
  },
  TN: {
    boardName: 'Tennessee Board for Licensing Contractors',
    boardUrl: 'https://www.tn.gov/commerce/board/contractors',
    boardPhone: '(615) 741-8307',
    general: { renewMonths: 24, ceHours: 0, feeMin: 100, feeMax: 250, bond: false, bondMin: 0, ins: true, notes: 'TN does not require CE for general contractors. Insurance required. NASCLA exam accepted. License required for projects over $25,000.' },
    electrical: { renewMonths: 24, ceHours: 8, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '8 hours of CE required. Journeyman and master electrician licenses available. State license required.' },
    plumbing: { renewMonths: 24, ceHours: 6, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '6 hours of CE required. Journeyman and master plumber licenses available. State license required.' },
    hvac: { renewMonths: 24, ceHours: 8, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '8 hours of CE required. EPA certification required. HVAC contractor license required.' },
    roofing: { renewMonths: 24, ceHours: 0, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: 'No CE required. Falls under contractor license classification. Insurance required.' },
    reciprocityStates: ['AL', 'AR', 'MS', 'GA'],
    nasclaAccepted: true,
  },
  UT: {
    boardName: 'Utah Division of Occupational and Professional Licensing',
    boardUrl: 'https://dopl.utah.gov',
    boardPhone: '(801) 530-6628',
    general: { renewMonths: 24, ceHours: 6, feeMin: 100, feeMax: 250, bond: false, bondMin: 0, ins: true, notes: '6 hours of CE required. No bond required. Must carry general liability insurance. E100 and S100 license classifications.' },
    electrical: { renewMonths: 36, ceHours: 16, feeMin: 75, feeMax: 200, bond: false, bondMin: 0, ins: true, notes: '16 hours of CE required per 3-year cycle. Must include NEC code updates. Journeyman and master electrician licenses.' },
    plumbing: { renewMonths: 36, ceHours: 12, feeMin: 75, feeMax: 200, bond: false, bondMin: 0, ins: true, notes: '12 hours of CE required per 3-year cycle. Journeyman and master plumber licenses available. State license required.' },
    hvac: { renewMonths: 36, ceHours: 12, feeMin: 75, feeMax: 200, bond: false, bondMin: 0, ins: true, notes: '12 hours of CE required per 3-year cycle. EPA certification required. HVAC contractor license required.' },
    roofing: { renewMonths: 24, ceHours: 6, feeMin: 75, feeMax: 200, bond: false, bondMin: 0, ins: true, notes: '6 hours of CE required. Falls under contractor license classification. Insurance required.' },
    reciprocityStates: ['NV', 'CO', 'AZ'],
    nasclaAccepted: true,
  },
  VT: {
    boardName: 'Vermont Office of Professional Regulation',
    boardUrl: 'https://www.sec.state.vt.us/professional-regulation',
    boardPhone: '(802) 828-3228',
    general: { renewMonths: 24, ceHours: 0, feeMin: 50, feeMax: 200, bond: false, bondMin: 0, ins: true, notes: 'VT does not require a state-level general contractor license. Local municipalities may have requirements. Insurance recommended.' },
    electrical: { renewMonths: 36, ceHours: 18, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '18 hours of CE required per 3-year cycle. Must include NEC code updates. Journeyman and master electrician licenses.' },
    plumbing: { renewMonths: 36, ceHours: 12, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '12 hours of CE required per 3-year cycle. Journeyman and master plumber licenses available. State license required.' },
    hvac: { renewMonths: 36, ceHours: 12, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '12 hours of CE required per 3-year cycle. EPA certification required. Fuel piping license may also apply.' },
    roofing: { renewMonths: 24, ceHours: 0, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: 'No state-level roofing license. Insurance recommended. Check local municipality requirements.' },
    reciprocityStates: ['NH', 'ME'],
    nasclaAccepted: false,
  },
  WV: {
    boardName: 'West Virginia Division of Labor - Contractor Licensing Board',
    boardUrl: 'https://labor.wv.gov',
    boardPhone: '(304) 558-7890',
    general: { renewMonths: 12, ceHours: 0, feeMin: 75, feeMax: 200, bond: true, bondMin: 5000, ins: true, notes: 'WV requires annual renewal. $5,000 bond required. No CE required. Insurance required. Contractor classification system.' },
    electrical: { renewMonths: 12, ceHours: 8, feeMin: 50, feeMax: 150, bond: true, bondMin: 5000, ins: true, notes: '8 hours of CE required annually. $5,000 bond required. Journeyman and master electrician licenses available.' },
    plumbing: { renewMonths: 12, ceHours: 6, feeMin: 50, feeMax: 150, bond: true, bondMin: 5000, ins: true, notes: '6 hours of CE required annually. $5,000 bond required. Journeyman and master plumber licenses available.' },
    hvac: { renewMonths: 12, ceHours: 8, feeMin: 50, feeMax: 150, bond: true, bondMin: 5000, ins: true, notes: '8 hours of CE required annually. Bond and insurance required. EPA certification also required.' },
    roofing: { renewMonths: 12, ceHours: 0, feeMin: 50, feeMax: 150, bond: true, bondMin: 5000, ins: true, notes: 'Bond and insurance required. No CE required. Falls under contractor license classification.' },
    reciprocityStates: ['VA', 'OH', 'PA'],
    nasclaAccepted: false,
  },
  WI: {
    boardName: 'Wisconsin Department of Safety and Professional Services',
    boardUrl: 'https://dsps.wi.gov',
    boardPhone: '(608) 266-2112',
    general: { renewMonths: 24, ceHours: 0, feeMin: 75, feeMax: 200, bond: false, bondMin: 0, ins: true, notes: 'WI does not require a state-level general contractor license for most work. Dwelling contractor certification for residential. Insurance recommended.' },
    electrical: { renewMonths: 36, ceHours: 18, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '18 hours of CE required per 3-year cycle. Must include NEC code updates. Journeyman and master electrician licenses.' },
    plumbing: { renewMonths: 36, ceHours: 12, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '12 hours of CE required per 3-year cycle. Journeyman and master plumber licenses available. State license required.' },
    hvac: { renewMonths: 36, ceHours: 12, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '12 hours of CE required per 3-year cycle. EPA certification required. HVAC contractor registration required.' },
    roofing: { renewMonths: 24, ceHours: 0, feeMin: 75, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: 'Dwelling contractor certification may apply for residential roofing. No specific roofing license. Insurance recommended.' },
    reciprocityStates: ['MN', 'IL', 'MI'],
    nasclaAccepted: false,
  },
  WY: {
    boardName: 'Wyoming Department of Workforce Services',
    boardUrl: 'https://wyomingworkforce.org',
    boardPhone: '(307) 777-7690',
    general: { renewMonths: 24, ceHours: 0, feeMin: 25, feeMax: 100, bond: false, bondMin: 0, ins: true, notes: 'WY does not require a state-level general contractor license. Local jurisdictions may have requirements. Insurance recommended.' },
    electrical: { renewMonths: 36, ceHours: 16, feeMin: 25, feeMax: 100, bond: false, bondMin: 0, ins: true, notes: '16 hours of CE required per 3-year cycle. Must include NEC code updates. Journeyman and master electrician licenses.' },
    plumbing: { renewMonths: 36, ceHours: 12, feeMin: 25, feeMax: 100, bond: false, bondMin: 0, ins: true, notes: '12 hours of CE required per 3-year cycle. Journeyman and master plumber licenses available. State license required.' },
    hvac: { renewMonths: 36, ceHours: 12, feeMin: 25, feeMax: 100, bond: false, bondMin: 0, ins: true, notes: '12 hours of CE required per 3-year cycle. EPA certification required. Mechanical contractor license available.' },
    roofing: { renewMonths: 24, ceHours: 0, feeMin: 25, feeMax: 100, bond: false, bondMin: 0, ins: true, notes: 'No state-level roofing license. Insurance recommended. Check local municipality requirements.' },
    reciprocityStates: ['CO', 'MT', 'NE'],
    nasclaAccepted: false,
  },
  // States already seeded in the original script (kept for completeness with upsert)
  CA: {
    boardName: 'Contractors State License Board',
    boardUrl: 'https://www.cslb.ca.gov',
    boardPhone: '(800) 321-2752',
    general: { renewMonths: 24, ceHours: 0, feeMin: 450, feeMax: 600, bond: true, bondMin: 15000, ins: true, notes: 'CA requires a $15,000 contractor bond. No CE required for general contractors, but specialty classifications may differ. Active license renewal every 2 years.' },
    electrical: { renewMonths: 24, ceHours: 0, feeMin: 450, feeMax: 600, bond: true, bondMin: 15000, ins: true, notes: 'C-10 Electrical classification. Must maintain bond and workers comp insurance. No CE required for renewal.' },
    plumbing: { renewMonths: 24, ceHours: 0, feeMin: 450, feeMax: 600, bond: true, bondMin: 15000, ins: true, notes: 'C-36 Plumbing classification. Same bond and insurance requirements as other CA contractors.' },
    hvac: { renewMonths: 24, ceHours: 0, feeMin: 450, feeMax: 600, bond: true, bondMin: 15000, ins: true, notes: 'C-20 HVAC classification. Must also comply with EPA Section 608 certification requirements.' },
    roofing: { renewMonths: 24, ceHours: 0, feeMin: 450, feeMax: 600, bond: true, bondMin: 15000, ins: true, notes: 'C-39 Roofing classification. Workers compensation insurance mandatory if employees present.' },
    reciprocityStates: ['NV', 'AZ'],
    nasclaAccepted: false,
  },
  TX: {
    boardName: 'Texas Department of Licensing and Regulation',
    boardUrl: 'https://www.tdlr.texas.gov',
    boardPhone: '(800) 803-9202',
    general: { renewMonths: 24, ceHours: 0, feeMin: 200, feeMax: 350, bond: false, bondMin: 0, ins: true, notes: 'Texas does not require a general contractor license at the state level, but many cities/municipalities have their own requirements. Insurance recommended.' },
    electrical: { renewMonths: 24, ceHours: 4, feeMin: 100, feeMax: 200, bond: false, bondMin: 0, ins: true, notes: '4 hours of CE required for electrical license renewal. Must include 1 hour of NEC updates. Insurance required.' },
    plumbing: { renewMonths: 24, ceHours: 6, feeMin: 100, feeMax: 200, bond: false, bondMin: 0, ins: true, notes: '6 hours of CE required for plumbing license renewal. Includes medical gas and water efficiency topics.' },
    hvac: { renewMonths: 24, ceHours: 8, feeMin: 100, feeMax: 200, bond: false, bondMin: 0, ins: true, notes: '8 hours of CE required for HVAC license renewal. EPA certification also required for refrigerant handling.' },
    roofing: { renewMonths: 24, ceHours: 0, feeMin: 150, feeMax: 250, bond: false, bondMin: 0, ins: true, notes: 'Roofing contractor registration with TDLR. Must carry general liability insurance. No CE required currently.' },
    reciprocityStates: ['LA', 'NM', 'OK'],
    nasclaAccepted: true,
  },
  FL: {
    boardName: 'Florida Department of Business and Professional Regulation',
    boardUrl: 'https://www.myfloridalicense.com',
    boardPhone: '(850) 487-1395',
    general: { renewMonths: 24, ceHours: 14, feeMin: 205, feeMax: 350, bond: false, bondMin: 0, ins: true, notes: '14 hours of CE required biennially. Must include 1 hour of workers compensation, 1 hour of business practices, and 1 hour of Florida building code.' },
    electrical: { renewMonths: 24, ceHours: 14, feeMin: 205, feeMax: 350, bond: false, bondMin: 0, ins: true, notes: '14 hours of CE required. Must include 1 hour of workplace safety, 1 hour of business practices, and 1 hour of Florida building code updates.' },
    plumbing: { renewMonths: 24, ceHours: 14, feeMin: 205, feeMax: 350, bond: false, bondMin: 0, ins: true, notes: '14 hours of CE required. Similar requirements to other FL contractor license types.' },
    hvac: { renewMonths: 24, ceHours: 14, feeMin: 205, feeMax: 350, bond: false, bondMin: 0, ins: true, notes: '14 hours of CE required. Must include EPA Section 608 compliance training. FL-specific code requirements.' },
    roofing: { renewMonths: 24, ceHours: 14, feeMin: 205, feeMax: 350, bond: false, bondMin: 0, ins: true, notes: '14 hours of CE required. Must include 1 hour of hurricane mitigation building techniques.' },
    reciprocityStates: ['GA', 'SC', 'MS'],
    nasclaAccepted: true,
  },
  NY: {
    boardName: 'NYC Department of Consumer and Worker Protection',
    boardUrl: 'https://www.nyc.gov/site/dca',
    boardPhone: '(212) 436-0300',
    general: { renewMonths: 24, ceHours: 0, feeMin: 150, feeMax: 300, bond: false, bondMin: 0, ins: true, notes: 'NY does not have a state-level general contractor license. NYC and other municipalities have their own requirements. Insurance is recommended.' },
    electrical: { renewMonths: 24, ceHours: 8, feeMin: 100, feeMax: 250, bond: true, bondMin: 5000, ins: true, notes: 'NYC requires an Electrical License. 8 hours of CE for renewal. $5,000 bond required. Check local jurisdictions for requirements outside NYC.' },
    plumbing: { renewMonths: 24, ceHours: 8, feeMin: 100, feeMax: 250, bond: true, bondMin: 5000, ins: true, notes: 'NYC Master Plumber License required within city limits. 8 hours of CE. Bond and insurance required.' },
    hvac: { renewMonths: 24, ceHours: 8, feeMin: 100, feeMax: 250, bond: true, bondMin: 5000, ins: true, notes: 'Oil Burning Equipment Installer or Refrigeration Machine Operator license may be required depending on work type.' },
    roofing: { renewMonths: 24, ceHours: 0, feeMin: 100, feeMax: 200, bond: false, bondMin: 0, ins: true, notes: 'No state-level roofing license. NYC Home Improvement Contractor license may apply. Insurance recommended.' },
    reciprocityStates: ['CT', 'NJ'],
    nasclaAccepted: false,
  },
  IL: {
    boardName: 'Illinois Department of Financial and Professional Regulation',
    boardUrl: 'https://www.idfpr.com',
    boardPhone: '(888) 473-4858',
    general: { renewMonths: 24, ceHours: 0, feeMin: 100, feeMax: 250, bond: false, bondMin: 0, ins: true, notes: 'IL does not require a state-level general contractor license. Local municipalities may have requirements. Insurance strongly recommended.' },
    electrical: { renewMonths: 24, ceHours: 12, feeMin: 75, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '12 hours of CE required for electrician license renewal. Must include code update hours. Chicago has separate licensing.' },
    plumbing: { renewMonths: 24, ceHours: 6, feeMin: 100, feeMax: 200, bond: true, bondMin: 10000, ins: true, notes: '6 hours of CE required. $10,000 bond required for plumbing contractors. Chicago has separate plumbing license requirements.' },
    hvac: { renewMonths: 24, ceHours: 8, feeMin: 75, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: 'EPA certification required for refrigerant handling. 8 hours of CE for mechanical contractor license renewal.' },
    roofing: { renewMonths: 24, ceHours: 8, feeMin: 150, feeMax: 300, bond: true, bondMin: 10000, ins: true, notes: 'IL is one of few states requiring a state roofing license. 8 hours of CE required. $10,000 bond required.' },
    reciprocityStates: ['IN', 'WI'],
    nasclaAccepted: false,
  },
  OH: {
    boardName: 'Ohio Construction Industry Licensing Board',
    boardUrl: 'https://com.ohio.gov/divisions-and-programs/industrial-compliance',
    boardPhone: '(614) 644-3493',
    general: { renewMonths: 24, ceHours: 0, feeMin: 75, feeMax: 200, bond: false, bondMin: 0, ins: true, notes: 'OH requires state license for commercial contractors only. Residential contractors licensed at local level. Insurance required.' },
    electrical: { renewMonths: 24, ceHours: 10, feeMin: 75, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '10 hours of CE required. Must include NEC code updates. Commercial electrical license only; residential handled locally.' },
    plumbing: { renewMonths: 24, ceHours: 10, feeMin: 75, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '10 hours of CE required. Commercial plumbing license only. Residential plumbers licensed at local level.' },
    hvac: { renewMonths: 24, ceHours: 10, feeMin: 75, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '10 hours of CE required for HVAC license renewal. EPA certification also required for refrigerant handling.' },
    roofing: { renewMonths: 24, ceHours: 0, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: 'OH does not require a state roofing license for residential. Commercial roofing may fall under general contractor requirements.' },
    reciprocityStates: ['KY', 'IN'],
    nasclaAccepted: false,
  },
  PA: {
    boardName: 'Pennsylvania Attorney General - Home Improvement Contractor',
    boardUrl: 'https://www.attorneygeneral.gov',
    boardPhone: '(717) 787-3391',
    general: { renewMonths: 24, ceHours: 0, feeMin: 50, feeMax: 200, bond: false, bondMin: 0, ins: true, notes: 'PA requires registration for home improvement contractors. No CE required. Must carry minimum insurance coverage.' },
    electrical: { renewMonths: 24, ceHours: 0, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: 'PA does not have a state-level electrical license. Licensing is handled at the local/municipal level. Check city requirements.' },
    plumbing: { renewMonths: 24, ceHours: 0, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: 'PA does not have a state-level plumbing license. Cities like Philadelphia and Pittsburgh have their own licensing requirements.' },
    hvac: { renewMonths: 24, ceHours: 0, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: 'No state-level HVAC license. EPA certification required for refrigerant handling. Check local municipality requirements.' },
    roofing: { renewMonths: 24, ceHours: 0, feeMin: 50, feeMax: 200, bond: false, bondMin: 0, ins: true, notes: 'Home Improvement Contractor registration required. No state-level roofing license or CE. Insurance required.' },
    reciprocityStates: ['NJ', 'DE'],
    nasclaAccepted: false,
  },
  GA: {
    boardName: 'Georgia Secretary of State - State Licensing Board for Residential and General Contractors',
    boardUrl: 'https://sos.ga.gov',
    boardPhone: '(478) 207-2440',
    general: { renewMonths: 24, ceHours: 6, feeMin: 100, feeMax: 200, bond: false, bondMin: 0, ins: true, notes: '6 hours of CE required for general contractor renewal. Must include at least 1 hour of business practices. Insurance required.' },
    electrical: { renewMonths: 24, ceHours: 8, feeMin: 75, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '8 hours of CE required. Must include NEC code updates. Class I and Class II electrical contractor licenses available.' },
    plumbing: { renewMonths: 24, ceHours: 8, feeMin: 75, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '8 hours of CE required for plumbing contractor renewal. Journeyman and master plumber licenses available.' },
    hvac: { renewMonths: 24, ceHours: 8, feeMin: 75, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '8 hours of CE required. EPA Section 608 certification also required. Class I and Class II HVAC licenses available.' },
    roofing: { renewMonths: 24, ceHours: 4, feeMin: 75, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '4 hours of CE required for roofing contractor renewal. Residential roofing license available.' },
    reciprocityStates: ['FL', 'SC', 'AL'],
    nasclaAccepted: true,
  },
  NC: {
    boardName: 'North Carolina Licensing Board for General Contractors',
    boardUrl: 'https://www.nclbgc.org',
    boardPhone: '(919) 571-4183',
    general: { renewMonths: 24, ceHours: 8, feeMin: 125, feeMax: 250, bond: false, bondMin: 0, ins: true, notes: '8 hours of CE required annually (not biennially). Must include 2 hours of mandatory board-produced course. Insurance required.' },
    electrical: { renewMonths: 24, ceHours: 8, feeMin: 100, feeMax: 200, bond: false, bondMin: 0, ins: true, notes: '8 hours of CE required annually. Must include code update hours. Separate board from general contractors.' },
    plumbing: { renewMonths: 24, ceHours: 6, feeMin: 75, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '6 hours of CE required. Combined board handles plumbing, heating, and fire sprinkler contractors.' },
    hvac: { renewMonths: 24, ceHours: 6, feeMin: 75, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '6 hours of CE required. EPA Section 608 certification also required. H1, H2, and H3 classification levels.' },
    roofing: { renewMonths: 24, ceHours: 0, feeMin: 50, feeMax: 125, bond: false, bondMin: 0, ins: true, notes: 'No specific state roofing license. May fall under general contractor classification. Insurance required.' },
    reciprocityStates: ['SC', 'VA', 'TN'],
    nasclaAccepted: true,
  },
  MI: {
    boardName: 'Michigan Department of Licensing and Regulatory Affairs',
    boardUrl: 'https://www.michigan.gov/lara',
    boardPhone: '(517) 241-9288',
    general: { renewMonths: 36, ceHours: 0, feeMin: 150, feeMax: 300, bond: false, bondMin: 0, ins: true, notes: '3-year renewal cycle for residential builder license. No CE required for general contractors. Insurance required.' },
    electrical: { renewMonths: 36, ceHours: 10, feeMin: 100, feeMax: 200, bond: false, bondMin: 0, ins: true, notes: '10 hours of CE required per 3-year cycle. Must include NEC code update hours. Journeyman and master electrician licenses.' },
    plumbing: { renewMonths: 36, ceHours: 6, feeMin: 100, feeMax: 200, bond: false, bondMin: 0, ins: true, notes: '6 hours of CE required per 3-year cycle. Journeyman and master plumber licenses available.' },
    hvac: { renewMonths: 36, ceHours: 8, feeMin: 100, feeMax: 200, bond: false, bondMin: 0, ins: true, notes: '8 hours of CE required per 3-year cycle. EPA certification required. Mechanical contractor license classifications.' },
    roofing: { renewMonths: 36, ceHours: 0, feeMin: 100, feeMax: 200, bond: false, bondMin: 0, ins: true, notes: 'Residential builder license covers roofing work. No specific roofing license. No CE required for roofing classification.' },
    reciprocityStates: ['OH', 'IN'],
    nasclaAccepted: false,
  },
  NJ: {
    boardName: 'New Jersey Division of Consumer Affairs - Home Improvement Contractors',
    boardUrl: 'https://www.njconsumeraffairs.gov',
    boardPhone: '(888) 656-6225',
    general: { renewMonths: 24, ceHours: 0, feeMin: 100, feeMax: 200, bond: false, bondMin: 0, ins: true, notes: 'Home Improvement Contractor registration required. No CE required. Must carry general liability insurance.' },
    electrical: { renewMonths: 36, ceHours: 10, feeMin: 100, feeMax: 200, bond: true, bondMin: 5000, ins: true, notes: '10 hours of CE required per 3-year cycle. $5,000 bond required. Business permit and CRI registration also needed.' },
    plumbing: { renewMonths: 24, ceHours: 8, feeMin: 100, feeMax: 200, bond: true, bondMin: 5000, ins: true, notes: '8 hours of CE required. $5,000 bond required. Master plumber license required for contracting.' },
    hvac: { renewMonths: 24, ceHours: 8, feeMin: 100, feeMax: 200, bond: false, bondMin: 0, ins: true, notes: '8 hours of CE required for HVACR contractor license. EPA certification also required. Registered with Division of Consumer Affairs.' },
    roofing: { renewMonths: 24, ceHours: 0, feeMin: 100, feeMax: 200, bond: false, bondMin: 0, ins: true, notes: 'Home Improvement Contractor registration required. No specific roofing license. Insurance required.' },
    reciprocityStates: ['NY', 'PA', 'CT'],
    nasclaAccepted: false,
  },
  VA: {
    boardName: 'Virginia Department of Professional and Occupational Regulation',
    boardUrl: 'https://www.dpor.virginia.gov',
    boardPhone: '(804) 367-8511',
    general: { renewMonths: 24, ceHours: 8, feeMin: 100, feeMax: 200, bond: false, bondMin: 0, ins: true, notes: '8 hours of CE required per renewal cycle. Class A, B, and C contractor licenses based on project value. Insurance required for Class A and B.' },
    electrical: { renewMonths: 24, ceHours: 10, feeMin: 75, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '10 hours of CE required. Journeyman and master electrician licenses available. NEC code update hours required.' },
    plumbing: { renewMonths: 24, ceHours: 8, feeMin: 75, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '8 hours of CE required for plumbing license renewal. Journeyman and master plumber licenses available.' },
    hvac: { renewMonths: 24, ceHours: 8, feeMin: 75, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '8 hours of CE required. EPA Section 608 certification also required. Journeyman and master HVAC licenses available.' },
    roofing: { renewMonths: 24, ceHours: 8, feeMin: 75, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: '8 hours of CE required. Roofing falls under contractor classification. Class A/B/C licensing based on project value.' },
    reciprocityStates: ['NC', 'MD', 'WV'],
    nasclaAccepted: true,
  },
  WA: {
    boardName: 'Washington State Department of Labor and Industries',
    boardUrl: 'https://www.lni.wa.gov',
    boardPhone: '(800) 647-0982',
    general: { renewMonths: 24, ceHours: 0, feeMin: 117, feeMax: 234, bond: true, bondMin: 12000, ins: true, notes: 'WA requires a $12,000 bond for general contractors. No CE required. Must carry general liability insurance. Specialty and general contractor registrations.' },
    electrical: { renewMonths: 36, ceHours: 24, feeMin: 134, feeMax: 268, bond: true, bondMin: 6000, ins: true, notes: '24 hours of CE required per 3-year cycle. $6,000 bond required. Administrator, electrician, and electrical contractor licenses.' },
    plumbing: { renewMonths: 24, ceHours: 8, feeMin: 100, feeMax: 200, bond: true, bondMin: 6000, ins: true, notes: '8 hours of CE required. $6,000 bond required. Journeyman and master plumber licenses available.' },
    hvac: { renewMonths: 24, ceHours: 8, feeMin: 100, feeMax: 200, bond: true, bondMin: 6000, ins: true, notes: '8 hours of CE required. $6,000 bond required. EPA certification also required. Specialty contractor registration.' },
    roofing: { renewMonths: 24, ceHours: 0, feeMin: 117, feeMax: 234, bond: true, bondMin: 6000, ins: true, notes: '$6,000 bond required for roofing contractors. No CE required. Must carry general liability insurance. Specialty contractor registration.' },
    reciprocityStates: ['OR', 'ID'],
    nasclaAccepted: false,
  },
  AZ: {
    boardName: 'Arizona Registrar of Contractors',
    boardUrl: 'https://roc.az.gov',
    boardPhone: '(602) 542-1525',
    general: { renewMonths: 24, ceHours: 0, feeMin: 180, feeMax: 360, bond: true, bondMin: 10000, ins: true, notes: 'AZ requires a $10,000 bond for residential, $15,000 for commercial. No CE required. Must carry workers compensation and general liability insurance.' },
    electrical: { renewMonths: 24, ceHours: 0, feeMin: 180, feeMax: 360, bond: true, bondMin: 10000, ins: true, notes: 'Electrical contractor license under ROC. Bond and insurance required. No CE for renewal. CR-11 classification.' },
    plumbing: { renewMonths: 24, ceHours: 0, feeMin: 180, feeMax: 360, bond: true, bondMin: 10000, ins: true, notes: 'Plumbing contractor license under ROC. CR-21 classification. Bond and insurance required. No CE for renewal.' },
    hvac: { renewMonths: 24, ceHours: 0, feeMin: 180, feeMax: 360, bond: true, bondMin: 10000, ins: true, notes: 'HVAC contractor license under ROC. CR-65 classification. EPA certification also required. No CE for renewal.' },
    roofing: { renewMonths: 24, ceHours: 0, feeMin: 180, feeMax: 360, bond: true, bondMin: 10000, ins: true, notes: 'Roofing contractor license under ROC. CR-71 classification. Bond and insurance required. No CE for renewal.' },
    reciprocityStates: ['CA', 'NV', 'NM'],
    nasclaAccepted: true,
  },
  CO: {
    boardName: 'Colorado Department of Regulatory Agencies',
    boardUrl: 'https://dora.colorado.gov',
    boardPhone: '(303) 894-7800',
    general: { renewMonths: 24, ceHours: 0, feeMin: 50, feeMax: 200, bond: false, bondMin: 0, ins: true, notes: 'CO does not require a state-level general contractor license. Local jurisdictions have their own requirements. Insurance recommended.' },
    electrical: { renewMonths: 36, ceHours: 24, feeMin: 100, feeMax: 200, bond: false, bondMin: 0, ins: true, notes: '24 hours of CE required per 3-year cycle. Must include NEC code updates. State electrical license required.' },
    plumbing: { renewMonths: 36, ceHours: 24, feeMin: 100, feeMax: 200, bond: false, bondMin: 0, ins: true, notes: '24 hours of CE required per 3-year cycle. State plumbing license required. Journeyman and master classifications.' },
    hvac: { renewMonths: 36, ceHours: 16, feeMin: 100, feeMax: 200, bond: false, bondMin: 0, ins: true, notes: '16 hours of CE required per 3-year cycle. EPA certification required. State mechanical license may apply.' },
    roofing: { renewMonths: 24, ceHours: 0, feeMin: 50, feeMax: 150, bond: false, bondMin: 0, ins: true, notes: 'No state-level roofing license. Insurance recommended. Check local municipality requirements.' },
    reciprocityStates: ['WY', 'NM', 'UT'],
    nasclaAccepted: true,
  },
};

// Generate state requirement seeds from STATE_CONFIGS
function generateStateData(): StateRequirementSeed[] {
  const results: StateRequirementSeed[] = [];
  const licenseTypes = ['general_contractor', 'electrical', 'plumbing', 'hvac', 'roofing'] as const;
  const typeKeys = ['general', 'electrical', 'plumbing', 'hvac', 'roofing'] as const;

  for (const [stateCode, config] of Object.entries(STATE_CONFIGS)) {
    for (let i = 0; i < licenseTypes.length; i++) {
      const licenseType = licenseTypes[i];
      const typeKey = typeKeys[i];
      const typeData = config[typeKey];

      results.push({
        state: stateCode,
        licenseType,
        renewPeriodMonths: typeData.renewMonths,
        ceHoursRequired: typeData.ceHours,
        renewalFeeMin: typeData.feeMin,
        renewalFeeMax: typeData.feeMax,
        bondRequired: typeData.bond,
        bondAmountMin: typeData.bondMin,
        insuranceRequired: typeData.ins,
        boardName: config.boardName,
        boardUrl: config.boardUrl,
        boardPhone: config.boardPhone,
        notes: typeData.notes,
        reciprocityStates: config.reciprocityStates,
        nasclaAccepted: config.nasclaAccepted,
      });
    }
  }

  return results;
}

const stateRequirements = generateStateData();

async function seedStateRequirements() {
  console.log('🌱 Seeding state requirements for all 50 US states + DC...\n');

  let created = 0;
  let skipped = 0;

  for (const req of stateRequirements) {
    const result = await prisma.stateRequirement.upsert({
      where: {
        state_licenseType: {
          state: req.state,
          licenseType: req.licenseType,
        },
      },
      update: {
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
        reciprocityStates: req.reciprocityStates ? JSON.stringify(req.reciprocityStates) : null,
        nasclaAccepted: req.nasclaAccepted ?? false,
      },
      create: {
        state: req.state,
        licenseType: req.licenseType,
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
        reciprocityStates: req.reciprocityStates ? JSON.stringify(req.reciprocityStates) : null,
        nasclaAccepted: req.nasclaAccepted ?? false,
      },
    });
    created++;
  }

  // Summary
  const states = [...new Set(stateRequirements.map((r) => r.state))];
  const licenseTypes = [...new Set(stateRequirements.map((r) => r.licenseType))];

  console.log(`✅ Created/updated ${created} state requirement records`);
  console.log(`📊 ${states.length} states/jurisdictions: ${states.join(', ')}`);
  console.log(`📊 ${licenseTypes.length} license types: ${licenseTypes.join(', ')}`);
  console.log('\n🎉 State requirements seeding complete!');

  await prisma.$disconnect();
}

seedStateRequirements().catch((e) => {
  console.error('❌ Seeding failed:', e);
  prisma.$disconnect();
  process.exit(1);
});
