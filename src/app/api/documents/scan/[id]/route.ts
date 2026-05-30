import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as Record<string, unknown>).id as string;
    const { id } = await params;

    // Get user's org
    const orgMember = await db.orgMember.findFirst({
      where: { userId },
    });

    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 403 });
    }

    // Get the specific scan
    const scan = await db.documentScan.findFirst({
      where: { id, orgId: orgMember.orgId },
    });

    if (!scan) {
      return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
    }

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error('Get scan result error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
