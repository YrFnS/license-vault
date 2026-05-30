"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Users,
	Search,
	Plus,
	LayoutGrid,
	List,
	Star,
	ShieldCheck,
	Eye,
	Loader2,
	Upload,
	Verified,
	Award,
	Ban,
	ChevronDown,
	MapPin,
	Phone,
	Mail,
	Globe,
	Download,
	Zap,
	TrendingUp,
	Shield,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useRole } from "@/hooks/useRole";
import { cn } from "@/lib/utils";

interface Contractor {
	id: string;
	orgId: string;
	companyName: string;
	tradeType: string;
	licenseNumber: string | null;
	licenseState: string | null;
	licenseStatus: string;
	licenseExpiry: string | null;
	contactName: string | null;
	contactEmail: string | null;
	contactPhone: string | null;
	address: string | null;
	city: string | null;
	state: string | null;
	zip: string | null;
	website: string | null;
	insuranceProvider: string | null;
	insuranceExpiry: string | null;
	insuranceStatus: string;
	bondingCapacity: number;
	complianceScore: number;
	totalProjects: number;
	completedProjects: number;
	rating: number;
	reviewCount: number;
	specialties: string | null;
	certifications: string | null;
	serviceAreas: string | null;
	yearsInBusiness: number;
	employeeCount: string | null;
	isVerified: boolean;
	isPreferred: boolean;
	isBlacklisted: boolean;
	notes: string | null;
	tags: string | null;
	lastVerifiedAt: string | null;
	createdAt: string;
	updatedAt: string;
}

interface PaginationInfo {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}

interface ScoreBreakdown {
	licensePoints: number;
	insurancePoints: number;
	bondingPoints: number;
	projectPoints: number;
	verificationPoints: number;
	ratingPoints: number;
	total: number;
	maxTotal: number;
}

interface DirectoryStats {
	totalContractors: number;
	verifiedCount: number;
	preferredCount: number;
	blacklistedCount: number;
	avgScore: number;
	tradeTypeBreakdown: { tradeType: string; count: number }[];
	stateBreakdown: { state: string; count: number }[];
}

const LIMIT = 20;

const US_STATES = [
	"AL",
	"AK",
	"AZ",
	"AR",
	"CA",
	"CO",
	"CT",
	"DE",
	"FL",
	"GA",
	"HI",
	"ID",
	"IL",
	"IN",
	"IA",
	"KS",
	"KY",
	"LA",
	"ME",
	"MD",
	"MA",
	"MI",
	"MN",
	"MS",
	"MO",
	"MT",
	"NE",
	"NV",
	"NH",
	"NJ",
	"NM",
	"NY",
	"NC",
	"ND",
	"OH",
	"OK",
	"OR",
	"PA",
	"RI",
	"SC",
	"SD",
	"TN",
	"TX",
	"UT",
	"VT",
	"VA",
	"WA",
	"WV",
	"WI",
	"WY",
	"DC",
];

const TRADE_TYPES = [
	"electrical",
	"plumbing",
	"hvac",
	"general",
	"roofing",
	"concrete",
	"painting",
	"landscaping",
	"other",
];

const fadeIn = {
	initial: { opacity: 0, y: 10 },
	animate: { opacity: 1, y: 0 },
	exit: { opacity: 0, y: -10 },
};

const staggerContainer = {
	animate: { transition: { staggerChildren: 0.05 } },
};

const staggerItem = {
	initial: { opacity: 0, y: 10 },
	animate: { opacity: 1, y: 0 },
};

function ScoreRing({ score, size = 56 }: { score: number; size?: number }) {
	const r = (size - 8) / 2;
	const circumference = 2 * Math.PI * r;
	const strokeDashoffset = circumference - (score / 100) * circumference;
	const color =
		score >= 80
			? "#10b981"
			: score >= 60
				? "#f59e0b"
				: score >= 40
					? "#f97316"
					: "#ef4444";

	return (
		<div
			className="relative inline-flex items-center justify-center"
			style={{ width: size, height: size }}
		>
			<svg width={size} height={size} className="-rotate-90">
				<circle
					cx={size / 2}
					cy={size / 2}
					r={r}
					fill="none"
					stroke="currentColor"
					strokeWidth={4}
					className="text-muted/30"
				/>
				<circle
					cx={size / 2}
					cy={size / 2}
					r={r}
					fill="none"
					stroke={color}
					strokeWidth={4}
					strokeDasharray={circumference}
					strokeDashoffset={strokeDashoffset}
					strokeLinecap="round"
					className="transition-all duration-700"
				/>
			</svg>
			<span className="absolute text-xs font-bold" style={{ color }}>
				{score}
			</span>
		</div>
	);
}

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
	return (
		<div className="flex items-center gap-0.5">
			{[1, 2, 3, 4, 5].map((i) => (
				<Star
					key={i}
					size={size}
					className={cn(
						i <= Math.round(rating)
							? "fill-amber-400 text-amber-400"
							: "text-muted-foreground/30",
					)}
				/>
			))}
		</div>
	);
}

function TradeBadge({ tradeType }: { tradeType: string }) {
	const t = useTranslations("contractorNetwork");
	const config: Record<string, { className: string }> = {
		electrical: {
			className:
				"bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800",
		},
		plumbing: {
			className:
				"bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-800",
		},
		hvac: {
			className:
				"bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400 border-teal-200 dark:border-teal-800",
		},
		general: {
			className:
				"bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
		},
		roofing: {
			className:
				"bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 border-orange-200 dark:border-orange-800",
		},
		concrete: {
			className:
				"bg-slate-100 text-slate-700 dark:bg-slate-800/40 dark:text-slate-300 border-slate-200 dark:border-slate-700",
		},
		painting: {
			className:
				"bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-400 border-pink-200 dark:border-pink-800",
		},
		landscaping: {
			className:
				"bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400 border-green-200 dark:border-green-800",
		},
		other: {
			className:
				"bg-gray-100 text-gray-700 dark:bg-gray-800/40 dark:text-gray-300 border-gray-200 dark:border-gray-700",
		},
	};
	const c = config[tradeType] || config.other;
	const labelKey = tradeType as string;
	const label = t(labelKey as any) || tradeType;
	return (
		<Badge
			variant="outline"
			className={cn("text-xs font-medium capitalize", c.className)}
		>
			{label}
		</Badge>
	);
}

function LicenseStatusBadge({ status }: { status: string }) {
	const config: Record<string, { label: string; className: string }> = {
		active: {
			label: "Active",
			className:
				"bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
		},
		expired: {
			label: "Expired",
			className:
				"bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-800",
		},
		suspended: {
			label: "Suspended",
			className:
				"bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800",
		},
		revoked: {
			label: "Revoked",
			className:
				"bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-800",
		},
		unknown: {
			label: "Unknown",
			className:
				"bg-gray-100 text-gray-600 dark:bg-gray-800/40 dark:text-gray-400 border-gray-200 dark:border-gray-700",
		},
	};
	const c = config[status] || config.unknown;
	return (
		<Badge variant="outline" className={cn("text-xs font-medium", c.className)}>
			{c.label}
		</Badge>
	);
}

function InsuranceStatusBadge({ status }: { status: string }) {
	const config: Record<string, { label: string; className: string }> = {
		compliant: {
			label: "Compliant",
			className:
				"bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
		},
		deficient: {
			label: "Deficient",
			className:
				"bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800",
		},
		expired: {
			label: "Expired",
			className:
				"bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-800",
		},
		unknown: {
			label: "Unknown",
			className:
				"bg-gray-100 text-gray-600 dark:bg-gray-800/40 dark:text-gray-400 border-gray-200 dark:border-gray-700",
		},
	};
	const c = config[status] || config.unknown;
	return (
		<Badge variant="outline" className={cn("text-xs font-medium", c.className)}>
			{c.label}
		</Badge>
	);
}

