"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ProjectStatsCards } from "./components/ProjectStatsCards";
import { ProjectFilters } from "./components/ProjectFilters";
import { ProjectsGrid } from "./components/ProjectsGrid";
import { ProjectFormDialog } from "./components/ProjectFormDialog";
import { ProjectDetailDialog } from "./components/ProjectDetailDialog";
import { DeleteProjectDialog } from "./components/DeleteProjectDialog";
import { LinkLicenseDialog } from "./components/LinkLicenseDialog";
import { LinkSubcontractorDialog } from "./components/LinkSubcontractorDialog";
import type {
	Project,
	ProjectLicense,
	ProjectSub,
	OrgLicense,
	OrgSubcontractor,
} from "./components/types";

const fadeIn = {
	initial: { opacity: 0, y: 12 },
	animate: { opacity: 1, y: 0 },
};

interface FormData {
	name: string;
	description: string;
	clientName: string;
	clientEmail: string;
	location: string;
	state: string;
	startDate: string;
	endDate: string;
	status: string;
	requiredLicenses: string;
	requiredInsurance: string;
}

const emptyFormData: FormData = {
	name: "",
	description: "",
	clientName: "",
	clientEmail: "",
	location: "",
	state: "",
	startDate: "",
	endDate: "",
	status: "active",
	requiredLicenses: "",
	requiredInsurance: "",
};

