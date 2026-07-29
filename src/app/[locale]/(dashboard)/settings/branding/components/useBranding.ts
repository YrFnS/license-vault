import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { DEFAULT_COLORS, THEME_PRESETS } from "./constants";
import type {
  BrandingColors,
  BrandingConfig,
  BrandingData,
  BrandingEmailTemplates,
  BrandingFonts,
  BrandingLoginPage,
  BrandingPortal,
} from "./types";

const DEFAULT_FONTS: BrandingFonts = {
  heading: "Inter",
  body: "Inter",
  scale: "normal",
};

const DEFAULT_LOGIN_PAGE: BrandingLoginPage = {
  backgroundImage: "",
  title: "",
  subtitle: "",
  leftPanelColor: "",
  showSocialLogin: true,
  welcomeMessage: "",
};

const DEFAULT_EMAIL_TEMPLATES: BrandingEmailTemplates = {
  headerColor: "#10b981",
  footerText: "",
  showLogo: true,
  signature: "",
};

const DEFAULT_PORTAL: BrandingPortal = {
  subdomain: "",
  welcomeMessage: "",
  showComplianceScore: true,
  showContactInfo: true,
  footerText: "",
};

export function useBranding(t: (key: string) => string) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [primaryColor, setPrimaryColor] = useState("#10b981");
  const [logoUrl, setLogoUrl] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [tagline, setTagline] = useState("");
  const [customLogo, setCustomLogo] = useState("");
  const [customFavicon, setCustomFavicon] = useState("");
  const [colors, setColors] = useState<BrandingColors>(DEFAULT_COLORS);
  const [fonts, setFonts] = useState<BrandingFonts>(DEFAULT_FONTS);
  const [loginPage, setLoginPage] =
    useState<BrandingLoginPage>(DEFAULT_LOGIN_PAGE);
  const [emailTemplates, setEmailTemplates] =
    useState<BrandingEmailTemplates>(DEFAULT_EMAIL_TEMPLATES);
  const [portal, setPortal] = useState<BrandingPortal>(DEFAULT_PORTAL);
  const [customCSS, setCustomCSS] = useState("");

  const fetchBranding = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/org/branding", { cache: "no-store" });
      if (!response.ok) return;

      const data: BrandingData = await response.json();
      const config = data.brandingConfig;
      setPrimaryColor(data.primaryColor || "#10b981");
      setLogoUrl(data.logoUrl || "");
      setCompanyName(data.companyName || "");
      setTagline(data.tagline || "");
      setCustomLogo(config.customLogo || "");
      setCustomFavicon(config.customFavicon || "");
      setColors({ ...DEFAULT_COLORS, ...(config.customColors || {}) });
      setFonts({ ...DEFAULT_FONTS, ...(config.customFonts || {}) });
      setLoginPage({ ...DEFAULT_LOGIN_PAGE, ...(config.loginPage || {}) });
      setEmailTemplates({
        ...DEFAULT_EMAIL_TEMPLATES,
        ...(config.emailTemplates || {}),
      });
      setPortal({ ...DEFAULT_PORTAL, ...(config.portal || {}) });
      setCustomCSS(config.customCSS || "");
    } catch {
      toast.error("Failed to load branding");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBranding();
  }, [fetchBranding]);

  const buildPayload = () => ({
    primaryColor,
    logoUrl,
    companyName,
    tagline,
    brandingConfig: {
      customLogo,
      customFavicon,
      customColors: colors,
      customFonts: fonts,
      loginPage,
      emailTemplates,
      portal,
      customCSS,
    },
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/org/branding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });

      if (response.ok) {
        toast.success(t("saveSuccess"));
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to save branding");
      }
    } catch {
      toast.error("Failed to save branding");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/org/branding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primaryColor: "#10b981",
          logoUrl: "",
          companyName: "",
          tagline: "",
          brandingConfig: {
            customLogo: "",
            customFavicon: "",
            customColors: DEFAULT_COLORS,
            customFonts: DEFAULT_FONTS,
            loginPage: DEFAULT_LOGIN_PAGE,
            emailTemplates: DEFAULT_EMAIL_TEMPLATES,
            portal: DEFAULT_PORTAL,
            customCSS: "",
          },
        }),
      });

      if (response.ok) {
        await fetchBranding();
        toast.success(t("resetSuccess"));
      } else {
        toast.error("Failed to reset branding");
      }
    } catch {
      toast.error("Failed to reset branding");
    } finally {
      setSaving(false);
    }
  };

  const handleExportBranding = () => {
    const blob = new Blob([JSON.stringify(buildPayload(), null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "branding-config.json";
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success(t("exportSuccess"));
  };

  const handleImportBranding = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        try {
          const data = JSON.parse(
            String(loadEvent.target?.result || "{}"),
          ) as Partial<BrandingData> & {
            brandingConfig?: Partial<BrandingConfig>;
          };

          if (data.primaryColor) setPrimaryColor(data.primaryColor);
          if (data.logoUrl !== undefined) setLogoUrl(data.logoUrl);
          if (data.companyName !== undefined) setCompanyName(data.companyName);
          if (data.tagline !== undefined) setTagline(data.tagline);

          const config = data.brandingConfig;
          if (config) {
            if (config.customLogo !== undefined) setCustomLogo(config.customLogo);
            if (config.customFavicon !== undefined)
              setCustomFavicon(config.customFavicon);
            if (config.customColors)
              setColors({ ...DEFAULT_COLORS, ...config.customColors });
            if (config.customFonts)
              setFonts({ ...DEFAULT_FONTS, ...config.customFonts });
            if (config.loginPage)
              setLoginPage({ ...DEFAULT_LOGIN_PAGE, ...config.loginPage });
            if (config.emailTemplates)
              setEmailTemplates({
                ...DEFAULT_EMAIL_TEMPLATES,
                ...config.emailTemplates,
              });
            if (config.portal)
              setPortal({ ...DEFAULT_PORTAL, ...config.portal });
            if (config.customCSS !== undefined) setCustomCSS(config.customCSS);
          }
          toast.success(t("importSuccess"));
        } catch {
          toast.error("Invalid JSON file");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const applyPreset = (presetKey: string) => {
    const preset = THEME_PRESETS[presetKey];
    if (!preset) return;
    setColors(preset);
    setPrimaryColor(preset.primary);
  };

  return {
    loading,
    saving,
    primaryColor,
    setPrimaryColor,
    logoUrl,
    setLogoUrl,
    companyName,
    setCompanyName,
    tagline,
    setTagline,
    customLogo,
    setCustomLogo,
    customFavicon,
    setCustomFavicon,
    colors,
    setColors,
    fonts,
    setFonts,
    loginPage,
    setLoginPage,
    emailTemplates,
    setEmailTemplates,
    portal,
    setPortal,
    customCSS,
    setCustomCSS,
    fetchBranding,
    handleSave,
    handleReset,
    handleExportBranding,
    handleImportBranding,
    applyPreset,
  };
}
