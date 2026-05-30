import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { scanCOI, scanLicense, scanBond, scanDocument, readFileAsBuffer } from '@/lib/document-scanner';
import { rateLimit } from '@/lib/rate-limit';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Rate limiter: max 10 scans per hour per user
const scanLimiter = rateLimit({ windowMs: 3600000, maxRequests: 10, key: 'doc-scan' });

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    // Authenticate
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as Record<string, unknown>).id as string;

    // Rate limit check
    const rateCheck = scanLimiter.check(userId);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Maximum 10 scans per hour.', resetIn: rateCheck.resetIn },
        { status: 429 }
      );
    }

    // Parse FormData
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const documentType = (formData.get('documentType') as string) || 'auto';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}. Allowed: JPEG, PNG, WebP, GIF, PDF` },
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

    // Get user's org
    const orgMember = await db.orgMember.findFirst({
      where: { userId },
    });

    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 403 });
    }

    // Save file temporarily
    const uploadsDir = path.join(process.cwd(), 'uploads', 'scans');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const fileExtension = file.name.split('.').pop() || 'jpg';
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;
    const filePath = path.join(uploadsDir, uniqueFileName);

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, fileBuffer);

    // Run VLM scan
    let scanResult;
    try {
      switch (documentType) {
        case 'coi':
          scanResult = await scanCOI(fileBuffer, file.type);
          break;
        case 'license':
          scanResult = await scanLicense(fileBuffer, file.type);
          break;
        case 'bond':
          scanResult = await scanBond(fileBuffer, file.type);
          break;
        default:
          scanResult = await scanDocument(fileBuffer, file.type);
          break;
      }
    } catch (scanError) {
      console.error('VLM scan error:', scanError);
      // Clean up file
      try { fs.unlinkSync(filePath); } catch { /* ignore */ }
      return NextResponse.json(
        { error: 'Failed to scan document. The image may be too low quality or the VLM service is unavailable.' },
        { status: 500 }
      );
    }

    // Clean up temporary file
    try { fs.unlinkSync(filePath); } catch { /* ignore */ }

    // Save scan result to database
    const documentScan = await db.documentScan.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        documentType: scanResult.documentType,
        extractedData: JSON.stringify({
          coi: scanResult.coi,
          license: scanResult.license,
          bond: scanResult.bond,
        }),
        rawText: scanResult.rawText,
        confidence: scanResult.confidence,
        status: 'completed',
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'create',
        entityType: 'document_scan',
        entityId: documentScan.id,
        entityName: file.name,
        details: `Scanned document as ${scanResult.documentType} with ${scanResult.confidence}% confidence`,
      },
    });

    return NextResponse.json({
      id: documentScan.id,
      documentType: scanResult.documentType,
      coi: scanResult.coi,
      license: scanResult.license,
      bond: scanResult.bond,
      rawText: scanResult.rawText,
      confidence: scanResult.confidence,
      createdAt: documentScan.createdAt,
    });
  } catch (error) {
    console.error('Document scan API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as Record<string, unknown>).id as string;

    // Get user's org
    const orgMember = await db.orgMember.findFirst({
      where: { userId },
    });

    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 403 });
    }

    // Get recent scans for the org
    const scans = await db.documentScan.findMany({
      where: { orgId: orgMember.orgId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const formattedScans = scans.map((scan) => ({
      id: scan.id,
      fileName: scan.fileName,
      fileType: scan.fileType,
      fileSize: scan.fileSize,
      documentType: scan.documentType,
      extractedData: JSON.parse(scan.extractedData),
      rawText: scan.rawText,
      confidence: scan.confidence,
      status: scan.status,
      createdAt: scan.createdAt,
    }));

    return NextResponse.json({ scans: formattedScans });
  } catch (error) {
    console.error('Get scan history error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
