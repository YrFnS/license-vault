'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Palette,
  Upload,
  Type,
  Image as ImageIcon,
  Mail,
  Globe,
  Code2,
  Loader2,
  Download,
  RotateCcw,
  Paintbrush,
  Check,
  Monitor,
  Eye,
  Sun,
  Moon,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

// Types
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
  scale: 'compact' | 'normal' | 'large';
}

interface BrandingLoginPage {
  backgroundImage: string;
  title: string;
  subtitle: string;
  leftPanelColor: string;
  showSocialLogin: boolean;
  welcomeMessage: string;
}

interface BrandingEmailTemplates {
  headerColor: string;
  footerText: string;
  showLogo: boolean;
  signature: string;
}

interface BrandingPortal {
  subdomain: string;
  welcomeMessage: string;
  showComplianceScore: boolean;
  showContactInfo: boolean;
  footerText: string;
}

interface BrandingConfig {
  customLogo: string;
  customFavicon: string;
  customColors: BrandingColors;
  customFonts: BrandingFonts;
  loginPage: BrandingLoginPage;
  emailTemplates: BrandingEmailTemplates;
  portal: BrandingPortal;
  customCSS: string;
  customHeadJS: string;
  customBodyJS: string;
  tagline?: string;
}

interface BrandingData {
  id: string;
  name: string;
  primaryColor: string;
  logoUrl: string;
  companyName: string;
  tagline: string;
  brandingConfig: BrandingConfig;
}

const DEFAULT_COLORS: BrandingColors = {
  primary: '#10b981',
  secondary: '#14b8a6',
  accent: '#0d9488',
  darkPrimary: '#059669',
  darkSecondary: '#0f766e',
};

const THEME_PRESETS: Record<string, BrandingColors> = {
  emerald: { primary: '#10b981', secondary: '#14b8a6', accent: '#0d9488', darkPrimary: '#059669', darkSecondary: '#0f766e' },
  teal: { primary: '#14b8a6', secondary: '#0d9488', accent: '#0f766e', darkPrimary: '#0d9488', darkSecondary: '#115e59' },
  rose: { primary: '#f43f5e', secondary: '#e11d48', accent: '#be123c', darkPrimary: '#e11d48', darkSecondary: '#9f1239' },
  amber: { primary: '#f59e0b', secondary: '#d97706', accent: '#b45309', darkPrimary: '#d97706', darkSecondary: '#92400e' },
  slate: { primary: '#64748b', secondary: '#475569', accent: '#334155', darkPrimary: '#475569', darkSecondary: '#1e293b' },
};

const FONT_OPTIONS = ['Inter', 'Roboto', 'Poppins', 'Montserrat', 'Open Sans', 'Lato', 'Nunito', 'Source Sans Pro'];

const fadeIn = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.2 },
};

// Color Picker Component
function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="size-9 rounded-md border border-border cursor-pointer appearance-none bg-transparent [&::-webkit-color-swatch-wrapper]:p-0.5 [&::-webkit-color-swatch]:rounded-sm [&::-webkit-color-swatch]:border-none"
        />
      </div>
      <Input
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onChange(v);
        }}
        className="w-24 font-mono text-sm"
        maxLength={7}
      />
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}

// Mini Preview Card
function MiniPreview({ colors, font, companyName }: { colors: BrandingColors; font: BrandingFonts; companyName: string }) {
  const scaleMap = { compact: '0.75', normal: '0.875', large: '1' };
  const s = scaleMap[font.scale] || '0.875';

  return (
    <div
      className="rounded-lg border border-border overflow-hidden shadow-sm"
      style={{ transform: `scale(${s})`, transformOrigin: 'top start' }}
    >
      {/* Header bar */}
      <div className="h-8 flex items-center px-3 gap-2" style={{ backgroundColor: colors.primary }}>
        <div className="size-4 rounded bg-white/30" />
        <div className="h-2 w-16 rounded bg-white/40" />
        <div className="ms-auto flex gap-1">
          <div className="size-2 rounded-full bg-white/30" />
          <div className="size-2 rounded-full bg-white/30" />
        </div>
      </div>
      {/* Body */}
      <div className="p-3 bg-background space-y-2">
        <div className="h-2 w-24 rounded bg-foreground/20" style={{ fontFamily: font.heading }} />
        <div className="h-1.5 w-full rounded bg-muted" />
        <div className="h-1.5 w-3/4 rounded bg-muted" />
        <div className="flex gap-2 mt-2">
          <div className="h-6 w-16 rounded text-[8px] flex items-center justify-center text-white" style={{ backgroundColor: colors.primary, fontFamily: font.body }}>
            Button
          </div>
          <div className="h-6 w-16 rounded border border-border text-[8px] flex items-center justify-center" style={{ fontFamily: font.body }}>
            Cancel
          </div>
        </div>
        <div className="flex gap-2 mt-1">
          <div className="flex-1 h-12 rounded border border-border p-1.5 space-y-1">
            <div className="h-1 w-8 rounded bg-muted" />
            <div className="h-4 w-full rounded bg-muted/60" />
          </div>
          <div className="flex-1 h-12 rounded border border-border p-1.5 space-y-1">
            <div className="h-1 w-8 rounded bg-muted" />
            <div className="h-4 w-full rounded" style={{ backgroundColor: `${colors.secondary}33` }} />
          </div>
        </div>
      </div>
      {/* Footer */}
      <div className="h-5 flex items-center px-3 border-t border-border">
        <div className="h-1.5 w-20 rounded bg-muted" />
        <div className="ms-auto h-1.5 w-12 rounded" style={{ backgroundColor: `${colors.accent}66` }} />
      </div>
      {companyName && (
        <div className="text-[6px] text-center py-0.5 text-muted-foreground" style={{ fontFamily: font.body }}>
          {companyName}
        </div>
      )}
    </div>
  );
}

