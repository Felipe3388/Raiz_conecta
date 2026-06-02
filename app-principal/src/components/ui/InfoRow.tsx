interface InfoRowProps {
  label: string;
  value?: string | number | null;
  className?: string;
}

export function InfoRow({ label, value, className = "" }: InfoRowProps) {
  if (!value) return null;
  return (
    <div className={`flex items-start justify-between gap-4 py-2.5 border-b border-gray-100 last:border-0 ${className}`}>
      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider shrink-0">{label}</span>
      <span className="text-sm font-semibold text-gray-800 text-right">{value}</span>
    </div>
  );
}
