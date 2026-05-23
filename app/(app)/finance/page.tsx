"use client";

import { useEffect, useState } from "react";
import { Topbar } from "../../components/Topbar";
import { PageHeader } from "../../components/PageHeader";
import { Tabs } from "../../components/ui/Tabs";
import { Avatar } from "../../components/ui/Avatar";
import { Badge } from "../../components/ui/Badge";
import { Pagination } from "../../components/ui/Pagination";
import { Skeleton, TableSkeleton } from "../../components/Skeleton";
import { Button } from "../../components/ui/Button";
import { Modal, ConfirmDialog } from "../../components/ui/Modal";
import { EyeIcon, DollarIcon, ClockIcon, UsersIcon } from "../../components/Icons";
import { BulkActionsBar, BulkCheckbox } from "../../components/BulkActionsBar";
import { useBulkSelection } from "../../lib/use-bulk-selection";
import { api, ApiError } from "../../lib/api";
import { useToast } from "../../lib/toast";
import { formatCurrency, formatDate } from "../../lib/format";
import { MiniArea } from "../../components/charts";
import type { Commissions, FinanceOverview, Transaction } from "../../lib/types";

const TABS = [
  { value: "transactions", label: "Transactions" },
  { value: "payouts", label: "Payouts" },
  { value: "commissions", label: "Commissions" },
];

export default function FinancePage() {
  const toast = useToast();
  const [tab, setTab] = useState("transactions");
  const [overview, setOverview] = useState<FinanceOverview | null>(null);

  useEffect(() => {
    api
      .get<FinanceOverview>("/admin/finance/overview")
      .then((r) => setOverview(r.data || null))
      .catch((err: unknown) => {
        const msg = err instanceof ApiError ? err.message : "Failed";
        toast.error(msg);
      });
  }, [toast]);

  return (
    <>
      <Topbar />
      <main className="px-6 md:px-8 pb-10">
        <PageHeader
          title="Revenue & Finance"
          breadcrumb={[
            { label: "Dashboard", href: "/" },
            { label: "Revenue & Finance" },
          ]}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <SummaryCard
            label="Monthly Revenue"
            value={formatCurrency(overview?.monthlyRevenue)}
            icon={<DollarIcon />}
            color="#86efac"
          />
          <SummaryCard
            label="Pending Payouts"
            value={formatCurrency(overview?.pendingPayouts)}
            icon={<ClockIcon />}
            color="#60a5fa"
            note={`${overview?.pendingPayoutsCount ?? 0} advisors waiting`}
          />
          <SummaryCard
            label="Platform Commission"
            value={formatCurrency(overview?.platformCommission)}
            icon={<UsersIcon />}
            color="#fbbf24"
          />
        </div>

        <div className="mb-6">
          <Tabs tabs={TABS} active={tab} onChange={setTab} />
        </div>

        {tab === "transactions" && <TransactionsTab />}
        {tab === "payouts" && <PayoutsTab />}
        {tab === "commissions" && <CommissionsTab />}
      </main>
    </>
  );
}

