"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Topbar } from "../../components/Topbar";
import { PageHeader } from "../../components/PageHeader";
import { Tabs } from "../../components/ui/Tabs";
import { Avatar } from "../../components/ui/Avatar";
import { Badge, StatusBadge } from "../../components/ui/Badge";
import { Pagination } from "../../components/ui/Pagination";
import { TableSkeleton, Skeleton } from "../../components/Skeleton";
import { Button } from "../../components/ui/Button";
import { Modal, ConfirmDialog } from "../../components/ui/Modal";
import { Input, Select, Textarea } from "../../components/ui/Input";
import { DollarIcon, ClockIcon, UsersIcon } from "../../components/Icons";
import { Wallet as WalletIcon, Landmark, RefreshCw, Send, Trash2 } from "lucide-react";
import { api, ApiError } from "../../lib/api";
import { useToast } from "../../lib/toast";
import { formatCurrency, formatDate, formatNumber } from "../../lib/format";
import type {
  PayoutConfig,
  PayoutStats,
  PayoutAccountRow,
  PayoutAccountDetails,
  PayoutTransaction,
} from "../../lib/types";

const TABS = [
  { value: "accounts", label: "Advisor Accounts" },
  { value: "queue", label: "Payout Queue" },
  { value: "settings", label: "Settings" },
];

const credits = (n?: number | null) => `${formatNumber(Math.round(Number(n || 0)))} cr`;