export default function ContractorNetworkPage() {
	const t = useTranslations("contractorNetwork");
	const tc = useTranslations("common");
	const { canManage } = useRole();

	const [contractors, setContractors] = useState<Contractor[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [tradeFilter, setTradeFilter] = useState("all");
	const [stateFilter, setStateFilter] = useState("all");
	const [licenseStatusFilter, setLicenseStatusFilter] = useState("all");
	const [insuranceStatusFilter, setInsuranceStatusFilter] = useState("all");
	const [page, setPage] = useState(1);
	const [pagination, setPagination] = useState<PaginationInfo>({
		page: 1,
		limit: LIMIT,
		total: 0,
		totalPages: 0,
	});
	const [stats, setStats] = useState<DirectoryStats | null>(null);

	const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [addOpen, setAddOpen] = useState(false);
	const [detailOpen, setDetailOpen] = useState(false);
	const [importOpen, setImportOpen] = useState(false);
	const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
	const [blacklistDialogOpen, setBlacklistDialogOpen] = useState(false);
	const [selectedContractor, setSelectedContractor] =
		useState<Contractor | null>(null);
	const [detailContractor, setDetailContractor] = useState<Contractor | null>(
		null,
	);
	const [scoreBreakdown, setScoreBreakdown] = useState<ScoreBreakdown | null>(
		null,
	);
	const [saving, setSaving] = useState(false);
	const [importing, setImporting] = useState(false);
	const [showFilters, setShowFilters] = useState(false);

	const [form, setForm] = useState({
		companyName: "",
		tradeType: "general",
		licenseNumber: "",
		licenseState: "",
		licenseStatus: "unknown",
		licenseExpiry: "",
		contactName: "",
		contactEmail: "",
		contactPhone: "",
		address: "",
		city: "",
		state: "",
		zip: "",
		website: "",
		insuranceProvider: "",
		insuranceExpiry: "",
		insuranceStatus: "unknown",
		bondingCapacity: "",
		totalProjects: "",
		completedProjects: "",
		rating: "",
		yearsInBusiness: "",
		employeeCount: "",
		notes: "",
	});

	const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	useEffect(() => {
		if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
		searchTimerRef.current = setTimeout(() => {
			setDebouncedSearch(searchQuery);
			setPage(1);
		}, 300);
		return () => {
			if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
		};
	}, [searchQuery]);

	const fetchContractors = useCallback(async () => {
		try {
			setLoading(true);
			const params = new URLSearchParams({
				page: String(page),
				limit: String(LIMIT),
			});
			if (tradeFilter !== "all") params.set("tradeType", tradeFilter);
			if (stateFilter !== "all") params.set("state", stateFilter);
			if (licenseStatusFilter !== "all")
				params.set("licenseStatus", licenseStatusFilter);
			if (insuranceStatusFilter !== "all")
				params.set("insuranceStatus", insuranceStatusFilter);
			if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());

			const res = await fetch(`/api/contractor-directory?${params.toString()}`);
			if (!res.ok) throw new Error("Failed to fetch contractors");
			const json = await res.json();
			setContractors(json.contractors || []);
			setPagination(
				json.pagination || { page: 1, limit: LIMIT, total: 0, totalPages: 0 },
			);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unknown error");
		} finally {
			setLoading(false);
		}
	}, [
		page,
		tradeFilter,
		stateFilter,
		licenseStatusFilter,
		insuranceStatusFilter,
		debouncedSearch,
	]);

	const fetchStats = useCallback(async () => {
		try {
			const res = await fetch("/api/contractor-directory/stats");
			if (res.ok) {
				const json = await res.json();
				setStats(json);
			}
		} catch {}
	}, []);

	useEffect(() => {
		fetchContractors();
	}, [fetchContractors]);
	useEffect(() => {
		fetchStats();
	}, [fetchStats]);
	useEffect(() => {
		setPage(1);
	}, [tradeFilter, stateFilter, licenseStatusFilter, insuranceStatusFilter]);

	const resetForm = useCallback(() => {
		setForm({
			companyName: "",
			tradeType: "general",
			licenseNumber: "",
			licenseState: "",
			licenseStatus: "unknown",
			licenseExpiry: "",
			contactName: "",
			contactEmail: "",
			contactPhone: "",
			address: "",
			city: "",
			state: "",
			zip: "",
			website: "",
			insuranceProvider: "",
			insuranceExpiry: "",
			insuranceStatus: "unknown",
			bondingCapacity: "",
			totalProjects: "",
			completedProjects: "",
			rating: "",
			yearsInBusiness: "",
			employeeCount: "",
			notes: "",
		});
	}, []);

	const openDetail = useCallback(async (c: Contractor) => {
		setDetailOpen(true);
		setDetailContractor(c);
		try {
			const [detailRes, scoreRes] = await Promise.all([
				fetch(`/api/contractor-directory/${c.id}`),
				fetch(`/api/contractor-directory/${c.id}/score`),
			]);
			if (detailRes.ok) {
				const json = await detailRes.json();
				setDetailContractor(json.contractor);
			}
			if (scoreRes.ok) {
				const json = await scoreRes.json();
				setScoreBreakdown(json.breakdown);
			}
		} catch {}
	}, []);

	const handleSave = useCallback(async () => {
		if (!form.companyName || !form.tradeType) {
			toast.error("Company name and trade type are required");
			return;
		}
		setSaving(true);
		try {
			const payload: any = {
				companyName: form.companyName,
				tradeType: form.tradeType,
				licenseNumber: form.licenseNumber || undefined,
				licenseState: form.licenseState || undefined,
				licenseStatus: form.licenseStatus || undefined,
				licenseExpiry: form.licenseExpiry || undefined,
				contactName: form.contactName || undefined,
				contactEmail: form.contactEmail || undefined,
				contactPhone: form.contactPhone || undefined,
				address: form.address || undefined,
				city: form.city || undefined,
				state: form.state || undefined,
				zip: form.zip || undefined,
				website: form.website || undefined,
				insuranceProvider: form.insuranceProvider || undefined,
				insuranceExpiry: form.insuranceExpiry || undefined,
				insuranceStatus: form.insuranceStatus || undefined,
				bondingCapacity: form.bondingCapacity
					? parseFloat(form.bondingCapacity)
					: undefined,
				totalProjects: form.totalProjects
					? parseInt(form.totalProjects)
					: undefined,
				completedProjects: form.completedProjects
					? parseInt(form.completedProjects)
					: undefined,
				rating: form.rating ? parseFloat(form.rating) : undefined,
				yearsInBusiness: form.yearsInBusiness
					? parseInt(form.yearsInBusiness)
					: undefined,
				employeeCount: form.employeeCount || undefined,
				notes: form.notes || undefined,
			};

			const res = await fetch("/api/contractor-directory", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || "Failed to create contractor");
			}
			toast.success("Contractor added successfully");
			setAddOpen(false);
			resetForm();
			fetchContractors();
			fetchStats();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "An error occurred");
		} finally {
			setSaving(false);
		}
	}, [form, fetchContractors, fetchStats, resetForm]);

	const handleVerify = useCallback(async () => {
		if (!selectedContractor) return;
		try {
			const res = await fetch(
				`/api/contractor-directory/${selectedContractor.id}/verify`,
				{ method: "POST" },
			);
			if (!res.ok) throw new Error("Failed to verify contractor");
			toast.success("Contractor verified successfully");
			setVerifyDialogOpen(false);
			setSelectedContractor(null);
			fetchContractors();
			fetchStats();
			if (detailOpen && detailContractor?.id === selectedContractor.id) {
				openDetail({ ...selectedContractor, isVerified: true });
			}
		} catch {
			toast.error("Failed to verify contractor");
		}
	}, [
		selectedContractor,
		fetchContractors,
		fetchStats,
		detailOpen,
		detailContractor,
		openDetail,
	]);

	const handleBlacklist = useCallback(async () => {
		if (!selectedContractor) return;
		try {
			const res = await fetch(
				`/api/contractor-directory/${selectedContractor.id}`,
				{
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						isBlacklisted: !selectedContractor.isBlacklisted,
					}),
				},
			);
			if (!res.ok) throw new Error("Failed to update contractor");
			toast.success(
				selectedContractor.isBlacklisted
					? "Contractor removed from blacklist"
					: "Contractor blacklisted",
			);
			setBlacklistDialogOpen(false);
			setSelectedContractor(null);
			fetchContractors();
			fetchStats();
		} catch {
			toast.error("Failed to update contractor");
		}
	}, [selectedContractor, fetchContractors, fetchStats]);

	const handleBulkVerify = useCallback(async () => {
		setSaving(true);
		try {
			let count = 0;
			for (const id of selectedIds) {
				const res = await fetch(`/api/contractor-directory/${id}/verify`, {
					method: "POST",
				});
				if (res.ok) count++;
			}
			toast.success(`${count} contractor(s) verified`);
			setSelectedIds(new Set());
			fetchContractors();
			fetchStats();
		} catch {
			toast.error("Failed to verify some contractors");
		} finally {
			setSaving(false);
		}
	}, [selectedIds, fetchContractors, fetchStats]);

	const handleBulkBlacklist = useCallback(async () => {
		setSaving(true);
		try {
			let count = 0;
			for (const id of selectedIds) {
				const res = await fetch(`/api/contractor-directory/${id}`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ isBlacklisted: true }),
				});
				if (res.ok) count++;
			}
			toast.success(`${count} contractor(s) blacklisted`);
			setSelectedIds(new Set());
			fetchContractors();
			fetchStats();
		} catch {
			toast.error("Failed to blacklist some contractors");
		} finally {
			setSaving(false);
		}
	}, [selectedIds, fetchContractors, fetchStats]);

	const handleExport = useCallback(() => {
		const headers = [
			"Company Name",
			"Trade Type",
			"License Number",
			"License State",
			"License Status",
			"Contact Name",
			"Contact Email",
			"Contact Phone",
			"City",
			"State",
			"Compliance Score",
			"Rating",
			"Verified",
			"Preferred",
		];
		const rows = contractors.map((c) => [
			c.companyName,
			c.tradeType,
			c.licenseNumber || "",
			c.licenseState || "",
			c.licenseStatus,
			c.contactName || "",
			c.contactEmail || "",
			c.contactPhone || "",
			c.city || "",
			c.state || "",
			c.complianceScore,
			c.rating,
			c.isVerified ? "Yes" : "No",
			c.isPreferred ? "Yes" : "No",
		]);
		const csv = [headers, ...rows]
			.map((row) =>
				row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
			)
			.join("\n");
		const blob = new Blob([csv], { type: "text/csv" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "contractor-directory.csv";
		a.click();
		URL.revokeObjectURL(url);
		toast.success("Exported successfully");
	}, [contractors]);

	const handleImport = useCallback(async () => {
		setImporting(true);
		try {
			const input = document.createElement("input");
			input.type = "file";
			input.accept = ".csv";
			input.onchange = async (e: any) => {
				const file = e.target.files?.[0];
				if (!file) {
					setImporting(false);
					return;
				}
				const text = await file.text();
				const lines = text.split("\n").filter((l) => l.trim());
				if (lines.length < 2) {
					toast.error(
						"CSV file must have a header row and at least one data row",
					);
					setImporting(false);
					return;
				}
				const headerLine = lines[0];
				const headers = headerLine
					.split(",")
					.map((h) =>
						h.trim().replace(/^"|"$/g, "").toLowerCase().replace(/\s+/g, ""),
					);
				const parsedContractors: Record<string, string>[] = [];
				for (let i = 1; i < lines.length; i++) {
					const values =
						lines[i]
							.match(/(".*?"|[^",]+)/g)
							?.map((v) => v.trim().replace(/^"|"$/g, "")) || [];
					const row = {};
					headers.forEach((h, idx) => {
						row[h] = values[idx] || "";
					});
					parsedContractors.push(row);
				}
				const res = await fetch("/api/contractor-directory/import" as string, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ contractors: parsedContractors }),
				});
				if (!res.ok) throw new Error("Import failed");
				const data = await res.json();
				toast.success(
					`${data.imported} contractor(s) imported${data.errors > 0 ? ` (${data.errors} errors)` : ""}`,
				);
				setImportOpen(false);
				fetchContractors();
				fetchStats();
				setImporting(false);
			};
			input.click();
		} catch {
			toast.error("Import failed");
			setImporting(false);
		}
	}, [fetchContractors, fetchStats]);

	const toggleSelect = (id: string) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};
	const toggleSelectAll = () => {
		if (selectedIds.size === contractors.length) setSelectedIds(new Set());
		else setSelectedIds(new Set(contractors.map((c) => c.id)));
	};

	const statsCards = [
		{
			label: t("totalContractors"),
			value: stats?.totalContractors || 0,
			icon: Users,
			color: "text-teal-600 dark:text-teal-400",
			bg: "bg-gradient-to-br from-teal-50/90 via-teal-50/60 to-emerald-100/40 dark:from-teal-950/40 dark:via-teal-950/20 dark:to-emerald-950/10",
			border: "border-s-teal-500",
		},
		{
			label: t("verified"),
			value: stats?.verifiedCount || 0,
			icon: ShieldCheck,
			color: "text-emerald-600 dark:text-emerald-400",
			bg: "bg-gradient-to-br from-emerald-50/90 via-emerald-50/60 to-teal-100/40 dark:from-emerald-950/40 dark:via-emerald-950/20 dark:to-teal-950/10",
			border: "border-s-emerald-500",
		},
		{
			label: t("preferred"),
			value: stats?.preferredCount || 0,
			icon: Award,
			color: "text-amber-600 dark:text-amber-400",
			bg: "bg-gradient-to-br from-amber-50/90 via-amber-50/60 to-orange-100/40 dark:from-amber-950/40 dark:via-amber-950/20 dark:to-orange-950/10",
			border: "border-s-amber-500",
		},
		{
			label: t("avgScore"),
			value: stats?.avgScore || 0,
			icon: TrendingUp,
			color: "text-emerald-600 dark:text-emerald-400",
			bg: "bg-gradient-to-br from-emerald-50/90 via-emerald-50/60 to-teal-100/40 dark:from-emerald-950/40 dark:via-emerald-950/20 dark:to-teal-950/10",
			border: "border-s-emerald-600",
		},
	];

	// Loading
	if (loading && contractors.length === 0) {
		return (
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-9 w-32" />
				</div>
				<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
					{Array.from({ length: 4 }).map((_, i) => (
						<Skeleton key={i} className="h-24" />
					))}
				</div>
				<Skeleton className="h-10 w-full max-w-md" />
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{Array.from({ length: 6 }).map((_, i) => (
						<Skeleton key={i} className="h-48" />
					))}
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex items-center justify-center min-h-[50vh]">
				<Card className="max-w-md w-full">
					<CardContent className="p-6 text-center">
						<p className="text-destructive font-medium">
							Failed to load contractors
						</p>
						<p className="text-muted-foreground text-sm mt-1">{error}</p>
						<Button
							onClick={() => {
								setError(null);
								fetchContractors();
							}}
							variant="outline"
							className="mt-4"
						>
							{tc("retry")}
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="space-y-6 pb-8">
			{/* Header */}
			<motion.div
				{...fadeIn}
				className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
			>
				<div>
					<h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
						{t("title")}
					</h1>
					<p className="text-muted-foreground text-sm mt-1">
						{t("description")}
					</p>
				</div>
				{canManage && (
					<div className="flex items-center gap-2">
						<Button size="sm" variant="outline" onClick={handleExport}>
							<Download className="size-4 me-1.5" />
							{tc("export")}
						</Button>
						<Button
							size="sm"
							variant="outline"
							onClick={() => setImportOpen(true)}
						>
							<Upload className="size-4 me-1.5" />
							{t("import")}
						</Button>
						<Button
							size="sm"
							onClick={() => {
								resetForm();
								setAddOpen(true);
							}}
							className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-sm shadow-emerald-500/25"
						>
							<Plus className="size-4 me-1.5" />
							{t("addContractor")}
						</Button>
					</div>
				)}
			</motion.div>

			{/* Stats Cards */}
			<motion.div
				variants={staggerContainer}
				initial="initial"
				animate="animate"
				className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4"
			>
				{statsCards.map((stat) => {
					const Icon = stat.icon;
					return (
						<motion.div
							key={stat.label}
							variants={staggerItem}
							whileHover={{ scale: 1.02, y: -2 }}
							transition={{ type: "spring", stiffness: 400, damping: 25 }}
						>
							<Card
								className={cn(
									"relative overflow-hidden border-s-4 shadow-sm hover:shadow-md transition-shadow duration-300",
									stat.bg,
									stat.border,
								)}
							>
								<CardContent className="p-3 md:p-4 lg:p-6">
									<div className="flex items-center justify-between">
										<div>
											<p className="text-xs uppercase tracking-wider text-muted-foreground/70 font-bold">
												{stat.label}
											</p>
											<p className="text-2xl lg:text-3xl font-extrabold tabular-nums mt-1">
												{stat.value}
											</p>
										</div>
										<div className="rounded-xl p-2 lg:p-3 bg-background/50 shadow-sm">
											<Icon className={cn("size-5 lg:size-6", stat.color)} />
										</div>
									</div>
								</CardContent>
							</Card>
						</motion.div>
					);
				})}
			</motion.div>

			{/* Search + Filters + View Toggle */}
			<motion.div {...fadeIn} className="space-y-3">
				<div className="flex flex-col sm:flex-row sm:items-center gap-3">
					<div className="relative flex-1 sm:max-w-md">
						<Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
						<Input
							placeholder={t("search")}
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="ps-9 h-9 bg-muted/30 border-border/50"
						/>
					</div>
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setShowFilters(!showFilters)}
							className={cn(
								showFilters &&
									"bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-700 dark:text-emerald-400",
							)}
						>
							<Zap className="size-4 me-1" />
							Filters
							<ChevronDown
								className={cn(
									"size-4 ms-1 transition-transform",
									showFilters && "rotate-180",
								)}
							/>
						</Button>
						<div className="flex items-center border rounded-lg overflow-hidden">
							<Button
								variant={viewMode === "grid" ? "default" : "ghost"}
								size="icon"
								className={cn(
									"size-9 rounded-none",
									viewMode === "grid" &&
										"bg-gradient-to-r from-emerald-500 to-teal-600 text-white",
								)}
								onClick={() => setViewMode("grid")}
							>
								<LayoutGrid className="size-4" />
								<span className="sr-only">{t("gridView")}</span>
							</Button>
							<Button
								variant={viewMode === "table" ? "default" : "ghost"}
								size="icon"
								className={cn(
									"size-9 rounded-none",
									viewMode === "table" &&
										"bg-gradient-to-r from-emerald-500 to-teal-600 text-white",
								)}
								onClick={() => setViewMode("table")}
							>
								<List className="size-4" />
								<span className="sr-only">{t("tableView")}</span>
							</Button>
						</div>
					</div>
				</div>

				{/* Filter Panel */}
				<AnimatePresence>
					{showFilters && (
						<motion.div
							initial={{ height: 0, opacity: 0 }}
							animate={{ height: "auto", opacity: 1 }}
							exit={{ height: 0, opacity: 0 }}
							className="overflow-hidden"
						>
							<Card className="shadow-sm">
								<CardContent className="p-4">
									<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
										<div>
											<Label className="text-xs font-medium text-muted-foreground mb-1">
												{t("tradeType")}
											</Label>
											<Select
												value={tradeFilter}
												onValueChange={setTradeFilter}
											>
												<SelectTrigger className="h-9 text-sm">
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="all">{t("allTrades")}</SelectItem>
													{TRADE_TYPES.map((tt) => (
														<SelectItem key={tt} value={tt}>
															{t(tt as any) || tt}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
										<div>
											<Label className="text-xs font-medium text-muted-foreground mb-1">
												{t("allStates")}
											</Label>
											<Select
												value={stateFilter}
												onValueChange={setStateFilter}
											>
												<SelectTrigger className="h-9 text-sm">
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="all">{t("allStates")}</SelectItem>
													{US_STATES.map((s) => (
														<SelectItem key={s} value={s}>
															{s}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
										<div>
											<Label className="text-xs font-medium text-muted-foreground mb-1">
												{t("licenseStatus")}
											</Label>
											<Select
												value={licenseStatusFilter}
												onValueChange={setLicenseStatusFilter}
											>
												<SelectTrigger className="h-9 text-sm">
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="all">All</SelectItem>
													<SelectItem value="active">Active</SelectItem>
													<SelectItem value="expired">Expired</SelectItem>
													<SelectItem value="suspended">Suspended</SelectItem>
													<SelectItem value="revoked">Revoked</SelectItem>
													<SelectItem value="unknown">Unknown</SelectItem>
												</SelectContent>
											</Select>
										</div>
										<div>
											<Label className="text-xs font-medium text-muted-foreground mb-1">
												{t("insuranceStatus")}
											</Label>
											<Select
												value={insuranceStatusFilter}
												onValueChange={setInsuranceStatusFilter}
											>
												<SelectTrigger className="h-9 text-sm">
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="all">All</SelectItem>
													<SelectItem value="compliant">Compliant</SelectItem>
													<SelectItem value="deficient">Deficient</SelectItem>
													<SelectItem value="expired">Expired</SelectItem>
													<SelectItem value="unknown">Unknown</SelectItem>
												</SelectContent>
											</Select>
										</div>
									</div>
								</CardContent>
							</Card>
						</motion.div>
					)}
				</AnimatePresence>
			</motion.div>

			{/* Bulk Action Bar */}
			{selectedIds.size > 0 && (
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: 20 }}
					className="fixed bottom-6 start-1/2 -translate-x-1/2 z-50"
				>
					<div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-card border border-border shadow-lg">
						<span className="text-sm font-medium">
							{selectedIds.size} selected
						</span>
						{canManage && (
							<>
								<Button
									size="sm"
									onClick={handleBulkVerify}
									disabled={saving}
									className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
								>
									{saving ? (
										<Loader2 className="size-4 animate-spin me-1" />
									) : (
										<ShieldCheck className="size-4 me-1" />
									)}
									{t("bulkVerify")}
								</Button>
								<Button
									size="sm"
									variant="destructive"
									onClick={handleBulkBlacklist}
									disabled={saving}
								>
									<Ban className="size-4 me-1" />
									{t("bulkBlacklist")}
								</Button>
							</>
						)}
						<Button
							size="sm"
							variant="outline"
							onClick={() => setSelectedIds(new Set())}
						>
							{tc("cancel")}
						</Button>
					</div>
				</motion.div>
			)}

			{/* Empty State */}
			{contractors.length === 0 ? (
				<motion.div
					{...fadeIn}
					className="flex flex-col items-center justify-center py-20 text-center"
				>
					<div className="relative mb-6">
						<div className="rounded-2xl bg-gradient-to-br from-muted/80 to-muted/40 p-6 ring-1 ring-border/20">
							<Users className="size-12 text-muted-foreground/60" />
						</div>
					</div>
					<h3 className="font-semibold text-lg">{t("noContractors")}</h3>
					<p className="text-muted-foreground text-sm mt-1 max-w-sm">
						{t("noContractorsDesc")}
					</p>
					{canManage && (
						<Button
							size="sm"
							className="mt-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-sm shadow-emerald-500/20"
							onClick={() => {
								resetForm();
								setAddOpen(true);
							}}
						>
							<Plus className="size-4 me-1" />
							{t("addContractor")}
						</Button>
					)}
				</motion.div>
			) : (
				<>
					{/* Grid View */}
					<motion.div
						variants={staggerContainer}
						initial="initial"
						animate="animate"
						className={cn(
							viewMode === "grid"
								? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
								: "hidden",
						)}
					>
						{contractors.map((c) => (
							<motion.div
								key={c.id}
								variants={staggerItem}
								whileHover={{ y: -2 }}
								transition={{ type: "spring", stiffness: 400, damping: 25 }}
							>
								<Card
									className={cn(
										"shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer",
										selectedIds.has(c.id) && "ring-2 ring-emerald-500/50",
										c.isBlacklisted && "opacity-60",
									)}
									onClick={() => openDetail(c)}
								>
									<CardContent className="p-4">
										<div className="flex items-start gap-3">
											<div className="shrink-0 mt-0.5">
												{canManage && (
													<Checkbox
														checked={selectedIds.has(c.id)}
														onCheckedChange={() => toggleSelect(c.id)}
														onClick={(e) => e.stopPropagation()}
														className="mb-2"
													/>
												)}
												<ScoreRing score={c.complianceScore} />
											</div>
											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-1.5 flex-wrap">
													<p className="font-semibold truncate">
														{c.companyName}
													</p>
													{c.isVerified && (
														<Verified className="size-4 text-emerald-500 shrink-0" />
													)}
													{c.isPreferred && (
														<Award className="size-4 text-amber-500 shrink-0" />
													)}
													{c.isBlacklisted && (
														<Ban className="size-4 text-red-500 shrink-0" />
													)}
												</div>
												<div className="flex items-center gap-2 mt-1 flex-wrap">
													<TradeBadge tradeType={c.tradeType} />
													{c.city && c.state && (
														<span className="text-xs text-muted-foreground flex items-center gap-0.5">
															<MapPin className="size-3" />
															{c.city}, {c.state}
														</span>
													)}
												</div>
												<div className="flex items-center gap-2 mt-2">
													<StarRating rating={c.rating} size={12} />
													<span className="text-xs text-muted-foreground">
														({c.reviewCount})
													</span>
												</div>
											</div>
										</div>

										<div className="flex items-center gap-2 mt-3 flex-wrap">
											<LicenseStatusBadge status={c.licenseStatus} />
											<InsuranceStatusBadge status={c.insuranceStatus} />
										</div>

										<div className="flex items-center justify-end gap-1 mt-3 pt-2 border-t">
											<Button
												variant="ghost"
												size="sm"
												className="text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 h-7 text-xs"
												onClick={(e) => {
													e.stopPropagation();
													openDetail(c);
												}}
											>
												<Eye className="size-3 me-1" />
												{t("viewDetails")}
											</Button>
											{canManage && !c.isVerified && (
												<Button
													variant="ghost"
													size="sm"
													className="text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/30 h-7 text-xs"
													onClick={(e) => {
														e.stopPropagation();
														setSelectedContractor(c);
														setVerifyDialogOpen(true);
													}}
												>
													<ShieldCheck className="size-3 me-1" />
													{t("verify")}
												</Button>
											)}
										</div>
									</CardContent>
								</Card>
							</motion.div>
						))}
					</motion.div>

					{/* Table View */}
					<motion.div
						{...fadeIn}
						className={cn(viewMode === "table" ? "" : "hidden")}
					>
						<Card className="shadow-sm">
							<CardContent className="p-0">
								<div className="overflow-x-auto">
									<table className="w-full text-sm">
										<thead>
											<tr className="border-b bg-muted/50">
												<th className="p-3 w-10">
													<Checkbox
														checked={
															selectedIds.size === contractors.length &&
															contractors.length > 0
														}
														onCheckedChange={toggleSelectAll}
													/>
												</th>
												<th className="text-start p-3 font-medium text-muted-foreground">
													Company
												</th>
												<th className="text-start p-3 font-medium text-muted-foreground">
													Trade
												</th>
												<th className="text-start p-3 font-medium text-muted-foreground">
													Location
												</th>
												<th className="text-start p-3 font-medium text-muted-foreground">
													Score
												</th>
												<th className="text-start p-3 font-medium text-muted-foreground">
													Rating
												</th>
												<th className="text-start p-3 font-medium text-muted-foreground">
													License
												</th>
												<th className="text-start p-3 font-medium text-muted-foreground">
													Insurance
												</th>
												<th className="text-end p-3 font-medium text-muted-foreground">
													{tc("actions")}
												</th>
											</tr>
										</thead>
										<tbody>
											<AnimatePresence>
												{contractors.map((c) => (
													<motion.tr
														key={c.id}
														variants={staggerItem}
														initial="initial"
														animate="animate"
														className={cn(
															"border-b last:border-0 transition-colors duration-150 cursor-pointer",
															selectedIds.has(c.id)
																? "bg-emerald-50/50 dark:bg-emerald-950/20"
																: "hover:bg-muted/30",
															c.isBlacklisted && "opacity-60",
														)}
														onClick={() => openDetail(c)}
													>
														<td className="p-3">
															<Checkbox
																checked={selectedIds.has(c.id)}
																onCheckedChange={() => toggleSelect(c.id)}
																onClick={(e) => e.stopPropagation()}
															/>
														</td>
														<td className="p-3">
															<div className="flex items-center gap-2">
																<div>
																	<div className="flex items-center gap-1">
																		<p className="font-medium">
																			{c.companyName}
																		</p>
																		{c.isVerified && (
																			<Verified className="size-3.5 text-emerald-500" />
																		)}
																		{c.isPreferred && (
																			<Award className="size-3.5 text-amber-500" />
																		)}
																		{c.isBlacklisted && (
																			<Ban className="size-3.5 text-red-500" />
																		)}
																	</div>
																	{c.contactName && (
																		<p className="text-xs text-muted-foreground">
																			{c.contactName}
																		</p>
																	)}
																</div>
															</div>
														</td>
														<td className="p-3">
															<TradeBadge tradeType={c.tradeType} />
														</td>
														<td className="p-3 text-muted-foreground text-xs">
															{c.city && c.state
																? `${c.city}, ${c.state}`
																: c.state || "—"}
														</td>
														<td className="p-3">
															<div className="flex items-center gap-2">
																<ScoreRing
																	score={c.complianceScore}
																	size={36}
																/>
															</div>
														</td>
														<td className="p-3">
															<div className="flex items-center gap-1">
																<StarRating rating={c.rating} size={12} />
																<span className="text-xs text-muted-foreground">
																	({c.reviewCount})
																</span>
															</div>
														</td>
														<td className="p-3">
															<LicenseStatusBadge status={c.licenseStatus} />
														</td>
														<td className="p-3">
															<InsuranceStatusBadge
																status={c.insuranceStatus}
															/>
														</td>
														<td className="p-3">
															<div
																className="flex items-center justify-end gap-1"
																onClick={(e) => e.stopPropagation()}
															>
																<Button
																	variant="ghost"
																	size="icon"
																	className="size-8 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/30"
																	onClick={() => openDetail(c)}
																>
																	<Eye className="size-4" />
																	<span className="sr-only">
																		{tc("viewDetails")}
																	</span>
																</Button>
																{canManage && !c.isVerified && (
																	<Button
																		variant="ghost"
																		size="icon"
																		className="size-8 hover:bg-teal-50 hover:text-teal-600 dark:hover:bg-teal-950/30"
																		onClick={() => {
																			setSelectedContractor(c);
																			setVerifyDialogOpen(true);
																		}}
																	>
																		<ShieldCheck className="size-4" />
																		<span className="sr-only">
																			{t("verify")}
																		</span>
																	</Button>
																)}
																{canManage && (
																	<Button
																		variant="ghost"
																		size="icon"
																		className={cn(
																			"size-8",
																			c.isBlacklisted
																				? "hover:bg-emerald-50 hover:text-emerald-600"
																				: "hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30",
																		)}
																		onClick={() => {
																			setSelectedContractor(c);
																			setBlacklistDialogOpen(true);
																		}}
																	>
																		<Ban className="size-4" />
																		<span className="sr-only">
																			{t("blacklistedBadge")}
																		</span>
																	</Button>
																)}
															</div>
														</td>
													</motion.tr>
												))}
											</AnimatePresence>
										</tbody>
									</table>
								</div>
							</CardContent>
						</Card>
					</motion.div>

					{/* Pagination */}
					{pagination.totalPages > 1 && (
						<div className="flex items-center justify-center gap-2">
							<Button
								variant="outline"
								size="sm"
								disabled={page <= 1}
								onClick={() => setPage(page - 1)}
							>
								Previous
							</Button>
							<span className="text-sm text-muted-foreground">
								Page {page} of {pagination.totalPages}
							</span>
							<Button
								variant="outline"
								size="sm"
								disabled={page >= pagination.totalPages}
								onClick={() => setPage(page + 1)}
							>
								Next
							</Button>
						</div>
					)}
				</>
			)}

			{/* Add Contractor Dialog */}
			<Dialog open={addOpen} onOpenChange={setAddOpen}>
				<DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>{t("addContractor")}</DialogTitle>
						<DialogDescription>
							Add a new contractor to your directory
						</DialogDescription>
					</DialogHeader>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
						<div className="space-y-2">
							<Label>Company Name *</Label>
							<Input
								value={form.companyName}
								onChange={(e) =>
									setForm((f) => ({ ...f, companyName: e.target.value }))
								}
								placeholder="Acme Electrical"
							/>
						</div>
						<div className="space-y-2">
							<Label>Trade Type *</Label>
							<Select
								value={form.tradeType}
								onValueChange={(v) => setForm((f) => ({ ...f, tradeType: v }))}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{TRADE_TYPES.map((tt) => (
										<SelectItem key={tt} value={tt}>
											{t(tt as any) || tt}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label>License Number</Label>
							<Input
								value={form.licenseNumber}
								onChange={(e) =>
									setForm((f) => ({ ...f, licenseNumber: e.target.value }))
								}
							/>
						</div>
						<div className="space-y-2">
							<Label>License State</Label>
							<Select
								value={form.licenseState}
								onValueChange={(v) =>
									setForm((f) => ({ ...f, licenseState: v }))
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select state" />
								</SelectTrigger>
								<SelectContent>
									{US_STATES.map((s) => (
										<SelectItem key={s} value={s}>
											{s}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label>License Status</Label>
							<Select
								value={form.licenseStatus}
								onValueChange={(v) =>
									setForm((f) => ({ ...f, licenseStatus: v }))
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="active">Active</SelectItem>
									<SelectItem value="expired">Expired</SelectItem>
									<SelectItem value="suspended">Suspended</SelectItem>
									<SelectItem value="revoked">Revoked</SelectItem>
									<SelectItem value="unknown">Unknown</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label>License Expiry</Label>
							<Input
								type="date"
								value={form.licenseExpiry}
								onChange={(e) =>
									setForm((f) => ({ ...f, licenseExpiry: e.target.value }))
								}
							/>
						</div>
						<div className="space-y-2">
							<Label>Contact Name</Label>
							<Input
								value={form.contactName}
								onChange={(e) =>
									setForm((f) => ({ ...f, contactName: e.target.value }))
								}
							/>
						</div>
						<div className="space-y-2">
							<Label>Contact Email</Label>
							<Input
								type="email"
								value={form.contactEmail}
								onChange={(e) =>
									setForm((f) => ({ ...f, contactEmail: e.target.value }))
								}
							/>
						</div>
						<div className="space-y-2">
							<Label>Contact Phone</Label>
							<Input
								value={form.contactPhone}
								onChange={(e) =>
									setForm((f) => ({ ...f, contactPhone: e.target.value }))
								}
							/>
						</div>
						<div className="space-y-2">
							<Label>Address</Label>
							<Input
								value={form.address}
								onChange={(e) =>
									setForm((f) => ({ ...f, address: e.target.value }))
								}
							/>
						</div>
						<div className="space-y-2">
							<Label>City</Label>
							<Input
								value={form.city}
								onChange={(e) =>
									setForm((f) => ({ ...f, city: e.target.value }))
								}
							/>
						</div>
						<div className="space-y-2">
							<Label>State</Label>
							<Select
								value={form.state}
								onValueChange={(v) => setForm((f) => ({ ...f, state: v }))}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select state" />
								</SelectTrigger>
								<SelectContent>
									{US_STATES.map((s) => (
										<SelectItem key={s} value={s}>
											{s}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label>ZIP</Label>
							<Input
								value={form.zip}
								onChange={(e) =>
									setForm((f) => ({ ...f, zip: e.target.value }))
								}
							/>
						</div>
						<div className="space-y-2">
							<Label>Website</Label>
							<Input
								value={form.website}
								onChange={(e) =>
									setForm((f) => ({ ...f, website: e.target.value }))
								}
							/>
						</div>
						<div className="space-y-2">
							<Label>Insurance Provider</Label>
							<Input
								value={form.insuranceProvider}
								onChange={(e) =>
									setForm((f) => ({ ...f, insuranceProvider: e.target.value }))
								}
							/>
						</div>
						<div className="space-y-2">
							<Label>Insurance Expiry</Label>
							<Input
								type="date"
								value={form.insuranceExpiry}
								onChange={(e) =>
									setForm((f) => ({ ...f, insuranceExpiry: e.target.value }))
								}
							/>
						</div>
						<div className="space-y-2">
							<Label>Insurance Status</Label>
							<Select
								value={form.insuranceStatus}
								onValueChange={(v) =>
									setForm((f) => ({ ...f, insuranceStatus: v }))
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="compliant">Compliant</SelectItem>
									<SelectItem value="deficient">Deficient</SelectItem>
									<SelectItem value="expired">Expired</SelectItem>
									<SelectItem value="unknown">Unknown</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label>Bonding Capacity ($)</Label>
							<Input
								type="number"
								value={form.bondingCapacity}
								onChange={(e) =>
									setForm((f) => ({ ...f, bondingCapacity: e.target.value }))
								}
							/>
						</div>
						<div className="space-y-2">
							<Label>Total Projects</Label>
							<Input
								type="number"
								value={form.totalProjects}
								onChange={(e) =>
									setForm((f) => ({ ...f, totalProjects: e.target.value }))
								}
							/>
						</div>
						<div className="space-y-2">
							<Label>Completed Projects</Label>
							<Input
								type="number"
								value={form.completedProjects}
								onChange={(e) =>
									setForm((f) => ({ ...f, completedProjects: e.target.value }))
								}
							/>
						</div>
						<div className="space-y-2">
							<Label>Rating (0-5)</Label>
							<Input
								type="number"
								min="0"
								max="5"
								step="0.1"
								value={form.rating}
								onChange={(e) =>
									setForm((f) => ({ ...f, rating: e.target.value }))
								}
							/>
						</div>
						<div className="space-y-2">
							<Label>Years in Business</Label>
							<Input
								type="number"
								value={form.yearsInBusiness}
								onChange={(e) =>
									setForm((f) => ({ ...f, yearsInBusiness: e.target.value }))
								}
							/>
						</div>
						<div className="space-y-2">
							<Label>Employee Count</Label>
							<Select
								value={form.employeeCount}
								onValueChange={(v) =>
									setForm((f) => ({ ...f, employeeCount: v }))
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="1-10">1-10</SelectItem>
									<SelectItem value="11-50">11-50</SelectItem>
									<SelectItem value="51-200">51-200</SelectItem>
									<SelectItem value="200+">200+</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2 md:col-span-2">
							<Label>Notes</Label>
							<Textarea
								value={form.notes}
								onChange={(e) =>
									setForm((f) => ({ ...f, notes: e.target.value }))
								}
								rows={3}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setAddOpen(false)}>
							{tc("cancel")}
						</Button>
						<Button
							onClick={handleSave}
							disabled={saving}
							className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
						>
							{saving ? (
								<Loader2 className="size-4 animate-spin me-1" />
							) : (
								<Plus className="size-4 me-1" />
							)}
							{tc("create")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Detail Dialog */}
			<Dialog open={detailOpen} onOpenChange={setDetailOpen}>
				<DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
					{detailContractor && (
						<>
							<DialogHeader>
								<div className="flex items-center gap-2">
									<DialogTitle className="text-xl">
										{detailContractor.companyName}
									</DialogTitle>
									{detailContractor.isVerified && (
										<Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200">
											<Verified className="size-3 me-1" />
											{t("verifiedBadge")}
										</Badge>
									)}
									{detailContractor.isPreferred && (
										<Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200">
											<Award className="size-3 me-1" />
											{t("preferredBadge")}
										</Badge>
									)}
									{detailContractor.isBlacklisted && (
										<Badge className="bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-red-200">
											<Ban className="size-3 me-1" />
											{t("blacklistedBadge")}
										</Badge>
									)}
								</div>
								<DialogDescription>
									<div className="flex items-center gap-2 mt-1">
										<TradeBadge tradeType={detailContractor.tradeType} />
										{detailContractor.city && detailContractor.state && (
											<span className="text-xs flex items-center gap-0.5">
												<MapPin className="size-3" />
												{detailContractor.city}, {detailContractor.state}
											</span>
										)}
									</div>
								</DialogDescription>
							</DialogHeader>

							<div className="space-y-6 mt-4">
								{/* Score + Rating */}
								<div className="grid grid-cols-2 gap-4">
									<Card className="shadow-sm">
										<CardContent className="p-4 flex items-center gap-4">
											<ScoreRing
												score={detailContractor.complianceScore}
												size={64}
											/>
											<div>
												<p className="font-semibold">{t("complianceScore")}</p>
												<p className="text-2xl font-bold">
													{detailContractor.complianceScore}/100
												</p>
											</div>
										</CardContent>
									</Card>
									<Card className="shadow-sm">
										<CardContent className="p-4">
											<p className="font-semibold mb-1">{t("rating")}</p>
											<div className="flex items-center gap-2">
												<StarRating
													rating={detailContractor.rating}
													size={20}
												/>
												<span className="text-lg font-bold">
													{detailContractor.rating.toFixed(1)}
												</span>
												<span className="text-sm text-muted-foreground">
													({detailContractor.reviewCount})
												</span>
											</div>
										</CardContent>
									</Card>
								</div>

								{/* Score Breakdown */}
								{scoreBreakdown && (
									<Card className="shadow-sm">
										<CardContent className="p-4">
											<p className="font-semibold mb-3">
												{t("scoreBreakdown")}
											</p>
											<div className="space-y-2">
												{[
													{
														label: t("licensePoints"),
														value: scoreBreakdown.licensePoints,
														max: 30,
													},
													{
														label: t("insurancePoints"),
														value: scoreBreakdown.insurancePoints,
														max: 25,
													},
													{
														label: t("bondingPoints"),
														value: scoreBreakdown.bondingPoints,
														max: 15,
													},
													{
														label: t("projectPoints"),
														value: scoreBreakdown.projectPoints,
														max: 15,
													},
													{
														label: t("verificationPoints"),
														value: scoreBreakdown.verificationPoints,
														max: 10,
													},
													{
														label: t("ratingPoints"),
														value: scoreBreakdown.ratingPoints,
														max: 5,
													},
												].map((item) => (
													<div
														key={item.label}
														className="flex items-center gap-3"
													>
														<span className="text-sm w-36 shrink-0">
															{item.label}
														</span>
														<div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
															<div
																className={cn(
																	"h-full rounded-full transition-all duration-500",
																	item.value / item.max > 0.7
																		? "bg-emerald-500"
																		: item.value / item.max > 0.4
																			? "bg-amber-500"
																			: "bg-red-500",
																)}
																style={{
																	width: `${(item.value / item.max) * 100}%`,
																}}
															/>
														</div>
														<span className="text-sm font-medium w-16 text-end">
															{item.value}/{item.max}
														</span>
													</div>
												))}
											</div>
										</CardContent>
									</Card>
								)}

								{/* Contact Info */}
								<Card className="shadow-sm">
									<CardContent className="p-4">
										<p className="font-semibold mb-3">Contact Information</p>
										<div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
											{detailContractor.contactName && (
												<div className="flex items-center gap-2">
													<Users className="size-4 text-muted-foreground" />
													{detailContractor.contactName}
												</div>
											)}
											{detailContractor.contactEmail && (
												<div className="flex items-center gap-2">
													<Mail className="size-4 text-muted-foreground" />
													{detailContractor.contactEmail}
												</div>
											)}
											{detailContractor.contactPhone && (
												<div className="flex items-center gap-2">
													<Phone className="size-4 text-muted-foreground" />
													{detailContractor.contactPhone}
												</div>
											)}
											{detailContractor.website && (
												<div className="flex items-center gap-2">
													<Globe className="size-4 text-muted-foreground" />
													<a
														href={detailContractor.website}
														target="_blank"
														rel="noopener noreferrer"
														className="text-emerald-600 hover:underline"
													>
														{detailContractor.website}
													</a>
												</div>
											)}
											{detailContractor.address && (
												<div className="flex items-center gap-2">
													<MapPin className="size-4 text-muted-foreground" />
													{detailContractor.address}
													{detailContractor.city
														? `, ${detailContractor.city}`
														: ""}
													{detailContractor.state
														? `, ${detailContractor.state}`
														: ""}
													{detailContractor.zip
														? ` ${detailContractor.zip}`
														: ""}
												</div>
											)}
										</div>
									</CardContent>
								</Card>

								{/* License & Insurance */}
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<Card className="shadow-sm">
										<CardContent className="p-4">
											<p className="font-semibold mb-2 flex items-center gap-2">
												<Shield className="size-4" />
												License Details
											</p>
											<div className="space-y-1.5 text-sm">
												<div className="flex justify-between">
													<span className="text-muted-foreground">Number</span>
													<span className="font-medium">
														{detailContractor.licenseNumber || "—"}
													</span>
												</div>
												<div className="flex justify-between">
													<span className="text-muted-foreground">State</span>
													<span className="font-medium">
														{detailContractor.licenseState || "—"}
													</span>
												</div>
												<div className="flex justify-between">
													<span className="text-muted-foreground">Status</span>
													<LicenseStatusBadge
														status={detailContractor.licenseStatus}
													/>
												</div>
												<div className="flex justify-between">
													<span className="text-muted-foreground">Expiry</span>
													<span className="font-medium">
														{detailContractor.licenseExpiry
															? new Date(
																	detailContractor.licenseExpiry,
																).toLocaleDateString()
															: "—"}
													</span>
												</div>
											</div>
										</CardContent>
									</Card>
									<Card className="shadow-sm">
										<CardContent className="p-4">
											<p className="font-semibold mb-2 flex items-center gap-2">
												<ShieldCheck className="size-4" />
												Insurance Details
											</p>
											<div className="space-y-1.5 text-sm">
												<div className="flex justify-between">
													<span className="text-muted-foreground">
														Provider
													</span>
													<span className="font-medium">
														{detailContractor.insuranceProvider || "—"}
													</span>
												</div>
												<div className="flex justify-between">
													<span className="text-muted-foreground">Status</span>
													<InsuranceStatusBadge
														status={detailContractor.insuranceStatus}
													/>
												</div>
												<div className="flex justify-between">
													<span className="text-muted-foreground">Expiry</span>
													<span className="font-medium">
														{detailContractor.insuranceExpiry
															? new Date(
																	detailContractor.insuranceExpiry,
																).toLocaleDateString()
															: "—"}
													</span>
												</div>
											</div>
										</CardContent>
									</Card>
								</div>

								{/* Additional Info */}
								<Card className="shadow-sm">
									<CardContent className="p-4">
										<p className="font-semibold mb-3">Additional Details</p>
										<div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
											<div>
												<span className="text-muted-foreground block text-xs">
													{t("bondingCapacity")}
												</span>
												<span className="font-medium">
													$
													{(
														detailContractor.bondingCapacity || 0
													).toLocaleString()}
												</span>
											</div>
											<div>
												<span className="text-muted-foreground block text-xs">
													{t("yearsInBusiness")}
												</span>
												<span className="font-medium">
													{detailContractor.yearsInBusiness}
												</span>
											</div>
											<div>
												<span className="text-muted-foreground block text-xs">
													{t("employeeCount")}
												</span>
												<span className="font-medium">
													{detailContractor.employeeCount || "—"}
												</span>
											</div>
											<div>
												<span className="text-muted-foreground block text-xs">
													{t("completedProjects")}
												</span>
												<span className="font-medium">
													{detailContractor.completedProjects}/
													{detailContractor.totalProjects}
												</span>
											</div>
											<div>
												<span className="text-muted-foreground block text-xs">
													Verified
												</span>
												<span className="font-medium">
													{detailContractor.isVerified ? "Yes" : "No"}
													{detailContractor.lastVerifiedAt
														? ` (${new Date(detailContractor.lastVerifiedAt).toLocaleDateString()})`
														: ""}
												</span>
											</div>
										</div>
										{detailContractor.specialties &&
											(() => {
												try {
													const items = JSON.parse(
														detailContractor.specialties,
													);
													if (Array.isArray(items) && items.length > 0) {
														return (
															<div className="mt-3">
																<span className="text-xs text-muted-foreground block mb-1">
																	{t("specialties")}
																</span>
																<div className="flex flex-wrap gap-1">
																	{items.map((s: string, i: number) => (
																		<Badge
																			key={i}
																			variant="outline"
																			className="text-xs"
																		>
																			{s}
																		</Badge>
																	))}
																</div>
															</div>
														);
													}
												} catch {}
												return null;
											})()}
										{detailContractor.certifications &&
											(() => {
												try {
													const items = JSON.parse(
														detailContractor.certifications,
													);
													if (Array.isArray(items) && items.length > 0) {
														return (
															<div className="mt-3">
																<span className="text-xs text-muted-foreground block mb-1">
																	{t("certifications")}
																</span>
																<div className="flex flex-wrap gap-1">
																	{items.map((s: string, i: number) => (
																		<Badge
																			key={i}
																			variant="outline"
																			className="text-xs bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400"
																		>
																			{s}
																		</Badge>
																	))}
																</div>
															</div>
														);
													}
												} catch {}
												return null;
											})()}
										{detailContractor.serviceAreas &&
											(() => {
												try {
													const items = JSON.parse(
														detailContractor.serviceAreas,
													);
													if (Array.isArray(items) && items.length > 0) {
														return (
															<div className="mt-3">
																<span className="text-xs text-muted-foreground block mb-1">
																	{t("serviceAreas")}
																</span>
																<div className="flex flex-wrap gap-1">
																	{items.map((s: string, i: number) => (
																		<Badge
																			key={i}
																			variant="outline"
																			className="text-xs"
																		>
																			{s}
																		</Badge>
																	))}
																</div>
															</div>
														);
													}
												} catch {}
												return null;
											})()}
										{detailContractor.notes && (
											<div className="mt-3">
												<span className="text-xs text-muted-foreground block mb-1">
													Notes
												</span>
												<p className="text-sm bg-muted/50 rounded-md p-2">
													{detailContractor.notes}
												</p>
											</div>
										)}
									</CardContent>
								</Card>

								{/* Actions */}
								{canManage && (
									<div className="flex items-center gap-2 justify-end">
										{!detailContractor.isVerified && (
											<Button
												onClick={() => {
													setSelectedContractor(detailContractor);
													setVerifyDialogOpen(true);
												}}
												className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
											>
												<ShieldCheck className="size-4 me-1" />
												{t("verify")}
											</Button>
										)}
										<Button
											variant={
												detailContractor.isBlacklisted
													? "default"
													: "destructive"
											}
											onClick={() => {
												setSelectedContractor(detailContractor);
												setBlacklistDialogOpen(true);
											}}
										>
											<Ban className="size-4 me-1" />
											{detailContractor.isBlacklisted
												? "Remove Blacklist"
												: t("blacklistedBadge")}
										</Button>
									</div>
								)}
							</div>
						</>
					)}
				</DialogContent>
			</Dialog>

			{/* Import Dialog */}
			<Dialog open={importOpen} onOpenChange={setImportOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>{t("import")}</DialogTitle>
						<DialogDescription>
							Import contractors from a CSV file
						</DialogDescription>
					</DialogHeader>
					<div className="py-4 text-center">
						<div className="rounded-xl border-2 border-dashed border-border/50 p-8 hover:border-emerald-300 transition-colors">
							<Upload className="size-10 text-muted-foreground/50 mx-auto mb-3" />
							<p className="text-sm text-muted-foreground">
								Required: companyName, tradeType
							</p>
							<p className="text-xs text-muted-foreground mt-1">
								Optional: licenseNumber, licenseState, licenseStatus,
								contactName, contactEmail, contactPhone, city, state,
								insuranceProvider, insuranceStatus, bondingCapacity, rating,
								yearsInBusiness
							</p>
						</div>
						<Button
							onClick={handleImport}
							disabled={importing}
							className="mt-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
						>
							{importing ? (
								<Loader2 className="size-4 animate-spin me-1" />
							) : (
								<Upload className="size-4 me-1" />
							)}
							Select CSV File
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			{/* Verify Confirmation */}
			<AlertDialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("confirmVerify")}</AlertDialogTitle>
						<AlertDialogDescription>
							{t("confirmVerifyDesc")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleVerify}
							className="bg-emerald-600 hover:bg-emerald-700"
						>
							{t("verify")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Blacklist Confirmation */}
			<AlertDialog
				open={blacklistDialogOpen}
				onOpenChange={setBlacklistDialogOpen}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("confirmBlacklist")}</AlertDialogTitle>
						<AlertDialogDescription>
							{t("confirmBlacklistDesc")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleBlacklist}
							className="bg-red-600 hover:bg-red-700"
						>
							{selectedContractor?.isBlacklisted
								? "Remove Blacklist"
								: t("blacklistedBadge")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
