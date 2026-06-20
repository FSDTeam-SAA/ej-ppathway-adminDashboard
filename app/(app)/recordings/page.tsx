"use client";

import { useCallback, useEffect, useState } from "react";
import { Topbar } from "../../components/Topbar";
import { PageHeader } from "../../components/PageHeader";
import { Avatar } from "../../components/ui/Avatar";
import { Pagination } from "../../components/ui/Pagination";
import { StatusBadge } from "../../components/ui/Badge";
import { TableSkeleton } from "../../components/Skeleton";
import { Modal } from "../../components/ui/Modal";
import { Spinner } from "../../components/Spinner";
import { CallIcon, VideoIcon, PlayIcon } from "../../components/Icons";
import { MessageSquare } from "lucide-react";
import { api, ApiError } from "../../lib/api";
import { useToast } from "../../lib/toast";
import { formatDate, formatDuration } from "../../lib/format";
import type { SessionItem, TranscriptResponse } from "../../lib/types";

type TabValue = "all" | "video" | "voice" | "chat";

const TYPE_FILTERS: { value: TabValue; label: string }[] = [
  { value: "all", label: "All" },
  { value: "video", label: "Video" },
  { value: "voice", label: "Voice" },
  { value: "chat", label: "Chat" },
];

const typeLabel = (t?: string) => (t === "call" ? "Voice" : t === "video" ? "Video" : "Chat");

