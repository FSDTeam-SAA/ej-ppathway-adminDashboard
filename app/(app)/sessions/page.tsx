"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Topbar } from "../../components/Topbar";
import { PageHeader } from "../../components/PageHeader";
import { Tabs } from "../../components/ui/Tabs";
import { Avatar } from "../../components/ui/Avatar";
import { StatusBadge } from "../../components/ui/Badge";
import { Pagination } from "../../components/ui/Pagination";
import { TableSkeleton } from "../../components/Skeleton";
import { Modal, ConfirmDialog } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Funnel } from "lucide-react";
import {
  ActivityIcon,
  CallIcon,
  ChatIcon,
  ClockIcon,
  EyeIcon,
  PlayIcon,
  VideoIcon,
} from "../../components/Icons";
import { BulkActionsBar, BulkCheckbox } from "../../components/BulkActionsBar";
import { useBulkSelection } from "../../lib/use-bulk-selection";
import { api, ApiError } from "../../lib/api";
import { useToast } from "../../lib/toast";
import { formatDate, formatDuration } from "../../lib/format";
import { MiniArea } from "../../components/charts";
import type { SessionItem, TranscriptResponse } from "../../lib/types";

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
  const router = useRouter();
  const [items, setItems] = useState<SessionItem[]>([]);
  const [tab, setTab] = useState("live");
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [tierFilter, setTierFilter] = useState("");
  const [periodFilter, setPeriodFilter] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [overview, setOverview] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const [details, setDetails] = useState<SessionItem | null>(null);
  const [transcript, setTranscript] = useState<TranscriptResponse | null>(null);
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const [flagReason, setFlagReason] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [confirmCancel, setConfirmCancel] = useState<SessionItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [bulkConfirm, setBulkConfirm] = useState(false);

  const bulk = useBulkSelection(items);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get<SessionItem[]>("/admin/sessions", {
        tab,
        page,
        limit,
        q: q || undefined,
        type: typeFilter || undefined,
        tier: tierFilter || undefined,
        period: periodFilter || undefined,
      });
      setItems(r.data || []);
      const m = (r.meta || {}) as ListMeta;
      setTotal(m.total || 0);
      const ov: Record<string, number> = {};
      (m.overview || []).forEach((x) => {
        ov[x._id] = x.count;
      });
      setOverview(ov);
      bulk.clear();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to load";
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
      ids.map((id) => api.delete(`/admin/sessions/${id}`))
    );
    setActionLoading(false);
    const failed = results.filter((r) => r.status === "rejected").length;
    const ok = results.length - failed;
    if (ok > 0) toast.success(`Deleted ${ok} session${ok === 1 ? "" : "s"}`);
    if (failed > 0)
      toast.error(`${failed} delete${failed === 1 ? "" : "s"} failed`);
    setBulkConfirm(false);
    load();
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, page, limit, q, typeFilter, tierFilter, periodFilter]);

  const cancelSession = async () => {
    if (!confirmCancel) return;
    setActionLoading(true);
    try {
      await api.patch(`/admin/sessions/${confirmCancel._id}/cancel`, { refundUser: true });
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
      await api.patch(`/admin/sessions/${s._id}/resolve`, {});
      toast.success("Resolved");
      load();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed";
      toast.error(msg);
    }
  };

  const openDetails = async (session: SessionItem) => {
    setDetails(session);
    setFlagReason(session.flagReason || "");
    setInternalNotes(session.internalNotes || "");
    setTranscript(null);
    setTranscriptLoading(true);
    try {
      const r = await api.get<TranscriptResponse>(`/admin/sessions/${session._id}/transcript`);
      setTranscript(r.data || null);
    } catch {
      setTranscript(null);
    } finally {
      setTranscriptLoading(false);
    }
  };

  const refreshDetails = (next: SessionItem) => {
    setDetails((current) => (current?._id === next._id ? { ...current, ...next } : current));
    setItems((current) => current.map((item) => (item._id === next._id ? { ...item, ...next } : item)));
  };

  const flagSession = async () => {
    if (!details) return;
    setActionLoading(true);
    try {
      await api.patch<SessionItem>(`/admin/sessions/${details._id}/flag`, { reason: flagReason });
      refreshDetails({ ...details, status: "flagged", flagReason, flaggedAt: new Date().toISOString() });
      toast.success("Session flagged");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not flag session");
    } finally {
      setActionLoading(false);
    }
  };

  const removeFlag = async () => {
    if (!details) return;
    setActionLoading(true);
    try {
      await api.patch<SessionItem>(`/admin/sessions/${details._id}/unflag`, {});
      refreshDetails({ ...details, status: "completed", flagReason: "", flaggedAt: undefined });
      setFlagReason("");
      toast.success("Flag removed");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not remove flag");
    } finally {
      setActionLoading(false);
    }
  };

  const saveNotes = async () => {
    if (!details) return;
    setActionLoading(true);
    try {
      await api.patch<SessionItem>(`/admin/sessions/${details._id}/notes`, { internalNotes });
      refreshDetails({ ...details, internalNotes });
      toast.success("Internal notes saved");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save notes");
    } finally {
      setActionLoading(false);
    }
  };

  const contactUser = async (userId?: string) => {
    if (!userId) return;
    try {
      const r = await api.post<{ _id: string }>(`/chats/admin/with/${userId}`, {});
      if (r.data?._id) router.push(`/chats/${r.data._id}`);
      else router.push(`/chats?user=${userId}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not open conversation");
    }
  };

  return (
    <>
      <Topbar
        searchPlaceholder="Search sessions by ID, client, or advisor ..."
        onSearch={(value) => {
          setPage(1);
          setQ(value);
        }}
      />
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

        <BulkActionsBar
          selectedCount={bulk.selectedCount}
          onClear={bulk.clear}
          onDelete={() => setBulkConfirm(true)}
        />

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <select
            value={periodFilter}
            onChange={(event) => {
              setPeriodFilter(event.target.value);
              setPage(1);
            }}
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700"
            aria-label="Filter sessions by date range"
          >
            <option value="">All Dates</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {loading ? (
            <TableSkeleton rows={8} cols={11} />
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
                    <th className="px-5 py-4 font-medium">Session ID</th>
                    <th className="px-5 py-4 font-medium">Client</th>
                    <th className="px-5 py-4 font-medium">Advisor</th>
                    <th className="px-5 py-4 font-medium">
                      <HeaderFilter
                        label="Tier"
                        value={tierFilter}
                        onChange={(value) => {
                          setTierFilter(value);
                          setPage(1);
                        }}
                        options={[
                          { value: "", label: "All Tiers" },
                          { value: "silver", label: "Silver" },
                          { value: "gold", label: "Gold" },
                          { value: "platinum", label: "Platinum" },
                        ]}
                        ariaLabel="Filter sessions by advisor tier"
                      />
                    </th>
                    <th className="px-5 py-4 font-medium">
                      <HeaderFilter
                        label="Type"
                        value={typeFilter}
                        onChange={(value) => {
                          setTypeFilter(value);
                          setPage(1);
                        }}
                        options={[
                          { value: "", label: "All Types" },
                          { value: "chat", label: "Chat" },
                          { value: "call", label: "Call" },
                          { value: "video", label: "Video" },
                        ]}
                        ariaLabel="Filter sessions by communication type"
                      />
                    </th>
                    <th className="px-5 py-4 font-medium">Duration</th>
                    <th className="px-5 py-4 font-medium">Credits</th>
                    <th className="px-5 py-4 font-medium">Status</th>
                    <th className="px-5 py-4 font-medium">
                      <HeaderFilter
                        label="Session Date"
                        value={periodFilter}
                        onChange={(value) => {
                          setPeriodFilter(value);
                          setPage(1);
                        }}
                        options={[
                          { value: "", label: "All Dates" },
                          { value: "today", label: "Today" },
                          { value: "week", label: "This Week" },
                          { value: "month", label: "This Month" },
                        ]}
                        ariaLabel="Filter sessions by session date"
                      />
                    </th>
                    <th className="px-5 py-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="text-center py-10 text-slate-500">
                        No sessions
                      </td>
                    </tr>
                  ) : (
                    items.map((s) => {
                      const selected = bulk.isSelected(s._id);
                      return (
                      <tr
                        key={s._id}
                        className={`border-b border-slate-50 last:border-0 ${
                          selected ? "bg-amber-50/60" : ""
                        }`}
                      >
                        <td className="pl-5 pr-2 py-3 w-10">
                          <BulkCheckbox
                            ariaLabel={`Select session ${s.sessionCode || s._id}`}
                            checked={selected}
                            onChange={() => bulk.toggle(s._id)}
                          />
                        </td>
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
                          <TierPill tier={s.advisorTier} />
                        </td>
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center gap-2">
                            {sessionIcon(s.type)} {sessionTypeLabel(s.type)}
                          </span>
                        </td>
                        <td className="px-5 py-3">{formatDuration(sessionDurationSeconds(s))}</td>
                        <td className="px-5 py-3">{formatCredits(s.creditsUsed ?? s.chargedAmount)}</td>
                        <td className="px-5 py-3">
                          <StatusBadge status={s.status} />
                        </td>
                        <td className="px-5 py-3 text-slate-600">
                          {formatDate(s.scheduledFor || s.startedAt || s.createdAt, true)}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openDetails(s)}
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
            setTranscript(null);
          }}
          title="Session Details"
          size="xl"
        >
          {details && (
            <div className="space-y-6">
              <DetailSection title="Session Information">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Field label="Session ID" value={details.sessionCode || details._id} />
                  <Field label="Client Name" value={details.user?.name || "—"} />
                  <Field label="Advisor Name" value={details.advisor?.name || "—"} />
                  <Field label="Advisor Tier" value={formatTier(details.advisorTier)} />
                  <Field label="Session Type" value={sessionTypeLabel(details.type)} />
                  <Field label="Session Status" value={details.status || "—"} />
                  <Field label="Session Date & Time" value={formatDate(details.scheduledFor || details.startedAt || details.createdAt, true)} />
                  <Field label="Session Start Time" value={details.startedAt ? formatDate(details.startedAt, true) : "—"} />
                  <Field label="Session End Time" value={details.endedAt ? formatDate(details.endedAt, true) : "—"} />
                  <Field label="Session Duration" value={formatDuration(sessionDurationSeconds(details))} />
                  <Field label="Session Amount" value={formatCredits(details.chargedAmount ?? details.estimatedCost)} />
                </div>
              </DetailSection>

              <DetailSection title="Communication Records">
                <div className="space-y-4">
                  {details.type === "chat" ? (
                    <>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-700">Full Chat Transcript</p>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => downloadSessionTranscriptPdf(details, transcript)}
                          disabled={!transcript?.messages?.length}
                        >
                          Download Transcript (PDF)
                        </Button>
                      </div>
                      <TranscriptPreview loading={transcriptLoading} transcript={transcript} advisorId={details.advisor?._id} />
                    </>
                  ) : (
                    <>
                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-slate-700">
                            {details.type === "video" ? "Video Recording Playback" : "Audio Recording Playback"}
                          </p>
                          {details.recordingUrl ? (
                            <a href={details.recordingUrl} target="_blank" rel="noreferrer" download className="text-sm font-semibold text-[#0a7a90] hover:underline">
                              Download Recording
                            </a>
                          ) : null}
                        </div>
                        {details.recordingUrl ? (
                          details.type === "video" ? (
                            <video src={details.recordingUrl} controls className="max-h-80 w-full rounded-lg bg-black" />
                          ) : (
                            <audio src={details.recordingUrl} controls className="w-full" />
                          )
                        ) : (
                          <p className="text-sm text-slate-500">No recording available for this session.</p>
                        )}
                      </div>

                      <div className="rounded-xl border border-slate-100 bg-white p-4">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-slate-700">
                            {details.type === "video" ? "Video Transcript" : "Call Transcript"}
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => downloadSessionTranscriptPdf(details, transcript)}
                            disabled={!transcript?.messages?.length && !details.transcriptUrl}
                          >
                            Download {details.type === "video" ? "Video" : "Call"} Transcript (PDF)
                          </Button>
                        </div>
                        {details.transcriptUrl ? (
                          <a href={details.transcriptUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-[#0a7a90] hover:underline">
                            Open uploaded transcript
                          </a>
                        ) : (
                          <TranscriptPreview loading={transcriptLoading} transcript={transcript} advisorId={details.advisor?._id} emptyText="No transcript available for this session." />
                        )}
                      </div>
                    </>
                  )}
                </div>
              </DetailSection>

              <DetailSection title="Compliance & Safety">
                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_260px] gap-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field label="Flagged Status" value={details.status === "flagged" ? "Flagged" : "Not flagged"} />
                      <Field label="Reason for Flag" value={details.flagReason || "—"} />
                    </div>
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-slate-700">Flag reason</span>
                      <Input value={flagReason} onChange={(event) => setFlagReason(event.target.value)} placeholder="Add a reason for flagging this session" />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-slate-700">Internal notes</span>
                      <textarea
                        value={internalNotes}
                        onChange={(event) => setInternalNotes(event.target.value)}
                        rows={4}
                        className="w-full rounded-lg border border-slate-200 bg-[#e6f2f6]/40 px-3 py-2 text-sm outline-none focus:border-[#0a7a90] focus:ring-2 focus:ring-[#0a7a90]/20"
                        placeholder="Add private admin notes for operations, compliance, or dispute review"
                      />
                    </label>
                  </div>
                  <div className="space-y-3">
                    <Button type="button" onClick={flagSession} loading={actionLoading} className="w-full">
                      Flag Session
                    </Button>
                    <Button type="button" variant="outline" onClick={removeFlag} loading={actionLoading} className="w-full">
                      Remove Flag
                    </Button>
                    <Button type="button" variant="secondary" onClick={saveNotes} loading={actionLoading} className="w-full">
                      Add Internal Notes
                    </Button>
                    <Button type="button" variant="outline" onClick={() => contactUser(details.advisor?._id)} className="w-full">
                      Contact Advisor
                    </Button>
                    <Button type="button" variant="outline" onClick={() => contactUser(details.user?._id)} className="w-full">
                      Contact Client
                    </Button>
                  </div>
                </div>
              </DetailSection>
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

        <ConfirmDialog
          open={bulkConfirm}
          onClose={() => setBulkConfirm(false)}
          onConfirm={handleBulkDelete}
          title={`Delete ${bulk.selectedCount} session${
            bulk.selectedCount === 1 ? "" : "s"
          }?`}
          description="This permanently removes the selected session records and cannot be undone."
          confirmText="Delete"
          danger
          loading={actionLoading}
        />
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

function HeaderFilter({
  label,
  value,
  onChange,
  options,
  ariaLabel,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  ariaLabel: string;
}) {
  return (
    <label className="inline-flex items-center gap-2">
      <span>{label}</span>
      <span className="relative inline-flex items-center">
        <Funnel size={13} className={value ? "text-[#0a7a90]" : "text-slate-400"} />
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-label={ariaLabel}
          className="absolute inset-0 h-6 w-6 cursor-pointer opacity-0"
        >
          {options.map((option) => (
            <option key={option.value || "all"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </span>
    </label>
  );
}

function TierPill({ tier }: { tier?: string }) {
  const label = formatTier(tier);
  if (label === "-") return <span className="text-slate-400">-</span>;
  return (
    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
      {label}
    </span>
  );
}

function formatTier(tier?: string) {
  if (!tier) return "-";
  return tier.charAt(0).toUpperCase() + tier.slice(1).toLowerCase();
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-4">
      <h3 className="mb-4 text-base font-bold text-slate-900">{title}</h3>
      {children}
    </section>
  );
}

function TranscriptPreview({
  loading,
  transcript,
  advisorId,
  emptyText = "No messages in this transcript.",
}: {
  loading: boolean;
  transcript: TranscriptResponse | null;
  advisorId?: string;
  emptyText?: string;
}) {
  if (loading) return <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Loading transcript...</div>;
  if (!transcript?.messages?.length) return <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">{emptyText}</div>;
  return (
    <div className="max-h-80 space-y-3 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50 p-4">
      {transcript.messages.map((message) => {
        const fromAdvisor = String(message.sender?._id) === String(advisorId);
        return (
          <div key={message._id} className={`flex ${fromAdvisor ? "justify-start" : "justify-end"}`}>
            <div className={`max-w-[85%] break-words rounded-2xl px-3 py-2 sm:max-w-[78%] sm:px-4 ${fromAdvisor ? "bg-white text-slate-800" : "bg-[#0a7a90] text-white"}`}>
              <div className="mb-1 text-[11px] opacity-70">
                {message.sender?.name || "User"} - {formatDate(message.createdAt, true)}
              </div>
              <div className="whitespace-pre-wrap text-sm">{message.text || (message.attachments?.length ? "[attachment]" : "")}</div>
              {message.attachments?.map((url) => (
                <a key={url} href={url} target="_blank" rel="noreferrer" className="mt-1 block text-xs underline">
                  Attachment
                </a>
              ))}
            </div>
          </div>
        );
      })}
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

function formatCredits(value?: number) {
  if (typeof value !== "number") return "-";
  const formatted = Number.isInteger(value) ? String(value) : value.toFixed(2);
  return `${formatted} credits`;
}

function sessionDurationSeconds(session: SessionItem) {
  if (typeof session.actualDurationSec === "number") return session.actualDurationSec;
  if (typeof session.duration === "number") return session.duration;
  if (typeof session.durationMinutes === "number") return session.durationMinutes * 60;
  return undefined;
}

function downloadSessionTranscriptPdf(session: SessionItem, transcript: TranscriptResponse | null) {
  if (session.transcriptUrl && !transcript?.messages?.length) {
    window.open(session.transcriptUrl, "_blank", "noopener,noreferrer");
    return;
  }
  const lines = [
    "Prophetic Pathway Session Transcript",
    "",
    `Session: ${session.sessionCode || session._id}`,
    `Client: ${session.user?.name || "Client"}`,
    `Advisor: ${session.advisor?.name || "Advisor"}`,
    `Advisor Tier: ${formatTier(session.advisorTier)}`,
    `Type: ${sessionTypeLabel(session.type)}`,
    `Status: ${session.status || "-"}`,
    `Date: ${formatDate(session.scheduledFor || session.startedAt || session.createdAt, true)}`,
    "",
    ...(transcript?.messages?.length
      ? transcript.messages.map(
          (message) =>
            `[${formatDate(message.createdAt, true)}] ${message.sender?.name || "User"}: ${
              message.text || (message.attachments?.length ? "[attachment]" : "")
            }`,
        )
      : ["No transcript messages available."]),
  ];
  downloadTextPdf(`transcript-${session.sessionCode || session._id}.pdf`, lines);
}

function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrapPdfText(value: string, max = 92) {
  const words = value.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > max && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

function downloadTextPdf(filename: string, lines: string[]) {
  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 48;
  const lineHeight = 15;
  const pages: string[][] = [[]];
  let y = pageHeight - margin;

  for (const line of lines.flatMap((item) => wrapPdfText(item))) {
    if (y < margin) {
      pages.push([]);
      y = pageHeight - margin;
    }
    pages[pages.length - 1].push(line);
    y -= lineHeight;
  }

  const objects: string[] = ["<< /Type /Catalog /Pages 2 0 R >>"];
  const pageRefs: string[] = [];
  const fontObjectNumber = 3 + pages.length * 2;

  pages.forEach((pageLines, index) => {
    const pageObj = 3 + index * 2;
    const contentObj = pageObj + 1;
    pageRefs.push(`${pageObj} 0 R`);
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontObjectNumber} 0 R >> >> /Contents ${contentObj} 0 R >>`);
    const text = [
      "BT",
      "/F1 10 Tf",
      `${margin} ${pageHeight - margin} Td`,
      ...pageLines.map((line, i) => `${i === 0 ? "" : `0 -${lineHeight} Td `}(${escapePdfText(line)}) Tj`),
      "ET",
    ].join("\n");
    objects.push(`<< /Length ${text.length} >>\nstream\n${text}\nendstream`);
  });

  objects.splice(1, 0, `<< /Type /Pages /Kids [${pageRefs.join(" ")}] /Count ${pages.length} >>`);
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((obj, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;

  const blob = new Blob([pdf], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function sessionTypeLabel(type?: string) {
  if (type === "video") return "Video";
  if (type === "call") return "Call";
  if (type === "chat") return "Chat";
  return "—";
}
