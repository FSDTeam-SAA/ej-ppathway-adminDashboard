"use client";

import { useEffect, useState } from "react";
import { Topbar } from "../../components/Topbar";
import { PageHeader } from "../../components/PageHeader";
import { Tabs } from "../../components/ui/Tabs";
import { Avatar } from "../../components/ui/Avatar";
import { Badge } from "../../components/ui/Badge";
import { Pagination } from "../../components/ui/Pagination";
import { TableSkeleton } from "../../components/Skeleton";
import { Modal, ConfirmDialog } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { Textarea } from "../../components/ui/Input";
import { EyeIcon, ShieldIcon, PdfIcon, UploadIcon } from "../../components/Icons";
import { BulkActionsBar, BulkCheckbox } from "../../components/BulkActionsBar";
import { useBulkSelection } from "../../lib/use-bulk-selection";
import { api, ApiError } from "../../lib/api";
import { useToast } from "../../lib/toast";
import { formatCurrency, formatDate } from "../../lib/format";
import type {
  Complaint,
  Dispute,
  DisputeResolution,
  DisputeStatus,
} from "../../lib/types";
import { MiniArea } from "../../components/charts";

const TABS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "rejected", label: "Reject" },
  { value: "complete", label: "Complete" },
];

type ListMeta = {
  total?: number;
  totals?: { all: number; solved: number; pending: number };
};

