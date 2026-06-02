"use client";

import { Users, ShieldCheck } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	BarChart,
	Bar,
	PieChart,
	Pie,
	Cell,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	Legend,
} from "recharts";
import { CHART_COLORS, PIE_COLORS } from "./constants";
import type { TeamActivityData } from "./types";

interface Props {
	teamData: TeamActivityData | null;
	t: (key: string) => string;
}

export function TeamActivityAnalytics({ teamData, t }: Props) {
	if (!teamData || teamData.totalActions === 0) {
		return (
			<Card className="shadow-sm hover:shadow-md transition-shadow">
				<CardHeader>
					<CardTitle className="text-lg">{t("team.title")}</CardTitle>
					<CardDescription>{t("team.description")}</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="text-center py-8 text-muted-foreground">
						<Users className="size-8 mx-auto mb-2" />
						<p>{t("team.noActivity")}</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="shadow-sm hover:shadow-md transition-shadow">
			<CardHeader>
				<CardTitle className="text-lg">{t("team.title")}</CardTitle>
				<CardDescription>{t("team.description")}</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					<div>
						<h4 className="text-sm font-semibold mb-3 text-muted-foreground">
							{t("team.actionsByUser")}
						</h4>
						<div className="h-56">
							<ResponsiveContainer width="100%" height="100%">
								<BarChart
									data={teamData.actionsByUser.slice(0, 8)}
									margin={{ top: 5, right: 10, bottom: 5, left: 0 }}
								>
									<CartesianGrid
										strokeDasharray="3 3"
										stroke="hsl(var(--border))"
										opacity={0.3}
									/>
									<XAxis
										dataKey="name"
										tick={{
											fontSize: 10,
											fill: "hsl(var(--muted-foreground))",
										}}
										tickLine={false}
										axisLine={false}
										interval={0}
										angle={-30}
										textAnchor="end"
										height={50}
									/>
									<YAxis
										tick={{
											fontSize: 11,
											fill: "hsl(var(--muted-foreground))",
										}}
										tickLine={false}
										axisLine={false}
									/>
									<Tooltip
										contentStyle={{
											backgroundColor: "hsl(var(--popover))",
											borderColor: "hsl(var(--border))",
											borderRadius: "8px",
											color: "hsl(var(--popover-foreground))",
										}}
									/>
									<Bar
										dataKey="count"
										name={t("team.actions")}
										fill={CHART_COLORS.teal}
										radius={[4, 4, 0, 0]}
									/>
								</BarChart>
							</ResponsiveContainer>
						</div>
					</div>
					<div>
						<h4 className="text-sm font-semibold mb-3 text-muted-foreground">
							{t("team.actionTypes")}
						</h4>
						<div className="h-56">
							<ResponsiveContainer width="100%" height="100%">
								<PieChart>
									<Pie
										data={teamData.actionTypes.slice(0, 6)}
										cx="50%"
										cy="50%"
										innerRadius={50}
										outerRadius={80}
										paddingAngle={3}
										dataKey="count"
										nameKey="action"
									>
										{teamData.actionTypes.slice(0, 6).map((_, index) => (
											<Cell
												key={`cell-${index}`}
												fill={PIE_COLORS[index % PIE_COLORS.length]}
											/>
										))}
									</Pie>
									<Tooltip
										contentStyle={{
											backgroundColor: "hsl(var(--popover))",
											borderColor: "hsl(var(--border))",
											borderRadius: "8px",
											color: "hsl(var(--popover-foreground))",
										}}
									/>
									<Legend
										verticalAlign="bottom"
										iconType="circle"
										iconSize={8}
										formatter={(value: string) => (
											<span className="text-xs text-muted-foreground">
												{value}
											</span>
										)}
									/>
								</PieChart>
							</ResponsiveContainer>
						</div>
					</div>
					<div className="lg:col-span-2">
						<h4 className="text-sm font-semibold mb-3 text-muted-foreground">
							{t("team.mostActive")}
						</h4>
						<div className="flex flex-wrap gap-3">
							{teamData.mostActiveUsers.map((user, idx) => (
								<div
									key={user.id}
									className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-muted/30 border border-border/50"
								>
									<Avatar className="size-8 ring-1 ring-emerald-500/20">
										<AvatarFallback className="text-xs bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-700 dark:text-emerald-400 font-bold">
											{user.name.charAt(0).toUpperCase()}
										</AvatarFallback>
									</Avatar>
									<div>
										<p className="text-sm font-medium">{user.name}</p>
										<p className="text-xs text-muted-foreground">
											{user.count} {t("team.actions").toLowerCase()}
										</p>
									</div>
									{idx === 0 && (
										<Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 text-[10px]">
											#1
										</Badge>
									)}
								</div>
							))}
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
