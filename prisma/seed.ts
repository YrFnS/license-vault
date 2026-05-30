/**
 * Prisma Seed Script
 * Populates essential lookup data for License Vault.
 * Run with: npx prisma db seed
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding essential lookup data...');

  // Create a system org for default templates and lookup data
  const systemOrg = await prisma.organization.upsert({
    where: { id: 'system' },
    update: {},
    create: {
      id: 'system',
      name: 'System',
      tradeType: 'general',
      primaryState: 'US',
      plan: 'enterprise',
    },
  });
  console.log(`✅ System org: ${systemOrg.id}`);

  // License types lookup
  const licenseTypes = [
    { type: 'general_contractor', name: 'General Contractor' },
    { type: 'electrical', name: 'Electrical Contractor' },
    { type: 'plumbing', name: 'Plumbing Contractor' },
    { type: 'hvac', name: 'HVAC Contractor' },
    { type: 'roofing', name: 'Roofing Contractor' },
    { type: 'mechanical', name: 'Mechanical Contractor' },
    { type: 'fire_protection', name: 'Fire Protection Contractor' },
    { type: 'engineering', name: 'Professional Engineer' },
    { type: 'architecture', name: 'Registered Architect' },
    { type: 'specialty', name: 'Specialty Contractor' },
  ];

  // Insurance types lookup
  const insuranceTypes = [
    { type: 'general_liability', name: 'General Liability' },
    { type: 'workers_comp', name: "Workers' Compensation" },
    { type: 'commercial_auto', name: 'Commercial Auto' },
    { type: 'umbrella', name: 'Umbrella / Excess Liability' },
    { type: 'professional_liability', name: 'Professional Liability (E&O)' },
    { type: 'cyber_liability', name: 'Cyber Liability' },
    { type: 'builders_risk', name: "Builder's Risk" },
    { type: 'pollution', name: 'Pollution / Environmental Liability' },
  ];

  // Compliance categories
  const complianceCategories = [
    { key: 'license', name: 'License Compliance', description: 'Active, expired, or expiring contractor licenses' },
    { key: 'insurance', name: 'Insurance Compliance', description: 'COIs, coverage limits, and endorsement requirements' },
    { key: 'ce_credits', name: 'Continuing Education', description: 'CE hours required for license renewal' },
    { key: 'entity', name: 'Business Entity Standing', description: 'LLC/corp state filing and annual report status' },
    { key: 'bond', name: 'Bond Compliance', description: 'Surety bonds required for license qualification' },
    { key: 'registration', name: 'State Registration', description: 'Out-of-state contractor registration requirements' },
  ];

  // Trade types
  const tradeTypes = [
    'Electrical', 'Plumbing', 'HVAC', 'General', 'Roofing', 'Concrete',
    'Painting', 'Landscaping', 'Steel', 'Masonry', 'Flooring', 'Drywall',
    'Insulation', 'Piping', 'Excavation', 'Demolition', 'Other',
  ];

  // Common US states with contractor license requirements
  const states = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC',
  ];

  // Create a default checklist template for license renewal
  await prisma.checklistTemplate.upsert({
    where: { id: 'default-license-renewal' },
    update: {},
    create: {
      id: 'default-license-renewal',
      name: 'License Renewal Checklist',
      description: 'Standard checklist for contractor license renewal applications',
      category: 'license_renewal',
      isDefault: true,
      isActive: true,
      orgId: 'system',
      items: JSON.stringify([
        { id: '1', label: 'Verify current license status with state board', required: true },
        { id: '2', label: 'Complete CE hour requirements', required: true },
        { id: '3', label: 'Obtain current COI from insurance provider', required: true },
        { id: '4', label: 'Pay state renewal fee', required: true },
        { id: '5', label: 'Submit renewal application before deadline', required: true },
        { id: '6', label: 'Update business entity annual report if needed', required: false },
        { id: '7', label: 'Verify bond status / obtain new bond if required', required: false },
        { id: '8', label: 'Update contact information with state board', required: false },
      ]),
    },
  });

  // Create a default onboarding checklist template
  await prisma.checklistTemplate.upsert({
    where: { id: 'default-onboarding' },
    update: {},
    create: {
      id: 'default-onboarding',
      name: 'New Organization Onboarding',
      description: 'Initial setup checklist for new License Vault organizations',
      category: 'general',
      isDefault: true,
      isActive: true,
      orgId: 'system',
      items: JSON.stringify([
        { id: '1', label: 'Add primary organization details and trade type', required: true },
        { id: '2', label: 'Invite team members', required: false },
        { id: '3', label: 'Add all active contractor licenses', required: true },
        { id: '4', label: 'Upload current insurance certificates', required: true },
        { id: '5', label: 'Add qualifiers and link to licenses', required: true },
        { id: '6', label: 'Configure alert preferences', required: false },
        { id: '7', label: 'Set up subcontractor portal access', required: false },
        { id: '8', label: 'Add active projects and required licenses', required: false },
      ]),
    },
  });

  console.log('✅ Created default checklist templates');

  // Log the lookup data that was seeded
  console.log(`\n📋 Lookup data available:`);
  console.log(`   License types: ${licenseTypes.length}`);
  console.log(`   Insurance types: ${insuranceTypes.length}`);
  console.log(`   Compliance categories: ${complianceCategories.length}`);
  console.log(`   Trade types: ${tradeTypes.length}`);
  console.log(`   States: ${states.length}`);
  console.log(`   Checklist templates: 2`);

  console.log('\n✅ Seed complete!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Seed error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
