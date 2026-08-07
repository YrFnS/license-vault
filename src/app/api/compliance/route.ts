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

export async function GET(request: Request) {
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

    if (new URL(request.url).searchParams.get('type') === 'score') {
      const now = new Date();
      const [licenses, insuranceBonds, ceTrackings, documentCount] = await Promise.all([
        db.license.findMany({
          where: { orgId: membership.orgId },
          select: { id: true, name: true, expirationDate: true },
        }),
        db.insuranceBond.findMany({
          where: { orgId: membership.orgId },
          select: { expirationDate: true, status: true },
        }),
        db.cETracking.findMany({
          where: { orgId: membership.orgId },
          select: { hoursEarned: true, hoursRequired: true },
        }),
        db.licenseDocument.count({ where: { orgId: membership.orgId } }),
      ]);
      const activeLicenses = licenses.filter((license) => license.expirationDate >= now);
      const activeInsurance = insuranceBonds.filter(
        (bond) => bond.expirationDate >= now && bond.status === 'active',
      );
      const completedCe = ceTrackings.filter((record) => record.hoursEarned >= record.hoursRequired);
      const score = (active: number, total: number) => total ? Math.round((active / total) * 100) : 0;
      const licenseScore = score(activeLicenses.length, licenses.length);
      const insuranceScore = score(activeInsurance.length, insuranceBonds.length);
      const ceScore = score(completedCe.length, ceTrackings.length);
      const documentScore = licenses.length ? score(documentCount, licenses.length) : 0;
      const scored = [licenseScore, insuranceScore, ceScore, documentScore].filter((value, index) => [licenses.length, insuranceBonds.length, ceTrackings.length, documentCount][index] > 0);
      const overallScore = scored.length ? Math.round(scored.reduce((sum, value) => sum + value, 0) / scored.length) : 0;
      const atRiskItems = licenses
        .filter((license) => license.expirationDate < now || license.expirationDate.getTime() - now.getTime() <= 30 * 86400000)
        .map((license) => ({
          id: license.id,
          name: license.name,
          type: 'license',
          expirationDate: license.expirationDate.toISOString(),
          status: license.expirationDate < now ? 'expired' : 'expiring',
          daysUntil: Math.ceil((license.expirationDate.getTime() - now.getTime()) / 86400000),
        }));

      return NextResponse.json({
        overallScore,
        trend: 'same',
        trendDelta: 0,
        breakdown: {
          license: { score: licenseScore, total: licenses.length, active: activeLicenses.length },
          insurance: { score: insuranceScore, total: insuranceBonds.length, active: activeInsurance.length },
          ce: { score: ceScore, total: ceTrackings.length, active: completedCe.length },
          documents: { score: documentScore, total: licenses.length, active: documentCount },
        },
        atRiskItems,
        recommendations: [],
        history: [],
      });
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
