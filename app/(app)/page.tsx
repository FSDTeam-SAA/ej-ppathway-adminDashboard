"use client";

import { useEffect, useMemo, useState } from "react";
import { Topbar } from "../components/Topbar";
import { api, ApiError } from "../lib/api";
import type { DashboardOverview } from "../lib/types";
import {
  AreaChart,
  BarChartSimple,
  DonutChart,
  HorizontalBarChart,
  MiniArea,
} from "../components/charts";
import { useToast } from "../lib/toast";
import { Spinner } from "../components/Spinner";
import { formatCompact, formatCurrency, formatNumber } from "../lib/format";
import { useAuth } from "../lib/auth-context";
import { CrownIcon, DollarIcon, TrendingUpIcon, UsersIcon, AdvisorIcon } from "../components/Icons";

const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const monthLabels = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

export default function DashboardPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    api
      .get<DashboardOverview>("/admin/dashboard/overview")
      .then((r) => {
        if (!cancel) setData(r.data || null);
      })
      .catch((e: unknown) => {
        const msg = e instanceof ApiError ? e.message : "Failed to load dashboard";
        toast.error(msg);
      })
      .finally(() => {
        if (!cancel) setLoading(false);
      });
    return () => {
      cancel = true;
    };
  }, [toast]);

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

  return (
    <>
      <Topbar />
      <main className="px-6 md:px-8 pb-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600 mt-1">
            Welcome back to your Dashboard 👋 {user?.name ? `, ${user.name}` : ""}
          </p>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center text-[#0a7a90]">
            <Spinner size={36} />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-lg font-semibold text-slate-900">Total Users</h3>
                  <select className="h-8 px-3 rounded-md border border-slate-200 text-xs">
                    <option>Month</option>
                  </select>
                </div>
                <p className="text-sm text-slate-500 mb-4">See your users per week</p>
                <BarChartSimple data={userBars} formatValue={(v) => `${v}`} />
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-lg font-semibold text-slate-900">Total Advisor</h3>
                  <select className="h-8 px-3 rounded-md border border-slate-200 text-xs">
                    <option>Month</option>
                  </select>
                </div>
                <p className="text-sm text-slate-500 mb-4">See your total advisor by category</p>
                {advisorBars.length ? (
                  <HorizontalBarChart data={advisorBars} />
                ) : (
                  <p className="text-sm text-slate-500 py-6">No data</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">Popular Service Categories</h3>
                <p className="text-sm text-slate-500 mb-4">See which Popular Service Categories the most by users.</p>
                {popularCats.length ? (
                  <DonutChart data={popularCats} />
                ) : (
                  <p className="text-sm text-slate-500 py-6">No data</p>
                )}
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-lg font-semibold text-slate-900">Revenue Overview</h3>
                  <select className="h-8 px-3 rounded-md border border-slate-200 text-xs">
                    <option>Month</option>
                  </select>
                </div>
                <p className="text-sm text-slate-500 mb-4">
                  Track total revenue, platform commission, and payouts over time.
                </p>
                <AreaChart
                  data={revenueAreaData}
                  formatValue={(v) => `${formatNumber(Math.round(v / 1000))}K`}
                  color="#0a7a90"
                />
              </div>
            </div>
          </>
        )}
      </main>
    </>
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
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative overflow-hidden">
      <div
        className="h-12 w-12 rounded-xl inline-flex items-center justify-center text-white"
        style={{ background: color }}
      >
        {icon}
      </div>
      <div className="mt-3 text-sm text-slate-500">{label}</div>
      <div className="mt-1 text-3xl font-bold text-slate-900">{value}</div>
      <div className="absolute right-3 bottom-2 w-32 opacity-80">
        <MiniArea values={[2, 4, 3, 5, 7, 6, 8, 7, 9, 8]} color={color} height={48} />
      </div>
      <span className="hidden">
        <TrendingUpIcon />
      </span>
    </div>
  );
}
