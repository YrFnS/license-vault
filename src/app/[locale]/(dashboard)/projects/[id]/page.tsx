"use client";

import { Link, useRouter } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProjectData } from "./components/use-project-data";
import { ProjectStatusBadge } from "./components/status-badges";
import { OverviewTab } from "./components/overview-tab";
import { LicensesTab } from "./components/licenses-tab";
import { SubcontractorsTab } from "./components/subcontractors-tab";
import { ComplianceTab } from "./components/compliance-tab";
import { AddLicenseDialog } from "./components/add-license-dialog";
import { AddSubDialog } from "./components/add-sub-dialog";

export default function ProjectDetailPage() {
	const t = useTranslations("projects");
	const tc = useTranslations("common");
	const params = useParams();
	const router = useRouter();
	const projectId = (params.id as string) || "";

	const {
		project,
		projectLicenses,
		projectSubs,
		compliance,
		loading,
		showAddLicense,
		setShowAddLicense,
		showAddSub,
		setShowAddSub,
		licenseOptions,
		subOptions,
		selectedLicenseId,
		setSelectedLicenseId,
		selectedSubId,
		setSelectedSubId,
		linkNotes,
		setLinkNotes,
		linkRequired,
		setLinkRequired,
		linkRole,
		setLinkRole,
		fetchLicenseOptions,
		fetchSubOptions,
		handleAddLicense,
		handleRemoveLicense,
		handleAddSub,
		handleRemoveSub,
	} = useProjectData(projectId);

	if (loading) {
		return (
			<div className="space-y-6">
				<div className="animate-pulse">
					<div className="h-8 bg-muted rounded w-1/3 mb-4" />
					<div className="h-4 bg-muted rounded w-1/2 mb-8" />
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						{[1, 2, 3].map((i) => (
							<div key={i} className="h-32 bg-muted rounded-lg" />
						))}
					</div>
				</div>
			</div>
		);
	}

	if (!project) {
		return (
			<div className="text-center py-16">
				<Shield className="size-12 mx-auto text-muted-foreground/40 mb-4" />
				<h2 className="text-lg font-semibold">{t("projectNotFound")}</h2>
				<Button
					variant="outline"
					className="mt-4"
					onClick={() => router.push("/projects")}
				>
					<ArrowLeft className="size-4 me-2" />
					{tc("back")}
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Gradient Header */}
			<div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-6 text-white shadow-lg">
				<div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
				<div className="absolute -top-12 -end-12 size-40 rounded-full bg-white/10 blur-2xl" />
				<div className="absolute -bottom-8 -start-8 size-32 rounded-full bg-white/5 blur-xl" />
				<div className="relative flex items-center gap-3">
					<Button
						variant="ghost"
						size="icon"
						asChild
						className="text-white hover:bg-white/20"
					>
						<Link href="/projects">
							<ArrowLeft className="size-4" />
						</Link>
					</Button>
					<div>
						<div className="flex items-center gap-2">
							<h1 className="text-2xl font-extrabold tracking-tight">
								{project.name}
							</h1>
							<ProjectStatusBadge status={project.status} />
						</div>
						{project.description && (
							<p className="text-white/75 text-sm mt-0.5">
								{project.description}
							</p>
						)}
					</div>
				</div>
			</div>

			{/* Tabs */}
			<Tabs defaultValue="overview" className="space-y-4">
				<TabsList>
					<TabsTrigger value="overview">{t("tabOverview")}</TabsTrigger>
					<TabsTrigger value="licenses">
						{t("tabLicenses")} ({projectLicenses.length})
					</TabsTrigger>
					<TabsTrigger value="subcontractors">
						{t("tabSubcontractors")} ({projectSubs.length})
					</TabsTrigger>
					<TabsTrigger value="compliance">{t("tabCompliance")}</TabsTrigger>
				</TabsList>

				<TabsContent value="overview">
					<OverviewTab
						project={project}
						projectLicenses={projectLicenses}
						projectSubs={projectSubs}
					/>
				</TabsContent>

				<TabsContent value="licenses">
					<LicensesTab
						projectLicenses={projectLicenses}
						onAddLicense={() => {
							fetchLicenseOptions();
							setShowAddLicense(true);
						}}
						onRemoveLicense={handleRemoveLicense}
					/>
				</TabsContent>

				<TabsContent value="subcontractors">
					<SubcontractorsTab
						projectSubs={projectSubs}
						onAddSub={() => {
							fetchSubOptions();
							setShowAddSub(true);
						}}
						onRemoveSub={handleRemoveSub}
					/>
				</TabsContent>

				<TabsContent value="compliance">
					<ComplianceTab
						compliance={compliance}
						projectLicenses={projectLicenses}
						projectSubs={projectSubs}
					/>
				</TabsContent>
			</Tabs>

			<AddLicenseDialog
				open={showAddLicense}
				onOpenChange={setShowAddLicense}
				licenseOptions={licenseOptions}
				selectedLicenseId={selectedLicenseId}
				onSelectedLicenseIdChange={setSelectedLicenseId}
				linkRequired={linkRequired}
				onLinkRequiredChange={setLinkRequired}
				linkNotes={linkNotes}
				onLinkNotesChange={setLinkNotes}
				onSubmit={handleAddLicense}
			/>

			<AddSubDialog
				open={showAddSub}
				onOpenChange={setShowAddSub}
				subOptions={subOptions}
				selectedSubId={selectedSubId}
				onSelectedSubIdChange={setSelectedSubId}
				linkRole={linkRole}
				onLinkRoleChange={setLinkRole}
				linkNotes={linkNotes}
				onLinkNotesChange={setLinkNotes}
				onSubmit={handleAddSub}
			/>
		</div>
	);
}