export default function ProjectsPage() {
	const t = useTranslations("projects");
	const tc = useTranslations("common");
	const { toast } = useToast();

	// State
	const [projects, setProjects] = useState<Project[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [counts, setCounts] = useState({ all: 0, active: 0, completed: 0, on_hold: 0 });
	const [stats, setStats] = useState({ avgCompliance: 0, atRiskCount: 0 });

	// Dialog states
	const [projectDialogOpen, setProjectDialogOpen] = useState(false);
	const [detailDialogOpen, setDetailDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [linkLicenseDialogOpen, setLinkLicenseDialogOpen] = useState(false);
	const [linkSubDialogOpen, setLinkSubDialogOpen] = useState(false);

	const [editingProject, setEditingProject] = useState<Project | null>(null);
	const [selectedProject, setSelectedProject] = useState<Project | null>(null);
	const [deletingProject, setDeletingProject] = useState<Project | null>(null);

	// Form state
	const [formData, setFormData] = useState<FormData>({ ...emptyFormData });
	const [saving, setSaving] = useState(false);

	// Detail data
	const [projectLicenses, setProjectLicenses] = useState<ProjectLicense[]>([]);
	const [projectSubs, setProjectSubs] = useState<ProjectSub[]>([]);
	const [orgLicenses, setOrgLicenses] = useState<OrgLicense[]>([]);
	const [orgSubs, setOrgSubs] = useState<OrgSubcontractor[]>([]);
	const [selectedLicenseId, setSelectedLicenseId] = useState("");
	const [selectedSubId, setSelectedSubId] = useState("");
	const [detailTab, setDetailTab] = useState("overview");

	// Fetch projects
	const fetchProjects = useCallback(async () => {
		try {
			setLoading(true);
			const params = new URLSearchParams();
			if (search) params.set("search", search);
			if (statusFilter !== "all") params.set("status", statusFilter);

			const res = await fetch(`/api/projects?${params.toString()}`);
			if (!res.ok) throw new Error("Failed to fetch");
			const data = await res.json();
			setProjects(data.projects || []);
			setCounts(data.counts || { all: 0, active: 0, completed: 0, on_hold: 0 });
			setStats(data.stats || { avgCompliance: 0, atRiskCount: 0 });
		} catch (err) {
			console.error("Fetch projects error:", err);
		} finally {
			setLoading(false);
		}
	}, [search, statusFilter]);

	useEffect(() => {
		fetchProjects();
	}, [fetchProjects]);

	// Fetch org licenses & subcontractors for link dialogs
	const fetchOrgData = useCallback(async () => {
		try {
			const [licRes, subRes] = await Promise.all([
				fetch("/api/licenses?limit=100"),
				fetch("/api/subcontractors"),
			]);
			if (licRes.ok) {
				const licData = await licRes.json();
				setOrgLicenses(licData.licenses || []);
			}
			if (subRes.ok) {
				const subData = await subRes.json();
				setOrgSubs(subData.subcontractors || []);
			}
		} catch (err) {
			console.error("Fetch org data error:", err);
		}
	}, []);

	// Fetch project detail
	const fetchProjectDetail = useCallback(async (projectId: string) => {
		try {
			const res = await fetch(`/api/projects/${projectId}`);
			if (!res.ok) throw new Error("Failed to fetch");
			const data = await res.json();
			setSelectedProject(data.project);
			setProjectLicenses(data.project.projectLicenses || []);
			setProjectSubs(data.project.projectSubs || []);
		} catch (err) {
			console.error("Fetch project detail error:", err);
		}
	}, []);

	// Open dialogs
	const openNewProjectDialog = () => {
		setEditingProject(null);
		setFormData({ ...emptyFormData });
		setProjectDialogOpen(true);
	};

	const openEditProjectDialog = (project: Project) => {
		setEditingProject(project);
		setFormData({
			name: project.name,
			description: project.description || "",
			clientName: project.clientName || "",
			clientEmail: project.clientEmail || "",
			location: project.location || "",
			state: project.state || "",
			startDate: project.startDate
				? new Date(project.startDate).toISOString().split("T")[0]
				: "",
			endDate: project.endDate
				? new Date(project.endDate).toISOString().split("T")[0]
				: "",
			status: project.status,
			requiredLicenses: project.requiredLicenses || "",
			requiredInsurance: project.requiredInsurance || "",
		});
		setProjectDialogOpen(true);
	};

	const openDetailDialog = (project: Project) => {
		fetchProjectDetail(project.id);
		fetchOrgData();
		setDetailTab("overview");
		setDetailDialogOpen(true);
	};

	// Save project
	const handleSaveProject = async () => {
		if (!formData.name.trim()) {
			toast({
				title: "Error",
				description: "Project name is required",
				variant: "destructive",
			});
			return;
		}
		try {
			setSaving(true);
			const url = editingProject
				? `/api/projects/${editingProject.id}`
				: "/api/projects";
			const method = editingProject ? "PUT" : "POST";
			const res = await fetch(url, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(formData),
			});
			if (!res.ok) {
				const errData = await res.json();
				throw new Error(errData.error || "Failed to save");
			}
			toast({
				title: editingProject ? t("updateSuccess") : t("createSuccess"),
			});
			setProjectDialogOpen(false);
			fetchProjects();
		} catch (err: any) {
			toast({ title: "Error", description: err.message, variant: "destructive" });
		} finally {
			setSaving(false);
		}
	};

	// Delete project
	const handleDeleteProject = async () => {
		if (!deletingProject) return;
		try {
			const res = await fetch(`/api/projects/${deletingProject.id}`, {
				method: "DELETE",
			});
			if (!res.ok) throw new Error("Failed to delete");
			toast({ title: t("deleteSuccess") });
			setDeleteDialogOpen(false);
			setDeletingProject(null);
			fetchProjects();
		} catch {
			toast({
				title: "Error",
				description: "Failed to delete project",
				variant: "destructive",
			});
		}
	};

	// Link license
	const handleLinkLicense = async () => {
		if (!selectedProject || !selectedLicenseId) return;
		try {
			const res = await fetch(`/api/projects/${selectedProject.id}/licenses`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ licenseId: selectedLicenseId, required: true }),
			});
			if (!res.ok) {
				const err = await res.json();
				throw new Error(err.error || "Failed");
			}
			toast({ title: t("linkSuccess") });
			setLinkLicenseDialogOpen(false);
			setSelectedLicenseId("");
			fetchProjectDetail(selectedProject.id);
			fetchProjects();
		} catch (err: any) {
			toast({ title: "Error", description: err.message, variant: "destructive" });
		}
	};

	// Unlink license
	const handleUnlinkLicense = async (licenseId: string) => {
		if (!selectedProject) return;
		try {
			const res = await fetch(
				`/api/projects/${selectedProject.id}/licenses/${licenseId}`,
				{ method: "DELETE" },
			);
			if (!res.ok) throw new Error("Failed");
			toast({ title: t("unlinkSuccess") });
			fetchProjectDetail(selectedProject.id);
			fetchProjects();
		} catch {
			toast({
				title: "Error",
				description: "Failed to unlink license",
				variant: "destructive",
			});
		}
	};

	// Link subcontractor
	const handleLinkSubcontractor = async () => {
		if (!selectedProject || !selectedSubId) return;
		try {
			const res = await fetch(
				`/api/projects/${selectedProject.id}/subcontractors`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ subcontractorId: selectedSubId }),
				},
			);
			if (!res.ok) {
				const err = await res.json();
				throw new Error(err.error || "Failed");
			}
			toast({ title: t("subLinkSuccess") });
			setLinkSubDialogOpen(false);
			setSelectedSubId("");
			fetchProjectDetail(selectedProject.id);
			fetchProjects();
		} catch (err: any) {
			toast({ title: "Error", description: err.message, variant: "destructive" });
		}
	};

	// Unlink subcontractor
	const handleUnlinkSubcontractor = async (subcontractorId: string) => {
		if (!selectedProject) return;
		try {
			const res = await fetch(
				`/api/projects/${selectedProject.id}/subcontractors/${subcontractorId}`,
				{ method: "DELETE" },
			);
			if (!res.ok) throw new Error("Failed");
			toast({ title: t("subUnlinkSuccess") });
			fetchProjectDetail(selectedProject.id);
			fetchProjects();
		} catch {
			toast({
				title: "Error",
				description: "Failed to unlink subcontractor",
				variant: "destructive",
			});
		}
	};

	// Detail dialog actions
	const handleDetailEdit = () => {
		setDetailDialogOpen(false);
		if (selectedProject) openEditProjectDialog(selectedProject);
	};

	const handleDetailDelete = () => {
		setDetailDialogOpen(false);
		if (selectedProject) {
			setDeletingProject(selectedProject);
			setDeleteDialogOpen(true);
		}
	};

	return (
		<div className="space-y-6">
			{/* Header */}
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
					onClick={openNewProjectDialog}
					className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-300"
				>
					<Plus className="size-4 me-2" />
					{t("newProject")}
				</Button>
			</motion.div>

			{/* Stats Cards */}
			<ProjectStatsCards counts={counts} stats={stats} t={t} />

			{/* Search & Filters */}
			<ProjectFilters
				search={search}
				onSearchChange={setSearch}
				statusFilter={statusFilter}
				onStatusFilterChange={setStatusFilter}
				t={t}
			/>

			{/* Projects Grid */}
			<ProjectsGrid
				projects={projects}
				loading={loading}
				t={t}
				onOpenDetail={openDetailDialog}
				onNewProject={openNewProjectDialog}
			/>

			{/* New/Edit Project Dialog */}
			<ProjectFormDialog
				open={projectDialogOpen}
				onOpenChange={setProjectDialogOpen}
				editing={!!editingProject}
				formData={formData}
				onFormDataChange={setFormData}
				onSave={handleSaveProject}
				saving={saving}
				t={t}
				tc={tc}
			/>

			{/* Project Detail Dialog */}
			<ProjectDetailDialog
				open={detailDialogOpen}
				onOpenChange={setDetailDialogOpen}
				selectedProject={selectedProject}
				projectLicenses={projectLicenses}
				projectSubs={projectSubs}
				detailTab={detailTab}
				onDetailTabChange={setDetailTab}
				onUnlinkLicense={handleUnlinkLicense}
				onUnlinkSubcontractor={handleUnlinkSubcontractor}
				onEdit={handleDetailEdit}
				onDelete={handleDetailDelete}
				onOpenLinkLicenseDialog={() => setLinkLicenseDialogOpen(true)}
				onOpenLinkSubDialog={() => setLinkSubDialogOpen(true)}
				t={t}
			/>

			{/* Delete Confirmation */}
			<DeleteProjectDialog
				open={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
				onConfirm={handleDeleteProject}
				t={t}
				tc={tc}
			/>

			{/* Link License Dialog */}
			<LinkLicenseDialog
				open={linkLicenseDialogOpen}
				onOpenChange={setLinkLicenseDialogOpen}
				orgLicenses={orgLicenses}
				projectLicenses={projectLicenses}
				selectedLicenseId={selectedLicenseId}
				onSelectedLicenseIdChange={setSelectedLicenseId}
				onLink={handleLinkLicense}
				t={t}
				tc={tc}
			/>

			{/* Link Subcontractor Dialog */}
			<LinkSubcontractorDialog
				open={linkSubDialogOpen}
				onOpenChange={setLinkSubDialogOpen}
				orgSubs={orgSubs}
				projectSubs={projectSubs}
				selectedSubId={selectedSubId}
				onSelectedSubIdChange={setSelectedSubId}
				onLink={handleLinkSubcontractor}
				t={t}
				tc={tc}
			/>
		</div>
	);
}
