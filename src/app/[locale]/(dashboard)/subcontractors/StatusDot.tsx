import { cn } from "@/lib/utils";

export default function StatusDot({ status }: { status: string }) {
  const color =
    status === "compliant"
      ? "bg-emerald-500"
      : status === "non_compliant"
        ? "bg-red-500"
        : status === "pending" || status === "pending_review"
          ? "bg-amber-500"
          : "bg-slate-400";
  return <span className={cn("size-2 rounded-full shrink-0", color)} />;
}
