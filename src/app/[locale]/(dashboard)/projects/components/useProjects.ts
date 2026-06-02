import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import type {
	Project,
	ProjectLicense,
	ProjectSub,
	OrgLicense,
	OrgSubcontractor,
} from "./types";

export interface FormData {
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

export const emptyFormData: FormData = {
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

export function useProjects(t: (key: string) => string) {
	const { toast } = useToast();

	const [projects, setProjects] = useState<Project[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [counts, setCounts] = useState({
		all: 0,
		active: 0,
		completed: 0,
		on_hold: 0,
	});
	const [stats, setStats] = useState({ avgCompliance: 0, atRiskCount: 0 });

	const [projectDialogOpen, setProjectDialogOpen] = useState(false);
	const [detailDialogOpen, setDetailDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [linkLicenseDialogOpen, setLinkLicenseDialogOpen] = useState(false);
	const [linkSubDialogOpen, setLinkSubDialogOpen] = useState(false);

	const [editingProject, setEditingProject] = useState<Project | null>(null);
	const [selectedProject, setSelectedProject] = useState<Project | null>(null);
	const [deletingProject, setDeletingProject] = useState<Project | null>(null);

	const [formData, setFormData] = useState<FormData>({ ...emptyFormData });
	const [saving, setSaving] = useState(false);

	const [projectLicenses, setProjectLicenses] = useState<ProjectLicense[]>([]);
	const [projectSubs, setProjectSubs] = useState<ProjectSub[]>([]);
	const [orgLicenses, setOrgLicenses] = useState<OrgLicense[]>([]);
	const [orgSubs, setOrgSubs] = useState<OrgSubcontractor[]>([]);
	const [selectedLicenseId, setSelectedLicenseId] = useState("");
	const [selectedSubId, setSelectedSubId] = useState("");
	const [detailTab, setDetailTab] = useState("overview");

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
			toast({
				title: "Error",
				description: err.message,
				variant: "destructive",
			});
		} finally {
			setSaving(false);
		}
	};

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
			toast({
				title: "Error",
				description: err.message,
				variant: "destructive",
			});
		}
	};

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
			toast({
				title: "Error",
				description: err.message,
				variant: "destructive",
			});
		}
	};

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

	return {
		projects,
		loading,
		search,
		setSearch,
		statusFilter,
		setStatusFilter,
		counts,
		stats,
		projectDialogOpen,
		setProjectDialogOpen,
		detailDialogOpen,
		setDetailDialogOpen,
		deleteDialogOpen,
		setDeleteDialogOpen,
		linkLicenseDialogOpen,
		setLinkLicenseDialogOpen,
		linkSubDialogOpen,
		setLinkSubDialogOpen,
		editingProject,
		selectedProject,
		deletingProject,
		setDeletingProject,
		formData,
		setFormData,
		saving,
		projectLicenses,
		projectSubs,
		orgLicenses,
		orgSubs,
		selectedLicenseId,
		setSelectedLicenseId,
		selectedSubId,
		setSelectedSubId,
		detailTab,
		setDetailTab,
		openNewProjectDialog,
		openEditProjectDialog,
		openDetailDialog,
		handleSaveProject,
		handleDeleteProject,
		handleLinkLicense,
		handleUnlinkLicense,
		handleLinkSubcontractor,
		handleUnlinkSubcontractor,
	};
}
