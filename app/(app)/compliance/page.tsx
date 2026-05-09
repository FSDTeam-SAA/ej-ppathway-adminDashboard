"use client";

import { useEffect, useState } from "react";
import { Topbar } from "../../components/Topbar";
import { PageHeader } from "../../components/PageHeader";
import { Tabs } from "../../components/ui/Tabs";
import { Avatar } from "../../components/ui/Avatar";
import { Badge } from "../../components/ui/Badge";
import { Pagination } from "../../components/ui/Pagination";
import { Spinner } from "../../components/Spinner";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { Textarea } from "../../components/ui/Input";
import { EyeIcon, ShieldIcon, PdfIcon, UploadIcon } from "../../components/Icons";
import { api, ApiError } from "../../lib/api";
import { useToast } from "../../lib/toast";
import { formatCurrency, formatDate } from "../../lib/format";
import type { Complaint } from "../../lib/types";
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <SummaryCard label="Total complain" value={totals.all} color="#86efac" icon={<ShieldIcon />} />
          <SummaryCard label="Total Solved Complain" value={totals.solved} color="#60a5fa" icon={<ShieldIcon />} />
          <SummaryCard label="Total Pending Complain" value={totals.pending} color="#fbbf24" icon={<ShieldIcon />} />
        </div>

        <div className="mb-6">
          <Tabs tabs={TABS} active={tab} onChange={(v) => { setTab(v); setPage(1); }} />
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 flex justify-center text-[#0a7a90]">
              <Spinner size={32} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-slate-500">
                  <tr className="border-b border-slate-100">
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
                      <td colSpan={7} className="text-center py-10 text-slate-500">
                        No complaints
                      </td>
                    </tr>
                  ) : (
                    items.map((c) => (
                      <tr key={c._id} className="border-b border-slate-50 last:border-0">
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
      </main>
    </>
  );
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
