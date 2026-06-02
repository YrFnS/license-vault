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
import type { OrgSubcontractor, ProjectSub } from "./types";

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	orgSubs: OrgSubcontractor[];
	projectSubs: ProjectSub[];
	selectedSubId: string;
	onSelectedSubIdChange: (id: string) => void;
	onLink: () => void;
	t: (key: string) => string;
	tc: (key: string) => string;
}

export function LinkSubcontractorDialog({
	open,
	onOpenChange,
	orgSubs,
	projectSubs,
	selectedSubId,
	onSelectedSubIdChange,
	onLink,
	t,
	tc,
}: Props) {
	const availableSubs = orgSubs.filter(
		(s) => !projectSubs.some((ps) => ps.subcontractorId === s.id),
	);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>{t("linkSubcontractor")}</DialogTitle>
					<DialogDescription className="sr-only">
						{t("linkSubcontractor")}
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4 py-2">
					<Select value={selectedSubId} onValueChange={onSelectedSubIdChange}>
						<SelectTrigger>
							<SelectValue placeholder="Select a subcontractor..." />
						</SelectTrigger>
						<SelectContent>
							<ScrollArea className="max-h-60">
								{availableSubs.map((sub) => (
									<SelectItem key={sub.id} value={sub.id}>
										<span className="truncate">
											{sub.companyName}
											{sub.contactName ? ` (${sub.contactName})` : ""}
										</span>
									</SelectItem>
								))}
								{availableSubs.length === 0 && (
									<div className="px-3 py-4 text-center text-sm text-muted-foreground">
										No subcontractors available
									</div>
								)}
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
						disabled={!selectedSubId}
						className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
					>
						{t("linkSubcontractor")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
