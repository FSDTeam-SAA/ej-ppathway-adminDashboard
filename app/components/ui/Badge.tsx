type Tone =
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "bronze"
  | "silver"
  | "gold"
  | "premium"
  | "basic"
  | "free";

const tones: Record<Tone, string> = {
  neutral: "bg-slate-100 text-slate-700",
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-red-100 text-red-700",
  info: "bg-sky-100 text-sky-700",
  bronze: "bg-orange-100 text-orange-700",
  silver: "bg-slate-200 text-slate-700",
  gold: "bg-amber-100 text-amber-800",
  premium: "bg-purple-100 text-purple-700",
  basic: "bg-sky-100 text-sky-700",
  free: "bg-amber-100 text-amber-700",
};

export function Badge({
  tone = "neutral",
  children,
  className = "",
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status?: string | null }) {
  if (!status) return <Badge>—</Badge>;
  const s = status.toLowerCase();
  const map: Record<string, { tone: Tone; label: string }> = {
    active: { tone: "success", label: "Active" },
    suspended: { tone: "danger", label: "Suspended" },
    deactivated: { tone: "danger", label: "Deactivated" },
    pending_verification: { tone: "warning", label: "Pending verification" },
    pending: { tone: "warning", label: "Pending" },
    reviewing: { tone: "info", label: "Reviewing" },
    complete: { tone: "info", label: "Complete" },
    rejected: { tone: "danger", label: "Reject" },
    completed: { tone: "info", label: "Completed" },
    cancelled: { tone: "danger", label: "Cancelled" },
    flagged: { tone: "warning", label: "Flagged" },
    disputed: { tone: "warning", label: "Disputed" },
    live: { tone: "info", label: "Live" },
    new: { tone: "info", label: "New" },
    under_review: { tone: "warning", label: "Under Review" },
    interview_pending: { tone: "warning", label: "Interview Pending" },
    scheduled: { tone: "info", label: "Scheduled" },
    awaiting_signature: { tone: "warning", label: "Awaiting Signature" },
    approved: { tone: "success", label: "Approved" },
    requested: { tone: "warning", label: "Requested" },
    paid: { tone: "success", label: "Paid" },
  };
  const { tone, label } = map[s] || { tone: "neutral" as const, label: status };
  return <Badge tone={tone}>{label}</Badge>;
}
