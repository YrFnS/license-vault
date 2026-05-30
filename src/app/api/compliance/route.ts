import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import crypto from 'crypto';
import { z } from 'zod';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Get user's org
    const membership = await db.orgMember.findFirst({
      where: { userId },
      include: { org: true },
    });

    if (!membership) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    // Generate unique token
    const token = crypto.randomBytes(16).toString('hex');

    const share = await db.complianceShare.create({
      data: {
        orgId: membership.orgId,
        token,
        createdBy: userId,
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        orgId: membership.orgId,
        userId,
        action: 'CREATE',
        entityType: 'ComplianceShare',
        entityId: share.id,
        entityName: 'Compliance Share Link',
        details: 'Generated compliance share link',
      },
    });

    return NextResponse.json({
      id: share.id,
      token: share.token,
      createdAt: share.createdAt.toISOString(),
    }, { status: 201 });
  } catch (error) {
    console.error('Create compliance share error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Get user's org
    const membership = await db.orgMember.findFirst({
      where: { userId },
    });

    if (!membership) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const shares = await db.complianceShare.findMany({
      where: { orgId: membership.orgId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        token: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      shares: shares.map((s) => ({
        id: s.id,
        token: s.token,
        createdAt: s.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Get compliance shares error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
