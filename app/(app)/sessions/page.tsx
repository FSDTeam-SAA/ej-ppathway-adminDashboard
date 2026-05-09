"use client";

import { useEffect, useState } from "react";
import { Topbar } from "../../components/Topbar";
import { PageHeader } from "../../components/PageHeader";
import { Tabs } from "../../components/ui/Tabs";
import { Avatar } from "../../components/ui/Avatar";
import { StatusBadge } from "../../components/ui/Badge";
import { Pagination } from "../../components/ui/Pagination";
import { Spinner } from "../../components/Spinner";
import { Modal, ConfirmDialog } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import {
  ActivityIcon,
  CallIcon,
  ChatIcon,
  ClockIcon,
  EyeIcon,
  PlayIcon,
  VideoIcon,
} from "../../components/Icons";
import { api, ApiError } from "../../lib/api";
import { useToast } from "../../lib/toast";
import { formatCurrency, formatDate, formatDuration } from "../../lib/format";
import { MiniArea } from "../../components/charts";
import type { SessionItem } from "../../lib/types";

const TABS = [
  { value: "live", label: "Live" },
  { value: "completed", label: "Completed" },
  { value: "disputed", label: "Disputed" },
  { value: "flagged", label: "Flagged" },
  { value: "cancelled", label: "Cancelled" },
];

type ListMeta = {
  total?: number;
  page?: number;
  limit?: number;
  overview?: Array<{ _id: string; count: number }>;
};