export default function CompliancePage() {
  const [section, setSection] = useState<"complaints" | "disputes">("complaints");

  return (
    <>
      <Topbar />
      <main className="px-6 md:px-8 pb-10">
        <PageHeader
          title="Compliance & Safety"
          breadcrumb={[
            { label: "Dashboard", href: "/" },
            { label: "Compliance & Safety" },
          ]}
        />
        <div className="inline-flex bg-slate-100 rounded-xl p-1 mb-6">
          <button
            type="button"
            onClick={() => setSection("complaints")}
            className={`px-4 h-9 rounded-lg text-sm font-medium ${
              section === "complaints"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Complaints
          </button>
          <button
            type="button"
            onClick={() => setSection("disputes")}
            className={`px-4 h-9 rounded-lg text-sm font-medium ${
              section === "disputes"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Disputes
          </button>
        </div>
        {section === "complaints" ? <ComplaintsSection /> : <DisputesSection />}
      </main>
    </>
  );
}

function ComplaintsSection() {
  const toast = useToast();
  const [tab, setTab] = useState("all");
  const [items, setItems] = useState<Complaint[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totals, setTotals] = useState({ all: 0, solved: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<Complaint | null>(null);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [note, setNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [bulkConfirm, setBulkConfirm] = useState(false);

  const bulk = useBulkSelection(items);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get<Complaint[]>("/admin/complaints", {
        page,
        limit,
        status: tab === "all" ? undefined : tab,
      });
      setItems(r.data || []);
      const m = (r.meta || {}) as ListMeta;
      setTotal(m.total || 0);
      if (m.totals) setTotals(m.totals);
      bulk.clear();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (bulk.selectedCount === 0) return;
    setActionLoading(true);
    const ids = bulk.selectedArray;
    const results = await Promise.allSettled(
      ids.map((id) => api.delete(`/admin/complaints/${id}`))
    );
    setActionLoading(false);
    const failed = results.filter((r) => r.status === "rejected").length;
    const ok = results.length - failed;
    if (ok > 0)
      toast.success(`Deleted ${ok} complaint${ok === 1 ? "" : "s"}`);
    if (failed > 0)
      toast.error(`${failed} delete${failed === 1 ? "" : "s"} failed`);
    setBulkConfirm(false);
    load();
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, page, limit]);

  const updateStatus = async (status: "complete" | "rejected" | "reviewing") => {
    if (!details) return;
    setActionLoading(true);
    try {
      await api.patch(`/admin/complaints/${details._id}`, { status, note });
      toast.success("Updated");
      setResolveOpen(false);
      setDetails(null);
      setNote("");
      load();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed";
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <SummaryCard label="Total complain" value={totals.all} color="#86efac" icon={<ShieldIcon />} />
          <SummaryCard label="Total Solved Complain" value={totals.solved} color="#60a5fa" icon={<ShieldIcon />} />
          <SummaryCard label="Total Pending Complain" value={totals.pending} color="#fbbf24" icon={<ShieldIcon />} />
        </div>

        <div className="mb-6">
          <Tabs tabs={TABS} active={tab} onChange={(v) => { setTab(v); setPage(1); }} />
        </div>

        <BulkActionsBar
          selectedCount={bulk.selectedCount}
          onClear={bulk.clear}
          onDelete={() => setBulkConfirm(true)}
        />

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {loading ? (
            <TableSkeleton rows={8} cols={8} />
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
                    <th className="px-5 py-4 font-medium">User Name</th>
                    <th className="px-5 py-4 font-medium">User Mail</th>
                    <th className="px-5 py-4 font-medium">Joined</th>
                    <th className="px-5 py-4 font-medium">Sessions</th>
                    <th className="px-5 py-4 font-medium">Payments</th>
                    <th className="px-5 py-4 font-medium">Plan</th>
                    <th className="px-5 py-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-10 text-slate-500">
                        No complaints
                      </td>
                    </tr>
                  ) : (
                    items.map((c) => {
                      const selected = bulk.isSelected(c._id);
                      return (
                      <tr
                        key={c._id}
                        className={`border-b border-slate-50 last:border-0 ${
                          selected ? "bg-amber-50/60" : ""
                        }`}
                      >
                        <td className="pl-5 pr-2 py-3 w-10">
                          <BulkCheckbox
                            ariaLabel={`Select ${c.user?.name || "complaint"}`}
                            checked={selected}
                            onChange={() => bulk.toggle(c._id)}
                          />
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar src={c.user?.profilePhoto} name={c.user?.name} size={32} />
                            <span className="font-medium text-slate-900">{c.user?.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-slate-600">{c.user?.email}</td>
                        <td className="px-5 py-3 text-slate-600">{formatDate(c.createdAt)}</td>
                        <td className="px-5 py-3 text-slate-700">{c.session?.sessionCode || "—"}</td>
                        <td className="px-5 py-3 text-slate-700">
                          {formatCurrency(c.session?.chargedAmount)}
                        </td>
                        <td className="px-5 py-3">
                          <PlanCell status={c.status} />
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => setDetails(c)}
                            className="inline-flex items-center gap-1.5 text-[#0a7a90] hover:underline text-sm font-medium"
                          >
                            <EyeIcon size={16} />
                            View Complain
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
              onLimit={(l) => { setLimit(l); setPage(1); }}
            />
          </div>
        </div>

        <Modal
          open={!!details}
          onClose={() => {
            setDetails(null);
            setResolveOpen(false);
          }}
          title="User Details"
          size="md"
        >
          {details && (
            <div>
              <div className="flex flex-col items-center text-center mb-5">
                <Avatar src={details.user?.profilePhoto} name={details.user?.name} size={88} />
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xl font-bold text-slate-900">{details.user?.name}</span>
                  {details.status === "pending" && (
                    <Badge tone="info">Solve</Badge>
                  )}
                </div>
              </div>

              <Field label="Complaint Type" value={details.issueType} />
              <Field label="Description" value={details.description || "—"} />

              {details.documents && details.documents.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs text-slate-500 mb-2">documents</div>
                  <div className="border-2 border-dashed border-sky-300 rounded-xl p-3 space-y-2">
                    {details.documents.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-[#e6f2f6]/60 rounded-lg px-3 py-3 flex items-center justify-between hover:bg-[#e6f2f6]"
                      >
                        <span className="inline-flex items-center gap-2">
                          <PdfIcon className="text-rose-500" size={20} />
                          <span className="text-sm text-slate-700 truncate max-w-xs">
                            {url.split("/").pop() || `Document ${i + 1}`}
                          </span>
                        </span>
                        <UploadIcon size={16} className="text-slate-500" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {!resolveOpen ? (
                <div className="grid grid-cols-2 gap-3 mt-5">
                  <Button variant="outline" onClick={() => setDetails(null)}>
                    Not Now
                  </Button>
                  <Button onClick={() => setResolveOpen(true)}>Resolve</Button>
                </div>
              ) : (
                <div className="mt-4">
                  <Textarea
                    label="Resolution Note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Outcome / explanation..."
                  />
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    <Button
                      variant="outline"
                      onClick={() => setResolveOpen(false)}
                    >
                      Back
                    </Button>
                    <Button
                      variant="danger"
                      loading={actionLoading}
                      onClick={() => updateStatus("rejected")}
                    >
                      Reject
                    </Button>
                    <Button
                      variant="success"
                      loading={actionLoading}
                      onClick={() => updateStatus("complete")}
                    >
                      Mark Complete
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal>

        <ConfirmDialog
          open={bulkConfirm}
          onClose={() => setBulkConfirm(false)}
          onConfirm={handleBulkDelete}
          title={`Delete ${bulk.selectedCount} complaint${
            bulk.selectedCount === 1 ? "" : "s"
          }?`}
          description="This permanently removes the selected complaints and cannot be undone."
          confirmText="Delete"
          danger
          loading={actionLoading}
        />
    </div>
  );
}

const DISPUTE_TABS: { value: DisputeStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "investigating", label: "Investigating" },
  { value: "resolved", label: "Resolved" },
  { value: "rejected", label: "Rejected" },
];

const RESOLUTION_OPTIONS: { value: DisputeResolution; label: string }[] = [
  { value: "full_refund", label: "Full refund" },
  { value: "partial_refund", label: "Partial refund" },
  { value: "free_reschedule", label: "Free reschedule" },
  { value: "assign_another_advisor", label: "Assign another advisor" },
  { value: "no_action", label: "No action" },
];

function DisputesSection() {
  const toast = useToast();
  const [tab, setTab] = useState<DisputeStatus | "all">("all");
  const [items, setItems] = useState<Dispute[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<Dispute | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [resolution, setResolution] = useState<DisputeResolution>("full_refund");
  const [refundAmount, setRefundAmount] = useState("");
  const [reassignAdvisorId, setReassignAdvisorId] = useState("");
  const [freeRescheduleAt, setFreeRescheduleAt] = useState("");
  const [note, setNote] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get<Dispute[]>("/admin/disputes", {
        page,
        limit,
        status: tab === "all" ? undefined : tab,
      });
      setItems(r.data || []);
      setTotal(r.meta?.total || 0);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, page, limit]);

  const closeAll = () => {
    setDetails(null);
    setResolveOpen(false);
    setRejectOpen(false);
    setRefundAmount("");
    setReassignAdvisorId("");
    setFreeRescheduleAt("");
    setNote("");
    setResolution("full_refund");
  };

  const markInvestigating = async () => {
    if (!details) return;
    setActionLoading(true);
    try {
      await api.post(`/admin/disputes/${details._id}/investigating`);
      toast.success("Marked as investigating");
      closeAll();
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed");
    } finally {
      setActionLoading(false);
    }
  };

  const submitResolve = async () => {
    if (!details) return;
    const body: Record<string, unknown> = { resolution, note };
    if (resolution === "partial_refund") {
      const v = Number(refundAmount);
      if (!v || v <= 0) {
        toast.error("Enter a valid refund amount");
        return;
      }
      body.refundAmount = v;
    }
    if (resolution === "free_reschedule") {
      if (!freeRescheduleAt) {
        toast.error("Pick a reschedule date/time");
        return;
      }
      body.freeRescheduleAt = freeRescheduleAt;
    }
    if (resolution === "assign_another_advisor") {
      if (!reassignAdvisorId.trim()) {
        toast.error("Enter the new advisor ID");
        return;
      }
      body.reassignAdvisorId = reassignAdvisorId.trim();
    }
    setActionLoading(true);
    try {
      await api.post(`/admin/disputes/${details._id}/resolve`, body);
      toast.success("Dispute resolved");
      closeAll();
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed");
    } finally {
      setActionLoading(false);
    }
  };

  const submitReject = async () => {
    if (!details) return;
    setActionLoading(true);
    try {
      await api.post(`/admin/disputes/${details._id}/reject`, { note });
      toast.success("Dispute rejected");
      closeAll();
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed");
    } finally {
      setActionLoading(false);
    }
  };

  const totals = {
    all: items.length,
    open: items.filter((d) => d.status === "open").length,
    investigating: items.filter((d) => d.status === "investigating").length,
    resolved: items.filter((d) => d.status === "resolved").length,
  };

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <SummaryCard label="Total disputes" value={total} color="#86efac" icon={<ShieldIcon />} />
        <SummaryCard label="Investigating" value={totals.investigating} color="#fbbf24" icon={<ShieldIcon />} />
        <SummaryCard label="Resolved" value={totals.resolved} color="#60a5fa" icon={<ShieldIcon />} />
      </div>

      <div className="mb-6">
        <Tabs
          tabs={DISPUTE_TABS.map((t) => ({ value: t.value, label: t.label }))}
          active={tab}
          onChange={(v) => {
            setTab(v as DisputeStatus | "all");
            setPage(1);
          }}
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <TableSkeleton rows={8} cols={6} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-500">
                <tr className="border-b border-slate-100">
                  <th className="px-5 py-4 font-medium">User</th>
                  <th className="px-5 py-4 font-medium">Advisor</th>
                  <th className="px-5 py-4 font-medium">Type</th>
                  <th className="px-5 py-4 font-medium">Session</th>
                  <th className="px-5 py-4 font-medium">Opened</th>
                  <th className="px-5 py-4 font-medium">Status</th>
                  <th className="px-5 py-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-500">
                      No disputes
                    </td>
                  </tr>
                ) : (
                  items.map((d) => (
                    <tr key={d._id} className="border-b border-slate-50 last:border-0">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={d.user?.profilePhoto}
                            name={d.user?.name}
                            size={32}
                          />
                          <span className="font-medium text-slate-900">
                            {d.user?.name || "—"}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-slate-700">
                        {d.advisor?.name || "—"}
                      </td>
                      <td className="px-5 py-3 text-slate-700 capitalize">
                        {d.disputeType?.replace(/_/g, " ") || "—"}
                      </td>
                      <td className="px-5 py-3 text-slate-700">
                        {d.session?.sessionCode || "—"}
                      </td>
                      <td className="px-5 py-3 text-slate-600">
                        {formatDate(d.createdAt)}
                      </td>
                      <td className="px-5 py-3">
                        <DisputeStatusBadge status={d.status} />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setDetails(d)}
                          className="inline-flex items-center gap-1.5 text-[#0a7a90] hover:underline text-sm font-medium"
                        >
                          <EyeIcon size={16} />
                          View
                        </button>
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

      <Modal
        open={!!details && !resolveOpen && !rejectOpen}
        onClose={closeAll}
        title="Dispute details"
        size="md"
      >
        {details && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Avatar
                src={details.user?.profilePhoto}
                name={details.user?.name}
                size={48}
              />
              <div>
                <div className="font-semibold text-slate-900">
                  {details.user?.name}
                </div>
                <div className="text-xs text-slate-500">
                  {details.user?.email}
                </div>
              </div>
              <div className="ml-auto">
                <DisputeStatusBadge status={details.status} />
              </div>
            </div>
            <Field
              label="Type"
              value={(details.disputeType || "—").replace(/_/g, " ")}
            />
            <Field
              label="Expected resolution"
              value={(details.expectedResolution || "—").replace(/_/g, " ")}
            />
            <Field label="Details" value={details.details || "—"} />
            <Field label="Advisor" value={details.advisor?.name || "—"} />
            <Field
              label="Session"
              value={
                details.session?.sessionCode
                  ? `${details.session.sessionCode} · ${formatCurrency(
                      details.session.chargedAmount
                    )}`
                  : "—"
              }
            />
            {details.refundAmount ? (
              <Field
                label="Refund issued"
                value={formatCurrency(details.refundAmount)}
              />
            ) : null}
            {details.resolutionNote ? (
              <Field label="Resolution note" value={details.resolutionNote} />
            ) : null}

            {details.documents && details.documents.length > 0 && (
              <div className="mt-3">
                <div className="text-xs text-slate-500 mb-2">Documents</div>
                <div className="border-2 border-dashed border-sky-300 rounded-xl p-3 space-y-2">
                  {details.documents.map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-[#e6f2f6]/60 rounded-lg px-3 py-3 flex items-center justify-between hover:bg-[#e6f2f6]"
                    >
                      <span className="inline-flex items-center gap-2">
                        <PdfIcon className="text-rose-500" size={20} />
                        <span className="text-sm text-slate-700 truncate max-w-xs">
                          {url.split("/").pop() || `Document ${i + 1}`}
                        </span>
                      </span>
                      <UploadIcon size={16} className="text-slate-500" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {(details.status === "open" || details.status === "investigating") && (
              <div className="grid grid-cols-2 gap-3 mt-5">
                {details.status === "open" && (
                  <Button
                    variant="outline"
                    loading={actionLoading}
                    onClick={markInvestigating}
                  >
                    Mark Investigating
                  </Button>
                )}
                <Button
                  variant="danger"
                  onClick={() => setRejectOpen(true)}
                  className={details.status === "open" ? "" : "col-span-1"}
                >
                  Reject
                </Button>
                <Button
                  variant="success"
                  onClick={() => setResolveOpen(true)}
                  className={
                    details.status === "open" ? "col-span-2" : "col-span-1"
                  }
                >
                  Resolve
                </Button>
              </div>
            )}
            {(details.status === "resolved" ||
              details.status === "rejected" ||
              details.status === "cancelled") && (
              <div className="mt-5">
                <Button variant="outline" onClick={closeAll}>
                  Close
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        open={resolveOpen}
        onClose={() => setResolveOpen(false)}
        title="Resolve dispute"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">
              Resolution
            </label>
            <select
              value={resolution}
              onChange={(e) =>
                setResolution(e.target.value as DisputeResolution)
              }
              className="w-full h-11 rounded-lg border border-slate-200 px-3 text-sm focus:border-[#0a7a90] focus:ring-2 focus:ring-[#0a7a90]/20 focus:outline-none"
            >
              {RESOLUTION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {resolution === "partial_refund" && (
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                Refund amount (USD)
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                className="w-full h-11 rounded-lg border border-slate-200 px-3 text-sm focus:border-[#0a7a90] focus:ring-2 focus:ring-[#0a7a90]/20 focus:outline-none"
                placeholder="e.g. 12.50"
              />
            </div>
          )}

          {resolution === "free_reschedule" && (
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                Reschedule date/time
              </label>
              <input
                type="datetime-local"
                value={freeRescheduleAt}
                onChange={(e) => setFreeRescheduleAt(e.target.value)}
                className="w-full h-11 rounded-lg border border-slate-200 px-3 text-sm focus:border-[#0a7a90] focus:ring-2 focus:ring-[#0a7a90]/20 focus:outline-none"
              />
            </div>
          )}

          {resolution === "assign_another_advisor" && (
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                New advisor ID
              </label>
              <input
                type="text"
                value={reassignAdvisorId}
                onChange={(e) => setReassignAdvisorId(e.target.value)}
                className="w-full h-11 rounded-lg border border-slate-200 px-3 text-sm focus:border-[#0a7a90] focus:ring-2 focus:ring-[#0a7a90]/20 focus:outline-none"
                placeholder="Mongo ObjectId"
              />
            </div>
          )}

          <Textarea
            label="Note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Resolution explanation (optional)..."
          />

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={() => setResolveOpen(false)}>
              Back
            </Button>
            <Button
              variant="success"
              loading={actionLoading}
              onClick={submitResolve}
            >
              Confirm
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="Reject dispute"
        size="sm"
      >
        <div className="space-y-4">
          <Textarea
            label="Reason"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Why is the dispute being rejected?"
          />
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Back
            </Button>
            <Button
              variant="danger"
              loading={actionLoading}
              onClick={submitReject}
            >
              Reject
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function DisputeStatusBadge({ status }: { status: DisputeStatus }) {
  if (status === "open") return <Badge tone="warning">Open</Badge>;
  if (status === "investigating") return <Badge tone="info">Investigating</Badge>;
  if (status === "resolved") return <Badge tone="success">Resolved</Badge>;
  if (status === "rejected") return <Badge tone="danger">Rejected</Badge>;
  if (status === "cancelled") return <Badge>Cancelled</Badge>;
  return <Badge>{status}</Badge>;
}

function PlanCell({ status }: { status?: string }) {
  if (status === "pending") return <Badge tone="warning">Pending</Badge>;
  if (status === "complete") return <Badge tone="info">Complete</Badge>;
  if (status === "rejected") return <Badge tone="danger">Reject</Badge>;
  if (status === "reviewing") return <Badge tone="info">Reviewing</Badge>;
  return <Badge>{status || "—"}</Badge>;
}

function SummaryCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
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
      <div className="absolute right-3 bottom-2 w-40 opacity-80">
        <MiniArea values={[2, 4, 3, 5, 7, 6, 8, 7, 9, 8]} color={color} height={48} />
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-3">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className="bg-[#e6f2f6]/60 rounded-lg px-3 py-2.5 text-sm text-slate-800">
        {value}
      </div>
    </div>
  );
}
