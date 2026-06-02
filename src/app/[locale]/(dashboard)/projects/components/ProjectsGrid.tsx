"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
	FolderKanban,
	Plus,
	MapPin,
	Calendar,
	Users,
	Shield,
	ChevronRight,
	Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ComplianceScoreCircle } from "./ComplianceScoreCircle";
import { StatusBadge } from "./StatusBadge";
import type { Project } from "./types";

interface Props {
	projects: Project[];
	loading: boolean;
	t: (key: string) => string;
	onOpenDetail: (project: Project) => void;
	onNewProject: () => void;
}

const fadeIn = {
	initial: { opacity: 0, y: 12 },
	animate: { opacity: 1, y: 0 },
};

const containerVariants = {
	animate: { transition: { staggerChildren: 0.05 } },
};

function formatDate(dateStr: string | null) {
	if (!dateStr) return "—";
	try {
		return new Date(dateStr).toLocaleDateString();
	} catch {
		return dateStr;
	}
}

export function ProjectsGrid({
	projects,
	loading,
	t,
	onOpenDetail,
	onNewProject,
}: Props) {
	if (loading) {
		return (
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				{[1, 2, 3, 4].map((i) => (
					<Card key={i} className="animate-pulse">
						<CardContent className="p-6">
							<div className="h-6 bg-muted rounded w-1/2 mb-4" />
							<div className="h-4 bg-muted rounded w-3/4 mb-2" />
							<div className="h-4 bg-muted rounded w-1/3" />
						</CardContent>
					</Card>
				))}
			</div>
		);
	}

	if (projects.length === 0) {
		return (
			<motion.div
				{...fadeIn}
				className="flex flex-col items-center justify-center py-20 text-center"
			>
				<div className="relative mb-6">
					<div className="rounded-2xl bg-gradient-to-br from-muted/80 to-muted/40 p-6 ring-1 ring-border/20">
						<FolderKanban className="size-12 text-muted-foreground/60" />
					</div>
					<div className="absolute -bottom-1 -end-1 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/50 p-1.5 ring-2 ring-background">
						<Plus className="size-3 text-emerald-600 dark:text-emerald-400" />
					</div>
				</div>
				<h3 className="text-lg font-semibold text-muted-foreground">
					{t("noProjects")}
				</h3>
				<p className="text-sm text-muted-foreground/70 mt-1 max-w-sm">
					{t("noProjectsDesc")}
				</p>
				<Button
					onClick={onNewProject}
					className="mt-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-sm shadow-emerald-500/20"
				>
					<Plus className="size-4 me-2" />
					{t("newProject")}
				</Button>
			</motion.div>
		);
	}

	return (
		<motion.div
			variants={containerVariants}
			initial="initial"
			animate="animate"
			className="grid grid-cols-1 lg:grid-cols-2 gap-4"
		>
			<AnimatePresence mode="popLayout">
				{projects.map((project) => (
					<motion.div
						key={project.id}
						variants={fadeIn}
						layout
						exit={{ opacity: 0, scale: 0.95 }}
					>
						<Card
							className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:border-emerald-500/30 dark:hover:border-emerald-400/20 bg-gradient-to-br from-card to-card/50"
							onClick={() => onOpenDetail(project)}
						>
							<CardContent className="p-4 md:p-6">
								<div className="flex items-start justify-between gap-3 mb-3">
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2 mb-1">
											<h3 className="font-semibold text-base truncate">
												{project.name}
											</h3>
											<StatusBadge status={project.status} t={t} />
										</div>
										{project.clientName && (
											<p className="text-sm text-muted-foreground truncate flex items-center gap-1">
												<Building2 className="size-3.5 shrink-0" />
												{project.clientName}
											</p>
										)}
									</div>
									<ComplianceScoreCircle score={project.complianceScore} />
								</div>

								<div className="grid grid-cols-2 gap-2 mb-3">
									{project.location && (
										<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
											<MapPin className="size-3.5 shrink-0" />
											<span className="truncate">
												{project.location}
												{project.state ? `, ${project.state}` : ""}
											</span>
										</div>
									)}
									{(project.startDate || project.endDate) && (
										<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
											<Calendar className="size-3.5 shrink-0" />
											<span>
												{formatDate(project.startDate)} —{" "}
												{formatDate(project.endDate)}
											</span>
										</div>
									)}
								</div>

								<Separator className="my-3 opacity-50" />

								<div className="flex items-center justify-between">
									<div className="flex items-center gap-4">
										<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
											<Shield className="size-3.5" />
											<span>
												{project.licenseCount} {t("licenseCount")}
											</span>
										</div>
										<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
											<Users className="size-3.5" />
											<span>
												{project.subcontractorCount} {t("subCount")}
											</span>
										</div>
									</div>
									<div className="flex items-center gap-2">
										<span
											className={cn(
												"text-xs font-medium",
												project.complianceScore >= 80
													? "text-emerald-600 dark:text-emerald-400"
													: project.complianceScore >= 60
														? "text-amber-600 dark:text-amber-400"
														: "text-red-600 dark:text-red-400",
											)}
										>
											{project.complianceScore >= 80
												? t("highCompliance")
												: project.complianceScore >= 60
													? t("mediumCompliance")
													: t("lowCompliance")}
										</span>
										<ChevronRight className="size-4 text-muted-foreground/50 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all duration-200" />
									</div>
								</div>
							</CardContent>
						</Card>
					</motion.div>
				))}
			</AnimatePresence>
		</motion.div>
	);
}
