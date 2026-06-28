"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Topbar } from "../../components/Topbar";
import { PageHeader } from "../../components/PageHeader";
import { CardSkeleton } from "../../components/Skeleton";
import { Modal, ConfirmDialog } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { Pagination } from "../../components/ui/Pagination";
import { StatusBadge } from "../../components/ui/Badge";
import { TableSkeleton } from "../../components/Skeleton";
import { CrownIcon, EditIcon, PlusIcon, TrashIcon, UsersIcon, DollarIcon, ClockIcon } from "../../components/Icons";
import { BulkActionsBar, BulkCheckbox } from "../../components/BulkActionsBar";
import { api, ApiError } from "../../lib/api";
import { useToast } from "../../lib/toast";
import { useBulkSelection } from "../../lib/use-bulk-selection";
import { formatCompact, formatCurrency, formatDate } from "../../lib/format";
import { AreaChart, DonutChart, MiniArea } from "../../components/charts";
import type { Plan, SubscriptionStats, Currency, CountryPrice, Transaction } from "../../lib/types";
import { CurrenciesModal } from "./CurrenciesModal";

const monthLabels = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

type RevenuePeriod = "today" | "week" | "month" | "year";

export default function SubscriptionsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/settings");
  }, [router]);

  return null;

  const toast = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Plan | null>(null);
  const [bulkConfirm, setBulkConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [manageCurrencies, setManageCurrencies] = useState(false);
  const [revPeriod, setRevPeriod] = useState<RevenuePeriod>("month");
  const [q, setQ] = useState("");

  const bulk = useBulkSelection(plans);

  const load = async () => {
    setLoading(true);
    try {
      const [p, s, c] = await Promise.all([
        api.get<Plan[]>("/admin/subscriptions/plans", { q: q || undefined }),
        api.get<SubscriptionStats>("/admin/subscriptions/stats"),
        api.get<Currency[]>("/admin/currencies"),
      ]);
      setPlans(p.data || []);
      setStats(s.data || null);
      setCurrencies(c.data || []);
      bulk.clear();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [q]);

  const submitDelete = async () => {
    if (!deleteConfirm) return;
    setActionLoading(true);
    try {
      await api.delete(`/admin/subscriptions/plans/${deleteConfirm._id}`);
      toast.success("Plan deactivated");
      setDeleteConfirm(null);
      load();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed";
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const submitBulkDelete = async () => {
    if (bulk.selectedCount === 0) return;
    setActionLoading(true);
    const ids = bulk.selectedArray;
    const results = await Promise.allSettled(
      ids.map((id) => api.delete(`/admin/subscriptions/plans/${id}`))
    );
    setActionLoading(false);
    const failed = results.filter((r) => r.status === "rejected").length;
    const ok = results.length - failed;
    if (ok > 0) toast.success(`Deleted ${ok} plan${ok === 1 ? "" : "s"}`);
    if (failed > 0)
      toast.error(`${failed} delete${failed === 1 ? "" : "s"} failed`);
    setBulkConfirm(false);
    load();
  };

  const planDistribution = stats?.planDistribution.map((p, i) => ({
    label: p._id || "Other",
    value: p.count,
    color: ["#fbbf24", "#60a5fa", "#0a7a90"][i % 3],
  })) || [];

  const revenueArea = monthLabels.map((m, i) => {
    const row = (stats?.revenueByMonth || []).find((r) => r.month === i + 1);
    return { label: m, value: row?.total || 0 };
  });

  const growthArea = monthLabels.map((m, i) => {
    const row = (stats?.growthByMonth || []).find((r) => r.month === i + 1);
    return { label: m, value: row?.total || 0 };
  });

  const perf = stats?.planPerformance;
  const revByPeriod = stats?.revenue?.[revPeriod];

  return (
    <>
      <Topbar
        searchPlaceholder="Search plans by name, audience, or benefit ..."
        onSearch={setQ}
      />
      <main className="px-6 md:px-8 pb-10">
        <PageHeader
          title="Subscription Plans"
          breadcrumb={[
            { label: "Dashboard", href: "/" },
            { label: "Subscription Plans" },
          ]}
        />

        {/* Top summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <SummaryCard
            label="Total Subscribers"
            value={formatCompact(stats?.subscribers?.active ?? stats?.totalUsers)}
            icon={<UsersIcon />}
            color="#a78bfa"
            note={`${stats?.subscribers?.month ?? 0} new this month · ${stats?.subscribers?.week ?? 0} this week`}
          />
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="h-12 w-12 rounded-xl inline-flex items-center justify-center text-white" style={{ background: "#fb7185" }}>
                <DollarIcon />
              </div>
              <select
                value={revPeriod}
                onChange={(e) => setRevPeriod(e.target.value as RevenuePeriod)}
                className="h-8 px-2 rounded-md border border-slate-200 text-xs bg-white"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
            </div>
            <div className="mt-3 text-sm text-slate-500">Subscription Revenue</div>
            <div className="mt-1 text-2xl font-bold text-slate-900">
              {formatCurrency(revByPeriod ?? stats?.totalRevenue)}
            </div>
            <div className="mt-1 text-xs text-slate-400">{formatCurrency(stats?.revenue?.allTime)} all-time</div>
          </div>
          <SummaryCard
            label="Renewals Due (7 days)"
            value={formatCompact(stats?.renewals?.dueIn7)}
            icon={<ClockIcon />}
            color="#fbbf24"
            note={`${stats?.renewals?.expired ?? 0} expired subscriptions`}
          />
          <SummaryCard
            label="Most Popular Plan"
            value={perf?.mostPopular?.plan || "—"}
            icon={<CrownIcon />}
            color="#0a7a90"
            note={perf?.mostPopular ? `${perf?.mostPopular?.total} subscribers` : undefined}
          />
        </div>

        {/* Plan performance highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <PerfCard title="Highest Revenue" plan={perf?.highestRevenue?.plan} metric={formatCurrency(perf?.highestRevenue?.revenue)} />
          <PerfCard title="Highest Retention" plan={perf?.highestRetention?.plan} metric={`${perf?.highestRetention?.retentionRate ?? 0}%`} />
          <PerfCard title="Highest Cancellation" plan={perf?.highestCancellation?.plan} metric={`${perf?.highestCancellation?.cancellationRate ?? 0}%`} tone="danger" />
          <PerfCard title="Most Popular" plan={perf?.mostPopular?.plan} metric={`${perf?.mostPopular?.total ?? 0} subs`} />
        </div>

        {/* Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <h3 className="text-lg font-semibold mb-1">Active Plan Distribution</h3>
            <p className="text-sm text-slate-500 mb-4">Current subscribers by plan</p>
            {planDistribution.length ? (
              <DonutChart data={planDistribution} />
            ) : (
              <p className="text-slate-500 text-sm">No data</p>
            )}
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <h3 className="text-lg font-semibold mb-1">Subscriber Growth</h3>
            <p className="text-sm text-slate-500 mb-4">New subscribers by month — {new Date().getFullYear()}</p>
            <AreaChart data={growthArea} color="#0a7a90" formatValue={(n) => `${Math.round(n)}`} />
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <h3 className="text-lg font-semibold mb-1">Revenue Breakdown</h3>
            <p className="text-sm text-slate-500 mb-4">Subscription revenue by month</p>
            <AreaChart data={revenueArea} color="#7c3aed" formatValue={(n) => `$${Math.round(n)}`} />
          </div>
        </div>

        <BulkActionsBar
          selectedCount={bulk.selectedCount}
          onClear={bulk.clear}
          onDelete={() => setBulkConfirm(true)}
        />

        <div className="flex items-center justify-between mb-3">
          {plans.length > 0 ? (
            <label className="inline-flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
              <BulkCheckbox
                ariaLabel="Select all plans"
                checked={bulk.allSelected}
                indeterminate={bulk.someSelected}
                onChange={bulk.toggleAll}
              />
              Select all
            </label>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setManageCurrencies(true)}>
              <CrownIcon size={16} /> Currencies
            </Button>
            <Button onClick={() => setCreating(true)}>
              <PlusIcon size={16} /> Add New
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <CardSkeleton key={i} className="h-64" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {plans.length === 0 ? (
              <div className="col-span-3 bg-white rounded-2xl p-8 text-center text-slate-500">
                No plans yet
              </div>
            ) : (
              plans.map((p) => (
                <div
                  key={p._id}
                  className={`relative bg-white rounded-2xl p-6 border shadow-sm flex flex-col transition-colors ${
                    bulk.isSelected(p._id)
                      ? "border-[#0a7a90]/60 ring-2 ring-[#0a7a90]/20"
                      : "border-slate-100"
                  }`}
                >
                  <div className="absolute top-4 left-4">
                    <BulkCheckbox
                      ariaLabel={`Select plan ${p.name}`}
                      checked={bulk.isSelected(p._id)}
                      onChange={() => bulk.toggle(p._id)}
                    />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 pl-8">{p.name}</h3>
                  <p className="text-slate-500 text-sm mb-4">
                    {p.audienceLimit || p.description || "—"}
                  </p>
                  <div className="text-3xl font-bold text-[#0a7a90] mb-1">
                    {formatCurrency(p.pricePerMonth)}
                    <span className="text-base text-slate-500 font-normal">/month</span>
                  </div>
                  <div className="text-xs text-slate-400 mb-4">
                    {p.countryPrices && p.countryPrices.length > 0
                      ? `${p.countryPrices.length} country price${
                          p.countryPrices.length === 1 ? "" : "s"
                        } set · others auto-converted`
                      : "All countries auto-converted from USD"}
                  </div>
                  <ul className="space-y-2 mb-6 flex-1">
                    {(p.benefits || []).map((b, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                        <span className="h-5 w-5 rounded-full bg-[#0a7a90] text-white inline-flex items-center justify-center text-xs">
                          ✓
                        </span>
                        {b}
                      </li>
                    ))}
                  </ul>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setEditing(p)}
                    >
                      <EditIcon size={14} /> Edit
                    </Button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(p)}
                      className="h-10 w-10 rounded-lg border border-red-200 text-red-500 inline-flex items-center justify-center hover:bg-red-50"
                      aria-label="Delete"
                    >
                      <TrashIcon size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <SubscriptionRevenueTable />

        <PlanModal
          open={creating}
          currencies={currencies}
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            load();
          }}
        />
        <PlanModal
          open={!!editing}
          plan={editing}
          currencies={currencies}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />

        <CurrenciesModal
          open={manageCurrencies}
          currencies={currencies}
          onClose={() => setManageCurrencies(false)}
          onChanged={load}
        />

        <ConfirmDialog
          open={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={submitDelete}
          title="Delete plan?"
          description={`Plan "${deleteConfirm?.name}" will be deactivated.`}
          danger
          loading={actionLoading}
        />

        <ConfirmDialog
          open={bulkConfirm}
          onClose={() => setBulkConfirm(false)}
          onConfirm={submitBulkDelete}
          title={`Delete ${bulk.selectedCount} plan${
            bulk.selectedCount === 1 ? "" : "s"
          }?`}
          description="The selected plans will be deactivated."
          confirmText="Delete"
          danger
          loading={actionLoading}
        />
      </main>
    </>
  );
}

function PlanModal({
  open,
  onClose,
  onSaved,
  plan,
  currencies,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  plan?: Plan | null;
  currencies: Currency[];
}) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [audience, setAudience] = useState("");
  const [price, setPrice] = useState("");
  const [benefits, setBenefits] = useState<string[]>([]);
  const [newBenefit, setNewBenefit] = useState("");
  const [countryPrices, setCountryPrices] = useState<CountryPrice[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (plan) {
      setName(plan.name);
      setAudience(plan.audienceLimit || "");
      setPrice(String(plan.pricePerMonth));
      setBenefits(plan.benefits || []);
      setCountryPrices(plan.countryPrices || []);
    } else {
      setName("");
      setAudience("");
      setPrice("");
      setBenefits([]);
      setCountryPrices([]);
    }
    setNewBenefit("");
  }, [plan, open]);

  const curFor = (code: string) => currencies.find((c) => c.country === code);
  const baseUsd = Number(price) || 0;

  const addCountryPrice = () => {
    // pick the first currency not already overridden (skip USD base)
    const used = new Set(countryPrices.map((cp) => cp.country));
    const next = currencies.find((c) => !c.isBase && !used.has(c.country));
    if (!next) {
      toast.error("All supported countries already have a price");
      return;
    }
    setCountryPrices((arr) => [
      ...arr,
      {
        country: next.country,
        currency: next.currency,
        // seed with the FX-converted amount as a convenient starting point
        pricePerMonth: Math.round(baseUsd * (next.usdRate || 1)),
      },
    ]);
  };

  const setCountryPriceAt = (i: number, patch: Partial<CountryPrice>) => {
    setCountryPrices((arr) =>
      arr.map((cp, idx) => {
        if (idx !== i) return cp;
        const merged = { ...cp, ...patch };
        if (patch.country) {
          const c = curFor(patch.country);
          if (c) merged.currency = c.currency;
        }
        return merged;
      })
    );
  };

  const submit = async () => {
    if (!name) {
      toast.error("Name required");
      return;
    }
    setLoading(true);
    try {
      const body = {
        name,
        audienceLimit: audience,
        pricePerMonth: Number(price) || 0,
        countryPrices: countryPrices
          .filter((cp) => cp.country && cp.pricePerMonth >= 0)
          .map((cp) => ({
            country: cp.country,
            currency: cp.currency,
            pricePerMonth: Number(cp.pricePerMonth) || 0,
          })),
        benefits,
      };
      if (plan) {
        await api.patch(`/admin/subscriptions/plans/${plan._id}`, body);
        toast.success("Plan updated");
      } else {
        await api.post(`/admin/subscriptions/plans`, body);
        toast.success("Plan created");
      }
      onSaved();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const addBenefit = () => {
    if (!newBenefit.trim()) return;
    setBenefits((b) => [...b, newBenefit.trim()]);
    setNewBenefit("");
  };

  return (
    <Modal open={open} onClose={onClose} title={plan ? "Edit Plan" : "Add Plan"} size="md">
      <div className="space-y-4">
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Basic" />
        <Input
          label="Audience"
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          placeholder="Up to 50 employees"
        />
        <div className="relative">
          <span className="absolute left-3 top-9 text-slate-500">$</span>
          <Input
            label="Base price / month (USD)"
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="pl-7"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="text-sm font-medium text-slate-700">
              Per-country pricing
            </div>
            <button
              type="button"
              onClick={addCountryPrice}
              className="text-xs font-medium text-[#0a7a90] inline-flex items-center gap-1 hover:underline"
            >
              <PlusIcon size={12} /> Add country
            </button>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Set the price manually for specific countries (based on local earning
            power). Countries without an override are auto-converted from the base
            USD price using the configured exchange rate.
          </p>
          {countryPrices.length === 0 ? (
            <p className="text-xs text-slate-400 bg-slate-50 rounded-lg px-3 py-2">
              No manual overrides — every country uses the converted USD price.
            </p>
          ) : (
            <div className="space-y-2">
              {countryPrices.map((cp, i) => {
                const c = curFor(cp.country);
                return (
                  <div key={i} className="flex items-center gap-2">
                    <select
                      value={cp.country}
                      onChange={(e) =>
                        setCountryPriceAt(i, { country: e.target.value })
                      }
                      className="h-10 px-2 rounded-lg bg-[#e6f2f6]/60 text-sm border border-transparent focus:border-[#0a7a90] focus:bg-white min-w-36"
                    >
                      {currencies
                        .filter((opt) => !opt.isBase)
                        .map((opt) => (
                          <option key={opt.country} value={opt.country}>
                            {opt.countryName} ({opt.currency})
                          </option>
                        ))}
                    </select>
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                        {c?.symbol || ""}
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        value={cp.pricePerMonth}
                        onChange={(e) =>
                          setCountryPriceAt(i, {
                            pricePerMonth: Number(e.target.value),
                          })
                        }
                        className="w-full h-10 pl-7 pr-3 rounded-lg bg-[#e6f2f6]/60 text-sm border border-transparent focus:border-[#0a7a90] focus:bg-white"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setCountryPrices((arr) =>
                          arr.filter((_, idx) => idx !== i)
                        )
                      }
                      className="h-10 w-10 rounded-lg border border-red-200 text-red-500 inline-flex items-center justify-center hover:bg-red-50 shrink-0"
                      aria-label="Remove"
                    >
                      <TrashIcon size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <div className="text-sm font-medium text-slate-700 mb-2">Benefits</div>
          <div className="space-y-2 mb-3">
            {benefits.map((b, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-[#e6f2f6]/60 px-3 py-2 rounded-lg"
              >
                <span className="text-sm text-slate-800">{b}</span>
                <button
                  type="button"
                  onClick={() =>
                    setBenefits((arr) => arr.filter((_, idx) => idx !== i))
                  }
                  className="text-red-500 hover:text-red-700"
                  aria-label="Remove"
                >
                  <TrashIcon size={16} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={newBenefit}
              onChange={(e) => setNewBenefit(e.target.value)}
              placeholder="Add a benefit..."
              className="flex-1 h-10 px-3 rounded-lg bg-[#e6f2f6]/60 text-sm border border-transparent focus:border-[#0a7a90] focus:bg-white"
            />
            <Button variant="outline" onClick={addBenefit}>
              Add
            </Button>
          </div>
        </div>
        <Button onClick={submit} loading={loading} className="w-full">
          {plan ? "Save Changes" : "Create Plan"}
        </Button>
      </div>
    </Modal>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  color,
  note,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  note?: string;
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
      <div className="mt-1 text-2xl font-bold text-slate-900 truncate">{value}</div>
      {note && <div className="mt-1 text-xs text-slate-400 truncate">{note}</div>}
      <div className="absolute right-3 bottom-2 w-24 opacity-70">
        <MiniArea values={[2, 4, 3, 5, 7, 6, 8, 7, 9, 8]} color={color} height={40} />
      </div>
    </div>
  );
}

function PerfCard({
  title,
  plan,
  metric,
  tone,
}: {
  title: string;
  plan?: string;
  metric: string;
  tone?: "danger";
}) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
      <div className="text-xs text-slate-500">{title}</div>
      <div className="mt-1 font-semibold text-slate-900 truncate">{plan || "—"}</div>
      <div className={`mt-0.5 text-lg font-bold ${tone === "danger" ? "text-red-600" : "text-[#0a7a90]"}`}>
        {metric}
      </div>
    </div>
  );
}

function SubscriptionRevenueTable() {
  const toast = useToast();
  const [items, setItems] = useState<Transaction[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get<Transaction[]>("/admin/finance/transactions", { page, limit, type: "subscription" })
      .then((r) => {
        setItems(r.data || []);
        setTotal(r.meta?.total || 0);
      })
      .catch((err) => toast.error(err instanceof ApiError ? err.message : "Failed"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  const planLabel = (t: Transaction) =>
    !t.plan ? "—" : typeof t.plan === "string" ? t.plan : t.plan.name || "—";

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold text-slate-900 mb-3">Subscription Revenue</h3>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-500">
                <tr className="border-b border-slate-100">
                  <th className="px-5 py-4 font-medium">Transaction ID</th>
                  <th className="px-5 py-4 font-medium">Username</th>
                  <th className="px-5 py-4 font-medium">Subscription Plan</th>
                  <th className="px-5 py-4 font-medium">Amount Paid</th>
                  <th className="px-5 py-4 font-medium">Date</th>
                  <th className="px-5 py-4 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-500">
                      No subscription revenue yet
                    </td>
                  </tr>
                ) : (
                  items.map((t) => (
                    <tr key={t._id} className="border-b border-slate-50 last:border-0">
                      <td className="px-5 py-3 font-medium text-slate-900">
                        {t.txCode || `TXN-${t._id.slice(-4).toUpperCase()}`}
                      </td>
                      <td className="px-5 py-3">{t.user?.name || "—"}</td>
                      <td className="px-5 py-3">{planLabel(t)}</td>
                      <td className="px-5 py-3 font-medium text-emerald-600">{formatCurrency(t.amount)}</td>
                      <td className="px-5 py-3 text-slate-600">{formatDate(t.createdAt, true)}</td>
                      <td className="px-5 py-3 text-right">
                        <StatusBadge status={t.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-5 py-3">
          <Pagination page={page} limit={limit} total={total} onPage={setPage} onLimit={(l) => { setLimit(l); setPage(1); }} />
        </div>
      </div>
    </div>
  );
}
