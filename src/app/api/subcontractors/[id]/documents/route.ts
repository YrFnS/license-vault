import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { z } from 'zod';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  'application/pdf': ['pdf'],
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'application/msword': ['doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// POST: Upload a document for a subcontractor
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

    const subcontractor = await db.subcontractor.findFirst({
      where: { id, orgId: orgMember.orgId },
    });

    if (!subcontractor) {
      return NextResponse.json({ error: 'Subcontractor not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const category = (formData.get('category') as string) || 'other';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedExtensions = Object.values(ALLOWED_MIME_TYPES).flat();
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';

    if (!ALLOWED_MIME_TYPES[file.type] && !allowedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed types: PDF, JPG, PNG, DOC, DOCX' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Ensure uploads directory exists
    await mkdir(UPLOADS_DIR, { recursive: true });

    // Generate unique filename
    const randomBytes = crypto.randomBytes(16).toString('hex');
    const safeFileName = `${randomBytes}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const filePath = path.join(UPLOADS_DIR, safeFileName);

    // Write file to disk
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(filePath, buffer);

    // Get user name
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    // Create document record
    const document = await db.subcontractorDocument.create({
      data: {
        subcontractorId: id,
        orgId: orgMember.orgId,
        fileName: file.name,
        fileType: fileExtension,
        fileSize: file.size,
        filePath: safeFileName,
        category,
        reviewStatus: 'pending',
      },
    });

    // Update lastSubmittedAt
    await db.subcontractor.update({
      where: { id },
      data: { lastSubmittedAt: new Date() },
    });

    // Create audit log entry
    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'DOCUMENT_UPLOADED',
        entityType: 'subcontractor_document',
        entityId: document.id,
        entityName: file.name,
        details: `Uploaded document "${file.name}" for subcontractor "${subcontractor.companyName}"`,
      },
    });

    return NextResponse.json({
      document: {
        id: document.id,
        fileName: document.fileName,
        fileType: document.fileType,
        fileSize: document.fileSize,
        category: document.category,
        reviewStatus: document.reviewStatus,
        createdAt: document.createdAt.toISOString(),
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Upload subcontractor document error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const reviewDocumentSchema = z.object({
  documentId: z.string().min(1, 'Document ID is required'),
  reviewStatus: z.enum(['approved', 'rejected']),
  reviewNotes: z.string().optional(),
});

// PUT: Review a document
export async function PUT(
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

    const body = await request.json();
    const result = reviewDocumentSchema.safeParse(body);

    if (!result.success) {
      const firstError = result.error.issues?.[0];
      return NextResponse.json(
        { error: firstError?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const { documentId, reviewStatus, reviewNotes } = result.data;

    // Verify document belongs to this subcontractor
    const document = await db.subcontractorDocument.findFirst({
      where: { id: documentId, subcontractorId: id },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Get reviewer name
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    const updated = await db.subcontractorDocument.update({
      where: { id: documentId },
      data: {
        reviewStatus,
        reviewedBy: user?.name || null,
        reviewedAt: new Date(),
        reviewNotes: reviewNotes || null,
      },
    });

    // Check if all documents are approved - update compliance status
    const allDocs = await db.subcontractorDocument.findMany({
      where: { subcontractorId: id },
    });

    const allApproved = allDocs.length > 0 && allDocs.every((d) => d.reviewStatus === 'approved');
    const anyRejected = allDocs.some((d) => d.reviewStatus === 'rejected');

    if (allApproved) {
      await db.subcontractor.update({
        where: { id },
        data: { complianceStatus: 'compliant' },
      });
    } else if (anyRejected) {
      await db.subcontractor.update({
        where: { id },
        data: { complianceStatus: 'non_compliant' },
      });
    }

    // Create audit log entry
    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'DOCUMENT_REVIEWED',
        entityType: 'subcontractor_document',
        entityId: documentId,
        entityName: document.fileName,
        details: `Reviewed document "${document.fileName}" for subcontractor: ${reviewStatus}`,
      },
    });

    return NextResponse.json({
      document: {
        id: updated.id,
        fileName: updated.fileName,
        fileType: updated.fileType,
        fileSize: updated.fileSize,
        category: updated.category,
        reviewStatus: updated.reviewStatus,
        reviewedBy: updated.reviewedBy,
        reviewedAt: updated.reviewedAt?.toISOString(),
        reviewNotes: updated.reviewNotes,
        createdAt: updated.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Review subcontractor document error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
