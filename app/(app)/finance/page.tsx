"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Topbar } from "../../components/Topbar";
import { PageHeader } from "../../components/PageHeader";
import { Tabs } from "../../components/ui/Tabs";
import { Avatar } from "../../components/ui/Avatar";
import { Badge, StatusBadge } from "../../components/ui/Badge";
import { Pagination } from "../../components/ui/Pagination";
import { Skeleton, TableSkeleton } from "../../components/Skeleton";
import { Button } from "../../components/ui/Button";
import { Modal, ConfirmDialog } from "../../components/ui/Modal";
import { EyeIcon, DollarIcon, ClockIcon, UsersIcon } from "../../components/Icons";
import { Download, Wallet as WalletIcon } from "lucide-react";
import { BulkActionsBar, BulkCheckbox } from "../../components/BulkActionsBar";
import { useBulkSelection } from "../../lib/use-bulk-selection";
import { api, ApiError, API_BASE, getAccessToken } from "../../lib/api";
import { useToast } from "../../lib/toast";
import { formatCurrency, formatDate } from "../../lib/format";
import { AreaChart, DonutChart, MiniArea } from "../../components/charts";
import type {
  Commissions,
  FinanceOverview,
  Transaction,
  AdvisorEarning,
} from "../../lib/types";

const TABS = [
  { value: "transactions", label: "Transactions" },
  { value: "advisor-earnings", label: "Advisor Earnings" },
  { value: "payouts", label: "Payouts" },
  { value: "refunds", label: "Refunds & Disputes" },
  { value: "subscriptions", label: "Subscription Revenue" },
  { value: "commissions", label: "Commissions" },
];

const PERIODS = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "year", label: "This Year" },
] as const;

type Period = (typeof PERIODS)[number]["value"];

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

async function downloadReport(report: string, query: Record<string, string> = {}) {
  const qs = new URLSearchParams({ report, ...query }).toString();
  const res = await fetch(`${API_BASE}/admin/finance/export?${qs}`, {
    headers: { Authorization: `Bearer ${getAccessToken() || ""}` },
  });
  if (!res.ok) throw new Error("Export failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${report}-report.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function ExportButton({ report, query }: { report: string; query?: Record<string, string> }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        setLoading(true);
        try {
          await downloadReport(report, query);
        } catch {
          toast.error("Export failed");
        } finally {
          setLoading(false);
        }
      }}
      className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 disabled:opacity-50"
      disabled={loading}
    >
      <Download size={15} /> {loading ? "Exporting…" : "Export CSV"}
    </button>
  );
}