// Login Page Preview Card
function LoginPagePreview({ config, primaryColor }: { config: BrandingLoginPage; primaryColor: string }) {
  return (
    <div className="rounded-lg border border-border overflow-hidden shadow-sm aspect-[4/3] flex">
      {/* Left panel */}
      <div
        className="w-2/5 p-3 flex flex-col justify-center items-center text-white"
        style={{ backgroundColor: config.leftPanelColor || primaryColor }}
      >
        <div className="size-6 rounded-full bg-white/30 mb-1.5" />
        <div className="h-1.5 w-16 rounded bg-white/70 text-center text-[5px] leading-[6px]">
          {config.title || 'Welcome Back'}
        </div>
        <div className="h-1 w-12 rounded bg-white/30 mt-1 text-[4px] leading-[4px] text-center">
          {config.subtitle || 'Sign in to your account'}
        </div>
      </div>
      {/* Right panel */}
      <div className="flex-1 p-3 bg-background space-y-2">
        <div className="h-1.5 w-14 rounded bg-foreground/30" />
        <div className="h-4 w-full rounded border border-border bg-muted/50" />
        <div className="h-1.5 w-12 rounded bg-foreground/30" />
        <div className="h-4 w-full rounded border border-border bg-muted/50" />
        <div className="h-5 w-full rounded text-[6px] flex items-center justify-center text-white" style={{ backgroundColor: primaryColor }}>
          Sign In
        </div>
        {config.showSocialLogin && (
          <div className="flex gap-1 justify-center">
            <div className="size-4 rounded-full border border-border" />
            <div className="size-4 rounded-full border border-border" />
          </div>
        )}
      </div>
    </div>
  );
}

// Email Preview Card
function EmailPreview({ config, primaryColor }: { config: BrandingEmailTemplates; primaryColor: string }) {
  return (
    <div className="rounded-lg border border-border overflow-hidden shadow-sm">
      {/* Header */}
      <div className="h-5 flex items-center px-3" style={{ backgroundColor: config.headerColor || primaryColor }}>
        <div className="size-3 rounded bg-white/30" />
        <div className="h-1 w-10 rounded bg-white/50 ms-2" />
      </div>
      {/* Body */}
      <div className="p-3 bg-background space-y-1.5">
        <div className="h-1.5 w-20 rounded bg-foreground/30" />
        <div className="h-1 w-full rounded bg-muted" />
        <div className="h-1 w-3/4 rounded bg-muted" />
        <div className="h-1 w-1/2 rounded bg-muted" />
        <div className="h-4 w-16 rounded text-[6px] flex items-center justify-center text-white mt-1" style={{ backgroundColor: primaryColor }}>
          View Details
        </div>
      </div>
      {/* Footer */}
      <div className="border-t border-border p-2 text-[5px] text-muted-foreground text-center">
        {config.footerText || `© ${new Date().getFullYear()} LicenseVault. All rights reserved.`}
      </div>
    </div>
  );
}

