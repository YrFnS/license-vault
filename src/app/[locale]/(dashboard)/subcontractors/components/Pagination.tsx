import { Button } from "@/components/ui/button";
import type { PaginationInfo } from "../types";

export default function PaginationBar({
  pagination,
  onPageChange,
}: {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-xs text-slate-500 tabular-nums">
        {(pagination.page - 1) * pagination.limit + 1}–
        {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
        {pagination.total}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pagination.page - 1)}
          disabled={pagination.page <= 1}
        >
          Previous
        </Button>
        <span className="text-xs text-slate-500 tabular-nums px-2">
          {pagination.page} / {pagination.totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pagination.page + 1)}
          disabled={pagination.page >= pagination.totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
