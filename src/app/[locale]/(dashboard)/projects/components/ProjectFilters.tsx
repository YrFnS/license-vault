"use client";

import { Search } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

const fadeIn = {
	initial: { opacity: 0, y: 12 },
	animate: { opacity: 1, y: 0 },
};

interface Props {
	search: string;
	onSearchChange: (value: string) => void;
	statusFilter: string;
	onStatusFilterChange: (value: string) => void;
	t: (key: string) => string;
}

export function ProjectFilters({
	search,
	onSearchChange,
	statusFilter,
	onStatusFilterChange,
	t,
}: Props) {
	return (
		<motion.div {...fadeIn} className="flex flex-col sm:flex-row gap-3">
			<div className="relative flex-1">
				<Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
				<Input
					value={search}
					onChange={(e) => onSearchChange(e.target.value)}
					placeholder={t("searchPlaceholder")}
					className="ps-9 h-10 bg-muted/30 border-border/50"
				/>
			</div>
			<Select value={statusFilter} onValueChange={onStatusFilterChange}>
				<SelectTrigger className="w-full sm:w-44 h-10 bg-muted/30 border-border/50">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">{t("allStatus")}</SelectItem>
					<SelectItem value="active">{t("active")}</SelectItem>
					<SelectItem value="completed">{t("completed")}</SelectItem>
					<SelectItem value="on_hold">{t("onHold")}</SelectItem>
				</SelectContent>
			</Select>
		</motion.div>
	);
}