export default function FinancePage() {
  const toast = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [tab, setTab] = useState("transactions");
  const [q, setQ] = useState("");
  const [period, setPeriod] = useState<Period>("month");
  const [overview, setOverview] = useState<FinanceOverview | null>(null);
  const initialTxnId = searchParams.get("txn") || undefined;

  useEffect(() => {
    api
      .get<FinanceOverview>("/admin/finance/overview")
      .then((r) => setOverview(r.data || null))
      .catch((err: unknown) => {
        const msg = err instanceof ApiError ? err.message : "Failed";
        toast.error(msg);
      });
  }, [toast]);

  const handleTxnOpened = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("txn");
    const qs = params.toString();
    router.replace(qs ? `/finance?${qs}` : "/finance", { scroll: false });
  };

  const gross = overview?.platformRevenue?.[period];
  const net = overview?.netRevenue?.[period];
  const sources = overview?.revenueSources;

  return (
    <>
      <Topbar
        searchPlaceholder="Search finance by transaction, user, advisor, or description ..."
        onSearch={setQ}
      />
      <main className="px-6 md:px-8 pb-10">
        <PageHeader
          title="Revenue & Finance"
          breadcrumb={[
            { label: "Dashboard", href: "/" },
            { label: "Revenue & Finance" },
          ]}
          action={
            <div className="inline-flex bg-slate-100 rounded-xl p-1">
              {PERIODS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value)}
                  className={`px-3 h-8 rounded-lg text-xs font-medium ${
                    period === p.value ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          }
        />

        {/* Top summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
          <SummaryCard
            label="Platform Revenue"
            value={formatCurrency(gross)}
            icon={<DollarIcon />}
            color="#34d399"
            note={PERIODS.find((p) => p.value === period)?.label}
          />
          <SummaryCard
            label="Net Revenue"
            value={formatCurrency(net)}
            icon={<DollarIcon />}
            color="#0a7a90"
            note="after payouts & refunds"
          />
          <SummaryCard
            label="Wallet Deposits"
            value={formatCurrency(overview?.wallet?.totalDeposits)}
            icon={<WalletIcon size={20} />}
            color="#60a5fa"
            note={`${formatCurrency(overview?.wallet?.totalBalance)} held`}
          />
          <SummaryCard
            label="Pending Payouts"
            value={formatCurrency(overview?.payouts?.pending.amount ?? overview?.pendingPayouts)}
            icon={<ClockIcon />}
            color="#fbbf24"
            note={`${overview?.payouts?.pending.count ?? overview?.pendingPayoutsCount ?? 0} waiting`}
          />
          <SummaryCard
            label="Advisor Earnings"
            value={formatCurrency(overview?.advisors?.totalEarnings)}
            icon={<UsersIcon />}
            color="#a78bfa"
            note={
              overview?.advisors?.topEarner
                ? `Top: ${overview.advisors.topEarner.name}`
                : undefined
            }
          />
        </div>

        {/* Revenue analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="font-semibold text-slate-900 mb-4">Revenue Analytics — {new Date().getFullYear()}</h3>
            {overview?.revenueByMonth ? (
              <AreaChart
                data={overview.revenueByMonth.map((m) => ({
                  label: MONTH_LABELS[m.month - 1],
                  value: m.total,
                }))}
                height={260}
                formatValue={(n) => `$${Math.round(n)}`}
              />
            ) : (
              <Skeleton className="h-64 w-full" />
            )}
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="font-semibold text-slate-900 mb-4">Revenue Sources</h3>
            {sources ? (
              <DonutChart
                size={180}
                data={[
                  { label: "Voice", value: sources.voiceSessions || 0 },
                  { label: "Video", value: sources.videoSessions || 0 },
                  { label: "Chat", value: sources.chatSessions || 0 },
                  { label: "Subscriptions", value: sources.subscriptionRevenue || 0 },
                  { label: "Recordings", value: sources.recordingPurchases || 0 },
                  { label: "Featured", value: sources.featuredAdvisorFees || 0 },
                ]}
              />
            ) : (
              <Skeleton className="h-44 w-full" />
            )}
          </div>
        </div>

        <div className="mb-6">
          <Tabs tabs={TABS} active={tab} onChange={setTab} />
        </div>

        {tab === "transactions" && (
          <TransactionsTab
            q={q}
            initialTxnId={initialTxnId}
            onInitialTxnOpened={handleTxnOpened}
          />
        )}
        {tab === "advisor-earnings" && <AdvisorEarningsTab />}
        {tab === "payouts" && <PayoutsTab q={q} />}
        {tab === "refunds" && <RefundsTab q={q} />}
        {tab === "subscriptions" && <SubscriptionRevenueTab q={q} />}
        {tab === "commissions" && <CommissionsTab />}
      </main>
    </>
  );
}

function TransactionsTab({
  q,
  initialTxnId,
  onInitialTxnOpened,
}: {
  q: string;
  initialTxnId?: string;
  onInitialTxnOpened?: () => void;
}) {
  const toast = useToast();
  const [items, setItems] = useState<Transaction[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<Transaction | null>(null);
  const [bulkConfirm, setBulkConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const openedRef = useRef(false);

  const bulk = useBulkSelection(items);

  useEffect(() => {
    setLoading(true);
    api
      .get<Transaction[]>("/admin/finance/transactions", { page, limit, q: q || undefined })
      .then((r) => {
        const loaded = r.data || [];
        setItems(loaded);
        setTotal(r.meta?.total || 0);
        bulk.clear();
        if (initialTxnId && !openedRef.current) {
          const match = loaded.find((t) => t._id === initialTxnId);
          if (match) {
            openedRef.current = true;
            setDetails(match);
            onInitialTxnOpened?.();
          }
        }
      })
      .catch((err: unknown) => {
        const msg = err instanceof ApiError ? err.message : "Failed";
        toast.error(msg);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, reloadKey, q]);

  const handleBulkDelete = async () => {
    if (bulk.selectedCount === 0) return;
    setActionLoading(true);
    const ids = bulk.selectedArray;
    const results = await Promise.allSettled(
      ids.map((id) => api.delete(`/admin/finance/transactions/${id}`))
    );
    setActionLoading(false);
    const failed = results.filter((r) => r.status === "rejected").length;
    const ok = results.length - failed;
    if (ok > 0) toast.success(`Deleted ${ok} transaction${ok === 1 ? "" : "s"}`);
    if (failed > 0) toast.error(`${failed} delete${failed === 1 ? "" : "s"} failed`);
    setBulkConfirm(false);
    setReloadKey((k) => k + 1);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <BulkActionsBar
          selectedCount={bulk.selectedCount}
          onClear={bulk.clear}
          onDelete={() => setBulkConfirm(true)}
        />
        <div className="ml-auto">
          <ExportButton report="transactions" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <TableSkeleton rows={8} cols={7} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-500">
                <tr className="border-b border-slate-100">
                  <th className="pl-5 pr-2 py-4 font-medium w-10">
                    <BulkCheckbox
                      ariaLabel="Select all on this page"
                      checked={bulk.allSelected}
                      indeterminate={bulk.someSelected}
                      onChange={bulk.toggleAll}
                    />
                  </th>
                  <th className="px-5 py-4 font-medium">User</th>
                  <th className="px-5 py-4 font-medium">Transaction ID</th>
                  <th className="px-5 py-4 font-medium">Type</th>
                  <th className="px-5 py-4 font-medium">Credits</th>
                  <th className="px-5 py-4 font-medium">Date & Time</th>
                  <th className="px-5 py-4 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-500">
                      No transactions
                    </td>
                  </tr>
                ) : (
                  items.map((t) => {
                    const isPositive = !["advisor_payout", "session_refund", "subscription_refund"].includes(t.type);
                    const selected = bulk.isSelected(t._id);
                    return (
                      <tr
                        key={t._id}
                        className={`border-b border-slate-50 last:border-0 ${selected ? "bg-amber-50/60" : ""}`}
                      >
                        <td className="pl-5 pr-2 py-3 w-10">
                          <BulkCheckbox
                            ariaLabel={`Select transaction ${t.txCode || t._id.slice(-4)}`}
                            checked={selected}
                            onChange={() => bulk.toggle(t._id)}
                          />
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <Avatar
                              src={t.user?.profilePhoto || t.advisor?.profilePhoto}
                              name={t.user?.name || t.advisor?.name}
                              size={28}
                            />
                            <span>{t.user?.name || t.advisor?.name || "—"}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 font-medium text-slate-900">
                          {t.txCode || `TXN-${t._id.slice(-4).toUpperCase()}`}
                        </td>
                        <td className="px-5 py-3 capitalize">{t.type.replace(/_/g, " ")}</td>
                        <td className="px-5 py-3">
                          <span className={isPositive ? "text-emerald-600 font-medium" : "text-red-600 font-medium"}>
                            {isPositive ? "+" : "-"}
                            {formatCredits(Math.abs(t.amount))}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-slate-600">{formatDate(t.createdAt, true)}</td>
                        <td className="px-5 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => setDetails(t)}
                            className="inline-flex items-center gap-1.5 text-emerald-600 hover:underline text-sm font-medium"
                          >
                            <EyeIcon size={16} /> Review Details
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-5 py-3">
          <Pagination
            page={page}
            limit={limit}
            total={total}
            onPage={setPage}
            onLimit={(l) => {
              setLimit(l);
              setPage(1);
            }}
          />
        </div>

        <Modal open={!!details} onClose={() => setDetails(null)} title="Transaction details" size="md">
          {details && (
            <div className="space-y-3 text-sm">
              <DetailRow label="Transaction ID" value={details.txCode || `TXN-${details._id.slice(-4).toUpperCase()}`} mono />
              <DetailRow label="Full ID" value={details._id} mono />
              <DetailRow label="Type" value={details.type.replace(/_/g, " ")} capitalize />
              <DetailRow label="Status" value={details.status} capitalize />
              {details.withdrawalStatus && (
                <DetailRow label="Withdrawal status" value={details.withdrawalStatus} capitalize />
              )}
              <DetailRow
                label="Credits"
                value={(details.amount < 0 ? "-" : "+") + formatCredits(Math.abs(details.amount))}
                tone={details.amount < 0 ? "danger" : "success"}
              />
              <DetailRow label="Payment Method" value={details.provider || "—"} capitalize />
              <DetailRow label="Date" value={formatDate(details.createdAt, true)} />
              {details.user && <DetailRow label="User" value={`${details.user.name} (${details.user.email})`} />}
              {details.advisor && <DetailRow label="Advisor" value={`${details.advisor.name} (${details.advisor.email})`} />}
              {details.description && <DetailRow label="Description" value={details.description} />}
            </div>
          )}
        </Modal>
      </div>

      <ConfirmDialog
        open={bulkConfirm}
        onClose={() => setBulkConfirm(false)}
        onConfirm={handleBulkDelete}
        title={`Delete ${bulk.selectedCount} transaction${bulk.selectedCount === 1 ? "" : "s"}?`}
        description="This permanently removes the selected transaction records and cannot be undone."
        confirmText="Delete"
        danger
        loading={actionLoading}
      />
    </div>
  );
}

function planName(t: Transaction): string {
  if (!t.plan) return "—";
  if (typeof t.plan === "string") return t.plan;
  return t.plan.name || "—";
}

function formatCredits(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "0 credits";
  const n = Number(value);
  const formatted = Number.isInteger(n) ? String(n) : n.toFixed(2);
  return `${formatted} credits`;
}

function SubscriptionRevenueTab({ q }: { q: string }) {
  const toast = useToast();
  const [items, setItems] = useState<Transaction[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get<Transaction[]>("/admin/finance/transactions", { page, limit, type: "subscription", q: q || undefined })
      .then((r) => {
        setItems(r.data || []);
        setTotal(r.meta?.total || 0);
      })
      .catch((err) => toast.error(err instanceof ApiError ? err.message : "Failed"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, q]);

  return (
    <div>
      <div className="flex justify-end mb-3">
        <ExportButton report="transactions" query={{ type: "subscription" }} />
      </div>
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
                      <td className="px-5 py-3">{planName(t)}</td>
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

function RefundsTab({ q }: { q: string }) {
  const toast = useToast();
  const [items, setItems] = useState<Transaction[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // session refunds first; admins can review chargebacks/disputes in Compliance.
    api
      .get<Transaction[]>("/admin/finance/transactions", { page, limit, type: "session_refund", q: q || undefined })
      .then((r) => {
        setItems(r.data || []);
        setTotal(r.meta?.total || 0);
      })
      .catch((err) => toast.error(err instanceof ApiError ? err.message : "Failed"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, q]);

  return (
    <div>
      <div className="flex justify-end mb-3">
        <ExportButton report="transactions" query={{ type: "session_refund" }} />
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <TableSkeleton rows={6} cols={5} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-500">
                <tr className="border-b border-slate-100">
                  <th className="px-5 py-4 font-medium">Refund ID</th>
                  <th className="px-5 py-4 font-medium">User</th>
                  <th className="px-5 py-4 font-medium">Amount</th>
                  <th className="px-5 py-4 font-medium">Reason</th>
                  <th className="px-5 py-4 font-medium text-right">Date</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-slate-500">
                      No refunds issued
                    </td>
                  </tr>
                ) : (
                  items.map((t) => (
                    <tr key={t._id} className="border-b border-slate-50 last:border-0">
                      <td className="px-5 py-3 font-medium text-slate-900">
                        {t.txCode || `TXN-${t._id.slice(-4).toUpperCase()}`}
                      </td>
                      <td className="px-5 py-3">{t.user?.name || "—"}</td>
                      <td className="px-5 py-3 font-medium text-red-600">{formatCurrency(t.amount)}</td>
                      <td className="px-5 py-3 text-slate-600">{t.description || "—"}</td>
                      <td className="px-5 py-3 text-slate-600 text-right">{formatDate(t.createdAt, true)}</td>
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

function AdvisorEarningsTab() {
  const toast = useToast();
  const [items, setItems] = useState<AdvisorEarning[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get<AdvisorEarning[]>("/admin/finance/advisor-earnings", { page, limit })
      .then((r) => {
        setItems(r.data || []);
        setTotal(r.meta?.total || 0);
      })
      .catch((err) => toast.error(err instanceof ApiError ? err.message : "Failed"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  return (
    <div>
      <div className="flex justify-end mb-3">
        <ExportButton report="advisor-earnings" />
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-500">
                <tr className="border-b border-slate-100">
                  <th className="px-5 py-4 font-medium">Advisor</th>
                  <th className="px-5 py-4 font-medium">Tier</th>
                  <th className="px-5 py-4 font-medium">Sessions</th>
                  <th className="px-5 py-4 font-medium">Gross Earnings</th>
                  <th className="px-5 py-4 font-medium">Platform Commission</th>
                  <th className="px-5 py-4 font-medium text-right">Paid Out</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-500">
                      No advisor earnings yet
                    </td>
                  </tr>
                ) : (
                  items.map((e, i) => (
                    <tr key={e.advisor?._id || i} className="border-b border-slate-50 last:border-0">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar src={e.advisor?.profilePhoto} name={e.advisor?.name} size={28} />
                          <span>{e.advisor?.name || "—"}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <Badge tone={e.tier}>
                          {e.tier === "platinum" ? "Platinum" : e.tier === "gold" ? "Gold" : "Silver"}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-slate-700">{e.totalSessions}</td>
                      <td className="px-5 py-3 font-medium text-emerald-600">{formatCurrency(e.grossEarnings)}</td>
                      <td className="px-5 py-3 text-slate-700">{formatCurrency(e.platformCommission)}</td>
                      <td className="px-5 py-3 text-right text-slate-700">{formatCurrency(e.paidEarnings)}</td>
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

function DetailRow({
  label,
  value,
  mono = false,
  capitalize = false,
  tone,
}: {
  label: string;
  value: string;
  mono?: boolean;
  capitalize?: boolean;
  tone?: "success" | "danger";
}) {
  const toneCls =
    tone === "success"
      ? "text-emerald-600 font-semibold"
      : tone === "danger"
        ? "text-red-600 font-semibold"
        : "text-slate-800";
  return (
    <div className="flex items-start gap-3">
      <div className="w-40 shrink-0 text-xs text-slate-500 pt-0.5">{label}</div>
      <div
        className={[
          "flex-1 break-all",
          toneCls,
          mono ? "font-mono text-xs" : "",
          capitalize ? "capitalize" : "",
        ].join(" ")}
      >
        {value}
      </div>
    </div>
  );
}

function PayoutsTab({ q }: { q: string }) {
  const toast = useToast();
  const [items, setItems] = useState<Transaction[]>([]);
  const [status, setStatus] = useState<"requested" | "paid" | "rejected">("requested");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get<Transaction[]>("/admin/finance/payouts", {
        page,
        limit,
        status,
        q: q || undefined,
      });
      setItems(r.data || []);
      setTotal(r.meta?.total || 0);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, status, q]);

  const approve = async (id: string) => {
    setActionLoadingId(id);
    try {
      await api.patch(`/admin/finance/payouts/${id}/approve`, {});
      toast.success("Payout approved");
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed");
    } finally {
      setActionLoadingId(null);
    }
  };

  const reject = async (id: string) => {
    setActionLoadingId(id);
    try {
      await api.patch(`/admin/finance/payouts/${id}/reject`, {});
      toast.success("Payout rejected");
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed");
    } finally {
      setActionLoadingId(null);
    }
  };

  const STATUSES: { value: "requested" | "paid" | "rejected"; label: string }[] = [
    { value: "requested", label: "Pending Queue" },
    { value: "paid", label: "Payout History" },
    { value: "rejected", label: "Rejected" },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between p-4 border-b border-slate-100">
        <div className="inline-flex bg-slate-100 rounded-xl p-1">
          {STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => {
                setStatus(s.value);
                setPage(1);
              }}
              className={`px-3 h-8 rounded-lg text-xs font-medium ${
                status === s.value ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <ExportButton report="payouts" />
      </div>
      {loading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr className="border-b border-slate-100">
                <th className="px-5 py-4 font-medium">Advisor</th>
                <th className="px-5 py-4 font-medium">Amount</th>
                <th className="px-5 py-4 font-medium">Method</th>
                <th className="px-5 py-4 font-medium">Date & Time</th>
                <th className="px-5 py-4 font-medium text-right">{status === "requested" ? "Action" : "Status"}</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-500">
                    No payouts
                  </td>
                </tr>
              ) : (
                items.map((p) => (
                  <tr key={p._id} className="border-b border-slate-50 last:border-0">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar src={p.advisor?.profilePhoto} name={p.advisor?.name} size={28} />
                        <span>{p.advisor?.name || "—"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-medium">{formatCurrency(p.amount)}</td>
                    <td className="px-5 py-3 text-slate-600 capitalize">{p.withdrawalMethod || "—"}</td>
                    <td className="px-5 py-3 text-slate-600">{formatDate(p.createdAt, true)}</td>
                    <td className="px-5 py-3 text-right">
                      {status === "requested" ? (
                        <div className="inline-flex items-center gap-2">
                          <Button
                            variant="success"
                            size="sm"
                            loading={actionLoadingId === p._id}
                            onClick={() => approve(p._id)}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            loading={actionLoadingId === p._id}
                            onClick={() => reject(p._id)}
                          >
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <StatusBadge status={p.withdrawalStatus} />
                      )}
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
  );
}

function CommissionsTab() {
  const toast = useToast();
  const [comm, setComm] = useState<Commissions>({ silver: 20, gold: 15, platinum: 10 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get<Commissions>("/admin/finance/commissions")
      .then((r) => {
        if (r.data) setComm((current) => ({ ...current, ...r.data }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api.patch("/admin/finance/commissions", comm);
      toast.success("Commissions updated");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <h2 className="text-2xl font-bold text-slate-900 mb-1">Commission Management</h2>
      <p className="text-sm text-slate-500 mb-5">
        Set the platform commission percentage taken from each advisor tier.
      </p>
      {loading ? (
        <div className="space-y-4 max-w-3xl">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
          <Skeleton className="h-10 w-40 rounded-lg" />
        </div>
      ) : (
        <div className="space-y-6 max-w-3xl">
          <Slider label={<Badge tone="silver">Silver</Badge>} value={comm.silver} onChange={(v) => setComm({ ...comm, silver: v })} />
          <Slider label={<Badge tone="gold">Gold</Badge>} value={comm.gold} onChange={(v) => setComm({ ...comm, gold: v })} />
          <Slider label={<Badge tone="platinum">Platinum</Badge>} value={comm.platinum} onChange={(v) => setComm({ ...comm, platinum: v })} />

          <Button onClick={save} loading={saving}>
            Save Commissions
          </Button>
        </div>
      )}
    </div>
  );
}

function Slider({
  label,
  value,
  onChange,
}: {
  label: React.ReactNode;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div>{label}</div>
        <span className="text-slate-700 font-medium">{value}% commission · {100 - value}% advisor</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[#0a7a90]"
      />
    </div>
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
      <div className="mt-1 text-2xl font-bold text-slate-900">{value}</div>
      {note && <div className="mt-1 text-xs text-slate-400 truncate">{note}</div>}
      <div className="absolute right-3 bottom-2 w-24 opacity-70">
        <MiniArea values={[2, 4, 3, 5, 7, 6, 8, 7, 9, 8]} color={color} height={40} />
      </div>
    </div>
  );
}
