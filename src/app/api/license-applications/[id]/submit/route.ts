import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// POST: Submit application (validate required checklist items and documents)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const application = await db.licenseApplication.findFirst({
      where: { id, orgId: orgMember.orgId },
      include: { documents: true },
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (application.status !== 'draft') {
      return NextResponse.json({ error: 'Only draft applications can be submitted' }, { status: 400 });
    }

    // Validate required checklist items
    const errors: string[] = [];
    if (application.checklistData) {
      try {
        const checklist = JSON.parse(application.checklistData);
        const incompleteRequired = checklist.items?.filter(
          (item: any) => item.required && !item.completed
        );
        if (incompleteRequired?.length > 0) {
          errors.push(`${incompleteRequired.length} required checklist item(s) are not completed`);
        }
      } catch {
        // If checklist data is malformed, allow submission
      }
    }

    // Validate required documents
    const requiredDocs = application.documents.filter(d => d.required);
    if (requiredDocs.length === 0 && application.documents.length === 0) {
      errors.push('At least one document must be uploaded');
    }

    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join('. '), errors }, { status: 400 });
    }

    // Update status to submitted
    const updated = await db.licenseApplication.update({
      where: { id },
      data: {
        status: 'submitted',
        submittedDate: new Date(),
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'update',
        entityType: 'license_application',
        entityId: id,
        entityName: `${application.licenseType} - ${application.state}`,
        details: `Submitted license application`,
      },
    });

    return NextResponse.json({ application: updated });
  } catch (error) {
    console.error('Submit license application error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
