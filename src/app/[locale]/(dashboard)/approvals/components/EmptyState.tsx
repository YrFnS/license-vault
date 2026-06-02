import { motion } from "framer-motion";
import { CheckSquare, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fadeIn } from "../constants";

interface EmptyStateProps {
	t: (key: string) => string;
	onNewRequest: () => void;
}

export function EmptyState({ t, onNewRequest }: EmptyStateProps) {
	return (
		<motion.div {...fadeIn} className="text-center py-20">
			<div className="relative inline-block mb-6">
				<div className="rounded-2xl bg-gradient-to-br from-muted/80 to-muted/40 p-6 ring-1 ring-border/20">
					<CheckSquare className="size-10 text-muted-foreground/60" />
				</div>
				<div className="absolute -bottom-1 -end-1 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/50 p-1.5 ring-2 ring-background">
					<Plus className="size-3 text-emerald-600 dark:text-emerald-400" />
				</div>
			</div>
			<h3 className="text-lg font-semibold text-muted-foreground">
				{t("noApprovals")}
			</h3>
			<p className="text-sm text-muted-foreground/70 mt-1 max-w-sm mx-auto">
				{t("noApprovalsDesc")}
			</p>
			<Button
				onClick={onNewRequest}
				className="mt-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-sm shadow-emerald-500/20"
			>
				<Plus className="size-4 me-2" />
				{t("newRequest")}
			</Button>
		</motion.div>
	);
}
