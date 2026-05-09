export const formatCurrency = (n: number | null | undefined): string => {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(n));
};

export const formatNumber = (n: number | null | undefined): string => {
  if (n === null || n === undefined) return "0";
  return new Intl.NumberFormat("en-US").format(Number(n));
};

export const formatCompact = (n: number | null | undefined): string => {
  if (n === null || n === undefined) return "0";
  const v = Number(n);
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${Math.round(v / 100) / 10}k`;
  return String(v);
};

export const formatDate = (
  d: string | Date | null | undefined,
  withTime = false
): string => {
  if (!d) return "—";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "—";
  const opts: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "2-digit",
  };
  if (withTime) {
    opts.hour = "2-digit";
    opts.minute = "2-digit";
    opts.hour12 = true;
  }
  return new Intl.DateTimeFormat("en-US", opts).format(date);
};

export const formatRelative = (d: string | Date | null | undefined): string => {
  if (!d) return "—";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "—";
  const diff = Date.now() - date.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return formatDate(date);
};

export const formatDuration = (seconds: number | null | undefined): string => {
  if (!seconds) return "0s";
  const s = Math.floor(seconds % 60);
  const m = Math.floor((seconds / 60) % 60);
  const h = Math.floor(seconds / 3600);
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

export const initials = (name?: string | null): string => {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] || "") + (parts[1]?.[0] || "");
};

export const tierForRate = (rate?: number): "bronze" | "silver" | "gold" => {
  if (!rate) return "bronze";
  if (rate >= 4) return "gold";
  if (rate >= 3) return "silver";
  return "bronze";
};
