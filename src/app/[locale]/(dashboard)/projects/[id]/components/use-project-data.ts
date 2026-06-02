"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type {
	ProjectData,
	ProjectLicense,
	ProjectSub,
	ComplianceData,
} from "./types";

interface LicenseOption {
	id: string;
	name: string;
	licenseNumber: string;
}

interface SubOption {
	id: string;
	name: string;
	company?: string | null;
}

export function useProjectData(projectId: string) {
	const t = useTranslations("projects");
	const router = useRouter();

	const [project, setProject] = useState<ProjectData | null>(null);
	const [projectLicenses, setProjectLicenses] = useState<ProjectLicense[]>([]);
	const [projectSubs, setProjectSubs] = useState<ProjectSub[]>([]);
	const [compliance, setCompliance] = useState<ComplianceData | null>(null);
	const [loading, setLoading] = useState(true);

	// Dialog states
	const [showAddLicense, setShowAddLicense] = useState(false);
	const [showAddSub, setShowAddSub] = useState(false);
	const [licenseOptions, setLicenseOptions] = useState<LicenseOption[]>([]);
	const [subOptions, setSubOptions] = useState<SubOption[]>([]);
	const [selectedLicenseId, setSelectedLicenseId] = useState("");
	const [selectedSubId, setSelectedSubId] = useState("");
	const [linkNotes, setLinkNotes] = useState("");
	const [linkRequired, setLinkRequired] = useState(true);
	const [linkRole, setLinkRole] = useState("");

	const fetchProject = useCallback(async () => {
		if (!projectId) return;
		try {
			setLoading(true);
			const [projRes, compRes] = await Promise.all([
				fetch(`/api/projects/${projectId}`),
				fetch(`/api/projects/${projectId}/compliance`),
			]);
			if (projRes.ok) {
				const data = await projRes.json();
				setProject(data.project);
				setProjectLicenses(data.project?.projectLicenses || []);
				setProjectSubs(data.project?.projectSubs || []);
			} else {
				const errorText = await projRes.text();
				console.error("Project API error:", projRes.status, errorText);
				if (projRes.status === 401) {
					router.push("/login");
				}
			}
			if (compRes.ok) {
				const compData = await compRes.json();
				setCompliance(compData);
			}
		} catch (err) {
			console.error("Fetch project error:", err);
			toast.error(t("loadError"));
		} finally {
			setLoading(false);
		}
	}, [projectId, t, router]);

	useEffect(() => {
		fetchProject();
	}, [fetchProject]);

	const fetchLicenseOptions = async () => {
		try {
			const res = await fetch("/api/licenses?limit=100");
			if (res.ok) {
				const data = await res.json();
				setLicenseOptions(data.licenses || []);
			}
		} catch {
			/* ignore */
		}
	};

	const fetchSubOptions = async () => {
		try {
			const res = await fetch("/api/subcontractors");
			if (res.ok) {
				const data = await res.json();
				setSubOptions(
					(data.subcontractors || []).map((s: any) => ({
						id: s.id,
						name: s.companyName,
						company: s.tradeType || null,
					})),
				);
			}
		} catch {
			/* ignore */
		}
	};

	const handleAddLicense = async () => {
		if (!selectedLicenseId) return;
		try {
			const res = await fetch(`/api/projects/${projectId}/licenses`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					licenseId: selectedLicenseId,
					required: linkRequired,
					notes: linkNotes,
				}),
			});
			if (res.ok) {
				toast.success(t("licenseLinked"));
				setShowAddLicense(false);
				setSelectedLicenseId("");
				setLinkNotes("");
				setLinkRequired(true);
				fetchProject();
			} else {
				const data = await res.json();
				toast.error(data.error || t("linkError"));
			}
		} catch {
			toast.error(t("linkError"));
		}
	};

	const handleRemoveLicense = async (linkId: string) => {
		try {
			const res = await fetch(
				`/api/projects/${projectId}/licenses?linkId=${linkId}`,
				{ method: "DELETE" },
			);
			if (res.ok) {
				toast.success(t("licenseUnlinked"));
				fetchProject();
			}
		} catch {
			toast.error(t("unlinkError"));
		}
	};

	const handleAddSub = async () => {
		if (!selectedSubId) return;
		try {
			const res = await fetch(`/api/projects/${projectId}/subcontractors`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					subcontractorId: selectedSubId,
					role: linkRole,
					notes: linkNotes,
				}),
			});
			if (res.ok) {
				toast.success(t("subLinked"));
				setShowAddSub(false);
				setSelectedSubId("");
				setLinkRole("");
				setLinkNotes("");
				fetchProject();
			} else {
				const data = await res.json();
				toast.error(data.error || t("linkError"));
			}
		} catch {
			toast.error(t("linkError"));
		}
	};

	const handleRemoveSub = async (linkId: string) => {
		try {
			const res = await fetch(
				`/api/projects/${projectId}/subcontractors?linkId=${linkId}`,
				{ method: "DELETE" },
			);
			if (res.ok) {
				toast.success(t("subUnlinked"));
				fetchProject();
			}
		} catch {
			toast.error(t("unlinkError"));
		}
	};

	return {
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
	};
}