function TransactionsTab() {
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

  const bulk = useBulkSelection(items);

  useEffect(() => {
    setLoading(true);
    api
      .get<Transaction[]>("/admin/finance/transactions", { page, limit })
      .then((r) => {
        setItems(r.data || []);
        setTotal(r.meta?.total || 0);
        bulk.clear();
      })
      .catch((err: unknown) => {
        const msg = err instanceof ApiError ? err.message : "Failed";
        toast.error(msg);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, reloadKey]);

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
    if (ok > 0)
      toast.success(`Deleted ${ok} transaction${ok === 1 ? "" : "s"}`);
    if (failed > 0)
      toast.error(`${failed} delete${failed === 1 ? "" : "s"} failed`);
    setBulkConfirm(false);
    setReloadKey((k) => k + 1);
  };

  return (
    <div>
      <BulkActionsBar
        selectedCount={bulk.selectedCount}
        onClear={bulk.clear}
        onDelete={() => setBulkConfirm(true)}
      />

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
                  <th className="px-5 py-4 font-medium">Transactions ID</th>
                  <th className="px-5 py-4 font-medium">Type</th>
                  <th className="px-5 py-4 font-medium">Amount</th>
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
                    const isPositive = !["advisor_payout", "session_refund"].includes(t.type);
                    const selected = bulk.isSelected(t._id);
                    return (
                      <tr
                        key={t._id}
                        className={`border-b border-slate-50 last:border-0 ${
                          selected ? "bg-amber-50/60" : ""
                        }`}
                      >
                        <td className="pl-5 pr-2 py-3 w-10">
                          <BulkCheckbox
                            ariaLabel={`Select transaction TXN-${t._id.slice(-4).toUpperCase()}`}
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
                          TXN-{t._id.slice(-4).toUpperCase()}
                        </td>
                        <td className="px-5 py-3 capitalize">{t.type.replace(/_/g, " ")}</td>
                        <td className="px-5 py-3">
                          <span className={isPositive ? "text-emerald-600 font-medium" : "text-red-600 font-medium"}>
                            {isPositive ? "+" : "-"}
                            {formatCurrency(Math.abs(t.amount))}
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

        <Modal
          open={!!details}
          onClose={() => setDetails(null)}
          title="Transaction details"
          size="md"
        >
          {details && (
            <div className="space-y-3 text-sm">
              <DetailRow label="Transaction ID" value={`TXN-${details._id.slice(-4).toUpperCase()}`} mono />
              <DetailRow label="Full ID" value={details._id} mono />
              <DetailRow label="Type" value={details.type.replace(/_/g, " ")} capitalize />
              <DetailRow label="Status" value={details.status} capitalize />
              {details.withdrawalStatus && (
                <DetailRow label="Withdrawal status" value={details.withdrawalStatus} capitalize />
              )}
              <DetailRow
                label="Amount"
                value={
                  (details.amount < 0 ? "-" : "+") +
                  formatCurrency(Math.abs(details.amount))
                }
                tone={details.amount < 0 ? "danger" : "success"}
              />
              <DetailRow label="Date" value={formatDate(details.createdAt, true)} />
              {details.user && (
                <DetailRow
                  label="User"
                  value={`${details.user.name} (${details.user.email})`}
                />
              )}
              {details.advisor && (
                <DetailRow
                  label="Advisor"
                  value={`${details.advisor.name} (${details.advisor.email})`}
                />
              )}
              {details.description && (
                <DetailRow label="Description" value={details.description} />
              )}
            </div>
          )}
        </Modal>
      </div>

      <ConfirmDialog
        open={bulkConfirm}
        onClose={() => setBulkConfirm(false)}
        onConfirm={handleBulkDelete}
        title={`Delete ${bulk.selectedCount} transaction${
          bulk.selectedCount === 1 ? "" : "s"
        }?`}
        description="This permanently removes the selected transaction records and cannot be undone."
        confirmText="Delete"
        danger
        loading={actionLoading}
      />
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

function PayoutsTab() {
  const toast = useToast();
  const [items, setItems] = useState<Transaction[]>([]);
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
        status: "requested",
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
  }, [page, limit]);

  const approve = async (id: string) => {
    setActionLoadingId(id);
    try {
      await api.post(`/admin/finance/payouts/${id}/approve`, {});
      toast.success("Payout approved");
      load();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed";
      toast.error(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const reject = async (id: string) => {
    setActionLoadingId(id);
    try {
      await api.post(`/admin/finance/payouts/${id}/reject`, {});
      toast.success("Payout rejected");
      load();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed";
      toast.error(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
      <div className="p-5 text-sm text-slate-700">
        {total} pending advisor payout request{total === 1 ? "" : "s"} awaiting approval.
      </div>
      {loading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr className="border-b border-slate-100">
                <th className="px-5 py-4 font-medium">User</th>
                <th className="px-5 py-4 font-medium">Amount</th>
                <th className="px-5 py-4 font-medium">Date & Time</th>
                <th className="px-5 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-slate-500">
                    No pending payouts
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
                    <td className="px-5 py-3 text-slate-600">{formatDate(p.createdAt, true)}</td>
                    <td className="px-5 py-3 text-right">
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
                    </td>
                  </tr>
                ))
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
    </div>
  );
}

function CommissionsTab() {
  const toast = useToast();
  const [comm, setComm] = useState<Commissions>({ bronze: 20, silver: 15, gold: 10 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get<Commissions>("/admin/finance/commissions")
      .then((r) => {
        if (r.data) setComm(r.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api.put("/admin/finance/commissions", comm);
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
      <h2 className="text-2xl font-bold text-slate-900 mb-5">Commission by Tier</h2>
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
          <Slider label={<span className="inline-flex items-center gap-2"><Badge tone="bronze">🥉 Bronze</Badge></span>} value={comm.bronze} onChange={(v) => setComm({ ...comm, bronze: v })} />
          <Slider label={<span className="inline-flex items-center gap-2"><Badge tone="silver">🥈 Silver</Badge></span>} value={comm.silver} onChange={(v) => setComm({ ...comm, silver: v })} />
          <Slider label={<span className="inline-flex items-center gap-2"><Badge tone="gold">🏅 Gold</Badge></span>} value={comm.gold} onChange={(v) => setComm({ ...comm, gold: v })} />

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
        <span className="text-slate-700 font-medium">{value}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={50}
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
      {note && (
        <span className="absolute top-3 right-3 text-xs font-medium text-slate-600 bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full">
          ↗ {note}
        </span>
      )}
      <div
        className="h-12 w-12 rounded-xl inline-flex items-center justify-center text-white"
        style={{ background: color }}
      >
        {icon}
      </div>
      <div className="mt-3 text-sm text-slate-500">{label}</div>
      <div className="mt-1 text-3xl font-bold text-slate-900">{value}</div>
      <div className="absolute right-3 bottom-2 w-40 opacity-80">
        <MiniArea values={[2, 4, 3, 5, 7, 6, 8, 7, 9, 8]} color={color} height={48} />
      </div>
    </div>
  );
}
