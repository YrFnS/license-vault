"use client";

import { useTranslations } from "next-intl";
import {
	AlertDialog, AlertDialogAction, AlertDialogCancel,
	AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
	AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Contractor } from "./types";

interface VerifyBlacklistDialogsProps {
	verifyDialogOpen: boolean;
	onVerifyDialogOpenChange: (v: boolean) => void;
	blacklistDialogOpen: boolean;
	onBlacklistDialogOpenChange: (v: boolean) => void;
	selectedContractor: Contractor | null;
	onVerify: () => void;
	onBlacklist: () => void;
}

export function VerifyBlacklistDialogs({
	verifyDialogOpen, onVerifyDialogOpenChange,
	blacklistDialogOpen, onBlacklistDialogOpenChange,
	selectedContractor, onVerify, onBlacklist,
}: VerifyBlacklistDialogsProps) {
	const t = useTranslations("contractorNetwork");
	const tc = useTranslations("common");

	return (
		<>
			<AlertDialog open={verifyDialogOpen} onOpenChange={onVerifyDialogOpenChange}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("confirmVerify")}</AlertDialogTitle>
						<AlertDialogDescription>{t("confirmVerifyDesc")}</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
						<AlertDialogAction onClick={onVerify} className="bg-emerald-600 hover:bg-emerald-700">
							{t("verify")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<AlertDialog open={blacklistDialogOpen} onOpenChange={onBlacklistDialogOpenChange}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("confirmBlacklist")}</AlertDialogTitle>
						<AlertDialogDescription>{t("confirmBlacklistDesc")}</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
						<AlertDialogAction onClick={onBlacklist} className="bg-red-600 hover:bg-red-700">
							{selectedContractor?.isBlacklisted ? "Remove Blacklist" : t("blacklistedBadge")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
