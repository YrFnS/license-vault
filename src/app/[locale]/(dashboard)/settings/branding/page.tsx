'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { DEFAULT_COLORS, THEME_PRESETS, fadeIn } from './components/constants';
import { BrandingColors, BrandingFonts, BrandingLoginPage, BrandingEmailTemplates, BrandingPortal, BrandingData } from './components/types';
import { BrandingLogoTab } from './components/BrandingLogoTab';
import { BrandingColorsTab } from './components/BrandingColorsTab';
import { BrandingTypographyTab } from './components/BrandingTypographyTab';
import { BrandingLoginTab } from './components/BrandingLoginTab';
import { BrandingEmailTab } from './components/BrandingEmailTab';
import { BrandingPortalTab } from './components/BrandingPortalTab';
import { BrandingAdvancedTab } from './components/BrandingAdvancedTab';
import { BrandingPreviewPanel } from './components/BrandingPreviewPanel';

export default function BrandingPage() {
  const t = useTranslations('branding');
  const tc = useTranslations('common');

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
                <Palette className="size-3.5" />
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

            <AnimatePresence mode="wait">
              {activeTab === 'logo' && (
                <BrandingLogoTab
                  customLogo={customLogo} setCustomLogo={setCustomLogo}
                  customFavicon={customFavicon} setCustomFavicon={setCustomFavicon}
                  companyName={companyName} setCompanyName={setCompanyName}
                  tagline={tagline} setTagline={setTagline}
                />
              )}

              {activeTab === 'colors' && (
                <BrandingColorsTab
                  colors={colors} setColors={setColors}
                  primaryColor={primaryColor} setPrimaryColor={setPrimaryColor}
                  applyPreset={applyPreset}
                />
              )}

              {activeTab === 'typography' && (
                <BrandingTypographyTab
                  fonts={fonts} setFonts={setFonts}
                  companyName={companyName} tagline={tagline}
                />
              )}

              {activeTab === 'login' && (
                <BrandingLoginTab
                  loginPage={loginPage} setLoginPage={setLoginPage}
                  primaryColor={primaryColor}
                />
              )}

              {activeTab === 'email' && (
                <BrandingEmailTab
                  emailTemplates={emailTemplates} setEmailTemplates={setEmailTemplates}
                  primaryColor={primaryColor}
                />
              )}

              {activeTab === 'portal' && (
                <BrandingPortalTab
                  portal={portal} setPortal={setPortal}
                  primaryColor={primaryColor}
                />
              )}

              {activeTab === 'advanced' && (
                <BrandingAdvancedTab
                  customCSS={customCSS} setCustomCSS={setCustomCSS}
                  customHeadJS={customHeadJS} setCustomHeadJS={setCustomHeadJS}
                  customBodyJS={customBodyJS} setCustomBodyJS={setCustomBodyJS}
                  handleExportBranding={handleExportBranding}
                  handleImportBranding={handleImportBranding}
                  onOpenResetDialog={() => setResetDialogOpen(true)}
                />
              )}
            </AnimatePresence>
          </Tabs>
        </div>

        {/* Right: Preview Panel */}
        <BrandingPreviewPanel
          colors={colors} fonts={fonts}
          companyName={companyName} portal={portal}
          saving={saving} onSave={handleSave}
        />
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
