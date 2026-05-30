"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Download,
	FileIcon,
	X,
	FileText,
	Image as ImageIcon,
	Clock,
	HardDrive,
	Loader2,
} from "lucide-react";

interface DocumentViewerProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	document: {
		id: string;
		fileName: string;
		fileType: string;
		fileSize: number;
		fileSizeFormatted: string;
		category: string;
		uploadedBy: string | null;
		createdAt: string;
		filePath?: string;
	} | null;
	licenseId: string;
}

function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getCategoryLabel(
	category: string,
	t: ReturnType<typeof useTranslations>,
): string {
	const categoryMap: Record<string, string> = {
		license_copy: t("categories.license_copy"),
		coi: t("categories.coi"),
		bond: t("categories.bond"),
		ce_certificate: t("categories.ce_certificate"),
		general: t("categories.general"),
	};
	return categoryMap[category] || category;
}

function getCategoryColor(category: string): string {
	const colorMap: Record<string, string> = {
		license_copy:
			"bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
		coi: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
		bond: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
		ce_certificate:
			"bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
		general:
			"bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400",
	};
	return colorMap[category] || colorMap.general;
}

function getFileTypeIcon(fileType: string) {
	switch (fileType.toLowerCase()) {
		case "pdf":
			return <FileText className="size-6 text-red-500 dark:text-red-400" />;
		case "jpg":
		case "jpeg":
		case "png":
			return (
				<ImageIcon className="size-6 text-emerald-500 dark:text-emerald-400" />
			);
		default:
			return <FileIcon className="size-6 text-muted-foreground" />;
	}
}

function isViewableType(fileType: string): boolean {
	return ["pdf", "jpg", "jpeg", "png"].includes(fileType.toLowerCase());
}

export function DocumentViewer({
	open,
	onOpenChange,
	document,
	licenseId,
}: DocumentViewerProps) {
	const t = useTranslations("licenses.documents");
	// Determine initial loading state based on document type

	// Construct the file URL using the files API
	const fileUrl = document
		? `/api/files/${document.filePath || document.id}?download=false`
		: "";
	const downloadUrl = document
		? `/api/files/${document.filePath || document.id}?download=true`
		: "";

	// Loading state for viewable documents
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Reset loading/error when document changes (via effect with document ID dependency)
	const currentDocId = document?.id;
	useEffect(() => {
		if (currentDocId) {
			// Use a microtask to avoid synchronous setState in effect
			const timer = setTimeout(() => {
				setLoading(false);
				setError(null);
			}, 0);
			return () => clearTimeout(timer);
		}
	}, [currentDocId]);

	if (!document) return null;

	const viewable = isViewableType(document.fileType);
	const formatDate = (dateStr: string) => {
		return new Date(dateStr).toLocaleDateString(undefined, {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};

	const handleDownload = () => {
		const a = window.document.createElement("a");
		a.href = downloadUrl;
		a.download = document.fileName;
		a.click();
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0">
				{/* Header */}
				<DialogHeader className="p-4 border-b bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20">
					<div className="flex items-start justify-between gap-3">
						<div className="flex items-start gap-3 min-w-0 flex-1">
							<div className="shrink-0 rounded-xl bg-white dark:bg-background p-2 shadow-sm border">
								{getFileTypeIcon(document.fileType)}
							</div>
							<div className="min-w-0 flex-1">
								<DialogTitle className="text-base font-semibold truncate">
									{document.fileName}
								</DialogTitle>
								<div className="flex items-center gap-2 mt-1.5 flex-wrap">
									<Badge
										variant="secondary"
										className={`text-xs px-2 py-0.5 ${getCategoryColor(document.category)}`}
									>
										{getCategoryLabel(document.category, t)}
									</Badge>
									<span className="text-xs text-muted-foreground flex items-center gap-1">
										<HardDrive className="size-3" />
										{document.fileSizeFormatted ||
											formatFileSize(document.fileSize)}
									</span>
									<span className="text-xs text-muted-foreground flex items-center gap-1">
										<Clock className="size-3" />
										{formatDate(document.createdAt)}
									</span>
								</div>
							</div>
						</div>
						<Button
							variant="outline"
							size="sm"
							className="gap-1.5 shrink-0"
							onClick={handleDownload}
						>
							<Download className="size-3.5" />
							{t("downloadDocument")}
						</Button>
					</div>
				</DialogHeader>

				{/* Content */}
				<div className="flex-1 min-h-0 overflow-auto">
					{viewable ? (
						<div className="relative w-full" style={{ minHeight: "500px" }}>
							{loading && (
								<div className="absolute inset-0 flex items-center justify-center bg-muted/30">
									<div className="flex flex-col items-center gap-3">
										<Loader2 className="size-8 text-emerald-600 dark:text-emerald-400 animate-spin" />
										<p className="text-sm text-muted-foreground">
											{t("viewDocument")}
										</p>
									</div>
								</div>
							)}
							{error && (
								<div className="absolute inset-0 flex items-center justify-center bg-muted/30">
									<div className="flex flex-col items-center gap-3 text-center p-6">
										<div className="rounded-full bg-red-50 dark:bg-red-950/30 p-3">
											<X className="size-6 text-red-500 dark:text-red-400" />
										</div>
										<p className="text-sm font-medium text-foreground">
											Failed to load document
										</p>
										<p className="text-xs text-muted-foreground">{error}</p>
										<Button
											variant="outline"
											size="sm"
											className="mt-1"
											onClick={handleDownload}
										>
											<Download className="size-3.5 me-1.5" />
											{t("downloadDocument")}
										</Button>
									</div>
								</div>
							)}

							{document.fileType.toLowerCase() === "pdf" ? (
								<iframe
									src={fileUrl}
									className="w-full border-0"
									style={{ minHeight: "600px", height: "70vh" }}
									title={document.fileName}
									onLoad={() => setLoading(false)}
									onError={() => {
										setLoading(false);
										setError("Unable to display PDF. Try downloading instead.");
									}}
								/>
							) : ["jpg", "jpeg", "png"].includes(
									document.fileType.toLowerCase(),
								) ? (
								<div className="flex items-center justify-center p-6 bg-muted/20 min-h-[500px]">
									<img
										src={fileUrl}
										alt={document.fileName}
										className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
										onLoad={() => setLoading(false)}
										onError={() => {
											setLoading(false);
											setError(
												"Unable to display image. Try downloading instead.",
											);
										}}
									/>
								</div>
							) : null}
						</div>
					) : (
						/* Non-viewable file type */
						<div className="flex flex-col items-center justify-center py-16 text-center">
							<div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-900/20 p-6 mb-4">
								<FileIcon className="size-12 text-emerald-500 dark:text-emerald-400" />
							</div>
							<h3 className="text-lg font-semibold text-foreground mt-2">
								{document.fileName}
							</h3>
							<p className="text-sm text-muted-foreground mt-1 max-w-xs">
								This file type ({document.fileType.toUpperCase()}) cannot be
								previewed in the browser.
							</p>
							<Button
								className="mt-4 gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
								onClick={handleDownload}
							>
								<Download className="size-4" />
								{t("downloadDocument")}
							</Button>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
