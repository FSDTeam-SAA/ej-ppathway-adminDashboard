type Props = {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  iconBg?: string;
  trend?: string;
  trendTone?: "success" | "info" | "warning";
};

export function StatCard({ icon, label, value, iconBg = "bg-purple-100 text-purple-600", trend, trendTone = "success" }: Props) {
  const toneCls =
    trendTone === "success"
      ? "text-emerald-700 bg-emerald-50"
      : trendTone === "warning"
        ? "text-amber-700 bg-amber-50"
        : "text-sky-700 bg-sky-50";
  return (
    <div className="relative bg-white rounded-2xl p-5 overflow-hidden border border-slate-100 shadow-sm">
      {trend && (
        <span className={`absolute top-4 right-4 text-xs font-medium px-2 py-1 rounded-full inline-flex items-center gap-1 ${toneCls}`}>
          ↗ {trend}
        </span>
      )}
      <div className={`h-12 w-12 rounded-xl inline-flex items-center justify-center ${iconBg}`}>
        {icon}
      </div>
      <div className="mt-3 text-sm text-slate-500">{label}</div>
      <div className="mt-1 text-3xl font-bold text-slate-900">{value}</div>
    </div>
  );
}
