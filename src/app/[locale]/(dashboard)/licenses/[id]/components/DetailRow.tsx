interface DetailRowProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
  mono?: boolean;
  hideValue?: boolean;
}

export function DetailRow({ label, value, icon, mono = false, hideValue = false }: DetailRowProps) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
        {icon}
        {label}
      </p>
      {!hideValue && (
        <p className={`text-sm font-medium ${mono ? 'font-mono' : ''}`}>{value}</p>
      )}
    </div>
  );
}