export default function RecordingsPage() {
  const toast = useToast();
  const [items, setItems] = useState<SessionItem[]>([]);
  const [type, setType] = useState<TabValue>("all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState<SessionItem | null>(null);
  const [transcriptFor, setTranscriptFor] = useState<SessionItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const query: Record<string, string | number> = { page, limit };
      if (type !== "all") query.type = type;
      if (q) query.q = q;
      const r = await api.get<SessionItem[]>("/admin/sessions/recordings", query);
      setItems(r.data || []);
      const m = (r.meta || {}) as { total?: number };
      setTotal(m.total || 0);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to load recordings");
    } finally {
      setLoading(false);
    }
  }, [page, limit, type, q, toast]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <Topbar
        searchPlaceholder="Search recordings by session, client, or advisor ..."
        onSearch={(value) => {
          setPage(1);
          setQ(value);
        }}
      />
      <main className="px-6 md:px-8 pb-10">
        <PageHeader
          title="Session Recordings"
          description="Central repository for voice & video recordings and text chat transcripts"
          breadcrumb={[
            { label: "Dashboard", href: "/" },
            { label: "Session Recordings" },
          ]}
        />

        <div className="inline-flex bg-slate-100 rounded-xl p-1 mb-6">
          {TYPE_FILTERS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => {
                setPage(1);
                setType(t.value);
              }}
              className={`px-4 h-9 rounded-lg text-sm font-medium ${
                type === t.value
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <TableSkeleton rows={6} />
        ) : items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 py-20 text-center text-slate-500">
            No recordings found.
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Session ID</th>
                    <th className="px-5 py-3 font-medium">Username</th>
                    <th className="px-5 py-3 font-medium">Advisor</th>
                    <th className="px-5 py-3 font-medium">Type</th>
                    <th className="px-5 py-3 font-medium">Date &amp; Time</th>
                    <th className="px-5 py-3 font-medium">Duration</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium text-right">Recording / Transcript</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((s) => {
                    const isChat = s.type === "chat";
                    return (
                      <tr key={s._id} className="hover:bg-slate-50">
                        <td className="px-5 py-3 font-medium text-slate-700">
                          {s.sessionCode || s._id.slice(-6)}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <Avatar name={s.user?.name || "Client"} src={s.user?.profilePhoto} size={28} />
                            <span className="text-slate-700">{s.user?.name || "Client"}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <Avatar name={s.advisor?.name || "Advisor"} src={s.advisor?.profilePhoto} size={28} />
                            <span className="text-slate-700">{s.advisor?.name || "Advisor"}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center gap-1.5 text-slate-600">
                            {s.type === "video" ? (
                              <VideoIcon size={15} />
                            ) : s.type === "call" ? (
                              <CallIcon size={15} />
                            ) : (
                              <MessageSquare size={15} />
                            )}
                            {typeLabel(s.type)}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-slate-600">
                          {formatDate(s.endedAt || s.createdAt, true)}
                        </td>
                        <td className="px-5 py-3 text-slate-600">
                          {formatDuration(s.actualDurationSec)}
                        </td>
                        <td className="px-5 py-3">
                          <StatusBadge status={s.status} />
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-2">
                            {isChat ? (
                              <button
                                type="button"
                                onClick={() => setTranscriptFor(s)}
                                disabled={!s.hasTranscript}
                                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-[#0a7a90] text-white text-sm hover:bg-[#076377] disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                <MessageSquare size={15} /> View Transcript
                              </button>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setPlaying(s)}
                                  disabled={!s.recordingUrl}
                                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-[#0a7a90] text-white text-sm hover:bg-[#076377] disabled:opacity-40"
                                >
                                  <PlayIcon size={15} /> Play
                                </button>
                                <a
                                  href={s.recordingUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  download
                                  className="inline-flex items-center h-9 px-3 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50"
                                >
                                  Download
                                </a>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {total > limit && (
          <div className="mt-4">
            <Pagination page={page} total={total} limit={limit} onPage={setPage} />
          </div>
        )}
      </main>

      {/* Video / voice player */}
      <Modal
        open={!!playing}
        onClose={() => setPlaying(null)}
        title={
          playing
            ? `Recording • ${playing.sessionCode || playing._id.slice(-6)}`
            : "Recording"
        }
        size="lg"
      >
        {playing?.recordingUrl ? (
          <div className="space-y-3">
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video
              src={playing.recordingUrl}
              controls
              autoPlay
              className="w-full rounded-lg bg-black max-h-[70vh]"
            />
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>
                {playing.advisor?.name || "Advisor"} &amp;{" "}
                {playing.user?.name || "Client"} •{" "}
                {formatDuration(playing.actualDurationSec)}
              </span>
              <a
                href={playing.recordingUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[#0a7a90] hover:underline"
              >
                Open in new tab
              </a>
            </div>
          </div>
        ) : (
          <p className="text-slate-500">Recording is not available.</p>
        )}
      </Modal>

      {/* Chat transcript viewer */}
      <TranscriptModal
        session={transcriptFor}
        onClose={() => setTranscriptFor(null)}
      />
    </>
  );
}

function TranscriptModal({
  session,
  onClose,
}: {
  session: SessionItem | null;
  onClose: () => void;
}) {
  const toast = useToast();
  const [data, setData] = useState<TranscriptResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session) {
      setData(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    api
      .get<TranscriptResponse>(`/admin/sessions/${session._id}/transcript`)
      .then((r) => {
        if (!cancelled) setData(r.data || null);
      })
      .catch((err) => {
        if (!cancelled) toast.error(err instanceof ApiError ? err.message : "Failed to load transcript");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?._id]);

  const download = () => {
    if (!data) return;
    const s = data.session;
    const lines = [
      `Session: ${s.sessionCode || s._id}`,
      `Client: ${s.user?.name || "Client"}`,
      `Advisor: ${s.advisor?.name || "Advisor"}`,
      `Date: ${formatDate(s.endedAt || s.createdAt, true)}`,
      `Status: ${s.status || "—"}`,
      "",
      ...data.messages.map(
        (m) => `[${formatDate(m.createdAt, true)}] ${m.sender?.name || "User"}: ${m.text || (m.attachments?.length ? "[attachment]" : "")}`
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transcript-${s.sessionCode || s._id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const advisorId = data?.session.advisor?._id;

  return (
    <Modal
      open={!!session}
      onClose={onClose}
      title={
        session
          ? `Chat Transcript • ${session.sessionCode || session._id.slice(-6)}`
          : "Chat Transcript"
      }
      size="lg"
    >
      {loading ? (
        <div className="py-16 grid place-items-center">
          <Spinner />
        </div>
      ) : !data ? (
        <p className="text-slate-500 py-8 text-center">Transcript not available.</p>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm border border-slate-100 rounded-xl p-3 bg-slate-50">
            <div className="space-y-0.5">
              <div className="text-slate-700">
                <span className="font-medium">{data.session.user?.name || "Client"}</span> ↔{" "}
                <span className="font-medium">{data.session.advisor?.name || "Advisor"}</span>
              </div>
              <div className="text-slate-500 text-xs">
                {formatDate(data.session.endedAt || data.session.createdAt, true)} ·{" "}
                {data.messages.length} messages
              </div>
            </div>
            <button
              onClick={download}
              className="inline-flex items-center h-9 px-3 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-white"
            >
              Download Transcript
            </button>
          </div>

          <div className="max-h-[55vh] overflow-y-auto space-y-3 pr-1">
            {data.messages.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No messages in this conversation.</p>
            ) : (
              data.messages.map((m) => {
                const fromAdvisor = String(m.sender?._id) === String(advisorId);
                return (
                  <div
                    key={m._id}
                    className={`flex ${fromAdvisor ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                        fromAdvisor
                          ? "bg-slate-100 text-slate-800"
                          : "bg-[#0a7a90] text-white"
                      }`}
                    >
                      <div className="text-[11px] opacity-70 mb-0.5">
                        {m.sender?.name || "User"} · {formatDate(m.createdAt, true)}
                      </div>
                      {m.text && <div className="text-sm whitespace-pre-wrap">{m.text}</div>}
                      {m.attachments?.map((url) => (
                        <a
                          key={url}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="block text-xs underline mt-1"
                        >
                          Attachment
                        </a>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
