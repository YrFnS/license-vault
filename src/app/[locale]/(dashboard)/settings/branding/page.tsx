"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Palette,
	Upload,
	Type,
	Image as ImageIcon,
	Mail,
	Globe,
	Code2,
	RotateCcw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { fadeIn } from "./components/constants";
import { useBranding } from "./components/useBranding";
import { BrandingLogoTab } from "./components/BrandingLogoTab";
import { BrandingColorsTab } from "./components/BrandingColorsTab";
import { BrandingTypographyTab } from "./components/BrandingTypographyTab";
import { BrandingLoginTab } from "./components/BrandingLoginTab";
import { BrandingEmailTab } from "./components/BrandingEmailTab";
import { BrandingPortalTab } from "./components/BrandingPortalTab";
import { BrandingAdvancedTab } from "./components/BrandingAdvancedTab";
import { BrandingPreviewPanel } from "./components/BrandingPreviewPanel";

export default function BrandingPage() {
	const t = useTranslations("branding");
	const tc = useTranslations("common");
	const [activeTab, setActiveTab] = useState("logo");
	const [resetDialogOpen, setResetDialogOpen] = useState(false);

	const b = useBranding(t);

	if (b.loading) {
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
						<TabsList className="w-full flex-wrap h-auto gap-1 bg-muted/50 p-1">
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
									customLogo={b.customLogo} setCustomLogo={b.setCustomLogo}
									customFavicon={b.customFavicon} setCustomFavicon={b.setCustomFavicon}
									companyName={b.companyName} setCompanyName={b.setCompanyName}
									tagline={b.tagline} setTagline={b.setTagline}
								/>
							)}
							{activeTab === "colors" && (
								<BrandingColorsTab
									colors={b.colors} setColors={b.setColors}
									primaryColor={b.primaryColor} setPrimaryColor={b.setPrimaryColor}
									applyPreset={b.applyPreset}
								/>
							)}
							{activeTab === "typography" && (
								<BrandingTypographyTab
									fonts={b.fonts} setFonts={b.setFonts}
									companyName={b.companyName} tagline={b.tagline}
								/>
							)}
							{activeTab === "login" && (
								<BrandingLoginTab
									loginPage={b.loginPage} setLoginPage={b.setLoginPage}
									primaryColor={b.primaryColor}
								/>
							)}
							{activeTab === "email" && (
								<BrandingEmailTab
									emailTemplates={b.emailTemplates} setEmailTemplates={b.setEmailTemplates}
									primaryColor={b.primaryColor}
								/>
							)}
							{activeTab === "portal" && (
								<BrandingPortalTab
									portal={b.portal} setPortal={b.setPortal}
									primaryColor={b.primaryColor}
								/>
							)}
							{activeTab === "advanced" && (
								<BrandingAdvancedTab
									customCSS={b.customCSS} setCustomCSS={b.setCustomCSS}
									customHeadJS={b.customHeadJS} setCustomHeadJS={b.setCustomHeadJS}
									customBodyJS={b.customBodyJS} setCustomBodyJS={b.setCustomBodyJS}
									handleExportBranding={b.handleExportBranding}
									handleImportBranding={b.handleImportBranding}
									onOpenResetDialog={() => setResetDialogOpen(true)}
								/>
							)}
						</AnimatePresence>
					</Tabs>
				</div>

				<BrandingPreviewPanel
					colors={b.colors} fonts={b.fonts}
					companyName={b.companyName} portal={b.portal}
					saving={b.saving} onSave={b.handleSave}
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
						<Button variant="destructive" onClick={() => { setResetDialogOpen(false); b.handleReset(); }}>
							<RotateCcw className="size-4 me-2" />
							{t("resetDefaults")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
