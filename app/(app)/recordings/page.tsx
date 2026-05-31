"use client";

import { useCallback, useEffect, useState } from "react";
import { Topbar } from "../../components/Topbar";
import { PageHeader } from "../../components/PageHeader";
import { Avatar } from "../../components/ui/Avatar";
import { Pagination } from "../../components/ui/Pagination";
import { TableSkeleton } from "../../components/Skeleton";
import { Modal } from "../../components/ui/Modal";
import { CallIcon, VideoIcon, PlayIcon } from "../../components/Icons";
import { api, ApiError } from "../../lib/api";
import { useToast } from "../../lib/toast";
import { formatDate, formatDuration } from "../../lib/format";
import type { SessionItem } from "../../lib/types";

const TYPE_FILTERS = [
  { value: "all", label: "All" },
  { value: "video", label: "Video" },
  { value: "call", label: "Voice" },
];

export default function RecordingsPage() {
  const toast = useToast();
  const [items, setItems] = useState<SessionItem[]>([]);
  const [type, setType] = useState<"all" | "video" | "call">("all");
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState<SessionItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const query: Record<string, string | number> = { page, limit };
      if (type !== "all") query.type = type;
      const r = await api.get<SessionItem[]>("/admin/sessions/recordings", query);
      setItems(r.data || []);
      const m = (r.meta || {}) as { total?: number };
      setTotal(m.total || 0);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to load recordings");
    } finally {
      setLoading(false);
    }
  }, [page, limit, type, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const peopleLabel = (s: SessionItem) => {
    const a = s.advisor?.name || "Advisor";
    const u = s.user?.name || "Client";
    return { a, u };
  };

  return (
    <>
      <Topbar />
      <main className="px-6 md:px-8 pb-10">
        <PageHeader
          title="Session Recordings"
          description="Recorded voice and video consultations"
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
                setType(t.value as "all" | "video" | "call");
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
                    <th className="px-5 py-3 font-medium">Session</th>
                    <th className="px-5 py-3 font-medium">Advisor</th>
                    <th className="px-5 py-3 font-medium">Client</th>
                    <th className="px-5 py-3 font-medium">Type</th>
                    <th className="px-5 py-3 font-medium">Duration</th>
                    <th className="px-5 py-3 font-medium">Date</th>
                    <th className="px-5 py-3 font-medium text-right">Recording</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((s) => {
                    const { a, u } = peopleLabel(s);
                    return (
                      <tr key={s._id} className="hover:bg-slate-50">
                        <td className="px-5 py-3 font-medium text-slate-700">
                          {s.sessionCode || s._id.slice(-6)}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <Avatar name={a} src={s.advisor?.profilePhoto} size={28} />
                            <span className="text-slate-700">{a}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <Avatar name={u} src={s.user?.profilePhoto} size={28} />
                            <span className="text-slate-700">{u}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center gap-1.5 text-slate-600 capitalize">
                            {s.type === "video" ? (
                              <VideoIcon size={15} />
                            ) : (
                              <CallIcon size={15} />
                            )}
                            {s.type === "call" ? "voice" : s.type}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-slate-600">
                          {formatDuration(s.actualDurationSec)}
                        </td>
                        <td className="px-5 py-3 text-slate-600">
                          {formatDate(s.endedAt || s.createdAt)}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setPlaying(s)}
                              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-[#0a7a90] text-white text-sm hover:bg-[#076377]"
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
    </>
  );
}
