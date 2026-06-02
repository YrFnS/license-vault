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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface SubOption {
	id: string;
	name: string;
	company?: string | null;
}

interface AddSubDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	subOptions: SubOption[];
	selectedSubId: string;
	onSelectedSubIdChange: (id: string) => void;
	linkRole: string;
	onLinkRoleChange: (role: string) => void;
	linkNotes: string;
	onLinkNotesChange: (notes: string) => void;
	onSubmit: () => void;
}

export function AddSubDialog({
	open,
	onOpenChange,
	subOptions,
	selectedSubId,
	onSelectedSubIdChange,
	linkRole,
	onLinkRoleChange,
	linkNotes,
	onLinkNotesChange,
	onSubmit,
}: AddSubDialogProps) {
	const t = useTranslations("projects");
	const tc = useTranslations("common");

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t("addSubToProject")}</DialogTitle>
				</DialogHeader>
				<div className="space-y-4 py-2">
					<div className="space-y-2">
						<Label>{t("selectSubcontractor")}</Label>
						{subOptions.length === 0 ? (
							<p className="text-sm text-muted-foreground">
								{t("noSubcontractorsAvailable")}
							</p>
						) : (
							<Select value={selectedSubId} onValueChange={onSelectedSubIdChange}>
								<SelectTrigger>
									<SelectValue placeholder={t("selectSubPlaceholder")} />
								</SelectTrigger>
								<SelectContent>
									{subOptions.map((s) => (
										<SelectItem key={s.id} value={s.id}>
											{s.name}
											{s.company ? ` (${s.company})` : ""}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}
					</div>
					<div className="space-y-2">
						<Label>{t("roleOnProject")}</Label>
						<Input
							value={linkRole}
							onChange={(e) => onLinkRoleChange(e.target.value)}
							placeholder={t("rolePlaceholder")}
						/>
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
						disabled={!selectedSubId}
						className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
					>
						{t("linkSubcontractor")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
