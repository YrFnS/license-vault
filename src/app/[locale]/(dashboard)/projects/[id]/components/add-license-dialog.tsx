"use client";

import { useTranslations } from "next-intl";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface LicenseOption {
	id: string;
	name: string;
	licenseNumber: string;
}

interface AddLicenseDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	licenseOptions: LicenseOption[];
	selectedLicenseId: string;
	onSelectedLicenseIdChange: (id: string) => void;
	linkRequired: boolean;
	onLinkRequiredChange: (required: boolean) => void;
	linkNotes: string;
	onLinkNotesChange: (notes: string) => void;
	onSubmit: () => void;
}

export function AddLicenseDialog({
	open,
	onOpenChange,
	licenseOptions,
	selectedLicenseId,
	onSelectedLicenseIdChange,
	linkRequired,
	onLinkRequiredChange,
	linkNotes,
	onLinkNotesChange,
	onSubmit,
}: AddLicenseDialogProps) {
	const t = useTranslations("projects");
	const tc = useTranslations("common");

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t("addLicenseToProject")}</DialogTitle>
				</DialogHeader>
				<div className="space-y-4 py-2">
					<div className="space-y-2">
						<Label>{t("selectLicense")}</Label>
						<Select
							value={selectedLicenseId}
							onValueChange={onSelectedLicenseIdChange}
						>
							<SelectTrigger>
								<SelectValue placeholder={t("selectLicensePlaceholder")} />
							</SelectTrigger>
							<SelectContent>
								{licenseOptions.map((l) => (
									<SelectItem key={l.id} value={l.id}>
										{l.name} ({l.licenseNumber})
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="flex items-center gap-3">
						<input
							type="checkbox"
							id="licenseRequired"
							checked={linkRequired}
							onChange={(e) => onLinkRequiredChange(e.target.checked)}
							className="rounded"
						/>
						<Label htmlFor="licenseRequired">{t("requiredForProject")}</Label>
					</div>
					<div className="space-y-2">
						<Label>{tc("notes")}</Label>
						<Textarea
							value={linkNotes}
							onChange={(e) => onLinkNotesChange(e.target.value)}
							placeholder={t("linkNotesPlaceholder")}
							rows={2}
						/>
					</div>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						{tc("cancel")}
					</Button>
					<Button
						onClick={onSubmit}
						disabled={!selectedLicenseId}
						className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
					>
						{t("linkLicense")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
