"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
	Search, Zap, ChevronDown, LayoutGrid, List,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { US_STATES, TRADE_TYPES, fadeIn } from "./types";

interface SearchFilterBarProps {
	searchQuery: string;
	onSearchChange: (v: string) => void;
	tradeFilter: string;
	onTradeFilterChange: (v: string) => void;
	stateFilter: string;
	onStateFilterChange: (v: string) => void;
	licenseStatusFilter: string;
	onLicenseStatusFilterChange: (v: string) => void;
	insuranceStatusFilter: string;
	onInsuranceStatusFilterChange: (v: string) => void;
	viewMode: "grid" | "table";
	onViewModeChange: (v: "grid" | "table") => void;
	showFilters: boolean;
	onToggleFilters: () => void;
}

export function SearchFilterBar({
	searchQuery, onSearchChange,
	tradeFilter, onTradeFilterChange,
	stateFilter, onStateFilterChange,
	licenseStatusFilter, onLicenseStatusFilterChange,
	insuranceStatusFilter, onInsuranceStatusFilterChange,
	viewMode, onViewModeChange,
	showFilters, onToggleFilters,
}: SearchFilterBarProps) {
	const t = useTranslations("contractorNetwork");

	return (
		<motion.div {...fadeIn} className="space-y-3">
			<div className="flex flex-col sm:flex-row sm:items-center gap-3">
				<div className="relative flex-1 sm:max-w-md">
					<Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
					<Input
						placeholder={t("search")}
						value={searchQuery}
						onChange={(e) => onSearchChange(e.target.value)}
						className="ps-9 h-9 bg-muted/30 border-border/50"
					/>
				</div>
				<div className="flex items-center gap-2">
					<Button variant="outline" size="sm" onClick={onToggleFilters}
						className={cn(showFilters && "bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-700 dark:text-emerald-400")}>
						<Zap className="size-4 me-1" />
						Filters
						<ChevronDown className={cn("size-4 ms-1 transition-transform", showFilters && "rotate-180")} />
					</Button>
					<div className="flex items-center border rounded-lg overflow-hidden">
						<Button
							variant={viewMode === "grid" ? "default" : "ghost"}
							size="icon"
							className={cn("size-9 rounded-none", viewMode === "grid" && "bg-gradient-to-r from-emerald-500 to-teal-600 text-white")}
							onClick={() => onViewModeChange("grid")}
						>
							<LayoutGrid className="size-4" />
							<span className="sr-only">{t("gridView")}</span>
						</Button>
						<Button
							variant={viewMode === "table" ? "default" : "ghost"}
							size="icon"
							className={cn("size-9 rounded-none", viewMode === "table" && "bg-gradient-to-r from-emerald-500 to-teal-600 text-white")}
							onClick={() => onViewModeChange("table")}
						>
							<List className="size-4" />
							<span className="sr-only">{t("tableView")}</span>
						</Button>
					</div>
				</div>
			</div>

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
									{/* Trade Type */}
									<div>
										<Label className="text-xs font-medium text-muted-foreground mb-1">{t("tradeType")}</Label>
										<Select value={tradeFilter} onValueChange={onTradeFilterChange}>
											<SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
											<SelectContent>
												<SelectItem value="all">{t("allTrades")}</SelectItem>
												{TRADE_TYPES.map((tt) => (
													<SelectItem key={tt} value={tt}>{t(tt as any) || tt}</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									{/* State */}
									<div>
										<Label className="text-xs font-medium text-muted-foreground mb-1">{t("allStates")}</Label>
										<Select value={stateFilter} onValueChange={onStateFilterChange}>
											<SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
											<SelectContent>
												<SelectItem value="all">{t("allStates")}</SelectItem>
												{US_STATES.map((s) => (
													<SelectItem key={s} value={s}>{s}</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									{/* License Status */}
									<div>
										<Label className="text-xs font-medium text-muted-foreground mb-1">{t("licenseStatus")}</Label>
										<Select value={licenseStatusFilter} onValueChange={onLicenseStatusFilterChange}>
											<SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
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
									{/* Insurance Status */}
									<div>
										<Label className="text-xs font-medium text-muted-foreground mb-1">{t("insuranceStatus")}</Label>
										<Select value={insuranceStatusFilter} onValueChange={onInsuranceStatusFilterChange}>
											<SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
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
	);
}
