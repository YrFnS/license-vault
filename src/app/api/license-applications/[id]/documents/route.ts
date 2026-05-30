import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// POST: Upload document for application
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
    });
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const category = (formData.get('category') as string) || 'general';
    const required = formData.get('required') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save file to disk
    const uploadsDir = path.join(process.cwd(), 'uploads', 'applications', id);
    await mkdir(uploadsDir, { recursive: true });
    const uniqueName = `${Date.now()}-${file.name}`;
    const filePath = path.join(uploadsDir, uniqueName);
    await writeFile(filePath, buffer);

    const doc = await db.licenseApplicationDocument.create({
      data: {
        applicationId: id,
        fileName: file.name,
        fileType: file.type || 'application/octet-stream',
        fileSize: file.size,
        filePath: `/uploads/applications/${id}/${uniqueName}`,
        category,
        required,
      },
    });

    return NextResponse.json({ document: doc }, { status: 201 });
  } catch (error) {
    console.error('Upload application document error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Remove document
export async function DELETE(
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
    const { searchParams } = new URL(request.url);
    const docId = searchParams.get('docId');

    if (!docId) {
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 });
    }

    // Verify application belongs to org
    const application = await db.licenseApplication.findFirst({
      where: { id, orgId: orgMember.orgId },
    });
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    await db.licenseApplicationDocument.delete({
      where: { id: docId, applicationId: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete application document error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
