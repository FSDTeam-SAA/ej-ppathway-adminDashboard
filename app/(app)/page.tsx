"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Topbar } from "../components/Topbar";
import { api, ApiError } from "../lib/api";
import type { DashboardOverview, DashboardPeriod, Transaction } from "../lib/types";
import { AreaChart, BarChartSimple, DonutChart, MiniArea } from "../components/charts";
import { useToast } from "../lib/toast";
import { StatGridSkeleton, CardSkeleton } from "../components/Skeleton";
import { formatCompact, formatCurrency } from "../lib/format";
import { Avatar } from "../components/ui/Avatar";
import {
  CrownIcon,
  DollarIcon,
  EyeIcon,
  SessionIcon,
  UsersIcon,
  AdvisorIcon,
  StarIcon,
} from "../components/Icons";

const monthLabels = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

const PERIODS: { value: DashboardPeriod; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
];

const periodSuffix: Record<DashboardPeriod, string> = {
  day: "Today",
  week: "This Week",
  month: "This Month",
  year: "This Year",
};

const PLAN_COLORS = ["#0d9488", "#fbbf24", "#06b6d4", "#a78bfa", "#fb7185"];

export default function DashboardPage() {
  const toast = useToast();
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<DashboardPeriod>("day");

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    api
      .get<DashboardOverview>("/admin/dashboard/overview", { period })
      .then((res) => {
        if (!cancel) setData(res.data || null);
      })
      .catch((e) => {
        if (!cancel) toast.error(e instanceof ApiError ? e.message : "Failed to load dashboard");
      })
      .finally(() => {
        if (!cancel) setLoading(false);
      });
    return () => {
      cancel = true;
    };
  }, [toast, period]);

  const suffix = periodSuffix[period];
  const m = data?.metrics;
  const transactions = data?.recentTransactions || [];

  const planBars = useMemo(
    () =>
      (data?.newSubsByPlan || []).map((p, i) => ({
        label: p.label,
        value: p.value,
        color: PLAN_COLORS[i % PLAN_COLORS.length],
      })),
    [data]
  );

  const appointmentBars = useMemo(
    () => [
      { label: "Today", value: data?.appointments?.today || 0, color: "#0d9488" },
      { label: "This Week", value: data?.appointments?.week || 0, color: "#60a5fa" },
      { label: "This Month", value: data?.appointments?.month || 0, color: "#a78bfa" },
    ],
    [data]
  );

  const refundBars = useMemo(
    () => [
      { label: "Today", value: data?.refunds?.today || 0, color: "#0d9488" },
      { label: "Week", value: data?.refunds?.week || 0, color: "#60a5fa" },
      { label: "Month", value: data?.refunds?.month || 0, color: "#fbbf24" },
      { label: "Year", value: data?.refunds?.year || 0, color: "#fb7185" },
    ],
    [data]
  );

  const serviceCats = useMemo(
    () => (data?.serviceCategories || []).map((c) => ({ label: c.label, value: c.value, color: c.color })),
    [data]
  );

  const revenueAreaData = useMemo(
    () => monthLabels.map((mo, i) => ({ label: mo, value: (data?.revenueByMonth || []).find((r) => r.month === i + 1)?.total || 0 })),
    [data]
  );

  const approvalsDistribution = useMemo(
    () => [
      { label: "Approved", value: data?.approvals?.approved || 0, color: "#10b981" },
      { label: "Pending", value: data?.approvals?.pending || 0, color: "#fbbf24" },
      { label: "Rejected", value: data?.approvals?.rejected || 0, color: "#ef4444" },
    ],
    [data]
  );

  const perf = data?.advisorPerformance;

  return (
    <>
      <Topbar />
      <main className="px-6 md:px-8 pb-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-600 mt-1">
              Welcome back to your Dashboard <span aria-hidden>👋</span>
            </p>
          </div>
          <PeriodFilter value={period} onChange={setPeriod} />
        </div>

        {loading ? (
          <div className="space-y-6">
            <StatGridSkeleton count={5} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <CardSkeleton className="h-80" />
              <CardSkeleton className="h-80" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <CardSkeleton className="h-64" />
              <CardSkeleton className="h-64" />
              <CardSkeleton className="h-64" />
            </div>
          </div>
        ) : (
          <>
            {/* Period-scoped stat cards (default: Today) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <StatBlock label={`New Users ${suffix}`} value={formatCompact(m?.newUsers)} icon={<UsersIcon />} color="#a78bfa" />
              <StatBlock label={`New Advisors ${suffix}`} value={formatCompact(m?.newAdvisors)} icon={<AdvisorIcon />} color="#60a5fa" />
              <StatBlock label={`Sessions ${suffix}`} value={formatCompact(m?.sessions)} icon={<SessionIcon />} color="#fbbf24" />
              <StatBlock label={`Subscriptions ${suffix}`} value={formatCompact(m?.subscriptions)} icon={<CrownIcon />} color="#c084fc" />
              <StatBlock label={`Revenue ${suffix}`} value={formatCurrency(m?.revenue)} icon={<DollarIcon />} color="#fb7185" />
            </div>

            {/* Active users by plan + Appointments */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              <Card>
                <CardHeader title="Active Users by Plan" subtitle={`New subscribers (${suffix.toLowerCase()}) by subscription plan`} period={period} onPeriod={setPeriod} />
                {planBars.length ? (
                  <BarChartSimple data={planBars} />
                ) : (
                  <p className="text-sm text-slate-500 py-10 text-center">No subscriber data for this period</p>
                )}
              </Card>

              <Card>
                <CardHeader title="Appointments" subtitle="Total appointments — today, this week and this month" noFilter />
                <BarChartSimple data={appointmentBars} formatValue={(v) => `${Math.round(v)}`} />
              </Card>
            </div>

            {/* Revenue (50%) + Advisor Approvals (50%) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              <Card>
                <CardHeader title="Revenue Overview" subtitle="Track total revenue, platform commission, and payouts over time." noFilter />
                <AreaChart data={revenueAreaData} formatValue={(v) => `${Math.round(v / 1000)}K`} color="#0a7a90" height={260} />
              </Card>

              <Card>
                <CardHeader
                  title="Advisor Approvals"
                  subtitle="Applications submitted via the website"
                  trailing={
                    <Link href="/advisor-approvals" className="text-xs font-medium text-[#0a7a90] hover:underline">
                      View All
                    </Link>
                  }
                />
                <DonutChart
                  data={approvalsDistribution}
                  centerLabel={String(data?.approvals?.pending ?? 0)}
                  centerSub="Pending"
                  showLegend
                />
              </Card>
            </div>

            {/* Service categories + Refunds + Advisor performance */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader title="Popular Service Categories" subtitle="Chat, Voice Call and Video Call" period={period} onPeriod={setPeriod} />
                {serviceCats.some((c) => c.value > 0) ? (
                  <DonutChart data={serviceCats} showLabels showLegend />
                ) : (
                  <p className="text-sm text-slate-500 py-10 text-center">No session data for this period</p>
                )}
              </Card>

              <Card>
                <CardHeader title="Total Refunds" subtitle="Refunds issued by period" noFilter />
                <BarChartSimple data={refundBars} formatValue={(v) => `${Math.round(v)}`} />
                <p className="text-xs text-slate-400 mt-2 text-center">
                  {formatCurrency(data?.refunds?.amountYear)} refunded this year
                </p>
              </Card>

              <Card>
                <CardHeader title="Advisor Performance" subtitle="Activity & top performers" noFilter />
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <MiniStat label="Total" value={perf?.total ?? 0} />
                  <MiniStat label="Active" value={perf?.active ?? 0} tone="emerald" />
                  <MiniStat label="Online" value={perf?.online ?? 0} tone="emerald" />
                  <MiniStat label="Deactivated" value={perf?.suspended ?? 0} tone="red" />
                </div>
                <div className="text-xs font-medium text-slate-500 mb-2">Top Performing Advisors</div>
                <div className="space-y-2">
                  {(perf?.topPerformers || []).length === 0 ? (
                    <p className="text-sm text-slate-400">No advisors yet</p>
                  ) : (
                    perf?.topPerformers.map((t, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Avatar src={t.profilePhoto} name={t.name} size={28} />
                        <span className="text-sm text-slate-800 flex-1 truncate">{t.name}</span>
                        <span className="text-xs text-slate-500">{t.sessions} sessions</span>
                        <span className="inline-flex items-center gap-0.5 text-xs text-amber-500">
                          <StarIcon size={12} /> {t.rating.toFixed(1)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>

            {/* Recent transactions */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Recent transactions</h3>
                <Link href="/finance" className="text-xs font-medium text-[#0a7a90] hover:underline">
                  View All
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[#0a7a90] border-b border-slate-100">
                      <th className="py-3 font-medium">User</th>
                      <th className="py-3 font-medium">Transaction ID</th>
                      <th className="py-3 font-medium">Type</th>
                      <th className="py-3 font-medium">Amount</th>
                      <th className="py-3 font-medium">Date &amp; Time</th>
                      <th className="py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-500">
                          No transactions yet
                        </td>
                      </tr>
                    ) : (
                      transactions.map((tx) => <TransactionRow key={tx._id} tx={tx} />)
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </main>
    </>
  );
}

function PeriodFilter({ value, onChange }: { value: DashboardPeriod; onChange: (p: DashboardPeriod) => void }) {
  return (
    <div className="inline-flex bg-slate-100 rounded-xl p-1">
      {PERIODS.map((p) => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className={`px-4 h-9 rounded-lg text-sm font-medium ${
            value === p.value ? "bg-[#0a7a90] text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white rounded-2xl p-5 border border-slate-100 shadow-sm ${className}`}>{children}</div>;
}

function CardHeader({
  title,
  subtitle,
  trailing,
  period,
  onPeriod,
  noFilter,
}: {
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  period?: DashboardPeriod;
  onPeriod?: (p: DashboardPeriod) => void;
  noFilter?: boolean;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        {subtitle ? <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p> : null}
      </div>
      {trailing ??
        (noFilter ? null : period && onPeriod ? (
          <select
            value={period}
            onChange={(e) => onPeriod(e.target.value as DashboardPeriod)}
            className="h-8 px-2 rounded-md bg-[#0a7a90] text-white text-xs font-medium border-0"
          >
            {PERIODS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        ) : null)}
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: number; tone?: "emerald" | "red" }) {
  const cls = tone === "emerald" ? "text-emerald-600" : tone === "red" ? "text-red-600" : "text-slate-900";
  return (
    <div className="bg-slate-50 rounded-lg px-3 py-2 text-center">
      <div className={`text-xl font-bold ${cls}`}>{value}</div>
      <div className="text-[11px] text-slate-500">{label}</div>
    </div>
  );
}

function StatBlock({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm relative overflow-hidden min-h-35">
      <div className="h-11 w-11 rounded-xl inline-flex items-center justify-center" style={{ background: `${color}22`, color }}>
        {icon}
      </div>
      <div className="mt-3 text-sm text-slate-500">{label}</div>
      <div className="mt-1 text-2xl md:text-3xl font-bold text-slate-900">{value}</div>
      <div className="absolute right-0 bottom-0 w-28 opacity-90 pointer-events-none">
        <MiniArea values={[2, 4, 3, 5, 7, 6, 8, 7, 9, 8]} color={color} height={48} />
      </div>
    </div>
  );
}

function TransactionRow({ tx }: { tx: Transaction }) {
  const amountText = `${tx.amount >= 0 ? "+" : ""}${formatCurrency(tx.amount)}`;
  const amountClass = tx.amount >= 0 ? "text-emerald-600" : "text-red-500";
  return (
    <tr className="border-b border-slate-50 last:border-0">
      <td className="py-3">
        <div className="flex items-center gap-2">
          <Avatar src={tx.user?.profilePhoto} name={tx.user?.name} size={32} />
          <span className="text-slate-800">{tx.user?.name || "—"}</span>
        </div>
      </td>
      <td className="py-3 text-slate-700">{tx.txCode || (tx._id?.slice(-4) ? `TXN-${tx._id.slice(-4)}` : "—")}</td>
      <td className="py-3 text-slate-700 capitalize">{tx.type?.replace(/_/g, " ") || "—"}</td>
      <td className={`py-3 font-semibold ${amountClass}`}>{amountText}</td>
      <td className="py-3 text-slate-600">
        {new Date(tx.createdAt).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })}
      </td>
      <td className="py-3">
        <Link
          href={`/finance?txn=${tx._id}`}
          className="inline-flex items-center gap-1.5 px-3 h-8 rounded-md bg-[#e6f2f6] text-[#0a7a90] text-xs font-medium hover:bg-[#d0e6ec]"
        >
          <EyeIcon size={14} /> Review Details
        </Link>
      </td>
    </tr>
  );
}
