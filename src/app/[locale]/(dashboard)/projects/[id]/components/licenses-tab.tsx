"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Plus, Shield, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import type { ProjectLicense } from "./types";
import { LicenseStatusBadge } from "./status-badges";

interface LicensesTabProps {
	projectLicenses: ProjectLicense[];
	onAddLicense: () => void;
	onRemoveLicense: (linkId: string) => void;
}

export function LicensesTab({
	projectLicenses,
	onAddLicense,
	onRemoveLicense,
}: LicensesTabProps) {
	const t = useTranslations("projects");

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h2 className="text-lg font-semibold">{t("linkedLicenses")}</h2>
				<Button
					onClick={onAddLicense}
					size="sm"
					className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
				>
					<Plus className="size-4 me-1" />
					{t("addLicense")}
				</Button>
			</div>

			{projectLicenses.length === 0 ? (
				<Card className="border-dashed">
					<CardContent className="py-12 text-center">
						<Shield className="size-10 mx-auto text-muted-foreground/40 mb-3" />
						<p className="text-muted-foreground">{t("noLicensesLinked")}</p>
						<p className="text-xs text-muted-foreground/60 mt-1">
							{t("noLicensesLinkedDesc")}
						</p>
					</CardContent>
				</Card>
			) : (
				<div className="grid gap-3">
					{projectLicenses.map((pl, idx) => (
						<motion.div
							key={pl.id}
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: idx * 0.03 }}
						>
							<Card className="hover:shadow-sm transition-shadow">
								<CardContent className="p-4">
									<div className="flex items-start justify-between gap-4">
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2 mb-1">
												<Link
													href={`/licenses/${pl.licenseId}`}
													className="font-semibold hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
												>
													{pl.license.name}
												</Link>
												{pl.required && (
													<Badge variant="outline" className="text-xs">
														{t("required")}
													</Badge>
												)}
												<LicenseStatusBadge status={pl.license.computedStatus} />
											</div>
											<div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
												<span>{pl.license.type}</span>
												<span>{pl.license.licenseNumber}</span>
												<span>
													{t("expires")}:{" "}
													{new Date(
														pl.license.expirationDate,
													).toLocaleDateString()}
												</span>
											</div>
											{pl.notes && (
												<p className="text-xs text-muted-foreground/70 mt-1">
													{pl.notes}
												</p>
											)}
										</div>
										<Button
											variant="ghost"
											size="icon"
											className="shrink-0 text-muted-foreground hover:text-destructive"
											onClick={() => onRemoveLicense(pl.id)}
										>
											<Trash2 className="size-4" />
										</Button>
									</div>
								</CardContent>
							</Card>
						</motion.div>
					))}
				</div>
			)}
		</div>
	);
}
