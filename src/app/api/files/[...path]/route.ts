import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { readFile, stat } from 'fs/promises';
import path from 'path';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

function getContentType(fileType: string): string {
  const mimeTypes: Record<string, string> = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };
  return mimeTypes[fileType.toLowerCase()] || 'application/octet-stream';
}

function isInlineViewable(fileType: string): boolean {
  return ['pdf', 'jpg', 'jpeg', 'png'].includes(fileType.toLowerCase());
}

// GET: Serve a file from the uploads directory
export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { path: pathSegments } = await params;

    // Reconstruct the file path from the catch-all route
    const filePath = pathSegments.join('/');

    // Security: prevent path traversal
    if (filePath.includes('..') || filePath.startsWith('/') || filePath.includes('\\')) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
    }

    // Find user's org membership
    const orgMember = await db.orgMember.findFirst({
      where: { userId },
    });

    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    // Look up the document in the database by filePath to verify orgId
    const document = await db.licenseDocument.findFirst({
      where: {
        filePath,
        orgId: orgMember.orgId,
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Read the file from disk
    const fullFilePath = path.join(UPLOADS_DIR, filePath);
    let fileBuffer: Buffer;
    try {
      fileBuffer = await readFile(fullFilePath);
    } catch {
      return NextResponse.json({ error: 'File not found on disk' }, { status: 404 });
    }

    // Get file stats for Content-Length
    let fileSize = fileBuffer.length;
    try {
      const fileStat = await stat(fullFilePath);
      fileSize = fileStat.size;
    } catch {
      // Use buffer length as fallback
    }

    // Determine content type
    const contentType = getContentType(document.fileType);

    // Check if download is forced via query param
    const url = new URL(request.url);
    const forceDownload = url.searchParams.get('download') === 'true';

    // Set Content-Disposition based on file type and download param
    const contentDisposition = forceDownload || !isInlineViewable(document.fileType)
      ? `attachment; filename="${document.fileName}"`
      : `inline; filename="${document.fileName}"`;

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': contentDisposition,
        'Content-Length': fileSize.toString(),
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Serve file error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