export default function SessionsPage() {
  const toast = useToast();
  const [items, setItems] = useState<SessionItem[]>([]);
  const [tab, setTab] = useState("live");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [overview, setOverview] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const [details, setDetails] = useState<SessionItem | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<SessionItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get<SessionItem[]>("/admin/sessions", { tab, page, limit });
      setItems(r.data || []);
      const m = (r.meta || {}) as ListMeta;
      setTotal(m.total || 0);
      const ov: Record<string, number> = {};
      (m.overview || []).forEach((x) => {
        ov[x._id] = x.count;
      });
      setOverview(ov);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to load";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, page, limit]);

  const cancelSession = async () => {
    if (!confirmCancel) return;
    setActionLoading(true);
    try {
      await api.post(`/admin/sessions/${confirmCancel._id}/cancel`, { refundUser: true });
      toast.success("Session cancelled");
      setConfirmCancel(null);
      load();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed";
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const resolveDisputed = async (s: SessionItem) => {
    try {
      await api.post(`/admin/sessions/${s._id}/resolve`, {});
      toast.success("Resolved");
      load();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed";
      toast.error(msg);
    }
  };

  return (
    <>
      <Topbar />
      <main className="px-6 md:px-8 pb-10">
        <PageHeader
          title="Session Management"
          breadcrumb={[
            { label: "Dashboard", href: "/" },
            { label: "Session Management" },
          ]}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <SummaryCard label="Live Now" value={overview.live ?? 0} icon={<ActivityIcon />} color="#a3e635" />
          <SummaryCard label="Today Total Sessions" value={total} icon={<VideoIcon />} color="#60a5fa" />
          <SummaryCard label="Flagged" value={overview.flagged ?? 0} icon={<PlayIcon />} color="#fbbf24" />
          <SummaryCard label="Avg. session length" value="--" icon={<ClockIcon />} color="#0ea5e9" />
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
                    <th className="px-5 py-4 font-medium">Session ID</th>
                    <th className="px-5 py-4 font-medium">Client</th>
                    <th className="px-5 py-4 font-medium">Advisor</th>
                    <th className="px-5 py-4 font-medium">Type</th>
                    <th className="px-5 py-4 font-medium">Duration</th>
                    <th className="px-5 py-4 font-medium">Amount</th>
                    <th className="px-5 py-4 font-medium">Status</th>
                    <th className="px-5 py-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-10 text-slate-500">
                        No sessions
                      </td>
                    </tr>
                  ) : (
                    items.map((s) => (
                      <tr key={s._id} className="border-b border-slate-50 last:border-0">
                        <td className="px-5 py-3 font-medium text-slate-900">
                          {s.sessionCode || s._id.slice(-6).toUpperCase()}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <Avatar
                              src={s.user?.profilePhoto}
                              name={s.user?.name}
                              size={28}
                            />
                            <span>{s.user?.name || "—"}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3">{s.advisor?.name || "—"}</td>
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center gap-2">
                            {sessionIcon(s.type)} {sessionTypeLabel(s.type)}
                          </span>
                        </td>
                        <td className="px-5 py-3">{formatDuration(s.duration)}</td>
                        <td className="px-5 py-3">{formatCurrency(s.chargedAmount)}</td>
                        <td className="px-5 py-3">
                          <StatusBadge status={s.status} />
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setDetails(s)}
                              className="inline-flex items-center gap-1.5 text-[#0a7a90] hover:underline text-sm font-medium"
                            >
                              <EyeIcon size={16} />
                              Details
                            </button>
                            {s.status === "disputed" ? (
                              <button
                                type="button"
                                onClick={() => resolveDisputed(s)}
                                className="text-emerald-600 hover:underline text-sm font-medium"
                              >
                                Resolve
                              </button>
                            ) : null}
                            {s.status !== "completed" && s.status !== "cancelled" ? (
                              <button
                                type="button"
                                onClick={() => setConfirmCancel(s)}
                                aria-label="Cancel"
                                className="h-9 w-9 rounded-full bg-red-100 text-red-600 inline-flex items-center justify-center hover:bg-red-200"
                              >
                                <PlayIcon size={14} />
                              </button>
                            ) : null}
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
              onLimit={(l) => { setLimit(l); setPage(1); }}
            />
          </div>
        </div>

        <Modal
          open={!!details}
          onClose={() => setDetails(null)}
          title="Session Details"
          size="md"
        >
          {details && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Session ID" value={details.sessionCode || details._id} />
                <Field label="Client Name" value={details.user?.name || "—"} />
                <Field label="Advisor Name" value={details.advisor?.name || "—"} />
                <Field label="Session Type" value={sessionTypeLabel(details.type)} />
                <Field label="Session Duration" value={formatDuration(details.duration)} />
                <Field label="Session Amount" value={formatCurrency(details.chargedAmount)} />
                <Field label="Session Status" value={details.status || "—"} />
                <Field label="Session Date & Time" value={formatDate(details.createdAt, true)} />
              </div>
              {details.recordingUrl && (
                <div>
                  <div className="text-xs text-slate-500 mb-2">Session Recordings</div>
                  <a
                    href={details.recordingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-[#e6f2f6]/60 rounded-lg px-4 py-3 flex items-center justify-between text-[#0a7a90] hover:underline"
                  >
                    <span className="inline-flex items-center gap-2">
                      <VideoIcon size={16} /> Video Recording
                    </span>
                    <span>View</span>
                  </a>
                </div>
              )}
            </div>
          )}
        </Modal>

        <Modal
          open={!!confirmCancel}
          onClose={() => setConfirmCancel(null)}
          title="Cancel Session"
          size="sm"
          hideClose
        >
          <p className="text-sm text-slate-600 mb-4">
            This will cancel the session and refund the user where applicable.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={() => setConfirmCancel(null)}>
              Not Now
            </Button>
            <Button variant="danger" loading={actionLoading} onClick={cancelSession}>
              Cancel Session
            </Button>
          </div>
        </Modal>
      </main>
    </>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative overflow-hidden">
      <div
        className="h-10 w-10 rounded-xl inline-flex items-center justify-center text-white"
        style={{ background: color }}
      >
        {icon}
      </div>
      <div className="mt-3 text-sm text-slate-500">{label}</div>
      <div className="mt-1 text-3xl font-bold text-slate-900">{value}</div>
      <div className="absolute right-3 bottom-2 w-32 opacity-80">
        <MiniArea values={[2, 4, 3, 5, 7, 6, 8, 7, 9, 8]} color={color} height={48} />
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className="bg-[#e6f2f6]/60 rounded-lg px-3 py-2.5 text-sm text-slate-800">
        {value}
      </div>
    </div>
  );
}

function sessionIcon(type?: string) {
  if (type === "video") return <VideoIcon className="text-sky-600" size={16} />;
  if (type === "call") return <CallIcon className="text-emerald-600" size={16} />;
  return <ChatIcon className="text-slate-600" size={16} />;
}
function sessionTypeLabel(type?: string) {
  if (type === "video") return "Video";
  if (type === "call") return "Call";
  if (type === "chat") return "Chat";
  return "—";
}