export default function PayoutsPage() {
  const toast = useToast();
  const [tab, setTab] = useState("accounts");
  const [q, setQ] = useState("");
  const [stats, setStats] = useState<PayoutStats | null>(null);
  const [statsKey, setStatsKey] = useState(0);
  const refreshStats = useCallback(() => setStatsKey((k) => k + 1), []);

  useEffect(() => {
    api
      .get<PayoutStats>("/admin/payouts/stats")
      .then((r) => setStats(r.data || null))
      .catch((err) => toast.error(err instanceof ApiError ? err.message : "Failed to load payout stats"));
  }, [toast, statsKey]);

  const cfg = stats?.config;

  return (
    <>
      <Topbar searchPlaceholder="Search advisors by name or email ..." onSearch={setQ} />
      <main className="px-6 md:px-8 pb-10">
        <PageHeader
          title="Payout Management"
          description="Pay advisors from their earned credits via Hyperwallet."
          breadcrumb={[{ label: "Dashboard", href: "/" }, { label: "Payouts" }]}
        />

        {cfg && !cfg.hyperwalletConfigured && (
          <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Hyperwallet API credentials are not set on the server. Payouts can be queued and
            marked paid manually, but money will not move until{" "}
            <code className="font-mono">HYPERWALLET_*</code> env vars are configured.
          </div>
        )}
        {cfg && cfg.hyperwalletConfigured && !cfg.hyperwalletEnabled && (
          <div className="mb-5 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
            Hyperwallet is configured but disabled. Enable it under the Settings tab to send real payouts.
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
          <SummaryCard
            label="Payable Pool"
            value={formatCurrency(stats?.payable.usd)}
            note={`${credits(stats?.payable.credits)} across advisors`}
            icon={<WalletIcon size={20} />}
            color="#0a7a90"
          />
          <SummaryCard
            label="Requested"
            value={formatCurrency(stats?.requested.usd)}
            note={`${stats?.requested.count ?? 0} awaiting`}
            icon={<ClockIcon />}
            color="#fbbf24"
          />
          <SummaryCard
            label="Processing"
            value={formatCurrency(stats?.processing.usd)}
            note={`${stats?.processing.count ?? 0} in transit`}
            icon={<Send size={18} />}
            color="#60a5fa"
          />
          <SummaryCard
            label="Paid Out"
            value={formatCurrency(stats?.paid.usd)}
            note={`${stats?.paid.count ?? 0} completed`}
            icon={<DollarIcon />}
            color="#34d399"
          />
          <SummaryCard
            label="Failed"
            value={formatCurrency(stats?.failed.usd)}
            note={`${stats?.failed.count ?? 0} to review`}
            icon={<UsersIcon />}
            color="#f87171"
          />
        </div>

        <div className="mb-6">
          <Tabs tabs={TABS} active={tab} onChange={setTab} />
        </div>

        {tab === "accounts" && <AccountsTab q={q} config={cfg} onChanged={refreshStats} />}
        {tab === "queue" && <QueueTab q={q} onChanged={refreshStats} />}
        {tab === "settings" && <SettingsTab onSaved={refreshStats} />}
      </main>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Advisor accounts                                                           */
/* -------------------------------------------------------------------------- */

function AccountsTab({
  q,
  config,
  onChanged,
}: {
  q: string;
  config?: PayoutConfig;
  onChanged: () => void;
}) {
  const toast = useToast();
  const [items, setItems] = useState<PayoutAccountRow[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [manageId, setManageId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get<PayoutAccountRow[]>("/admin/payouts/accounts", { page, limit, q: q || undefined })
      .then((r) => {
        setItems(r.data || []);
        setTotal(r.meta?.total || 0);
      })
      .catch((err) => toast.error(err instanceof ApiError ? err.message : "Failed"))
      .finally(() => setLoading(false));
  }, [page, limit, q, toast]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, q, reloadKey]);

  const reload = () => {
    setReloadKey((k) => k + 1);
    onChanged();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {loading ? (
        <TableSkeleton rows={8} cols={6} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr className="border-b border-slate-100">
                <th className="px-5 py-4 font-medium">Advisor</th>
                <th className="px-5 py-4 font-medium">Available</th>
                <th className="px-5 py-4 font-medium">Pending</th>
                <th className="px-5 py-4 font-medium">Payout Method</th>
                <th className="px-5 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-500">
                    No advisors
                  </td>
                </tr>
              ) : (
                items.map((row) => (
                  <tr key={row.advisor._id} className="border-b border-slate-50 last:border-0">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar src={row.advisor.profilePhoto} name={row.advisor.name} size={28} />
                        <div>
                          <div className="font-medium text-slate-800">{row.advisor.name}</div>
                          <div className="text-xs text-slate-400">{row.advisor.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-medium text-emerald-600">{formatCurrency(row.availableUsd)}</div>
                      <div className="text-xs text-slate-400">{credits(row.availableCredits)}</div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="text-slate-700">{formatCurrency(row.pendingUsd)}</div>
                      <div className="text-xs text-slate-400">{credits(row.pendingCredits)}</div>
                    </td>
                    <td className="px-5 py-3">
                      {row.account.hasMethod ? (
                        <span className="inline-flex items-center gap-1.5 text-slate-700">
                          {row.account.methodType === "paypal" ? (
                            <WalletIcon size={15} />
                          ) : (
                            <Landmark size={15} />
                          )}
                          {row.account.methodLabel || row.account.methodType}
                        </span>
                      ) : row.account.configured ? (
                        <Badge tone="warning">No method</Badge>
                      ) : (
                        <Badge tone="neutral">Not set up</Badge>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Button variant="outline" size="sm" onClick={() => setManageId(row.advisor._id)}>
                        Manage
                      </Button>
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

      {manageId && (
        <ManageAccountModal
          advisorId={manageId}
          config={config}
          onClose={() => setManageId(null)}
          onChanged={reload}
        />
      )}
    </div>
  );
}

function ManageAccountModal({
  advisorId,
  config,
  onClose,
  onChanged,
}: {
  advisorId: string;
  config?: PayoutConfig;
  onClose: () => void;
  onChanged: () => void;
}) {
  const toast = useToast();
  const [data, setData] = useState<PayoutAccountDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  // form state
  const [methodTab, setMethodTab] = useState<"bank" | "paypal">("bank");
  const [routing, setRouting] = useState("");
  const [accountNo, setAccountNo] = useState("");
  const [purpose, setPurpose] = useState("CHECKING");
  const [paypalEmail, setPaypalEmail] = useState("");
  const [payCredits, setPayCredits] = useState("");
  const [note, setNote] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    api
      .get<PayoutAccountDetails>(`/admin/payouts/accounts/${advisorId}`)
      .then((r) => setData(r.data || null))
      .catch((err) => toast.error(err instanceof ApiError ? err.message : "Failed"))
      .finally(() => setLoading(false));
  }, [advisorId, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const rate = data?.config.payoutCreditUsdRate ?? config?.payoutCreditUsdRate ?? 1;
  const payUsd = useMemo(() => {
    const c = Number(payCredits);
    return Number.isFinite(c) && c > 0 ? c * rate : 0;
  }, [payCredits, rate]);

  const run = async (key: string, fn: () => Promise<unknown>, okMsg: string) => {
    setBusy(key);
    try {
      await fn();
      toast.success(okMsg);
      load();
      onChanged();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed");
    } finally {
      setBusy(null);
    }
  };

  const setup = () =>
    run("setup", () => api.post(`/admin/payouts/accounts/${advisorId}/setup`, {}), "Payout account created");

  const addBank = () =>
    run(
      "bank",
      () =>
        api.post(`/admin/payouts/accounts/${advisorId}/bank`, {
          branchId: routing,
          bankAccountId: accountNo,
          bankAccountPurpose: purpose,
        }),
      "Bank account added"
    ).then(() => {
      setRouting("");
      setAccountNo("");
    });

  const addPaypal = () =>
    run("paypal", () => api.post(`/admin/payouts/accounts/${advisorId}/paypal`, { email: paypalEmail }), "PayPal added").then(
      () => setPaypalEmail("")
    );

  const removeMethod = () =>
    run("remove", () => api.delete(`/admin/payouts/accounts/${advisorId}/method`), "Method removed");

  const initiatePayout = (processNow: boolean) => {
    const c = Number(payCredits);
    if (!Number.isFinite(c) || c <= 0) {
      toast.error("Enter a credit amount");
      return;
    }
    return run(
      processNow ? "pay" : "queue",
      () =>
        api.post("/admin/payouts", {
          advisorId,
          credits: c,
          note: note || undefined,
          process: processNow,
        }),
      processNow ? "Payout sent" : "Payout queued"
    ).then(() => {
      setPayCredits("");
      setNote("");
    });
  };

  const acct = data?.account;

  return (
    <Modal open onClose={onClose} title="Manage payout account" size="lg">
      {loading || !data ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* header */}
          <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <Avatar src={data.advisor.profilePhoto} name={data.advisor.name} size={40} />
              <div>
                <div className="font-semibold text-slate-800">{data.advisor.name}</div>
                <div className="text-xs text-slate-500">{data.advisor.email}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-emerald-600">{formatCurrency(data.balance.availableUsd)}</div>
              <div className="text-xs text-slate-400">{credits(data.balance.availableCredits)} available</div>
            </div>
          </div>

          {/* account status */}
          {!acct?.configured ? (
            <div className="rounded-xl border border-slate-200 p-4">
              <div className="text-sm text-slate-600 mb-3">
                This advisor does not have a Hyperwallet payee account yet. Create one to attach a bank
                or PayPal payout method.
              </div>
              <Button loading={busy === "setup"} onClick={setup}>
                Create Hyperwallet account
              </Button>
            </div>
          ) : (
            <>
              {/* current method */}
              <div className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-slate-400 mb-1">Active payout method</div>
                    {acct.hasMethod ? (
                      <div className="flex items-center gap-2 font-medium text-slate-800">
                        {acct.methodType === "paypal" ? <WalletIcon size={16} /> : <Landmark size={16} />}
                        {acct.methodLabel || acct.methodType}
                        <Badge tone="info">{acct.currency}</Badge>
                      </div>
                    ) : (
                      <div className="text-sm text-slate-500">No transfer method attached yet.</div>
                    )}
                  </div>
                  {acct.hasMethod && (
                    <Button variant="ghost" size="sm" loading={busy === "remove"} onClick={removeMethod}>
                      <Trash2 size={15} /> Remove
                    </Button>
                  )}
                </div>
              </div>

              {/* add method */}
              <div className="rounded-xl border border-slate-200 p-4">
                <div className="mb-3 inline-flex bg-slate-100 rounded-lg p-1">
                  <button
                    onClick={() => setMethodTab("bank")}
                    className={`px-3 h-8 rounded-md text-xs font-medium ${methodTab === "bank" ? "bg-white shadow-sm" : "text-slate-500"}`}
                  >
                    Bank account
                  </button>
                  <button
                    onClick={() => setMethodTab("paypal")}
                    className={`px-3 h-8 rounded-md text-xs font-medium ${methodTab === "paypal" ? "bg-white shadow-sm" : "text-slate-500"}`}
                  >
                    PayPal
                  </button>
                </div>

                {methodTab === "bank" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="Routing number (ABA)"
                      value={routing}
                      onChange={(e) => setRouting(e.target.value)}
                      placeholder="021000021"
                    />
                    <Input
                      label="Account number"
                      value={accountNo}
                      onChange={(e) => setAccountNo(e.target.value)}
                      placeholder="1234567890"
                    />
                    <Select label="Account type" value={purpose} onChange={(e) => setPurpose(e.target.value)}>
                      <option value="CHECKING">Checking</option>
                      <option value="SAVINGS">Savings</option>
                    </Select>
                    <div className="flex items-end">
                      <Button className="w-full" loading={busy === "bank"} onClick={addBank}>
                        Add bank account
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="PayPal email"
                      type="email"
                      value={paypalEmail}
                      onChange={(e) => setPaypalEmail(e.target.value)}
                      placeholder="advisor@example.com"
                    />
                    <div className="flex items-end">
                      <Button className="w-full" loading={busy === "paypal"} onClick={addPaypal}>
                        Add PayPal
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* initiate payout */}
              <div className="rounded-xl border border-[#0a7a90]/30 bg-[#e6f2f6]/40 p-4">
                <div className="font-semibold text-slate-800 mb-1">Send a payout</div>
                <div className="text-xs text-slate-500 mb-3">
                  Converts credits to {data.config.payoutCurrency} at {formatCurrency(rate)} / credit.
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Credits to pay out"
                    type="number"
                    min={0}
                    value={payCredits}
                    onChange={(e) => setPayCredits(e.target.value)}
                    placeholder={`min ${data.config.minPayoutCredits}`}
                  />
                  <div className="flex items-end">
                    <div className="h-11 flex items-center px-4 rounded-lg bg-white border border-slate-200 w-full">
                      <span className="text-slate-500 text-sm">Payout amount:&nbsp;</span>
                      <span className="font-semibold text-slate-800">{formatCurrency(payUsd)}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <Input label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    loading={busy === "pay"}
                    disabled={!acct.hasMethod}
                    onClick={() => initiatePayout(true)}
                  >
                    <Send size={15} /> Pay now
                  </Button>
                  <Button variant="outline" loading={busy === "queue"} onClick={() => initiatePayout(false)}>
                    Queue without sending
                  </Button>
                  {!acct.hasMethod && (
                    <span className="text-xs text-amber-600 self-center">Add a payout method to send.</span>
                  )}
                </div>
              </div>
            </>
          )}

          {/* recent payouts */}
          {data.recentPayouts.length > 0 && (
            <div>
              <div className="text-sm font-semibold text-slate-700 mb-2">Recent payouts</div>
              <div className="space-y-2">
                {data.recentPayouts.map((p) => (
                  <div key={p._id} className="flex items-center justify-between text-sm border border-slate-100 rounded-lg px-3 py-2">
                    <div className="text-slate-600">{formatDate(p.createdAt, true)}</div>
                    <div className="font-medium">{formatCurrency(p.amountUsd)}</div>
                    <StatusBadge status={p.withdrawalStatus} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/* Payout queue                                                               */
/* -------------------------------------------------------------------------- */

const QUEUE_STATUSES: { value: string; label: string }[] = [
  { value: "requested", label: "Requested" },
  { value: "processing", label: "Processing" },
  { value: "paid", label: "Paid" },
  { value: "failed", label: "Failed" },
  { value: "rejected", label: "Rejected" },
];

function QueueTab({ q, onChanged }: { q: string; onChanged: () => void }) {
  const toast = useToast();
  const [status, setStatus] = useState("requested");
  const [items, setItems] = useState<PayoutTransaction[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectFor, setRejectFor] = useState<PayoutTransaction | null>(null);
  const [reason, setReason] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get<PayoutTransaction[]>("/admin/finance/payouts", { page, limit, status, q: q || undefined })
      .then((r) => {
        setItems(r.data || []);
        setTotal(r.meta?.total || 0);
      })
      .catch((err) => toast.error(err instanceof ApiError ? err.message : "Failed"))
      .finally(() => setLoading(false));
  }, [page, limit, status, q, toast]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, status, q, reloadKey]);

  const reload = () => {
    setReloadKey((k) => k + 1);
    onChanged();
  };

  const act = async (id: string, fn: () => Promise<unknown>, ok: string) => {
    setBusyId(id);
    try {
      await fn();
      toast.success(ok);
      reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed");
    } finally {
      setBusyId(null);
    }
  };

  const approve = (id: string) =>
    act(id, () => api.patch(`/admin/finance/payouts/${id}/approve`, {}), "Payout approved");
  const markPaid = (id: string) =>
    act(id, () => api.patch(`/admin/finance/payouts/${id}/mark-paid`, {}), "Marked as paid");
  const retry = (id: string) => act(id, () => api.post(`/admin/payouts/${id}/retry`, {}), "Payout retried");
  const sync = (id: string) => act(id, () => api.post(`/admin/payouts/${id}/sync`, {}), "Status synced");

  const doReject = async () => {
    if (!rejectFor) return;
    await act(rejectFor._id, () => api.patch(`/admin/finance/payouts/${rejectFor._id}/reject`, { reason }), "Payout rejected");
    setRejectFor(null);
    setReason("");
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between p-4 border-b border-slate-100 flex-wrap gap-3">
        <div className="inline-flex bg-slate-100 rounded-xl p-1 flex-wrap">
          {QUEUE_STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => {
                setStatus(s.value);
                setPage(1);
              }}
              className={`px-3 h-8 rounded-lg text-xs font-medium ${status === s.value ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"}`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <Button variant="ghost" size="sm" onClick={reload}>
          <RefreshCw size={15} /> Refresh
        </Button>
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
                <th className="px-5 py-4 font-medium">Date</th>
                <th className="px-5 py-4 font-medium text-right">Action</th>
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
                  <tr key={p._id} className="border-b border-slate-50 last:border-0 align-top">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar src={p.advisor?.profilePhoto} name={p.advisor?.name} size={28} />
                        <div>
                          <div className="text-slate-800">{p.advisor?.name || "—"}</div>
                          <div className="text-xs text-slate-400">{p.txCode}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-medium">{formatCurrency(p.amountUsd)}</div>
                      <div className="text-xs text-slate-400">{credits(p.payoutCredits ?? p.amount)}</div>
                    </td>
                    <td className="px-5 py-3 text-slate-600 capitalize">
                      {(p.withdrawalMethod || "—").replace(/_/g, " ")}
                    </td>
                    <td className="px-5 py-3 text-slate-600">{formatDate(p.createdAt, true)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2 flex-wrap">
                        {status === "requested" && (
                          <>
                            <Button variant="success" size="sm" loading={busyId === p._id} onClick={() => approve(p._id)}>
                              Approve & send
                            </Button>
                            <Button variant="outline" size="sm" loading={busyId === p._id} onClick={() => markPaid(p._id)}>
                              Mark paid
                            </Button>
                            <Button variant="danger" size="sm" loading={busyId === p._id} onClick={() => setRejectFor(p)}>
                              Reject
                            </Button>
                          </>
                        )}
                        {status === "processing" && (
                          <>
                            <Button variant="outline" size="sm" loading={busyId === p._id} onClick={() => sync(p._id)}>
                              <RefreshCw size={14} /> Sync
                            </Button>
                            <Button variant="ghost" size="sm" loading={busyId === p._id} onClick={() => markPaid(p._id)}>
                              Mark paid
                            </Button>
                          </>
                        )}
                        {status === "failed" && (
                          <>
                            <Button variant="primary" size="sm" loading={busyId === p._id} onClick={() => retry(p._id)}>
                              Retry
                            </Button>
                            {p.withdrawalFailureReason && (
                              <span className="text-xs text-red-500 max-w-[180px] truncate" title={p.withdrawalFailureReason}>
                                {p.withdrawalFailureReason}
                              </span>
                            )}
                          </>
                        )}
                        {(status === "paid" || status === "rejected") && (
                          <StatusBadge status={p.withdrawalStatus} />
                        )}
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

      <ConfirmDialog
        open={!!rejectFor}
        onClose={() => {
          setRejectFor(null);
          setReason("");
        }}
        onConfirm={doReject}
        title="Reject payout?"
        description="The held credits are returned to the advisor's earnings balance."
        confirmText="Reject payout"
        danger
        loading={busyId === rejectFor?._id}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Settings                                                                   */
/* -------------------------------------------------------------------------- */

function SettingsTab({ onSaved }: { onSaved: () => void }) {
  const toast = useToast();
  const [cfg, setCfg] = useState<PayoutConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get<PayoutConfig>("/admin/payouts/config")
      .then((r) => setCfg(r.data || null))
      .catch((err) => toast.error(err instanceof ApiError ? err.message : "Failed"))
      .finally(() => setLoading(false));
  }, [toast]);

  const save = async () => {
    if (!cfg) return;
    setSaving(true);
    try {
      const r = await api.patch<PayoutConfig>("/admin/payouts/config", {
        hyperwalletEnabled: cfg.hyperwalletEnabled,
        provider: cfg.provider,
        payoutCreditUsdRate: cfg.payoutCreditUsdRate,
        payoutCurrency: cfg.payoutCurrency,
        minPayoutCredits: cfg.minPayoutCredits,
      });
      setCfg(r.data || cfg);
      toast.success("Payout settings saved");
      onSaved();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !cfg) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 max-w-2xl space-y-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-10 w-40" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 max-w-2xl">
      <h2 className="text-xl font-bold text-slate-900 mb-1">Payout settings</h2>
      <p className="text-sm text-slate-500 mb-5">
        Control how advisor credits convert to real money and how payouts are sent.
      </p>

      <div className="space-y-5">
        <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
          <div>
            <div className="font-medium text-slate-800">Hyperwallet payouts</div>
            <div className="text-xs text-slate-500">
              {cfg.hyperwalletConfigured
                ? "API credentials detected on the server."
                : "API credentials missing — set HYPERWALLET_* env vars."}
            </div>
          </div>
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={cfg.hyperwalletEnabled}
              onChange={(e) => setCfg({ ...cfg, hyperwalletEnabled: e.target.checked })}
            />
            <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:bg-[#0a7a90] relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
          </label>
        </div>

        <Select
          label="Provider"
          value={cfg.provider}
          onChange={(e) => setCfg({ ...cfg, provider: e.target.value as PayoutConfig["provider"] })}
        >
          <option value="hyperwallet">Hyperwallet (send real money)</option>
          <option value="manual">Manual (mark paid only)</option>
        </Select>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Payout rate (USD per credit)"
            type="number"
            step="0.01"
            min={0}
            value={String(cfg.payoutCreditUsdRate)}
            onChange={(e) => setCfg({ ...cfg, payoutCreditUsdRate: Number(e.target.value) })}
          />
          <Input
            label="Payout currency"
            value={cfg.payoutCurrency}
            maxLength={3}
            onChange={(e) => setCfg({ ...cfg, payoutCurrency: e.target.value.toUpperCase() })}
          />
          <Input
            label="Minimum payout (credits)"
            type="number"
            min={0}
            value={String(cfg.minPayoutCredits)}
            onChange={(e) => setCfg({ ...cfg, minPayoutCredits: Number(e.target.value) })}
          />
          <div className="flex items-end">
            <div className="h-11 w-full flex items-center px-4 rounded-lg bg-[#e6f2f6]/50 border border-slate-200 text-sm text-slate-600">
              Min payout ≈ {formatCurrency(cfg.minPayoutCredits * cfg.payoutCreditUsdRate)}
            </div>
          </div>
        </div>

        <Button onClick={save} loading={saving}>
          Save settings
        </Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Shared                                                                     */
/* -------------------------------------------------------------------------- */

function SummaryCard({
  label,
  value,
  note,
  icon,
  color,
}: {
  label: string;
  value: string;
  note?: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
      <div
        className="h-11 w-11 rounded-xl inline-flex items-center justify-center text-white"
        style={{ background: color }}
      >
        {icon}
      </div>
      <div className="mt-3 text-sm text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-slate-900">{value}</div>
      {note && <div className="mt-1 text-xs text-slate-400 truncate">{note}</div>}
    </div>
  );
}
