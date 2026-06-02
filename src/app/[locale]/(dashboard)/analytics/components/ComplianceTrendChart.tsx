"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from "recharts";
import { CHART_COLORS } from "./constants";
import type { TrendPoint } from "./types";

interface Props {
	trendData: TrendPoint[];
	trendPeriod: string;
	onTrendPeriodChange: (period: string) => void;
	t: (key: string) => string;
}

export function ComplianceTrendChart({
	trendData,
	trendPeriod,
	onTrendPeriodChange,
	t,
}: Props) {
	return (
		<Card className="shadow-sm hover:shadow-md transition-shadow">
			<CardHeader className="pb-2">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
					<div>
						<CardTitle className="text-lg">{t("trends.title")}</CardTitle>
						<CardDescription>{t("trends.description")}</CardDescription>
					</div>
					<div className="flex gap-1 bg-muted/50 rounded-lg p-1">
						{(["7d", "30d", "90d", "1y"] as const).map((period) => (
							<Button
								key={period}
								variant={trendPeriod === period ? "default" : "ghost"}
								size="sm"
								className={cn(
									"text-xs px-3 h-7",
									trendPeriod === period &&
										"bg-emerald-600 hover:bg-emerald-700 text-white",
								)}
								onClick={() => onTrendPeriodChange(period)}
							>
								{t(
									`trends.period${period.charAt(0).toUpperCase() + period.slice(1)}` as
										| "trends.period7d"
										| "trends.period30d"
										| "trends.period90d"
										| "trends.period1y",
								)}
							</Button>
						))}
					</div>
				</div>
			</CardHeader>
			<CardContent>
				{trendData.length > 0 ? (
					<div className="h-72">
						<ResponsiveContainer width="100%" height="100%">
							<LineChart
								data={trendData}
								margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
							>
								<CartesianGrid
									strokeDasharray="3 3"
									stroke="hsl(var(--border))"
									opacity={0.3}
								/>
								<XAxis
									dataKey="date"
									tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
									tickLine={false}
									axisLine={false}
								/>
								<YAxis
									domain={[0, 100]}
									tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
									tickLine={false}
									axisLine={false}
									tickFormatter={(v: number) => `${v}%`}
								/>
								<Tooltip
									contentStyle={{
										backgroundColor: "hsl(var(--popover))",
										borderColor: "hsl(var(--border))",
										borderRadius: "8px",
										color: "hsl(var(--popover-foreground))",
									}}
									formatter={(value: number) => [
										`${value}%`,
										t("trends.complianceRate"),
									]}
									labelFormatter={(label: string) =>
										`${t("trends.date")}: ${label}`
									}
								/>
								<Line
									type="monotone"
									dataKey="score"
									stroke={CHART_COLORS.emerald}
									strokeWidth={2.5}
									dot={false}
									activeDot={{ r: 5, fill: CHART_COLORS.emerald }}
								/>
								<Line
									type="monotone"
									dataKey={() => 80}
									stroke={CHART_COLORS.red}
									strokeWidth={1}
									strokeDasharray="6 4"
									dot={false}
									name={t("trends.riskThreshold")}
								/>
							</LineChart>
						</ResponsiveContainer>
					</div>
				) : (
					<div className="h-72 flex items-center justify-center text-muted-foreground">
						<p>{t("trends.noData")}</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
