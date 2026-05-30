import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import crypto from 'crypto';
import { sendSubcontractorPortalInvite } from '@/lib/email';

// POST: Send document request email to subcontractor
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
    const { id } = await params;

    const orgMember = await db.orgMember.findFirst({
      where: { userId },
    });

    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    if (!['owner', 'admin'].includes(orgMember.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const subcontractor = await db.subcontractor.findFirst({
      where: { id, orgId: orgMember.orgId },
    });

    if (!subcontractor) {
      return NextResponse.json({ error: 'Subcontractor not found' }, { status: 404 });
    }

    // Regenerate upload token for security
    const newToken = crypto.randomUUID();

    await db.subcontractor.update({
      where: { id },
      data: { uploadToken: newToken },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'request_docs',
        entityType: 'subcontractor',
        entityId: subcontractor.id,
        entityName: subcontractor.companyName,
        details: `Requested documents from subcontractor: ${subcontractor.companyName}`,
      },
    });

    // Construct the upload URL for the portal
    const appUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || new URL(request.url).origin;
    const uploadUrl = `${appUrl}/subcontractor-upload?token=${newToken}`;

    // Send portal invitation email to the subcontractor (fire-and-forget)
    if (subcontractor.email) {
      const org = await db.organization.findUnique({ where: { id: orgMember.orgId } });

      sendSubcontractorPortalInvite(
        subcontractor.email,
        {
          orgName: org?.name || org?.companyName || 'License Vault',
          portalUrl: uploadUrl,
          companyName: subcontractor.companyName,
        },
        orgMember.orgId
      ).catch(err => console.error('Failed to send subcontractor portal invite email:', err));
    }

    return NextResponse.json({
      success: true,
      uploadUrl,
      token: newToken,
    });
  } catch (error) {
    console.error('Request docs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