// Portal Preview Card
function PortalPreview({ config, primaryColor }: { config: BrandingPortal; primaryColor: string }) {
  return (
    <div className="rounded-lg border border-border overflow-hidden shadow-sm">
      {/* Header */}
      <div className="h-6 flex items-center px-3" style={{ backgroundColor: primaryColor }}>
        <div className="size-3 rounded bg-white/30" />
        <div className="h-1 w-14 rounded bg-white/50 ms-2" />
        {config.showComplianceScore && (
          <div className="ms-auto size-4 rounded-full border-2 border-white/50 flex items-center justify-center text-[4px] text-white">
            ✓
          </div>
        )}
      </div>
      {/* Body */}
      <div className="p-3 bg-background space-y-1.5">
        {config.welcomeMessage && (
          <div className="h-1.5 w-20 rounded bg-foreground/30" />
        )}
        <div className="h-1 w-full rounded bg-muted" />
        <div className="h-1 w-3/4 rounded bg-muted" />
        <div className="flex gap-1.5 mt-1">
          <div className="flex-1 h-8 rounded border border-border p-1">
            <div className="h-1 w-6 rounded bg-muted" />
            <div className="h-3 w-full rounded mt-0.5" style={{ backgroundColor: `${primaryColor}33` }} />
          </div>
          <div className="flex-1 h-8 rounded border border-border p-1">
            <div className="h-1 w-6 rounded bg-muted" />
            <div className="h-3 w-full rounded mt-0.5" style={{ backgroundColor: `${primaryColor}33` }} />
          </div>
        </div>
        {config.showContactInfo && (
          <div className="h-1 w-16 rounded bg-muted mt-1" />
        )}
      </div>
      {/* Footer */}
      <div className="border-t border-border p-1.5 text-[5px] text-muted-foreground text-center">
        {config.footerText || 'Powered by LicenseVault'}
      </div>
    </div>
  );
}

