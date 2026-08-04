"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import {
  Code2,
  Globe,
  Image as ImageIcon,
  Mail,
  Palette,
  RotateCcw,
  Type,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BrandingAdvancedTab } from "./components/BrandingAdvancedTab";
import { BrandingColorsTab } from "./components/BrandingColorsTab";
import { BrandingEmailTab } from "./components/BrandingEmailTab";
import { BrandingLoginTab } from "./components/BrandingLoginTab";
import { BrandingLogoTab } from "./components/BrandingLogoTab";
import { BrandingPortalTab } from "./components/BrandingPortalTab";
import { BrandingPreviewPanel } from "./components/BrandingPreviewPanel";
import { BrandingTypographyTab } from "./components/BrandingTypographyTab";
import { fadeIn } from "./components/constants";
import { useBranding } from "./components/useBranding";

export default function BrandingPage() {
  const t = useTranslations("branding");
  const tc = useTranslations("common");
  const [activeTab, setActiveTab] = useState("logo");
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const branding = useBranding(t);

  if (branding.loading) {
    return (
      <div className="max-w-4xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <motion.div {...fadeIn}>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25">
            <Palette className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t("title")}</h1>
            <p className="text-sm text-muted-foreground">{t("description")}</p>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="h-auto w-full flex-wrap gap-1 bg-muted/50 p-1">
              <TabsTrigger value="logo" className="gap-1.5 text-xs">
                <Upload className="size-3.5" />
                <span className="hidden sm:inline">{t("logoIdentity")}</span>
              </TabsTrigger>
              <TabsTrigger value="colors" className="gap-1.5 text-xs">
                <Palette className="size-3.5" />
                <span className="hidden sm:inline">{t("colorTheme")}</span>
              </TabsTrigger>
              <TabsTrigger value="typography" className="gap-1.5 text-xs">
                <Type className="size-3.5" />
                <span className="hidden sm:inline">{t("typography")}</span>
              </TabsTrigger>
              <TabsTrigger value="login" className="gap-1.5 text-xs">
                <ImageIcon className="size-3.5" />
                <span className="hidden sm:inline">{t("loginPage")}</span>
              </TabsTrigger>
              <TabsTrigger value="email" className="gap-1.5 text-xs">
                <Mail className="size-3.5" />
                <span className="hidden sm:inline">{t("emailTemplates")}</span>
              </TabsTrigger>
              <TabsTrigger value="portal" className="gap-1.5 text-xs">
                <Globe className="size-3.5" />
                <span className="hidden sm:inline">{t("portalSettings")}</span>
              </TabsTrigger>
              <TabsTrigger value="advanced" className="gap-1.5 text-xs">
                <Code2 className="size-3.5" />
                <span className="hidden sm:inline">{t("advanced")}</span>
              </TabsTrigger>
            </TabsList>

            <AnimatePresence mode="wait">
              {activeTab === "logo" && (
                <BrandingLogoTab
                  customLogo={branding.customLogo}
                  setCustomLogo={branding.setCustomLogo}
                  customFavicon={branding.customFavicon}
                  setCustomFavicon={branding.setCustomFavicon}
                  companyName={branding.companyName}
                  setCompanyName={branding.setCompanyName}
                  tagline={branding.tagline}
                  setTagline={branding.setTagline}
                />
              )}
              {activeTab === "colors" && (
                <BrandingColorsTab
                  colors={branding.colors}
                  setColors={branding.setColors}
                  primaryColor={branding.primaryColor}
                  setPrimaryColor={branding.setPrimaryColor}
                  applyPreset={branding.applyPreset}
                />
              )}
              {activeTab === "typography" && (
                <BrandingTypographyTab
                  fonts={branding.fonts}
                  setFonts={branding.setFonts}
                  companyName={branding.companyName}
                  tagline={branding.tagline}
                />
              )}
              {activeTab === "login" && (
                <BrandingLoginTab
                  loginPage={branding.loginPage}
                  setLoginPage={branding.setLoginPage}
                  primaryColor={branding.primaryColor}
                />
              )}
              {activeTab === "email" && (
                <BrandingEmailTab
                  emailTemplates={branding.emailTemplates}
                  setEmailTemplates={branding.setEmailTemplates}
                  primaryColor={branding.primaryColor}
                />
              )}
              {activeTab === "portal" && (
                <BrandingPortalTab
                  portal={branding.portal}
                  setPortal={branding.setPortal}
                  primaryColor={branding.primaryColor}
                />
              )}
              {activeTab === "advanced" && (
                <BrandingAdvancedTab
                  customCSS={branding.customCSS}
                  setCustomCSS={branding.setCustomCSS}
                  handleExportBranding={branding.handleExportBranding}
                  handleImportBranding={branding.handleImportBranding}
                  onOpenResetDialog={() => setResetDialogOpen(true)}
                />
              )}
            </AnimatePresence>
          </Tabs>
        </div>

        <BrandingPreviewPanel
          colors={branding.colors}
          fonts={branding.fonts}
          companyName={branding.companyName}
          portal={branding.portal}
          saving={branding.saving}
          onSave={branding.handleSave}
        />
      </div>

      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("confirmReset")}</DialogTitle>
            <DialogDescription>{t("confirmResetDesc")}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setResetDialogOpen(false)}>
              {tc("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setResetDialogOpen(false);
                branding.handleReset();
              }}
            >
              <RotateCcw className="me-2 size-4" />
              {t("resetDefaults")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
