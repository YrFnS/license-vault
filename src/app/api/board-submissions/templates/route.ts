import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Hardcoded templates for common states
const templates: Record<string, any[]> = {
  CA: [
    {
      state: 'CA',
      submissionType: 'new_license',
      boardName: 'Contractors State License Board (CSLB)',
      boardEmail: 'licensing@cslb.ca.gov',
      boardPortalUrl: 'https://www.cslb.ca.gov/Online_Services/',
      filingFee: 330,
      estimatedDays: 45,
      fields: [
        { name: 'businessName', label: 'Business Name', value: '', required: true },
        { name: 'dba', label: 'DBA (Doing Business As)', value: '', required: false },
        { name: 'businessType', label: 'Business Entity Type', value: '', required: true },
        { name: 'applicantName', label: 'Qualifying Individual Name', value: '', required: true },
        { name: 'ssn', label: 'SSN (last 4)', value: '', required: true },
        { name: 'licenseClass', label: 'License Classification', value: '', required: true },
        { name: 'experienceYears', label: 'Years of Experience', value: '', required: true },
        { name: 'address', label: 'Business Address', value: '', required: true },
        { name: 'phone', label: 'Business Phone', value: '', required: true },
      ],
      requiredDocs: [
        'Completed Application Form',
        'Bond of Qualifying Individual ($15,000)',
        'Certificate of Workers\' Compensation Insurance',
        'Live Scan Fingerprint Receipt',
        'Experience Verification Form',
        'Proof of Trade Examination',
      ],
    },
    {
      state: 'CA',
      submissionType: 'renewal',
      boardName: 'Contractors State License Board (CSLB)',
      boardEmail: 'renewal@cslb.ca.gov',
      boardPortalUrl: 'https://www.cslb.ca.gov/Online_Services/Renew_License/',
      filingFee: 450,
      estimatedDays: 30,
      fields: [
        { name: 'licenseNumber', label: 'License Number', value: '', required: true },
        { name: 'businessName', label: 'Business Name', value: '', required: true },
        { name: 'currentAddress', label: 'Current Business Address', value: '', required: true },
        { name: 'classification', label: 'Current Classification', value: '', required: true },
        { name: 'workersComp', label: 'Workers\' Comp Status', value: '', required: true },
      ],
      requiredDocs: [
        'Completed Renewal Application',
        'Updated Bond Documentation',
        'Current Workers\' Compensation Certificate',
        'Proof of Continuing Education (if applicable)',
      ],
    },
    {
      state: 'CA',
      submissionType: 'name_change',
      boardName: 'Contractors State License Board (CSLB)',
      boardEmail: 'licensing@cslb.ca.gov',
      boardPortalUrl: 'https://www.cslb.ca.gov/',
      filingFee: 25,
      estimatedDays: 30,
      fields: [
        { name: 'licenseNumber', label: 'License Number', value: '', required: true },
        { name: 'currentName', label: 'Current Business Name', value: '', required: true },
        { name: 'newName', label: 'New Business Name', value: '', required: true },
        { name: 'reason', label: 'Reason for Name Change', value: '', required: true },
      ],
      requiredDocs: [
        'Name Change Application',
        'Proof of Fictitious Business Name (if DBA)',
        'Updated Bond',
      ],
    },
  ],
  TX: [
    {
      state: 'TX',
      submissionType: 'new_license',
      boardName: 'Texas Department of Licensing and Regulation (TDLR)',
      boardEmail: 'licensing@tdlr.texas.gov',
      boardPortalUrl: 'https://www.tdlr.texas.gov/',
      filingFee: 250,
      estimatedDays: 30,
      fields: [
        { name: 'applicantName', label: 'Applicant Full Name', value: '', required: true },
        { name: 'businessName', label: 'Business Name', value: '', required: true },
        { name: 'trade', label: 'Trade Category', value: '', required: true },
        { name: 'experienceYears', label: 'Years of Experience', value: '', required: true },
        { name: 'address', label: 'Business Address', value: '', required: true },
        { name: 'phone', label: 'Phone Number', value: '', required: true },
        { name: 'insuranceInfo', label: 'Insurance Information', value: '', required: true },
      ],
      requiredDocs: [
        'Completed Application',
        'Proof of Insurance',
        'Proof of Experience',
        'Trade Examination Results',
        'Background Check Results',
      ],
    },
    {
      state: 'TX',
      submissionType: 'renewal',
      boardName: 'Texas Department of Licensing and Regulation (TDLR)',
      boardEmail: 'renewals@tdlr.texas.gov',
      boardPortalUrl: 'https://www.tdlr.texas.gov/',
      filingFee: 200,
      estimatedDays: 21,
      fields: [
        { name: 'licenseNumber', label: 'License Number', value: '', required: true },
        { name: 'businessName', label: 'Business Name', value: '', required: true },
        { name: 'address', label: 'Current Address', value: '', required: true },
        { name: 'continuingEd', label: 'Continuing Education Hours Completed', value: '', required: true },
      ],
      requiredDocs: [
        'Renewal Application',
        'Continuing Education Certificate',
        'Updated Insurance Certificate',
      ],
    },
  ],
  FL: [
    {
      state: 'FL',
      submissionType: 'new_license',
      boardName: 'Florida Department of Business and Professional Regulation (DBPR)',
      boardEmail: 'call.center@myfloridalicense.com',
      boardPortalUrl: 'https://www.myfloridalicense.com/',
      filingFee: 309,
      estimatedDays: 45,
      fields: [
        { name: 'applicantName', label: 'Applicant Full Name', value: '', required: true },
        { name: 'businessName', label: 'Business Name', value: '', required: true },
        { name: 'licenseCategory', label: 'License Category', value: '', required: true },
        { name: 'experienceYears', label: 'Years of Experience', value: '', required: true },
        { name: 'address', label: 'Business Address', value: '', required: true },
        { name: 'phone', label: 'Phone Number', value: '', required: true },
      ],
      requiredDocs: [
        'Completed Application',
        'Credit Report',
        'Proof of Insurance',
        'Trade Examination Results',
        'Fingerprint Results',
        'Financial Statement',
      ],
    },
    {
      state: 'FL',
      submissionType: 'renewal',
      boardName: 'Florida Department of Business and Professional Regulation (DBPR)',
      boardEmail: 'call.center@myfloridalicense.com',
      boardPortalUrl: 'https://www.myfloridalicense.com/',
      filingFee: 209,
      estimatedDays: 21,
      fields: [
        { name: 'licenseNumber', label: 'License Number', value: '', required: true },
        { name: 'businessName', label: 'Business Name', value: '', required: true },
        { name: 'continuingEd', label: 'Continuing Education Hours', value: '', required: true },
      ],
      requiredDocs: [
        'Renewal Application',
        '14-Hour Continuing Education Certificate',
        'Updated Insurance Certificate',
        'Workers\' Compensation Documentation',
      ],
    },
  ],
};

// GET: Get form templates by state and/or type
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state')?.toUpperCase();
    const submissionType = searchParams.get('submissionType');

    let result = templates;

    if (state) {
      const stateTemplates = templates[state] || [];
      if (submissionType) {
        const filtered = stateTemplates.filter((t: any) => t.submissionType === submissionType);
        return NextResponse.json({ templates: filtered });
      }
      return NextResponse.json({ templates: stateTemplates });
    }

    // Return all available states
    const availableStates = Object.keys(templates).map((s) => ({
      state: s,
      types: templates[s].map((t: any) => t.submissionType),
    }));

    return NextResponse.json({ availableStates, templates: [] });
  } catch (error) {
    console.error('Get templates error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
