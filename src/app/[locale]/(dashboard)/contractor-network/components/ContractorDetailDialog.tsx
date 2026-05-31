"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
	Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
	Verified, Award, Ban, MapPin, Mail, Phone, Globe, Users,
	Shield, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Contractor, ScoreBreakdown } from "./types";
import { ScoreRing, StarRating, TradeBadge, LicenseStatusBadge, InsuranceStatusBadge, TaggableBadges } from "./ui-components";

interface ContractorDetailDialogProps {
	open: boolean;
	onOpenChange: (v: boolean) => void;
	contractor: Contractor | null;
	scoreBreakdown: ScoreBreakdown | null;
	canManage: boolean;
	onVerify: () => void;
	onBlacklist: () => void;
}

export function ContractorDetailDialog({
	open, onOpenChange, contractor, scoreBreakdown, canManage, onVerify, onBlacklist,
}: ContractorDetailDialogProps) {
	const t = useTranslations("contractorNetwork");

	if (!contractor) return null;
	const c = contractor;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
				<DialogHeader>
					<div className="flex items-center gap-2">
						<DialogTitle className="text-xl">{c.companyName}</DialogTitle>
						{c.isVerified && (
							<Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200">
								<Verified className="size-3 me-1" />{t("verifiedBadge")}
							</Badge>
						)}
						{c.isPreferred && (
							<Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200">
								<Award className="size-3 me-1" />{t("preferredBadge")}
							</Badge>
						)}
						{c.isBlacklisted && (
							<Badge className="bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-red-200">
								<Ban className="size-3 me-1" />{t("blacklistedBadge")}
							</Badge>
						)}
					</div>
					<DialogDescription>
						<div className="flex items-center gap-2 mt-1">
							<TradeBadge tradeType={c.tradeType} />
							{c.city && c.state && (
								<span className="text-xs flex items-center gap-0.5">
									<MapPin className="size-3" />{c.city}, {c.state}
								</span>
							)}
						</div>
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6 mt-4">
					{/* Score + Rating */}
					<div className="grid grid-cols-2 gap-4">
						<Card className="shadow-sm">
							<CardContent className="p-4 flex items-center gap-4">
								<ScoreRing score={c.complianceScore} size={64} />
								<div>
									<p className="font-semibold">{t("complianceScore")}</p>
									<p className="text-2xl font-bold">{c.complianceScore}/100</p>
								</div>
							</CardContent>
						</Card>
						<Card className="shadow-sm">
							<CardContent className="p-4">
								<p className="font-semibold mb-1">{t("rating")}</p>
								<div className="flex items-center gap-2">
									<StarRating rating={c.rating} size={20} />
									<span className="text-lg font-bold">{c.rating.toFixed(1)}</span>
									<span className="text-sm text-muted-foreground">({c.reviewCount})</span>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Score Breakdown */}
					{scoreBreakdown && (
						<Card className="shadow-sm">
							<CardContent className="p-4">
								<p className="font-semibold mb-3">{t("scoreBreakdown")}</p>
								<div className="space-y-2">
									{[
										{ label: t("licensePoints"), value: scoreBreakdown.licensePoints, max: 30 },
										{ label: t("insurancePoints"), value: scoreBreakdown.insurancePoints, max: 25 },
										{ label: t("bondingPoints"), value: scoreBreakdown.bondingPoints, max: 15 },
										{ label: t("projectPoints"), value: scoreBreakdown.projectPoints, max: 15 },
										{ label: t("verificationPoints"), value: scoreBreakdown.verificationPoints, max: 10 },
										{ label: t("ratingPoints"), value: scoreBreakdown.ratingPoints, max: 5 },
									].map((item) => (
										<div key={item.label} className="flex items-center gap-3">
											<span className="text-sm w-36 shrink-0">{item.label}</span>
											<div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
												<div
													className={cn(
														"h-full rounded-full transition-all duration-500",
														item.value / item.max > 0.7 ? "bg-emerald-500"
															: item.value / item.max > 0.4 ? "bg-amber-500" : "bg-red-500",
													)}
													style={{ width: `${(item.value / item.max) * 100}%` }}
												/>
											</div>
											<span className="text-sm font-medium w-16 text-end">{item.value}/{item.max}</span>
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					)}

					{/* Contact Info */}
					<Card className="shadow-sm">
						<CardContent className="p-4">
							<p className="font-semibold mb-3">Contact Information</p>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
								{c.contactName && <div className="flex items-center gap-2"><Users className="size-4 text-muted-foreground" />{c.contactName}</div>}
								{c.contactEmail && <div className="flex items-center gap-2"><Mail className="size-4 text-muted-foreground" />{c.contactEmail}</div>}
								{c.contactPhone && <div className="flex items-center gap-2"><Phone className="size-4 text-muted-foreground" />{c.contactPhone}</div>}
								{c.website && (
									<div className="flex items-center gap-2">
										<Globe className="size-4 text-muted-foreground" />
										<a href={c.website} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">{c.website}</a>
									</div>
								)}
								{c.address && (
									<div className="flex items-center gap-2">
										<MapPin className="size-4 text-muted-foreground" />
										{c.address}{c.city ? `, ${c.city}` : ""}{c.state ? `, ${c.state}` : ""}{c.zip ? ` ${c.zip}` : ""}
									</div>
								)}
							</div>
						</CardContent>
					</Card>

					{/* License & Insurance */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<Card className="shadow-sm">
							<CardContent className="p-4">
								<p className="font-semibold mb-2 flex items-center gap-2"><Shield className="size-4" />License Details</p>
								<div className="space-y-1.5 text-sm">
									<div className="flex justify-between"><span className="text-muted-foreground">Number</span><span className="font-medium">{c.licenseNumber || "—"}</span></div>
									<div className="flex justify-between"><span className="text-muted-foreground">State</span><span className="font-medium">{c.licenseState || "—"}</span></div>
									<div className="flex justify-between"><span className="text-muted-foreground">Status</span><LicenseStatusBadge status={c.licenseStatus} /></div>
									<div className="flex justify-between">
										<span className="text-muted-foreground">Expiry</span>
										<span className="font-medium">{c.licenseExpiry ? new Date(c.licenseExpiry).toLocaleDateString() : "—"}</span>
									</div>
								</div>
							</CardContent>
						</Card>
						<Card className="shadow-sm">
							<CardContent className="p-4">
								<p className="font-semibold mb-2 flex items-center gap-2"><ShieldCheck className="size-4" />Insurance Details</p>
								<div className="space-y-1.5 text-sm">
									<div className="flex justify-between">
										<span className="text-muted-foreground">Provider</span>
										<span className="font-medium">{c.insuranceProvider || "—"}</span>
									</div>
									<div className="flex justify-between"><span className="text-muted-foreground">Status</span><InsuranceStatusBadge status={c.insuranceStatus} /></div>
									<div className="flex justify-between">
										<span className="text-muted-foreground">Expiry</span>
										<span className="font-medium">{c.insuranceExpiry ? new Date(c.insuranceExpiry).toLocaleDateString() : "—"}</span>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Additional Info */}
					<Card className="shadow-sm">
						<CardContent className="p-4">
							<p className="font-semibold mb-3">Additional Details</p>
							<div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
								<div>
									<span className="text-muted-foreground block text-xs">{t("bondingCapacity")}</span>
									<span className="font-medium">${(c.bondingCapacity || 0).toLocaleString()}</span>
								</div>
								<div>
									<span className="text-muted-foreground block text-xs">{t("yearsInBusiness")}</span>
									<span className="font-medium">{c.yearsInBusiness}</span>
								</div>
								<div>
									<span className="text-muted-foreground block text-xs">{t("employeeCount")}</span>
									<span className="font-medium">{c.employeeCount || "—"}</span>
								</div>
								<div>
									<span className="text-muted-foreground block text-xs">{t("completedProjects")}</span>
									<span className="font-medium">{c.completedProjects}/{c.totalProjects}</span>
								</div>
								<div>
									<span className="text-muted-foreground block text-xs">Verified</span>
									<span className="font-medium">
										{c.isVerified ? "Yes" : "No"}
										{c.lastVerifiedAt ? ` (${new Date(c.lastVerifiedAt).toLocaleDateString()})` : ""}
									</span>
								</div>
							</div>
							<TaggableBadges json={c.specialties} label={t("specialties")} t={t} />
							<TaggableBadges json={c.certifications} label={t("certifications")} t={t}
								badgeClassName="bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400" />
							<TaggableBadges json={c.serviceAreas} label={t("serviceAreas")} t={t} />
							{c.notes && (
								<div className="mt-3">
									<span className="text-xs text-muted-foreground block mb-1">Notes</span>
									<p className="text-sm bg-muted/50 rounded-md p-2">{c.notes}</p>
								</div>
							)}
						</CardContent>
					</Card>

					{/* Actions */}
					{canManage && (
						<div className="flex items-center gap-2 justify-end">
							{!c.isVerified && (
								<Button onClick={onVerify} className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
									<ShieldCheck className="size-4 me-1" />{t("verify")}
								</Button>
							)}
							<Button
								variant={c.isBlacklisted ? "default" : "destructive"}
								onClick={onBlacklist}
							>
								<Ban className="size-4 me-1" />
								{c.isBlacklisted ? "Remove Blacklist" : t("blacklistedBadge")}
							</Button>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
