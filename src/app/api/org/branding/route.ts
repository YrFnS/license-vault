import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { canManageOrganization, getOrgContext } from "@/lib/org-context";

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const assetUrl = z
  .string()
  .max(2_000)
  .refine(
    (value) =>
      value === "" ||
      value.startsWith("/") ||
      (() => {
        try {
          return new URL(value).protocol === "https:";
        } catch {
          return false;
        }
      })(),
    "Asset URL must be empty, same-origin, or use HTTPS",
  );

const brandingConfigSchema = z.object({
  customLogo: assetUrl.optional(),
  customFavicon: assetUrl.optional(),
  customColors: z
    .object({
      primary: hexColor.optional(),
      secondary: hexColor.optional(),
      accent: hexColor.optional(),
      darkPrimary: hexColor.optional(),
      darkSecondary: hexColor.optional(),
    })
    .optional(),
  customFonts: z
    .object({
      heading: z.string().max(100).optional(),
      body: z.string().max(100).optional(),
      scale: z.enum(["compact", "normal", "large"]).optional(),
    })
    .optional(),
  loginPage: z
    .object({
      backgroundImage: assetUrl.optional(),
      title: z.string().max(200).optional(),
      subtitle: z.string().max(500).optional(),
      leftPanelColor: hexColor.or(z.literal("")).optional(),
      showSocialLogin: z.boolean().optional(),
      welcomeMessage: z.string().max(1_000).optional(),
    })
    .optional(),
  emailTemplates: z
    .object({
      headerColor: hexColor.optional(),
      footerText: z.string().max(1_000).optional(),
      showLogo: z.boolean().optional(),
      signature: z.string().max(2_000).optional(),
    })
    .optional(),
  portal: z
    .object({
      subdomain: z.string().max(100).optional(),
      welcomeMessage: z.string().max(1_000).optional(),
      showComplianceScore: z.boolean().optional(),
      showContactInfo: z.boolean().optional(),
      footerText: z.string().max(1_000).optional(),
    })
    .optional(),
  customCSS: z.string().max(25_000).optional(),
});

const brandingUpdateSchema = z.object({
  primaryColor: hexColor.optional(),
  logoUrl: assetUrl.optional(),
  companyName: z.string().max(200).optional(),
  tagline: z.string().max(500).optional(),
  brandingConfig: brandingConfigSchema.optional(),
});

const DEFAULT_BRANDING = {
  customLogo: "",
  customFavicon: "",
  customColors: {
    primary: "#10b981",
    secondary: "#14b8a6",
    accent: "#0d9488",
    darkPrimary: "#059669",
    darkSecondary: "#0f766e",
  },
  customFonts: { heading: "Inter", body: "Inter", scale: "normal" },
  loginPage: {
    backgroundImage: "",
    title: "",
    subtitle: "",
    leftPanelColor: "",
    showSocialLogin: true,
    welcomeMessage: "",
  },
  emailTemplates: {
    headerColor: "#10b981",
    footerText: "",
    showLogo: true,
    signature: "",
  },
  portal: {
    subdomain: "",
    welcomeMessage: "",
    showComplianceScore: true,
    showContactInfo: true,
    footerText: "",
  },
  customCSS: "",
  tagline: "",
};

function parseBrandingConfig(raw: string | null) {
  if (!raw) return DEFAULT_BRANDING;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const validated = brandingConfigSchema.safeParse(parsed);
    const value = validated.success ? validated.data : {};
    return {
      customLogo: value.customLogo || DEFAULT_BRANDING.customLogo,
      customFavicon: value.customFavicon || DEFAULT_BRANDING.customFavicon,
      customColors: { ...DEFAULT_BRANDING.customColors, ...(value.customColors || {}) },
      customFonts: { ...DEFAULT_BRANDING.customFonts, ...(value.customFonts || {}) },
      loginPage: { ...DEFAULT_BRANDING.loginPage, ...(value.loginPage || {}) },
      emailTemplates: {
        ...DEFAULT_BRANDING.emailTemplates,
        ...(value.emailTemplates || {}),
      },
      portal: { ...DEFAULT_BRANDING.portal, ...(value.portal || {}) },
      customCSS: value.customCSS || DEFAULT_BRANDING.customCSS,
      tagline: typeof parsed.tagline === "string" ? parsed.tagline : "",
    };
  } catch {
    return DEFAULT_BRANDING;
  }
}

export async function GET() {
  try {
    const context = await getOrgContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const org = await db.organization.findUnique({
      where: { id: context.orgId },
    });
    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const brandingConfig = parseBrandingConfig(org.brandingConfig);
    return NextResponse.json(
      {
        id: org.id,
        name: org.name,
        primaryColor: org.primaryColor || "#10b981",
        logoUrl: org.logoUrl || "",
        companyName: org.companyName || "",
        tagline: brandingConfig.tagline || "",
        brandingConfig,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Error fetching branding config:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const context = await getOrgContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!canManageOrganization(context.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const validated = brandingUpdateSchema.safeParse(await request.json());
    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten() },
        { status: 400 },
      );
    }

    const existingOrg = await db.organization.findUnique({
      where: { id: context.orgId },
    });
    if (!existingOrg) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const existingConfig = parseBrandingConfig(existingOrg.brandingConfig);
    const incoming = validated.data.brandingConfig;
    const mergedConfig = {
      ...existingConfig,
      ...(incoming || {}),
      customColors: {
        ...existingConfig.customColors,
        ...(incoming?.customColors || {}),
      },
      customFonts: {
        ...existingConfig.customFonts,
        ...(incoming?.customFonts || {}),
      },
      loginPage: {
        ...existingConfig.loginPage,
        ...(incoming?.loginPage || {}),
      },
      emailTemplates: {
        ...existingConfig.emailTemplates,
        ...(incoming?.emailTemplates || {}),
      },
      portal: { ...existingConfig.portal, ...(incoming?.portal || {}) },
      ...(validated.data.tagline !== undefined
        ? { tagline: validated.data.tagline }
        : {}),
    };

    const org = await db.$transaction(async (transaction) => {
      const updated = await transaction.organization.update({
        where: { id: context.orgId },
        data: {
          brandingConfig: JSON.stringify(mergedConfig),
          ...(validated.data.primaryColor !== undefined
            ? { primaryColor: validated.data.primaryColor }
            : {}),
          ...(validated.data.logoUrl !== undefined
            ? { logoUrl: validated.data.logoUrl || null }
            : {}),
          ...(validated.data.companyName !== undefined
            ? { companyName: validated.data.companyName }
            : {}),
        },
      });

      await transaction.auditLog.create({
        data: {
          orgId: context.orgId,
          userId: context.userId,
          action: "update",
          entityType: "branding",
          entityId: updated.id,
          entityName: "Branding Configuration",
          details: JSON.stringify({ updatedFields: Object.keys(validated.data) }),
        },
      });
      return updated;
    });

    const brandingConfig = parseBrandingConfig(org.brandingConfig);
    return NextResponse.json({
      id: org.id,
      name: org.name,
      primaryColor: org.primaryColor || "#10b981",
      logoUrl: org.logoUrl || "",
      companyName: org.companyName || "",
      tagline: brandingConfig.tagline || "",
      brandingConfig,
    });
  } catch (error) {
    console.error("Error updating branding config:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
