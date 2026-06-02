import { Search, Filter, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { fadeIn } from "../constants";

interface ApprovalFiltersProps {
	t: (key: string) => string;
	tc: (key: string) => string;
	activeTab: string;
	setActiveTab: (v: string) => void;
	search: string;
	setSearch: (v: string) => void;
	typeFilter: string;
	setTypeFilter: (v: string) => void;
	priorityFilter: string;
	setPriorityFilter: (v: string) => void;
	setPage: (p: number) => void;
	counts: { pending: number; approved: number; rejected: number };
}

export function ApprovalFilters({
	t,
	tc,
	activeTab,
	setActiveTab,
	search,
	setSearch,
	typeFilter,
	setTypeFilter,
	priorityFilter,
	setPriorityFilter,
	setPage,
	counts,
}: ApprovalFiltersProps) {
	return (
		<motion.div {...fadeIn} className="space-y-4">
			<div className="flex flex-col sm:flex-row sm:items-center gap-3">
				<Tabs
					value={activeTab}
					onValueChange={(v) => {
						setActiveTab(v);
						setPage(1);
					}}
				>
					<TabsList className="bg-muted/50">
						<TabsTrigger value="all" className="text-xs">
							{tc("status") === "Status" ? "All" : "الكل"}
						</TabsTrigger>
						<TabsTrigger value="pending" className="text-xs gap-1">
							<Clock className="size-3" />
							{t("pending")} ({counts.pending})
						</TabsTrigger>
						<TabsTrigger value="approved" className="text-xs gap-1">
							<CheckCircle2 className="size-3" />
							{t("approved")} ({counts.approved})
						</TabsTrigger>
						<TabsTrigger value="rejected" className="text-xs gap-1">
							<XCircle className="size-3" />
							{t("rejected")} ({counts.rejected})
						</TabsTrigger>
					</TabsList>
				</Tabs>

				<div className="flex items-center gap-2 ms-auto">
					<div className="relative">
						<Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
						<Input
							placeholder={t("searchPlaceholder")}
							value={search}
							onChange={(e) => {
								setSearch(e.target.value);
								setPage(1);
							}}
							className="ps-9 h-9 w-48 md:w-64 bg-muted/30 border-border/50"
						/>
					</div>
					<Select
						value={typeFilter}
						onValueChange={(v) => {
							setTypeFilter(v);
							setPage(1);
						}}
					>
						<SelectTrigger className="h-9 w-32 bg-muted/30 border-border/50 text-xs">
							<Filter className="size-3 me-1" />
							<SelectValue placeholder={t("allTypes")} />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">{t("allTypes")}</SelectItem>
							<SelectItem value="license_renewal">
								{t("licenseRenewal")}
							</SelectItem>
							<SelectItem value="document_review">
								{t("documentReview")}
							</SelectItem>
							<SelectItem value="ce_verification">
								{t("ceVerification")}
							</SelectItem>
							<SelectItem value="insurance_update">
								{t("insuranceUpdate")}
							</SelectItem>
							<SelectItem value="other">{t("other")}</SelectItem>
						</SelectContent>
					</Select>
					<Select
						value={priorityFilter}
						onValueChange={(v) => {
							setPriorityFilter(v);
							setPage(1);
						}}
					>
						<SelectTrigger className="h-9 w-32 bg-muted/30 border-border/50 text-xs hidden md:flex">
							<SelectValue placeholder={t("allPriorities")} />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">{t("allPriorities")}</SelectItem>
							<SelectItem value="urgent">{t("urgent")}</SelectItem>
							<SelectItem value="high">{t("high")}</SelectItem>
							<SelectItem value="medium">{t("medium")}</SelectItem>
							<SelectItem value="low">{t("low")}</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>
		</motion.div>
	);
}
