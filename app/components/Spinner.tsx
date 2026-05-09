export function Spinner({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={`animate-spin ${className}`}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        opacity="0.2"
      />
      <path
        d="M22 12a10 10 0 0 1-10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function FullPageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center text-[#0a7a90]">
      <Spinner size={36} />
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="py-16 text-center">
      <div className="text-lg font-semibold text-slate-900">{title}</div>
      {description && (
        <div className="text-sm text-slate-500 mt-1 mb-4">{description}</div>
      )}
      {action}
    </div>
  );
}
