"use client";

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { OrgLicense, ProjectLicense } from "./types";

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	orgLicenses: OrgLicense[];
	projectLicenses: ProjectLicense[];
	selectedLicenseId: string;
	onSelectedLicenseIdChange: (id: string) => void;
	onLink: () => void;
	t: (key: string) => string;
	tc: (key: string) => string;
}

export function LinkLicenseDialog({
	open,
	onOpenChange,
	orgLicenses,
	projectLicenses,
	selectedLicenseId,
	onSelectedLicenseIdChange,
	onLink,
	t,
	tc,
}: Props) {
	const availableLicenses = orgLicenses.filter(
		(l) => !projectLicenses.some((pl) => pl.licenseId === l.id),
	);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>{t("linkLicense")}</DialogTitle>
					<DialogDescription className="sr-only">
						{t("linkLicense")}
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4 py-2">
					<Select
						value={selectedLicenseId}
						onValueChange={onSelectedLicenseIdChange}
					>
						<SelectTrigger>
							<SelectValue placeholder="Select a license..." />
						</SelectTrigger>
						<SelectContent>
							<ScrollArea className="max-h-60">
								{availableLicenses.map((license) => (
									<SelectItem key={license.id} value={license.id}>
										<span className="truncate">
											{license.name} ({license.licenseNumber})
										</span>
									</SelectItem>
								))}
							</ScrollArea>
						</SelectContent>
					</Select>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						{tc("cancel")}
					</Button>
					<Button
						onClick={onLink}
						disabled={!selectedLicenseId}
						className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
					>
						{t("linkLicense")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
