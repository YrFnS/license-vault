"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectStatsCards } from "./components/ProjectStatsCards";
import { ProjectFilters } from "./components/ProjectFilters";
import { ProjectsGrid } from "./components/ProjectsGrid";
import { ProjectFormDialog } from "./components/ProjectFormDialog";
import { ProjectDetailDialog } from "./components/ProjectDetailDialog";
import { DeleteProjectDialog } from "./components/DeleteProjectDialog";
import { LinkLicenseDialog } from "./components/LinkLicenseDialog";
import { LinkSubcontractorDialog } from "./components/LinkSubcontractorDialog";
import { useProjects } from "./components/useProjects";

const fadeIn = {
	initial: { opacity: 0, y: 12 },
	animate: { opacity: 1, y: 0 },
};

export default function ProjectsPage() {
	const t = useTranslations("projects");
	const tc = useTranslations("common");
	const p = useProjects(t);

	const handleDetailEdit = () => {
		p.setDetailDialogOpen(false);
		if (p.selectedProject) p.openEditProjectDialog(p.selectedProject);
	};

	const handleDetailDelete = () => {
		p.setDetailDialogOpen(false);
		if (p.selectedProject) {
			p.setDeletingProject(p.selectedProject);
			p.setDeleteDialogOpen(true);
		}
	};

	return (
		<div className="space-y-6">
			<motion.div
				{...fadeIn}
				className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
			>
				<div>
					<h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
						{t("title")}
					</h1>
					<p className="text-muted-foreground text-sm mt-1">
						{t("description")}
					</p>
				</div>
				<Button
					onClick={p.openNewProjectDialog}
					className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-300"
				>
					<Plus className="size-4 me-2" />
					{t("newProject")}
				</Button>
			</motion.div>

			<ProjectStatsCards counts={p.counts} stats={p.stats} t={t} />

			<ProjectFilters
				search={p.search}
				onSearchChange={p.setSearch}
				statusFilter={p.statusFilter}
				onStatusFilterChange={p.setStatusFilter}
				t={t}
			/>

			<ProjectsGrid
				projects={p.projects}
				loading={p.loading}
				t={t}
				onOpenDetail={p.openDetailDialog}
				onNewProject={p.openNewProjectDialog}
			/>

			<ProjectFormDialog
				open={p.projectDialogOpen}
				onOpenChange={p.setProjectDialogOpen}
				editing={!!p.editingProject}
				formData={p.formData}
				onFormDataChange={p.setFormData}
				onSave={p.handleSaveProject}
				saving={p.saving}
				t={t}
				tc={tc}
			/>

			<ProjectDetailDialog
				open={p.detailDialogOpen}
				onOpenChange={p.setDetailDialogOpen}
				selectedProject={p.selectedProject}
				projectLicenses={p.projectLicenses}
				projectSubs={p.projectSubs}
				detailTab={p.detailTab}
				onDetailTabChange={p.setDetailTab}
				onUnlinkLicense={p.handleUnlinkLicense}
				onUnlinkSubcontractor={p.handleUnlinkSubcontractor}
				onEdit={handleDetailEdit}
				onDelete={handleDetailDelete}
				onOpenLinkLicenseDialog={() => p.setLinkLicenseDialogOpen(true)}
				onOpenLinkSubDialog={() => p.setLinkSubDialogOpen(true)}
				t={t}
			/>

			<DeleteProjectDialog
				open={p.deleteDialogOpen}
				onOpenChange={p.setDeleteDialogOpen}
				onConfirm={p.handleDeleteProject}
				t={t}
				tc={tc}
			/>

			<LinkLicenseDialog
				open={p.linkLicenseDialogOpen}
				onOpenChange={p.setLinkLicenseDialogOpen}
				orgLicenses={p.orgLicenses}
				projectLicenses={p.projectLicenses}
				selectedLicenseId={p.selectedLicenseId}
				onSelectedLicenseIdChange={p.setSelectedLicenseId}
				onLink={p.handleLinkLicense}
				t={t}
				tc={tc}
			/>

			<LinkSubcontractorDialog
				open={p.linkSubDialogOpen}
				onOpenChange={p.setLinkSubDialogOpen}
				orgSubs={p.orgSubs}
				projectSubs={p.projectSubs}
				selectedSubId={p.selectedSubId}
				onSelectedSubIdChange={p.setSelectedSubId}
				onLink={p.handleLinkSubcontractor}
				t={t}
				tc={tc}
			/>
		</div>
	);
}