export default function BrandingPage() {
  const t = useTranslations('branding');
  const tc = useTranslations('common');
  const locale = useLocale();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('logo');

  // Core branding data
  const [primaryColor, setPrimaryColor] = useState('#10b981');
  const [logoUrl, setLogoUrl] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [tagline, setTagline] = useState('');

  // Extended branding config
  const [customLogo, setCustomLogo] = useState('');
  const [customFavicon, setCustomFavicon] = useState('');
  const [colors, setColors] = useState<BrandingColors>(DEFAULT_COLORS);
  const [fonts, setFonts] = useState<BrandingFonts>({ heading: 'Inter', body: 'Inter', scale: 'normal' });
  const [loginPage, setLoginPage] = useState<BrandingLoginPage>({
    backgroundImage: '', title: '', subtitle: '', leftPanelColor: '', showSocialLogin: true, welcomeMessage: '',
  });
  const [emailTemplates, setEmailTemplates] = useState<BrandingEmailTemplates>({
    headerColor: '#10b981', footerText: '', showLogo: true, signature: '',
  });
  const [portal, setPortal] = useState<BrandingPortal>({
    subdomain: '', welcomeMessage: '', showComplianceScore: true, showContactInfo: true, footerText: '',
  });
  const [customCSS, setCustomCSS] = useState('');
  const [customHeadJS, setCustomHeadJS] = useState('');
  const [customBodyJS, setCustomBodyJS] = useState('');

  // Reset dialog
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  const fetchBranding = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/org/branding');
      if (res.ok) {
        const data: BrandingData = await res.json();
        setPrimaryColor(data.primaryColor);
        setLogoUrl(data.logoUrl);
        setCompanyName(data.companyName);
        setTagline(data.tagline);

        const bc = data.brandingConfig;
        setCustomLogo(bc.customLogo || '');
        setCustomFavicon(bc.customFavicon || '');
        setColors(bc.customColors || DEFAULT_COLORS);
        setFonts(bc.customFonts || { heading: 'Inter', body: 'Inter', scale: 'normal' });
        setLoginPage(bc.loginPage || { backgroundImage: '', title: '', subtitle: '', leftPanelColor: '', showSocialLogin: true, welcomeMessage: '' });
        setEmailTemplates(bc.emailTemplates || { headerColor: '#10b981', footerText: '', showLogo: true, signature: '' });
        setPortal(bc.portal || { subdomain: '', welcomeMessage: '', showComplianceScore: true, showContactInfo: true, footerText: '' });
        setCustomCSS(bc.customCSS || '');
        setCustomHeadJS(bc.customHeadJS || '');
        setCustomBodyJS(bc.customBodyJS || '');
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBranding();
  }, [fetchBranding]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/org/branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
            customHeadJS,
            customBodyJS,
          },
        }),
      });

      if (res.ok) {
        toast.success(t('saveSuccess'));
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to save branding');
      }
    } catch {
      toast.error('Failed to save branding');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setResetDialogOpen(false);
    setSaving(true);
    try {
      const res = await fetch('/api/org/branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primaryColor: '#10b981',
          logoUrl: '',
          companyName: '',
          tagline: '',
          brandingConfig: {
            customLogo: '',
            customFavicon: '',
            customColors: DEFAULT_COLORS,
            customFonts: { heading: 'Inter', body: 'Inter', scale: 'normal' },
            loginPage: { backgroundImage: '', title: '', subtitle: '', leftPanelColor: '', showSocialLogin: true, welcomeMessage: '' },
            emailTemplates: { headerColor: '#10b981', footerText: '', showLogo: true, signature: '' },
            portal: { subdomain: '', welcomeMessage: '', showComplianceScore: true, showContactInfo: true, footerText: '' },
            customCSS: '',
            customHeadJS: '',
            customBodyJS: '',
          },
        }),
      });
      if (res.ok) {
        await fetchBranding();
        toast.success(t('resetSuccess'));
      }
    } catch {
      toast.error('Failed to reset');
    } finally {
      setSaving(false);
    }
  };

  const handleExportBranding = () => {
    const data = {
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
        customHeadJS,
        customBodyJS,
      },
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'branding-config.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t('exportSuccess'));
  };

  const handleImportBranding = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          if (data.primaryColor) setPrimaryColor(data.primaryColor);
          if (data.logoUrl !== undefined) setLogoUrl(data.logoUrl);
          if (data.companyName !== undefined) setCompanyName(data.companyName);
          if (data.tagline !== undefined) setTagline(data.tagline);
          const bc = data.brandingConfig;
          if (bc) {
            if (bc.customLogo !== undefined) setCustomLogo(bc.customLogo);
            if (bc.customFavicon !== undefined) setCustomFavicon(bc.customFavicon);
            if (bc.customColors) setColors(bc.customColors);
            if (bc.customFonts) setFonts(bc.customFonts);
            if (bc.loginPage) setLoginPage(bc.loginPage);
            if (bc.emailTemplates) setEmailTemplates(bc.emailTemplates);
            if (bc.portal) setPortal(bc.portal);
            if (bc.customCSS !== undefined) setCustomCSS(bc.customCSS);
            if (bc.customHeadJS !== undefined) setCustomHeadJS(bc.customHeadJS);
            if (bc.customBodyJS !== undefined) setCustomBodyJS(bc.customBodyJS);
          }
          toast.success(t('importSuccess'));
        } catch {
          toast.error('Invalid JSON file');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const applyPreset = (presetKey: string) => {
    const preset = THEME_PRESETS[presetKey];
    if (preset) {
      setColors(preset);
      setPrimaryColor(preset.primary);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <motion.div {...fadeIn}>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25">
            <Palette className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t('title')}</h1>
            <p className="text-sm text-muted-foreground">{t('description')}</p>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Tabs & Settings */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full flex-wrap h-auto gap-1 bg-muted/50 p-1">
              <TabsTrigger value="logo" className="gap-1.5 text-xs">
                <Upload className="size-3.5" />
                <span className="hidden sm:inline">{t('logoIdentity')}</span>
              </TabsTrigger>
              <TabsTrigger value="colors" className="gap-1.5 text-xs">
                <Paintbrush className="size-3.5" />
                <span className="hidden sm:inline">{t('colorTheme')}</span>
              </TabsTrigger>
              <TabsTrigger value="typography" className="gap-1.5 text-xs">
                <Type className="size-3.5" />
                <span className="hidden sm:inline">{t('typography')}</span>
              </TabsTrigger>
              <TabsTrigger value="login" className="gap-1.5 text-xs">
                <ImageIcon className="size-3.5" />
                <span className="hidden sm:inline">{t('loginPage')}</span>
              </TabsTrigger>
              <TabsTrigger value="email" className="gap-1.5 text-xs">
                <Mail className="size-3.5" />
                <span className="hidden sm:inline">{t('emailTemplates')}</span>
              </TabsTrigger>
              <TabsTrigger value="portal" className="gap-1.5 text-xs">
                <Globe className="size-3.5" />
                <span className="hidden sm:inline">{t('portalSettings')}</span>
              </TabsTrigger>
              <TabsTrigger value="advanced" className="gap-1.5 text-xs">
                <Code2 className="size-3.5" />
                <span className="hidden sm:inline">{t('advanced')}</span>
              </TabsTrigger>
            </TabsList>

            {/* Logo & Identity */}
            <AnimatePresence mode="wait">
              {activeTab === 'logo' && (
                <motion.div key="logo" {...fadeIn}>
                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Upload className="size-5 text-emerald-600" />
                        {t('logoIdentity')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Logo Upload */}
                      <div className="space-y-2">
                        <Label>{t('uploadLogo')}</Label>
                        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-emerald-500/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors">
                          {customLogo ? (
                            <div className="flex flex-col items-center gap-2">
                              <img src={customLogo} alt="Organization logo" className="h-16 w-auto object-contain" />
                              <Button variant="ghost" size="sm" onClick={() => setCustomLogo('')}>
                                {tc('delete')}
                              </Button>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                              <Upload className="size-8" />
                              <p className="text-sm">{t('dragDrop')}</p>
                              <p className="text-xs">{t('or')} <span className="text-emerald-600 cursor-pointer hover:underline">{t('browse')}</span></p>
                            </div>
                          )}
                        </div>
                        <Input
                          placeholder="https://example.com/logo.png"
                          value={customLogo}
                          onChange={(e) => setCustomLogo(e.target.value)}
                        />
                      </div>

                      {/* Favicon */}
                      <div className="space-y-2">
                        <Label>{t('uploadFavicon')}</Label>
                        <div className="flex items-center gap-3">
                          {customFavicon ? (
                            <img src={customFavicon} alt="Organization favicon" className="size-8 rounded border border-border" />
                          ) : (
                            <div className="size-8 rounded border border-border bg-muted flex items-center justify-center">
                              <ImageIcon className="size-4 text-muted-foreground" />
                            </div>
                          )}
                          <Input
                            placeholder="https://example.com/favicon.ico"
                            value={customFavicon}
                            onChange={(e) => setCustomFavicon(e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>

                      <Separator />

                      {/* Company Name */}
                      <div className="space-y-2">
                        <Label>{t('companyName')}</Label>
                        <Input
                          placeholder="Your Company Name"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                        />
                      </div>

                      {/* Tagline */}
                      <div className="space-y-2">
                        <Label>{t('tagline')}</Label>
                        <Input
                          placeholder="Your trusted compliance partner"
                          value={tagline}
                          onChange={(e) => setTagline(e.target.value)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Color Theme */}
              {activeTab === 'colors' && (
                <motion.div key="colors" {...fadeIn}>
                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Paintbrush className="size-5 text-emerald-600" />
                        {t('colorTheme')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Primary Color */}
                      <div className="space-y-3">
                        <Label className="text-base font-semibold">{t('primaryColor')}</Label>
                        <ColorPicker
                          label={t('primaryColor')}
                          value={colors.primary}
                          onChange={(v) => {
                            setColors((c) => ({ ...c, primary: v }));
                            setPrimaryColor(v);
                          }}
                        />
                      </div>

                      {/* Secondary Color */}
                      <div className="space-y-3">
                        <Label className="text-base font-semibold">{t('secondaryColor')}</Label>
                        <ColorPicker
                          label={t('secondaryColor')}
                          value={colors.secondary}
                          onChange={(v) => setColors((c) => ({ ...c, secondary: v }))}
                        />
                      </div>

                      {/* Accent Color */}
                      <div className="space-y-3">
                        <Label className="text-base font-semibold">{t('accentColor')}</Label>
                        <ColorPicker
                          label={t('accentColor')}
                          value={colors.accent}
                          onChange={(v) => setColors((c) => ({ ...c, accent: v }))}
                        />
                      </div>

                      <Separator />

                      {/* Color Swatches */}
                      <div className="space-y-3">
                        <Label className="text-base font-semibold">{t('preview')}</Label>
                        <div className="flex gap-2 flex-wrap">
                          <div className="flex flex-col items-center gap-1">
                            <div className="size-10 rounded-lg shadow-sm border border-border" style={{ backgroundColor: colors.primary }} />
                            <span className="text-[10px] text-muted-foreground">{t('primaryColor')}</span>
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            <div className="size-10 rounded-lg shadow-sm border border-border" style={{ backgroundColor: colors.secondary }} />
                            <span className="text-[10px] text-muted-foreground">{t('secondaryColor')}</span>
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            <div className="size-10 rounded-lg shadow-sm border border-border" style={{ backgroundColor: colors.accent }} />
                            <span className="text-[10px] text-muted-foreground">{t('accentColor')}</span>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Dark Mode Colors */}
                      <div className="space-y-3">
                        <Label className="text-base font-semibold flex items-center gap-2">
                          <Moon className="size-4" />
                          {t('darkModeColors')}
                        </Label>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <ColorPicker
                            label="Dark Primary"
                            value={colors.darkPrimary}
                            onChange={(v) => setColors((c) => ({ ...c, darkPrimary: v }))}
                          />
                          <ColorPicker
                            label="Dark Secondary"
                            value={colors.darkSecondary}
                            onChange={(v) => setColors((c) => ({ ...c, darkSecondary: v }))}
                          />
                        </div>
                      </div>

                      <Separator />

                      {/* Theme Presets */}
                      <div className="space-y-3">
                        <Label className="text-base font-semibold">{t('themePresets')}</Label>
                        <div className="grid gap-2 sm:grid-cols-5">
                          {Object.entries(THEME_PRESETS).map(([key, preset]) => (
                            <button
                              key={key}
                              onClick={() => applyPreset(key)}
                              className="flex flex-col items-center gap-1.5 p-2 rounded-lg border border-border hover:border-emerald-500/50 hover:shadow-sm transition-all"
                            >
                              <div className="flex gap-0.5">
                                <div className="size-5 rounded-full" style={{ backgroundColor: preset.primary }} />
                                <div className="size-5 rounded-full" style={{ backgroundColor: preset.secondary }} />
                                <div className="size-5 rounded-full" style={{ backgroundColor: preset.accent }} />
                              </div>
                              <span className="text-[10px] text-muted-foreground capitalize">{t(`${key}Theme`)}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Typography */}
              {activeTab === 'typography' && (
                <motion.div key="typography" {...fadeIn}>
                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Type className="size-5 text-emerald-600" />
                        {t('typography')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Heading Font */}
                      <div className="space-y-2">
                        <Label>{t('headingFont')}</Label>
                        <Select value={fonts.heading} onValueChange={(v) => setFonts((f) => ({ ...f, heading: v }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FONT_OPTIONS.map((font) => (
                              <SelectItem key={font} value={font}>
                                <span style={{ fontFamily: font }}>{font}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Body Font */}
                      <div className="space-y-2">
                        <Label>{t('bodyFont')}</Label>
                        <Select value={fonts.body} onValueChange={(v) => setFonts((f) => ({ ...f, body: v }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FONT_OPTIONS.map((font) => (
                              <SelectItem key={font} value={font}>
                                <span style={{ fontFamily: font }}>{font}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Font Size Scale */}
                      <div className="space-y-2">
                        <Label>{t('fontSize')}</Label>
                        <div className="grid grid-cols-3 gap-2">
                          {(['compact', 'normal', 'large'] as const).map((scale) => (
                            <button
                              key={scale}
                              onClick={() => setFonts((f) => ({ ...f, scale }))}
                              className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                                fonts.scale === scale
                                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
                                  : 'border-border hover:border-emerald-500/50'
                              }`}
                            >
                              {t(scale)}
                            </button>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      {/* Live Preview Text */}
                      <div className="space-y-3 p-4 rounded-lg border border-border bg-muted/30">
                        <Label className="text-muted-foreground">{t('livePreview')}</Label>
                        <div style={{ fontFamily: fonts.heading }}>
                          <p className="font-bold" style={{ fontSize: fonts.scale === 'compact' ? '18px' : fonts.scale === 'large' ? '24px' : '20px' }}>
                            {companyName || 'Your Company'}
                          </p>
                        </div>
                        <div style={{ fontFamily: fonts.body }}>
                          <p style={{ fontSize: fonts.scale === 'compact' ? '12px' : fonts.scale === 'large' ? '16px' : '14px' }}>
                            {tagline || 'Your compliance dashboard shows all licenses, expiration dates, and compliance scores at a glance.'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Login Page Customization */}
              {activeTab === 'login' && (
                <motion.div key="login" {...fadeIn}>
                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ImageIcon className="size-5 text-emerald-600" />
                        {t('loginPage')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Background Image */}
                      <div className="space-y-2">
                        <Label>{t('backgroundImage')}</Label>
                        <Input
                          placeholder="https://example.com/bg.jpg"
                          value={loginPage.backgroundImage}
                          onChange={(e) => setLoginPage((lp) => ({ ...lp, backgroundImage: e.target.value }))}
                        />
                      </div>

                      {/* Login Title */}
                      <div className="space-y-2">
                        <Label>{t('loginTitle')}</Label>
                        <Input
                          placeholder="Welcome Back"
                          value={loginPage.title}
                          onChange={(e) => setLoginPage((lp) => ({ ...lp, title: e.target.value }))}
                        />
                      </div>

                      {/* Login Subtitle */}
                      <div className="space-y-2">
                        <Label>{t('loginSubtitle')}</Label>
                        <Input
                          placeholder="Sign in to your compliance portal"
                          value={loginPage.subtitle}
                          onChange={(e) => setLoginPage((lp) => ({ ...lp, subtitle: e.target.value }))}
                        />
                      </div>

                      {/* Left Panel Color */}
                      <div className="space-y-2">
                        <Label>{t('leftPanelColor')}</Label>
                        <ColorPicker
                          label=""
                          value={loginPage.leftPanelColor || primaryColor}
                          onChange={(v) => setLoginPage((lp) => ({ ...lp, leftPanelColor: v }))}
                        />
                      </div>

                      {/* Show Social Login */}
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>{t('showSocialLogin')}</Label>
                          <p className="text-xs text-muted-foreground">Google, GitHub, Microsoft</p>
                        </div>
                        <Switch
                          checked={loginPage.showSocialLogin}
                          onCheckedChange={(v) => setLoginPage((lp) => ({ ...lp, showSocialLogin: v }))}
                        />
                      </div>

                      {/* Welcome Message */}
                      <div className="space-y-2">
                        <Label>{t('welcomeMessage')}</Label>
                        <Textarea
                          placeholder="Enter a custom welcome message for your team..."
                          value={loginPage.welcomeMessage}
                          onChange={(e) => setLoginPage((lp) => ({ ...lp, welcomeMessage: e.target.value }))}
                          rows={3}
                        />
                      </div>

                      <Separator />

                      {/* Login Preview */}
                      <div className="space-y-3">
                        <Label className="text-base font-semibold flex items-center gap-2">
                          <Eye className="size-4" />
                          {t('preview')}
                        </Label>
                        <LoginPagePreview config={loginPage} primaryColor={primaryColor} />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Email Templates */}
              {activeTab === 'email' && (
                <motion.div key="email" {...fadeIn}>
                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Mail className="size-5 text-emerald-600" />
                        {t('emailTemplates')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Email Header Color */}
                      <div className="space-y-2">
                        <Label>{t('emailHeaderColor')}</Label>
                        <ColorPicker
                          label=""
                          value={emailTemplates.headerColor}
                          onChange={(v) => setEmailTemplates((et) => ({ ...et, headerColor: v }))}
                        />
                      </div>

                      {/* Email Footer Text */}
                      <div className="space-y-2">
                        <Label>{t('emailFooterText')}</Label>
                        <Input
                          placeholder="© 2024 Your Company. All rights reserved."
                          value={emailTemplates.footerText}
                          onChange={(e) => setEmailTemplates((et) => ({ ...et, footerText: e.target.value }))}
                        />
                      </div>

                      {/* Show Logo in Emails */}
                      <div className="flex items-center justify-between">
                        <Label>{t('showLogoInEmail')}</Label>
                        <Switch
                          checked={emailTemplates.showLogo}
                          onCheckedChange={(v) => setEmailTemplates((et) => ({ ...et, showLogo: v }))}
                        />
                      </div>

                      {/* Email Signature */}
                      <div className="space-y-2">
                        <Label>{t('emailSignature')}</Label>
                        <Textarea
                          placeholder="Best regards,&#10;Your Company Team"
                          value={emailTemplates.signature}
                          onChange={(e) => setEmailTemplates((et) => ({ ...et, signature: e.target.value }))}
                          rows={3}
                        />
                      </div>

                      <Separator />

                      {/* Email Preview */}
                      <div className="space-y-3">
                        <Label className="text-base font-semibold flex items-center gap-2">
                          <Eye className="size-4" />
                          {t('preview')}
                        </Label>
                        <EmailPreview config={emailTemplates} primaryColor={primaryColor} />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Portal Settings */}
              {activeTab === 'portal' && (
                <motion.div key="portal" {...fadeIn}>
                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Globe className="size-5 text-emerald-600" />
                        {t('portalSettings')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Subdomain */}
                      <div className="space-y-2">
                        <Label>{t('portalSubdomain')}</Label>
                        <div className="flex items-center gap-0">
                          <Input
                            placeholder="company"
                            value={portal.subdomain}
                            onChange={(e) => setPortal((p) => ({ ...p, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                            className="rounded-e-none"
                          />
                          <div className="px-3 py-2 bg-muted border border-s-0 border-border rounded-e-lg text-sm text-muted-foreground whitespace-nowrap">
                            .licensevault.com
                          </div>
                        </div>
                      </div>

                      {/* Welcome Message */}
                      <div className="space-y-2">
                        <Label>{t('portalWelcome')}</Label>
                        <Textarea
                          placeholder="Welcome to our compliance portal..."
                          value={portal.welcomeMessage}
                          onChange={(e) => setPortal((p) => ({ ...p, welcomeMessage: e.target.value }))}
                          rows={3}
                        />
                      </div>

                      {/* Show Compliance Score */}
                      <div className="flex items-center justify-between">
                        <Label>{t('showComplianceScore')}</Label>
                        <Switch
                          checked={portal.showComplianceScore}
                          onCheckedChange={(v) => setPortal((p) => ({ ...p, showComplianceScore: v }))}
                        />
                      </div>

                      {/* Show Contact Info */}
                      <div className="flex items-center justify-between">
                        <Label>{t('showContactInfo')}</Label>
                        <Switch
                          checked={portal.showContactInfo}
                          onCheckedChange={(v) => setPortal((p) => ({ ...p, showContactInfo: v }))}
                        />
                      </div>

                      {/* Footer Text */}
                      <div className="space-y-2">
                        <Label>{t('portalFooter')}</Label>
                        <Input
                          placeholder="Powered by Your Company"
                          value={portal.footerText}
                          onChange={(e) => setPortal((p) => ({ ...p, footerText: e.target.value }))}
                        />
                      </div>

                      <Separator />

                      {/* Portal Preview */}
                      <div className="space-y-3">
                        <Label className="text-base font-semibold flex items-center gap-2">
                          <Eye className="size-4" />
                          {t('preview')}
                        </Label>
                        <PortalPreview config={portal} primaryColor={primaryColor} />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Advanced */}
              {activeTab === 'advanced' && (
                <motion.div key="advanced" {...fadeIn}>
                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Code2 className="size-5 text-emerald-600" />
                        {t('advanced')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Custom CSS */}
                      <div className="space-y-2">
                        <Label>{t('customCSS')}</Label>
                        <Textarea
                          placeholder="/* Custom CSS styles */&#10;.dashboard {&#10;  /* your styles */&#10;}"
                          value={customCSS}
                          onChange={(e) => setCustomCSS(e.target.value)}
                          rows={6}
                          className="font-mono text-sm bg-slate-950 text-green-400 dark:bg-slate-900 border-slate-700"
                        />
                      </div>

                      {/* Custom Head JS */}
                      <div className="space-y-2">
                        <Label>{t('customHeadJS')}</Label>
                        <Textarea
                          placeholder="// JavaScript to inject in <head>"
                          value={customHeadJS}
                          onChange={(e) => setCustomHeadJS(e.target.value)}
                          rows={4}
                          className="font-mono text-sm bg-slate-950 text-green-400 dark:bg-slate-900 border-slate-700"
                        />
                      </div>

                      {/* Custom Body JS */}
                      <div className="space-y-2">
                        <Label>{t('customBodyJS')}</Label>
                        <Textarea
                          placeholder="// JavaScript to inject before </body>"
                          value={customBodyJS}
                          onChange={(e) => setCustomBodyJS(e.target.value)}
                          rows={4}
                          className="font-mono text-sm bg-slate-950 text-green-400 dark:bg-slate-900 border-slate-700"
                        />
                      </div>

                      <Separator />

                      {/* Export / Import / Reset */}
                      <div className="space-y-3">
                        <div className="grid gap-2 sm:grid-cols-3">
                          <Button
                            variant="outline"
                            onClick={handleExportBranding}
                            className="gap-2"
                          >
                            <Download className="size-4" />
                            {t('exportBranding')}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={handleImportBranding}
                            className="gap-2"
                          >
                            <Upload className="size-4" />
                            {t('importBranding')}
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => setResetDialogOpen(true)}
                            className="gap-2"
                          >
                            <RotateCcw className="size-4" />
                            {t('resetDefaults')}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </Tabs>
        </div>

        {/* Right: Preview Panel */}
        <div className="space-y-4">
          <Card className="sticky top-20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Monitor className="size-4 text-emerald-600" />
                {t('livePreview')}
              </CardTitle>
              <div className="flex gap-1">
                <Badge variant="outline" className="text-[10px] gap-1">
                  <Sun className="size-3" /> Light
                </Badge>
                <Badge variant="outline" className="text-[10px] gap-1">
                  <Moon className="size-3" /> Dark
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Mini Dashboard Preview */}
              <MiniPreview colors={colors} font={fonts} companyName={companyName} />

              <Separator />

              {/* Quick Stats */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quick Info</p>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('companyName')}</span>
                    <span className="font-medium truncate ms-2 max-w-[120px]">{companyName || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('primaryColor')}</span>
                    <div className="flex items-center gap-1">
                      <div className="size-3 rounded-sm" style={{ backgroundColor: colors.primary }} />
                      <span className="font-mono">{colors.primary}</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('headingFont')}</span>
                    <span className="font-medium">{fonts.heading}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('fontSize')}</span>
                    <span className="font-medium capitalize">{fonts.scale}</span>
                  </div>
                  {portal.subdomain && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('portalSubdomain')}</span>
                      <span className="font-mono truncate ms-2 max-w-[120px]">{portal.subdomain}.licensevault.com</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Save Button */}
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {tc('loading')}
                  </>
                ) : (
                  <>
                    <Check className="size-4" />
                    {t('save')}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('confirmReset')}</DialogTitle>
            <DialogDescription>{t('confirmResetDesc')}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setResetDialogOpen(false)}>
              {tc('cancel')}
            </Button>
            <Button variant="destructive" onClick={handleReset}>
              <RotateCcw className="size-4 me-2" />
              {t('resetDefaults')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
