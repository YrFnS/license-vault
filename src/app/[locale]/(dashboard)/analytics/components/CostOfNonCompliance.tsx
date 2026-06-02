"use client";

import { RefreshCw, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatCurrency, getSeverityBadge } from "./helpers";
import type { CostData } from "./types";

interface Props {
	costData: CostData | null;
	avgFine: number;
	onAvgFineChange: (v: number) => void;
	dailyPenalty: number;
	onDailyPenaltyChange: (v: number) => void;
	onRecalculate: () => void;
	t: (key: string) => string;
}

function CostCard({
	label,
	value,
	valueColor,
	bgGradient,
}: {
	label: string;
	value: string;
	valueColor: string;
	bgGradient: string;
}) {
	return (
		<div
			className={cn(
				"p-4 rounded-xl bg-gradient-to-br border border-border/30",
				bgGradient,
			)}
		>
			<p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
				{label}
			</p>
			<p
				className={cn(
					"text-xl md:text-2xl font-extrabold tabular-nums mt-1",
					valueColor,
				)}
			>
				{value}
			</p>
		</div>
	);
}

export function CostOfNonCompliance({
	costData,
	avgFine,
	onAvgFineChange,
	dailyPenalty,
	onDailyPenaltyChange,
	onRecalculate,
	t,
}: Props) {
	return (
		<Card className="shadow-sm hover:shadow-md transition-shadow">
			<CardHeader>
				<CardTitle className="text-lg">{t("cost.title")}</CardTitle>
				<CardDescription>{t("cost.description")}</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
					<CostCard
						label={t("cost.totalExposure")}
						value={formatCurrency(costData?.totalExposure ?? 0)}
						valueColor="text-red-600 dark:text-red-400"
						bgGradient="from-red-50/90 via-red-50/60 to-red-100/40 dark:from-red-950/30 dark:via-red-950/20 dark:to-red-950/10"
					/>
					<CostCard
						label={t("cost.finesRisk")}
						value={formatCurrency(costData?.finesRisk ?? 0)}
						valueColor="text-amber-600 dark:text-amber-400"
						bgGradient="from-amber-50/90 via-amber-50/60 to-amber-100/40 dark:from-amber-950/30 dark:via-amber-950/20 dark:to-amber-950/10"
					/>
					<CostCard
						label={t("cost.projectDelayCost")}
						value={formatCurrency(costData?.projectDelayCost ?? 0)}
						valueColor="text-orange-600 dark:text-orange-400"
						bgGradient="from-orange-50/90 via-orange-50/60 to-orange-100/40 dark:from-orange-950/30 dark:via-orange-950/20 dark:to-orange-950/10"
					/>
					<CostCard
						label={t("cost.lostContracts")}
						value={formatCurrency(costData?.lostContracts ?? 0)}
						valueColor="text-slate-600 dark:text-slate-400"
						bgGradient="from-slate-50/90 via-slate-50/60 to-slate-100/40 dark:from-slate-950/30 dark:via-slate-950/20 dark:to-slate-950/10"
					/>
				</div>

				<div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 rounded-lg bg-muted/30 border border-border/50">
					<div className="flex items-center gap-4 flex-1">
						<div className="flex items-center gap-2">
							<span className="text-sm text-muted-foreground">
								{t("cost.avgFine")}:
							</span>
							<Select
								value={String(avgFine)}
								onValueChange={(v) => onAvgFineChange(Number(v))}
							>
								<SelectTrigger className="w-28 h-8 text-xs">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="500">$500</SelectItem>
									<SelectItem value="1000">$1,000</SelectItem>
									<SelectItem value="2500">$2,500</SelectItem>
									<SelectItem value="5000">$5,000</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="flex items-center gap-2">
							<span className="text-sm text-muted-foreground">
								{t("cost.dailyPenalty")}:
							</span>
							<Select
								value={String(dailyPenalty)}
								onValueChange={(v) => onDailyPenaltyChange(Number(v))}
							>
								<SelectTrigger className="w-28 h-8 text-xs">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="50">$50/day</SelectItem>
									<SelectItem value="100">$100/day</SelectItem>
									<SelectItem value="200">$200/day</SelectItem>
									<SelectItem value="500">$500/day</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
					<Button
						variant="outline"
						size="sm"
						onClick={onRecalculate}
						className="gap-1.5 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-300 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-400"
					>
						<RefreshCw className="size-3.5" />
						{t("cost.recalculate")}
					</Button>
				</div>

				{costData && costData.licenses.length > 0 ? (
					<div className="rounded-lg border overflow-hidden">
						<ScrollArea className="max-h-64">
							<Table>
								<TableHeader>
									<TableRow className="bg-muted/30">
										<TableHead className="text-xs">
											{t("cost.licenseName")}
										</TableHead>
										<TableHead className="text-xs">
											{t("cost.status")}
										</TableHead>
										<TableHead className="text-xs text-end">
											{t("cost.daysOverdue")}
										</TableHead>
										<TableHead className="text-xs text-end">
											{t("cost.estimatedFine")}
										</TableHead>
										<TableHead className="text-xs">
											{t("cost.riskLevel")}
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{costData.licenses.map((license) => (
										<TableRow key={license.id}>
											<TableCell className="text-sm font-medium">
												{license.name}
											</TableCell>
											<TableCell>
												<Badge
													variant="outline"
													className={cn(
														"text-xs",
														license.status === "expired"
															? "border-red-300 text-red-600 dark:border-red-800 dark:text-red-400"
															: "border-amber-300 text-amber-600 dark:border-amber-800 dark:text-amber-400",
													)}
												>
													{license.status === "expired"
														? t("cost.statusExpired")
														: t("cost.statusExpiring")}
												</Badge>
											</TableCell>
											<TableCell className="text-sm text-end tabular-nums">
												{license.daysOverdue > 0
													? license.daysOverdue
													: `-${Math.abs(license.daysOverdue)}`}
											</TableCell>
											<TableCell className="text-sm text-end tabular-nums">
												{license.estimatedFine > 0
													? formatCurrency(license.estimatedFine)
													: "—"}
											</TableCell>
											<TableCell>
												{getSeverityBadge(license.riskLevel, t)}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</ScrollArea>
					</div>
				) : (
					<div className="text-center py-8 text-muted-foreground">
						<ShieldCheck className="size-8 mx-auto mb-2 text-emerald-500" />
						<p className="font-medium text-emerald-600 dark:text-emerald-400">
							{t("cost.noExpired")}
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
