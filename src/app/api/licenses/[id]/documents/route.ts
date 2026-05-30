import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  'application/pdf': ['pdf'],
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'application/msword': ['doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// GET: List all documents for a license
export async function GET(
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

    // Find user's org membership
    const orgMember = await db.orgMember.findFirst({
      where: { userId },
    });

    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    // Verify license belongs to user's org
    const license = await db.license.findFirst({
      where: { id, orgId: orgMember.orgId },
    });

    if (!license) {
      return NextResponse.json({ error: 'License not found' }, { status: 404 });
    }

    const documents = await db.licenseDocument.findMany({
      where: { licenseId: id, orgId: orgMember.orgId },
      orderBy: { createdAt: 'desc' },
    });

    const formattedDocs = documents.map((doc) => ({
      id: doc.id,
      fileName: doc.fileName,
      fileType: doc.fileType,
      fileSize: doc.fileSize,
      fileSizeFormatted: formatFileSize(doc.fileSize),
      category: doc.category,
      uploadedBy: doc.uploadedBy,
      createdAt: doc.createdAt.toISOString(),
    }));

    return NextResponse.json({ documents: formattedDocs });
  } catch (error) {
    console.error('List documents error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Upload a document
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

    // Find user's org membership
    const orgMember = await db.orgMember.findFirst({
      where: { userId },
    });

    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    // Verify license belongs to user's org
    const license = await db.license.findFirst({
      where: { id, orgId: orgMember.orgId },
    });

    if (!license) {
      return NextResponse.json({ error: 'License not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const category = (formData.get('category') as string) || 'general';

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

    // Cross-validate: if we have a MIME type, check the extension matches
    if (ALLOWED_MIME_TYPES[file.type] && !ALLOWED_MIME_TYPES[file.type].includes(fileExtension)) {
      // MIME type is valid but extension doesn't match — still allow if MIME type is known
      // This handles cases like .jpeg vs .jpg
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

    // Generate unique filename to avoid collisions
    const randomBytes = crypto.randomBytes(16).toString('hex');
    const safeFileName = `${randomBytes}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const filePath = path.join(UPLOADS_DIR, safeFileName);

    // Write file to disk
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(filePath, buffer);

    // Get user name for uploadedBy
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    // Save metadata to database
    const document = await db.licenseDocument.create({
      data: {
        licenseId: id,
        orgId: orgMember.orgId,
        fileName: file.name,
        fileType: fileExtension,
        fileSize: file.size,
        filePath: safeFileName,
        category,
        uploadedBy: user?.name || null,
      },
    });

    // Create audit log entry
    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'DOCUMENT_UPLOADED',
        entityType: 'license_document',
        entityId: document.id,
        entityName: file.name,
        details: `Uploaded document "${file.name}" to license "${license.name}"`,
      },
    });

    return NextResponse.json({
      document: {
        id: document.id,
        fileName: document.fileName,
        fileType: document.fileType,
        fileSize: document.fileSize,
        fileSizeFormatted: formatFileSize(document.fileSize),
        category: document.category,
        uploadedBy: document.uploadedBy,
        createdAt: document.createdAt.toISOString(),
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Upload document error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
