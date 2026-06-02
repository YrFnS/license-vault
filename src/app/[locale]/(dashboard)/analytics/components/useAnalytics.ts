import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import type {
	OverviewData,
	TrendPoint,
	CostData,
	TeamActivityData,
	PortfolioData,
	ScheduleConfig,
} from "./types";

export function useAnalytics(t: (key: string) => string) {
	const { toast } = useToast();

	// Data states
	const [overview, setOverview] = useState<OverviewData | null>(null);
	const [trendData, setTrendData] = useState<TrendPoint[]>([]);
	const [costData, setCostData] = useState<CostData | null>(null);
	const [teamData, setTeamData] = useState<TeamActivityData | null>(null);
	const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(
		null,
	);
	const [loading, setLoading] = useState(true);

	// Trend controls
	const [trendPeriod, setTrendPeriod] = useState("30d");

	// Cost parameters
	const [avgFine, setAvgFine] = useState(2500);
	const [dailyPenalty, setDailyPenalty] = useState(100);

	// Report builder state
	const [reportType, setReportType] = useState("complianceSummary");
	const [dateRange, setDateRange] = useState("last30");
	const [stateFilter, setStateFilter] = useState("all");
	const [licenseTypeFilter, setLicenseTypeFilter] = useState("all");
	const [reportFormat, setReportFormat] = useState("pdf");
	const [generating, setGenerating] = useState(false);

	// Schedule reports state
	const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfig>({
		frequency: "monthly",
		recipients: [],
		reportType: "compliance",
		format: "pdf",
		enabled: false,
	});
	const [newRecipient, setNewRecipient] = useState("");
	const [savingSchedule, setSavingSchedule] = useState(false);

	// Fetchers
	const fetchOverview = useCallback(async () => {
		try {
			const res = await fetch("/api/analytics/overview");
			if (res.ok) {
				const data = await res.json();
				setOverview(data.overview);
			}
		} catch (err) {
			console.error("Failed to fetch overview:", err);
		}
	}, []);

	const fetchTrends = useCallback(async () => {
		try {
			const res = await fetch(
				`/api/analytics/compliance-trends?period=${trendPeriod}`,
			);
			if (res.ok) {
				const data = await res.json();
				setTrendData(data.data || []);
			}
		} catch (err) {
			console.error("Failed to fetch trends:", err);
		}
	}, [trendPeriod]);

	const fetchCost = useCallback(async () => {
		try {
			const res = await fetch(
				`/api/analytics/cost-calculator?avgFine=${avgFine}&dailyPenalty=${dailyPenalty}`,
			);
			if (res.ok) {
				const data = await res.json();
				setCostData(data);
			}
		} catch (err) {
			console.error("Failed to fetch cost:", err);
		}
	}, [avgFine, dailyPenalty]);

	const fetchTeam = useCallback(async () => {
		try {
			const res = await fetch("/api/analytics/team-activity");
			if (res.ok) {
				const data = await res.json();
				setTeamData(data);
			}
		} catch (err) {
			console.error("Failed to fetch team:", err);
		}
	}, []);

	const fetchPortfolio = useCallback(async () => {
		try {
			const res = await fetch("/api/analytics/portfolio");
			if (res.ok) {
				const data = await res.json();
				setPortfolioData(data);
			}
		} catch (err) {
			console.error("Failed to fetch portfolio:", err);
		}
	}, []);

	const fetchScheduleConfig = useCallback(async () => {
		try {
			const res = await fetch("/api/reports/schedule");
			if (res.ok) {
				const data = await res.json();
				if (data.config) {
					setScheduleConfig({
						frequency: data.config.frequency || "monthly",
						recipients: data.config.recipients || [],
						reportType: data.config.reportType || "compliance",
						format: data.config.format || "pdf",
						enabled: data.config.enabled || false,
					});
				}
			}
		} catch (err) {
			console.error("Failed to fetch schedule:", err);
		}
	}, []);

	const handleGenerateReport = useCallback(async () => {
		setGenerating(true);
		try {
			const now = new Date();
			let startDate = "";
			let endDate = now.toISOString().split("T")[0];
			switch (dateRange) {
				case "last7": {
					const d = new Date();
					d.setDate(d.getDate() - 7);
					startDate = d.toISOString().split("T")[0];
					break;
				}
				case "last30": {
					const d = new Date();
					d.setDate(d.getDate() - 30);
					startDate = d.toISOString().split("T")[0];
					break;
				}
				case "last90": {
					const d = new Date();
					d.setDate(d.getDate() - 90);
					startDate = d.toISOString().split("T")[0];
					break;
				}
				case "lastYear": {
					const d = new Date();
					d.setFullYear(d.getFullYear() - 1);
					startDate = d.toISOString().split("T")[0];
					break;
				}
				case "all": {
					startDate = "";
					endDate = "";
					break;
				}
			}
			const typeMap: Record<string, string> = {
				complianceSummary: "compliance",
				licenseStatus: "licenses",
				insuranceStatus: "insurance",
				ceTracking: "ce",
				fullAudit: "full",
			};
			const apiType = typeMap[reportType] || "compliance";
			let url = "";
			if (reportFormat === "pdf") {
				const params = new URLSearchParams();
				params.set("type", apiType);
				if (stateFilter !== "all") params.set("state", stateFilter);
				if (licenseTypeFilter !== "all")
					params.set("licenseType", licenseTypeFilter);
				if (startDate) params.set("startDate", startDate);
				if (endDate) params.set("endDate", endDate);
				url = `/api/reports/pdf?${params.toString()}`;
			} else {
				const params = new URLSearchParams();
				params.set("format", "csv");
				if (stateFilter !== "all") params.set("state", stateFilter);
				if (licenseTypeFilter !== "all") params.set("type", licenseTypeFilter);
				url = `/api/licenses/export?${params.toString()}`;
			}
			const res = await fetch(url);
			if (!res.ok) {
				const errData = await res
					.json()
					.catch(() => ({ error: "Failed to generate report" }));
				throw new Error(errData.error || "Failed to generate report");
			}
			const blob = await res.blob();
			const contentDisposition = res.headers.get("Content-Disposition");
			let filename =
				reportFormat === "pdf"
					? "compliance-report.pdf"
					: "licenses-export.csv";
			if (contentDisposition) {
				const match = contentDisposition.match(
					/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/,
				);
				if (match) filename = match[1].replace(/['"]/g, "");
			}
			const downloadUrl = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = downloadUrl;
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(downloadUrl);
			toast({
				title: `${t("reports.generate")} ✓`,
				description: `Report downloaded as ${filename}`,
			});
		} catch (err) {
			toast({
				title: "Error",
				description:
					err instanceof Error ? err.message : "Failed to generate report",
				variant: "destructive",
			});
		} finally {
			setGenerating(false);
		}
	}, [
		reportType,
		dateRange,
		stateFilter,
		licenseTypeFilter,
		reportFormat,
		t,
		toast,
	]);

	const handleSaveSchedule = useCallback(async () => {
		setSavingSchedule(true);
		try {
			const res = await fetch("/api/reports/schedule", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(scheduleConfig),
			});
			if (!res.ok) {
				const errData = await res
					.json()
					.catch(() => ({ error: "Failed to save" }));
				throw new Error(errData.error || "Failed to save schedule");
			}
			toast({
				title: "Schedule Saved",
				description: "Report schedule has been saved successfully.",
			});
		} catch (err) {
			toast({
				title: "Error",
				description:
					err instanceof Error ? err.message : "Failed to save schedule",
				variant: "destructive",
			});
		} finally {
			setSavingSchedule(false);
		}
	}, [scheduleConfig, toast]);

	const addRecipient = useCallback(() => {
		const email = newRecipient.trim();
		if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			setScheduleConfig((prev) => ({
				...prev,
				recipients: [...prev.recipients, email],
			}));
			setNewRecipient("");
		}
	}, [newRecipient]);

	const removeRecipient = useCallback((index: number) => {
		setScheduleConfig((prev) => ({
			...prev,
			recipients: prev.recipients.filter((_, i) => i !== index),
		}));
	}, []);

	// Initial data load
	useEffect(() => {
		const loadAll = async () => {
			setLoading(true);
			await Promise.all([
				fetchOverview(),
				fetchCost(),
				fetchTeam(),
				fetchPortfolio(),
				fetchScheduleConfig(),
			]);
			setLoading(false);
		};
		loadAll();
	}, [
		fetchOverview,
		fetchCost,
		fetchTeam,
		fetchPortfolio,
		fetchScheduleConfig,
	]);

	// Trends load on period change
	useEffect(() => {
		fetchTrends();
	}, [fetchTrends]);

	return {
		overview,
		trendData,
		trendPeriod,
		setTrendPeriod,
		costData,
		avgFine,
		setAvgFine,
		dailyPenalty,
		setDailyPenalty,
		teamData,
		portfolioData,
		loading,
		reportType,
		setReportType,
		dateRange,
		setDateRange,
		stateFilter,
		setStateFilter,
		licenseTypeFilter,
		setLicenseTypeFilter,
		reportFormat,
		setReportFormat,
		generating,
		scheduleConfig,
		setScheduleConfig,
		newRecipient,
		setNewRecipient,
		savingSchedule,
		addRecipient,
		removeRecipient,
		fetchCost,
		handleGenerateReport,
		handleSaveSchedule,
	};
}
