interface QuickStatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  colorClass: string;
}

export function QuickStatCard({ icon, label, value, colorClass }: QuickStatCardProps) {
  return (
    <div className={`rounded-xl border p-4 flex items-center gap-3 ${colorClass}`}>
      <div className="shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-lg font-bold truncate">{value}</p>
      </div>
    </div>
  );
}
