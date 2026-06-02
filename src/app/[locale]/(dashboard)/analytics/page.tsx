"use client";

import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { fadeIn } from "./components/constants";
import { useAnalytics } from "./components/useAnalytics";
import { OverviewCards } from "./components/OverviewCards";
import { ComplianceTrendChart } from "./components/ComplianceTrendChart";
import { CostOfNonCompliance } from "./components/CostOfNonCompliance";
import { TeamActivityAnalytics } from "./components/TeamActivity";
import { PortfolioOptimization } from "./components/PortfolioOptimization";
import { ReportBuilder } from "./components/ReportBuilder";

export default function AnalyticsPage() {
	const a = useAnalytics(useTranslations("analytics"));

	if (a.loading) {
		return (
			<div className="space-y-6 p-4 md:p-6">
				<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>
				<Skeleton className="h-80 rounded-xl" />
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					<Skeleton className="h-64 rounded-xl" /><Skeleton className="h-64 rounded-xl" />
				</div>
			</div>
		);
	}

return (
		<div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
			<motion.div variants={fadeIn} initial="hidden" animate="visible" transition={{ duration: 0.4 }}>
				<h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-foreground to-emerald-600 bg-clip-text text-transparent">{useTranslations("analytics")("title")}</h1>
				<p className="text-muted-foreground mt-1">{useTranslations("analytics")("description")}</p>
			</motion.div>

			<motion.div variants={fadeIn} initial="hidden" animate="visible" transition={{ duration: 0.4, delay: 0.1 }}>
				<OverviewCards overview={a.overview} t={useTranslations("analytics")} />
			</motion.div>

			<motion.div variants={fadeIn} initial="hidden" animate="visible" transition={{ duration: 0.4, delay: 0.2 }}>
				<ComplianceTrendChart trendData={a.trendData} trendPeriod={a.trendPeriod} onTrendPeriodChange={a.setTrendPeriod} t={useTranslations("analytics")} />
			</motion.div>

			<motion.div variants={fadeIn} initial="hidden" animate="visible" transition={{ duration: 0.4, delay: 0.3 }}>
				<CostOfNonCompliance costData={a.costData} avgFine={a.avgFine} onAvgFineChange={a.setAvgFine} dailyPenalty={a.dailyPenalty} onDailyPenaltyChange={a.setDailyPenalty} onRecalculate={a.fetchCost} t={useTranslations("analytics")} />
			</motion.div>

			<motion.div variants={fadeIn} initial="hidden" animate="visible" transition={{ duration: 0.4, delay: 0.4 }}>
				<TeamActivityAnalytics teamData={a.teamData} t={useTranslations("analytics")} />
			</motion.div>

			<motion.div variants={fadeIn} initial="hidden" animate="visible" transition={{ duration: 0.4, delay: 0.5 }}>
				<PortfolioOptimization portfolioData={a.portfolioData} t={useTranslations("analytics")} />
			</motion.div>

			<motion.div variants={fadeIn} initial="hidden" animate="visible" transition={{ duration: 0.4, delay: 0.6 }}>
				<ReportBuilder
					reportType={a.reportType} onReportTypeChange={a.setReportType}
					dateRange={a.dateRange} onDateRangeChange={a.setDateRange}
					stateFilter={a.stateFilter} onStateChange={a.setStateFilter}
					licenseTypeFilter={a.licenseTypeFilter} onLicenseTypeChange={a.setLicenseTypeFilter}
					reportFormat={a.reportFormat} onFormatChange={a.setReportFormat}
					generating={a.generating}
					scheduleConfig={a.scheduleConfig} onScheduleConfigChange={a.setScheduleConfig}
					newRecipient={a.newRecipient} onNewRecipientChange={a.setNewRecipient}
					savingSchedule={a.savingSchedule}
					onGenerateReport={a.handleGenerateReport} onSaveSchedule={a.handleSaveSchedule}
					onAddRecipient={a.addRecipient} onRemoveRecipient={a.removeRecipient}
					t={useTranslations("analytics")}
				/>
			</motion.div>
		</div>
	);
}

