import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const brandingConfigSchema = z.object({
  customLogo: z.string().optional(),
  customFavicon: z.string().optional(),
  customColors: z.object({
    primary: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    secondary: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    accent: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    darkPrimary: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    darkSecondary: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  }).optional(),
  customFonts: z.object({
    heading: z.string().optional(),
    body: z.string().optional(),
    scale: z.enum(['compact', 'normal', 'large']).optional(),
  }).optional(),
  loginPage: z.object({
    backgroundImage: z.string().optional(),
    title: z.string().optional(),
    subtitle: z.string().optional(),
    leftPanelColor: z.string().optional(),
    showSocialLogin: z.boolean().optional(),
    welcomeMessage: z.string().optional(),
  }).optional(),
  emailTemplates: z.object({
    headerColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    footerText: z.string().optional(),
    showLogo: z.boolean().optional(),
    signature: z.string().optional(),
  }).optional(),
  portal: z.object({
    subdomain: z.string().optional(),
    welcomeMessage: z.string().optional(),
    showComplianceScore: z.boolean().optional(),
    showContactInfo: z.boolean().optional(),
    footerText: z.string().optional(),
  }).optional(),
  customCSS: z.string().optional(),
  customHeadJS: z.string().optional(),
  customBodyJS: z.string().optional(),
});

const brandingUpdateSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  logoUrl: z.string().url().or(z.literal('')).optional(),
  companyName: z.string().optional(),
  tagline: z.string().optional(),
  brandingConfig: brandingConfigSchema.optional(),
});

const DEFAULT_BRANDING = {
  customLogo: '',
  customFavicon: '',
  customColors: {
    primary: '#10b981',
    secondary: '#14b8a6',
    accent: '#0d9488',
    darkPrimary: '#059669',
    darkSecondary: '#0f766e',
  },
  customFonts: {
    heading: 'Inter',
    body: 'Inter',
    scale: 'normal',
  },
  loginPage: {
    backgroundImage: '',
    title: '',
    subtitle: '',
    leftPanelColor: '',
    showSocialLogin: true,
    welcomeMessage: '',
  },
  emailTemplates: {
    headerColor: '#10b981',
    footerText: '',
    showLogo: true,
    signature: '',
  },
  portal: {
    subdomain: '',
    welcomeMessage: '',
    showComplianceScore: true,
    showContactInfo: true,
    footerText: '',
  },
  customCSS: '',
  customHeadJS: '',
  customBodyJS: '',
};

async function getUserOrg(session: unknown) {
  const s = session as { user?: { email?: string } } | null;
  if (!s?.user?.email) return null;
  const member = await db.orgMember.findFirst({
    where: { email: s.user.email },
    include: { org: true },
    orderBy: { invitedAt: 'desc' },
  });
  return member;
}

function parseBrandingConfig(raw: string | null) {
  if (!raw) return DEFAULT_BRANDING;
  try {
    const parsed = JSON.parse(raw);
    return {
      customLogo: parsed.customLogo || DEFAULT_BRANDING.customLogo,
      customFavicon: parsed.customFavicon || DEFAULT_BRANDING.customFavicon,
      customColors: { ...DEFAULT_BRANDING.customColors, ...(parsed.customColors || {}) },
      customFonts: { ...DEFAULT_BRANDING.customFonts, ...(parsed.customFonts || {}) },
      loginPage: { ...DEFAULT_BRANDING.loginPage, ...(parsed.loginPage || {}) },
      emailTemplates: { ...DEFAULT_BRANDING.emailTemplates, ...(parsed.emailTemplates || {}) },
      portal: { ...DEFAULT_BRANDING.portal, ...(parsed.portal || {}) },
      customCSS: parsed.customCSS || DEFAULT_BRANDING.customCSS,
      customHeadJS: parsed.customHeadJS || DEFAULT_BRANDING.customHeadJS,
      customBodyJS: parsed.customBodyJS || DEFAULT_BRANDING.customBodyJS,
    };
  } catch {
    return DEFAULT_BRANDING;
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const member = await getUserOrg(session);
    if (!member) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const org = await db.organization.findUnique({
      where: { id: member.orgId },
    });

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const brandingConfig = parseBrandingConfig(org.brandingConfig);

    return NextResponse.json({
      id: org.id,
      name: org.name,
      primaryColor: org.primaryColor || '#10b981',
      logoUrl: org.logoUrl || '',
      companyName: org.companyName || '',
      tagline: (brandingConfig as Record<string, unknown>).tagline || '',
      brandingConfig,
    });
  } catch (error) {
    console.error('Error fetching branding config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const member = await getUserOrg(session);
    if (!member) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    if (member.role !== 'owner' && member.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validated = brandingUpdateSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const data = validated.data;

    // Build the brandingConfig JSON, merging with existing
    const existingOrg = await db.organization.findUnique({
      where: { id: member.orgId },
    });
    const existingConfig = parseBrandingConfig(existingOrg?.brandingConfig || null);

    let mergedConfig = existingConfig;
    if (data.brandingConfig) {
      mergedConfig = {
        ...existingConfig,
        ...data.brandingConfig,
        customColors: { ...existingConfig.customColors, ...(data.brandingConfig.customColors || {}) },
        customFonts: { ...existingConfig.customFonts, ...(data.brandingConfig.customFonts || {}) },
        loginPage: { ...existingConfig.loginPage, ...(data.brandingConfig.loginPage || {}) },
        emailTemplates: { ...existingConfig.emailTemplates, ...(data.brandingConfig.emailTemplates || {}) },
        portal: { ...existingConfig.portal, ...(data.brandingConfig.portal || {}) },
      };
    }

    // Include tagline in branding config
    if (data.tagline !== undefined) {
      (mergedConfig as Record<string, unknown>).tagline = data.tagline;
    }

    // Build update data
    const updateData: Record<string, unknown> = {
      brandingConfig: JSON.stringify(mergedConfig),
    };
    if (data.primaryColor !== undefined) updateData.primaryColor = data.primaryColor;
    if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl;
    if (data.companyName !== undefined) updateData.companyName = data.companyName;

    const org = await db.organization.update({
      where: { id: member.orgId },
      data: updateData,
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        orgId: member.orgId,
        userId: (session.user as Record<string, unknown>).id as string | undefined,
        action: 'update',
        entityType: 'branding',
        entityId: org.id,
        entityName: 'Branding Configuration',
        details: JSON.stringify({ updatedFields: Object.keys(data) }),
      },
    });

    const brandingConfig = parseBrandingConfig(org.brandingConfig);

    return NextResponse.json({
      id: org.id,
      name: org.name,
      primaryColor: org.primaryColor || '#10b981',
      logoUrl: org.logoUrl || '',
      companyName: org.companyName || '',
      tagline: (brandingConfig as Record<string, unknown>).tagline || '',
      brandingConfig,
    });
  } catch (error) {
    console.error('Error updating branding config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
