"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
	Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Upload, Loader2 } from "lucide-react";

interface ImportDialogProps {
	open: boolean;
	onOpenChange: (v: boolean) => void;
	onImport: () => void;
	importing: boolean;
}

export function ImportDialog({ open, onOpenChange, onImport, importing }: ImportDialogProps) {
	const t = useTranslations("contractorNetwork");

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>{t("import")}</DialogTitle>
					<DialogDescription>Import contractors from a CSV file</DialogDescription>
				</DialogHeader>
				<div className="py-4 text-center">
					<div className="rounded-xl border-2 border-dashed border-border/50 p-8 hover:border-emerald-300 transition-colors">
						<Upload className="size-10 text-muted-foreground/50 mx-auto mb-3" />
						<p className="text-sm text-muted-foreground">Required: companyName, tradeType</p>
						<p className="text-xs text-muted-foreground mt-1">
							Optional: licenseNumber, licenseState, licenseStatus,
							contactName, contactEmail, contactPhone, city, state,
							insuranceProvider, insuranceStatus, bondingCapacity, rating,
							yearsInBusiness
						</p>
					</div>
					<Button onClick={onImport} disabled={importing}
						className="mt-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
						{importing ? <Loader2 className="size-4 animate-spin me-1" /> : <Upload className="size-4 me-1" />}
						Select CSV File
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
