"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Topbar } from "../components/Topbar";
import { api, ApiError } from "../lib/api";
import type { DashboardOverview, Transaction } from "../lib/types";
import {
  AreaChart,
  BarChartSimple,
  DonutChart,
  HorizontalBarChart,
  MiniArea,
} from "../components/charts";
import { useToast } from "../lib/toast";
import { StatGridSkeleton, CardSkeleton } from "../components/Skeleton";
import { formatCompact, formatCurrency } from "../lib/format";
import { Avatar } from "../components/ui/Avatar";
import {
  CrownIcon,
  DollarIcon,
  EyeIcon,
  SessionIcon,
  TrendingUpIcon,
  UsersIcon,
  AdvisorIcon,
} from "../components/Icons";

const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const monthLabels = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];

export default function DashboardPage() {
  const toast = useToast();
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    api
      .get<DashboardOverview>("/admin/dashboard/overview")
      .then((res) => {
        if (cancel) return;
        setData(res.data || null);
      })
      .catch((e) => {
        if (cancel) return;
        const msg =
          e instanceof ApiError ? e.message : "Failed to load dashboard";
        toast.error(msg);
      })
      .finally(() => {
        if (!cancel) setLoading(false);
      });
    return () => {
      cancel = true;
    };
  }, [toast]);

  const sessionsTotal = data?.totals.sessions ?? null;
  const transactions = data?.recentTransactions || [];

  const userBars = useMemo(() => {
    const counts = new Array(7).fill(0);
    (data?.usersByDay || []).forEach((d) => {
      const idx = (d._id - 1) % 7;
      counts[idx] = d.count;
    });
    return dayLabels.map((label, i) => ({ label, value: counts[i] }));
  }, [data]);

  const advisorBars = useMemo(() => {
    return (data?.advisorsByCategory || []).slice(0, 5).map((c) => ({
      label: c._id || "Other",
      value: c.count,
    }));
  }, [data]);

  const popularCats = useMemo(() => {
    return (data?.popularCategories || []).slice(0, 5).map((c) => ({
      label: c._id || "Other",
      value: c.count,
    }));
  }, [data]);

  const revenueAreaData = useMemo(() => {
    const byKey = new Map<string, number>();
    (data?.revenueByMonth || []).forEach((r) => {
      const idx = (r._id.m - 1) % 12;
      byKey.set(monthLabels[idx], (byKey.get(monthLabels[idx]) || 0) + r.total);
    });
    return monthLabels.map((m) => ({ label: m, value: byKey.get(m) || 0 }));
  }, [data]);

  // Placeholder distributions where real data is not yet wired.
  const subscriptionDistribution = useMemo(
    () => [
      { label: "Instant Access", value: 432, color: "#0d9488" },
      { label: "Priority Access", value: 18, color: "#fbbf24" },
      { label: "Clarity Access", value: 67, color: "#06b6d4" },
    ],
    []
  );
  const approvalsDistribution = useMemo(
    () => [
      { label: "Approved", value: 432, color: "#10b981" },
      { label: "Pendings", value: 18, color: "#fbbf24" },
      { label: "Rejected", value: 67, color: "#ef4444" },
    ],
    []
  );

  return (
    <>
      <Topbar />
      <main className="px-6 md:px-8 pb-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600 mt-1">
            Welcome back to your Dashboard{" "}
            <span aria-hidden>👋</span>
          </p>
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
            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <StatBlock
                label="Total Users"
                value={formatCompact(data?.totals.users)}
                icon={<UsersIcon />}
                color="#a78bfa"
              />
              <StatBlock
                label="Total Advisor"
                value={formatCompact(data?.totals.advisors)}
                icon={<AdvisorIcon />}
                color="#60a5fa"
              />
              <StatBlock
                label="Total Sessions"
                value={formatCompact(sessionsTotal ?? 0)}
                icon={<SessionIcon />}
                color="#fbbf24"
              />
              <StatBlock
                label="Total Subscription"
                value={formatCompact(data?.totals.subscriptions)}
                icon={<CrownIcon />}
                color="#c084fc"
              />
              <StatBlock
                label="Total Revenue"
                value={formatCurrency(data?.totals.revenue)}
                icon={<DollarIcon />}
                color="#fb7185"
              />
            </div>

            {/* Bar charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              <Card>
                <CardHeader
                  title="Total Users"
                  subtitle="See your users per week"
                />
                <BarChartSimple data={userBars} />
              </Card>

              <Card>
                <CardHeader
                  title="Total Advisor"
                  subtitle="See your total advisor per year."
                />
                {advisorBars.length ? (
                  <HorizontalBarChart data={advisorBars} />
                ) : (
                  <p className="text-sm text-slate-500 py-6">No data</p>
                )}
              </Card>
            </div>

            {/* Revenue Overview (full width) */}
            <Card className="mb-6">
              <CardHeader
                title="Revenue Overview"
                subtitle="Track total revenue, platform commission, and payouts over time."
              />
              <AreaChart
                data={revenueAreaData}
                formatValue={(v) => `${Math.round(v / 1000)}K`}
                color="#0a7a90"
              />
            </Card>

            {/* 3 donut row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader
                  title="Popular Service Categories"
                  subtitle="See which Popular Service Categories the most by users."
                />
                {popularCats.length ? (
                  <DonutChart data={popularCats} showLabels showLegend />
                ) : (
                  <p className="text-sm text-slate-500 py-6">No data</p>
                )}
              </Card>

              <Card>
                <CardHeader
                  title="Subscription Plan Distribution"
                  subtitle="Active Subscription by plans"
                  trailing={
                    <Pill>Last 30 days</Pill>
                  }
                />
                <DonutChart
                  data={subscriptionDistribution}
                  centerLabel="18"
                  centerSub="Pending"
                  showLegend
                />
              </Card>

              <Card>
                <CardHeader
                  title="Advisor Approvals"
                  subtitle=" "
                  trailing={
                    <Link
                      href="/advisor-approvals"
                      className="text-xs font-medium text-[#0a7a90] hover:underline"
                    >
                      View All
                    </Link>
                  }
                />
                <DonutChart
                  data={approvalsDistribution}
                  centerLabel="18"
                  centerSub="Pending"
                  showLegend
                />
              </Card>
            </div>

            {/* Recent transactions */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">
                  Recent transactions
                </h3>
                <Link
                  href="/finance"
                  className="text-xs font-medium text-[#0a7a90] hover:underline"
                >
                  View All
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[#0a7a90] border-b border-slate-100">
                      <th className="py-3 font-medium">User</th>
                      <th className="py-3 font-medium">Transactions ID</th>
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
                      transactions.map((tx) => (
                        <TransactionRow key={tx._id} tx={tx} />
                      ))
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

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white rounded-2xl p-5 border border-slate-100 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

function CardHeader({
  title,
  subtitle,
  trailing,
}: {
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        {subtitle ? (
          <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
        ) : null}
      </div>
      {trailing ?? <Pill>Month</Pill>}
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 h-7 px-3 rounded-md bg-[#0a7a90] text-white text-xs font-medium">
      {children}
      <svg
        className="h-3 w-3"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </span>
  );
}

function StatBlock({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm relative overflow-hidden min-h-35">
      <div
        className="h-11 w-11 rounded-xl inline-flex items-center justify-center"
        style={{ background: `${color}22`, color }}
      >
        {icon}
      </div>
      <div className="mt-3 text-sm text-slate-500">{label}</div>
      <div className="mt-1 text-2xl md:text-3xl font-bold text-slate-900">
        {value}
      </div>
      <div className="absolute right-0 bottom-0 w-28 opacity-90 pointer-events-none">
        <MiniArea
          values={[2, 4, 3, 5, 7, 6, 8, 7, 9, 8]}
          color={color}
          height={48}
        />
      </div>
      <span className="hidden">
        <TrendingUpIcon />
      </span>
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
          <Avatar
            src={tx.user?.profilePhoto}
            name={tx.user?.name}
            size={32}
          />
          <span className="text-slate-800">{tx.user?.name || "—"}</span>
        </div>
      </td>
      <td className="py-3 text-slate-700">
        {tx._id?.slice(-4) ? `TXN-${tx._id.slice(-4)}` : "—"}
      </td>
      <td className="py-3 text-slate-700 capitalize">
        {tx.type?.replace(/_/g, " ") || "—"}
      </td>
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
