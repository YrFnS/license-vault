import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Integration catalog - product catalog data (not user data), legitimate to hardcode
const INTEGRATION_CATALOG = [
  // Construction ERP
  { type: 'procore', name: 'Procore', category: 'construction_erp', icon: 'HardHat', description: 'Sync projects, RFIs, and compliance data with Procore construction management', dataFlows: ['licenses', 'projects', 'documents'] },
  { type: 'autodesk_construction', name: 'Autodesk Construction Cloud', category: 'construction_erp', icon: 'Layers', description: 'Connect with Autodesk Construction Cloud for project document management', dataFlows: ['licenses', 'projects', 'documents'] },
  { type: 'viewpoint', name: 'Viewpoint', category: 'construction_erp', icon: 'Building', description: 'Integrate Viewpoint ERP for construction accounting and project management', dataFlows: ['licenses', 'projects', 'contractors'] },
  { type: 'cmic', name: 'CMiC', category: 'construction_erp', icon: 'Building', description: 'Connect CMiC for enterprise construction management and payroll', dataFlows: ['licenses', 'projects', 'contractors'] },
  // Accounting
  { type: 'quickbooks', name: 'QuickBooks', category: 'accounting', icon: 'Calculator', description: 'Sync financial data, invoices, and expense tracking with QuickBooks', dataFlows: ['licenses', 'contractors', 'documents'] },
  { type: 'sage', name: 'Sage', category: 'accounting', icon: 'DollarSign', description: 'Connect Sage for accounting, payroll, and financial reporting', dataFlows: ['licenses', 'contractors', 'documents'] },
  { type: 'freshbooks', name: 'FreshBooks', category: 'accounting', icon: 'Calculator', description: 'Sync invoicing and expense tracking with FreshBooks', dataFlows: ['licenses', 'contractors'] },
  { type: 'xero', name: 'Xero', category: 'accounting', icon: 'Calculator', description: 'Connect Xero for cloud-based accounting and bookkeeping', dataFlows: ['licenses', 'contractors', 'documents'] },
  // HR & Payroll
  { type: 'adp', name: 'ADP', category: 'hris', icon: 'Users', description: 'Sync employee data, payroll, and compliance with ADP workforce management', dataFlows: ['licenses', 'contractors', 'documents'] },
  { type: 'workday', name: 'Workday', category: 'hris', icon: 'Users', description: 'Connect Workday for HR, payroll, and workforce planning', dataFlows: ['licenses', 'contractors'] },
  { type: 'bamboohr', name: 'BambooHR', category: 'hris', icon: 'Users', description: 'Sync employee records and compliance tracking with BambooHR', dataFlows: ['licenses', 'contractors'] },
  { type: 'gusto', name: 'Gusto', category: 'hris', icon: 'Users', description: 'Connect Gusto for payroll, benefits, and HR management', dataFlows: ['licenses', 'contractors'] },
];

// GET: Integration catalog (requires auth)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ catalog: INTEGRATION_CATALOG });
  } catch (error) {
    console.error('Error fetching integration catalog:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
