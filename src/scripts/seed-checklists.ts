import { db } from '@/lib/db';

async function seedChecklists() {
  console.log('Seeding default checklist templates...');

  // Find the first organization
  const org = await db.organization.findFirst();
  if (!org) {
    console.error('No organization found. Please run the demo seed first.');
    process.exit(1);
  }

  const templates = [
    {
      name: 'New Hire Onboarding',
      description: 'Checklist for onboarding a new hire with license verification',
      category: 'onboarding',
      isDefault: true,
      items: JSON.stringify([
        { id: '1', label: 'Collect license info', required: true, category: 'documentation', order: 0 },
        { id: '2', label: 'Verify insurance', required: true, category: 'verification', order: 1 },
        { id: '3', label: 'Upload COI', required: true, category: 'documentation', order: 2 },
        { id: '4', label: 'Review compliance requirements', required: true, category: 'verification', order: 3 },
        { id: '5', label: 'Assign to projects', required: false, category: 'general', order: 4 },
      ]),
    },
    {
      name: 'License Renewal',
      description: 'Checklist for license renewal process',
      category: 'renewal',
      isDefault: true,
      items: JSON.stringify([
        { id: '1', label: 'Check renewal requirements', required: true, category: 'verification', order: 0 },
        { id: '2', label: 'Complete CE hours', required: true, category: 'training', order: 1 },
        { id: '3', label: 'Submit renewal form', required: true, category: 'documentation', order: 2 },
        { id: '4', label: 'Pay renewal fee', required: true, category: 'payment', order: 3 },
        { id: '5', label: 'Upload new license copy', required: true, category: 'documentation', order: 4 },
      ]),
    },
    {
      name: 'Compliance Audit',
      description: 'Comprehensive audit checklist for compliance review',
      category: 'audit',
      isDefault: true,
      items: JSON.stringify([
        { id: '1', label: 'Review all licenses', required: true, category: 'verification', order: 0 },
        { id: '2', label: 'Check insurance coverage', required: true, category: 'verification', order: 1 },
        { id: '3', label: 'Verify CE compliance', required: true, category: 'verification', order: 2 },
        { id: '4', label: 'Review subcontractor compliance', required: true, category: 'verification', order: 3 },
        { id: '5', label: 'Generate compliance report', required: true, category: 'documentation', order: 4 },
      ]),
    },
    {
      name: 'Project Setup',
      description: 'Checklist for setting up a new project with compliance requirements',
      category: 'general',
      isDefault: true,
      items: JSON.stringify([
        { id: '1', label: 'Define required licenses', required: true, category: 'documentation', order: 0 },
        { id: '2', label: 'Set insurance requirements', required: true, category: 'documentation', order: 1 },
        { id: '3', label: 'Add subcontractors', required: false, category: 'general', order: 2 },
        { id: '4', label: 'Verify compliance', required: true, category: 'verification', order: 3 },
        { id: '5', label: 'Schedule compliance review', required: false, category: 'general', order: 4 },
      ]),
    },
  ];

  for (const tmpl of templates) {
    // Check if template already exists
    const existing = await db.checklistTemplate.findFirst({
      where: { orgId: org.id, name: tmpl.name },
    });
    if (existing) {
      console.log(`Template "${tmpl.name}" already exists, skipping...`);
      continue;
    }

    await db.checklistTemplate.create({
      data: {
        orgId: org.id,
        name: tmpl.name,
        description: tmpl.description,
        category: tmpl.category,
        isDefault: tmpl.isDefault,
        items: tmpl.items,
      },
    });
    console.log(`Created template: ${tmpl.name}`);
  }

  console.log('Seeding complete!');
}

seedChecklists()
  .catch(console.error)
  .finally(() => process.exit());
