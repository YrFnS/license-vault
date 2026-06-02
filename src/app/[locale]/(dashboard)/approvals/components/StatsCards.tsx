import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getStatsCardsConfig } from "../constants";

interface StatsCardsProps {
	t: (key: string) => string;
	total: number;
	pending: number;
	approved: number;
	rejected: number;
}

export function StatsCards({
	t,
	total,
	pending,
	approved,
	rejected,
}: StatsCardsProps) {
	const statsCards = getStatsCardsConfig(t, total, pending, approved, rejected);

	return (
		<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
			{statsCards.map((card, i) => (
				<motion.div
					key={card.label}
					initial={{ opacity: 0, y: 15 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: i * 0.05 }}
					whileHover={{ scale: 1.02, y: -2 }}
				>
					<Card
						className={cn(
							"bg-gradient-to-br border-s-4 shadow-sm hover:shadow-md transition-shadow duration-300",
							card.bg,
							card.border,
						)}
					>
						<CardContent className="p-3 md:p-4">
							<div className="flex items-center justify-between">
								<p className="text-xs uppercase tracking-wider text-muted-foreground/70 font-bold">
									{card.label}
								</p>
								<card.icon className={cn("size-4", card.color)} />
							</div>
							<p
								className={cn(
									"text-2xl lg:text-3xl font-extrabold tabular-nums mt-1",
									card.color,
								)}
							>
								{card.value}
							</p>
						</CardContent>
					</Card>
				</motion.div>
			))}
		</div>
	);
}
