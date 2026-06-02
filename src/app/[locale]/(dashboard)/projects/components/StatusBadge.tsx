"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function StatusBadge({
	status,
	t,
}: {
	status: string;
	t: (key: string) => string;
}) {
	const config: Record<string, { label: string; className: string }> = {
		active: {
			label: t("active"),
			className:
				"bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
		},
		completed: {
			label: t("completed"),
			className:
				"bg-teal-100 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400 border-teal-200 dark:border-teal-800",
		},
		on_hold: {
			label: t("onHold"),
			className:
				"bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
		},
	};

	const c = config[status] || config.active;

	return (
		<Badge
			variant="outline"
			className={cn("text-[10px] font-semibold px-2 py-0.5", c.className)}
		>
			{c.label}
		</Badge>
	);
}
