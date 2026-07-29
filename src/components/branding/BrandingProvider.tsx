"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSession } from "next-auth/react";

interface BrandingColors {
  primary: string;
  secondary: string;
  accent: string;
  darkPrimary: string;
  darkSecondary: string;
}

interface BrandingFonts {
  heading: string;
  body: string;
  scale: "compact" | "normal" | "large";
}

interface BrandingPayload {
  id: string;
  name: string;
  primaryColor: string;
  logoUrl: string;
  companyName: string;
  tagline: string;
  brandingConfig?: {
    customLogo?: string;
    customFavicon?: string;
    customColors?: Partial<BrandingColors>;
    customFonts?: Partial<BrandingFonts>;
  };
}

interface BrandingContextValue {
  loading: boolean;
  organizationName: string;
  displayName: string;
  tagline: string;
  logoUrl: string;
  faviconUrl: string;
  colors: BrandingColors;
  fonts: BrandingFonts;
  refreshBranding: () => Promise<void>;
}

const DEFAULT_COLORS: BrandingColors = {
  primary: "#10b981",
  secondary: "#14b8a6",
  accent: "#0d9488",
  darkPrimary: "#059669",
  darkSecondary: "#0f766e",
};

const DEFAULT_FONTS: BrandingFonts = {
  heading: "Geist",
  body: "Geist",
  scale: "normal",
};

const DEFAULT_VALUE: BrandingContextValue = {
  loading: true,
  organizationName: "",
  displayName: "LicenseVault",
  tagline: "",
  logoUrl: "",
  faviconUrl: "",
  colors: DEFAULT_COLORS,
  fonts: DEFAULT_FONTS,
  refreshBranding: async () => undefined,
};

const BrandingContext = createContext<BrandingContextValue>(DEFAULT_VALUE);

function safeHex(value: string | undefined, fallback: string): string {
  return value && /^#[0-9a-fA-F]{6}$/.test(value) ? value : fallback;
}

function safeFont(value: string | undefined, fallback: string): string {
  const allowed = new Set([
    "Geist",
    "Inter",
    "Arial",
    "Helvetica",
    "Roboto",
    "system-ui",
    "sans-serif",
  ]);
  return value && allowed.has(value) ? value : fallback;
}

function setFavicon(url: string) {
  if (!url) return;
  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.href = url;
}

function applyBranding(value: BrandingContextValue) {
  const root = document.documentElement;
  const isDark = root.classList.contains("dark");
  const primary = isDark ? value.colors.darkPrimary : value.colors.primary;
  const secondary = isDark ? value.colors.darkSecondary : value.colors.secondary;

  root.style.setProperty("--brand-primary", primary);
  root.style.setProperty("--brand-secondary", secondary);
  root.style.setProperty("--brand-accent", value.colors.accent);
  root.style.setProperty("--primary", primary);
  root.style.setProperty("--ring", primary);
  root.style.setProperty("--sidebar-primary", primary);
  root.style.setProperty("--font-heading", safeFont(value.fonts.heading, "Geist"));
  root.style.setProperty("--font-body", safeFont(value.fonts.body, "Geist"));
  root.dataset.fontScale = value.fonts.scale;

  const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (themeColor) themeColor.content = primary;
  setFavicon(value.faviconUrl);
}

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const activeOrgId = (session?.user as { activeOrgId?: string } | undefined)
    ?.activeOrgId;
  const [payload, setPayload] = useState<BrandingPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshBranding = useCallback(async () => {
    if (status !== "authenticated") {
      setLoading(status === "loading");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/org/branding", { cache: "no-store" });
      if (!response.ok) throw new Error("Unable to load branding");
      setPayload((await response.json()) as BrandingPayload);
    } catch {
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }, [status, activeOrgId]);

  useEffect(() => {
    refreshBranding();
  }, [refreshBranding]);

  useEffect(() => {
    const handler = () => refreshBranding();
    window.addEventListener("branding-updated", handler);
    return () => window.removeEventListener("branding-updated", handler);
  }, [refreshBranding]);

  const value = useMemo<BrandingContextValue>(() => {
    const config = payload?.brandingConfig;
    const colors = config?.customColors;
    const fonts = config?.customFonts;
    const logoUrl = config?.customLogo || payload?.logoUrl || "";

    return {
      loading,
      organizationName: payload?.name || "",
      displayName: payload?.companyName || payload?.name || "LicenseVault",
      tagline: payload?.tagline || "",
      logoUrl,
      faviconUrl: config?.customFavicon || "",
      colors: {
        primary: safeHex(colors?.primary || payload?.primaryColor, DEFAULT_COLORS.primary),
        secondary: safeHex(colors?.secondary, DEFAULT_COLORS.secondary),
        accent: safeHex(colors?.accent, DEFAULT_COLORS.accent),
        darkPrimary: safeHex(colors?.darkPrimary, DEFAULT_COLORS.darkPrimary),
        darkSecondary: safeHex(colors?.darkSecondary, DEFAULT_COLORS.darkSecondary),
      },
      fonts: {
        heading: safeFont(fonts?.heading, DEFAULT_FONTS.heading),
        body: safeFont(fonts?.body, DEFAULT_FONTS.body),
        scale:
          fonts?.scale === "compact" || fonts?.scale === "large"
            ? fonts.scale
            : "normal",
      },
      refreshBranding,
    };
  }, [loading, payload, refreshBranding]);

  useEffect(() => {
    applyBranding(value);

    const observer = new MutationObserver(() => applyBranding(value));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, [value]);

  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
}

export function useBrandingContext(): BrandingContextValue {
  return useContext(BrandingContext);
}
