import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ApprovalPaginationProps {
	page: number;
	totalPages: number;
	total: number;
	setPage: (p: number) => void;
	t: (key: string) => string;
}

export function ApprovalPagination({
	page,
	totalPages,
	total,
	setPage,
	t,
}: ApprovalPaginationProps) {
	if (totalPages <= 1) return null;

	return (
		<div className="flex items-center justify-between pt-2">
			<p className="text-xs text-muted-foreground">
				{page} / {totalPages} · {total} {t("title").toLowerCase()}
			</p>
			<div className="flex items-center gap-1">
				<Button
					variant="outline"
					size="icon"
					className="size-8"
					disabled={page <= 1}
					onClick={() => setPage(page - 1)}
				>
					<ChevronLeft className="size-4" />
				</Button>
				<Button
					variant="outline"
					size="icon"
					className="size-8"
					disabled={page >= totalPages}
					onClick={() => setPage(page + 1)}
				>
					<ChevronRight className="size-4" />
				</Button>
			</div>
		</div>
	);
}
