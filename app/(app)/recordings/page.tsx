"use client";

import { useCallback, useEffect, useState } from "react";
import { Topbar } from "../../components/Topbar";
import { PageHeader } from "../../components/PageHeader";
import { Avatar } from "../../components/ui/Avatar";
import { Pagination } from "../../components/ui/Pagination";
import { StatusBadge } from "../../components/ui/Badge";
import { TableSkeleton } from "../../components/Skeleton";
import { Modal } from "../../components/ui/Modal";
import { Input, Select } from "../../components/ui/Input";
import { Spinner } from "../../components/Spinner";
import { CallIcon, VideoIcon, PlayIcon } from "../../components/Icons";
import { MessageSquare } from "lucide-react";
import { api, ApiError, API_BASE, getAccessToken } from "../../lib/api";
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

function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrapText(value: string, max = 88) {
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

function downloadPdf(filename: string, lines: string[]) {
  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 48;
  const lineHeight = 15;
  const pages: string[][] = [[]];
  let y = pageHeight - margin;

  for (const line of lines.flatMap((item) => wrapText(item))) {
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
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function pdfText(
  text: string,
  x: number,
  y: number,
  options: { size?: number; font?: "F1" | "F2"; color?: [number, number, number] } = {},
) {
  const size = options.size || 10;
  const font = options.font || "F1";
  const color = options.color || [15, 23, 42];
  return [
    "BT",
    `${(color[0] / 255).toFixed(3)} ${(color[1] / 255).toFixed(3)} ${(color[2] / 255).toFixed(3)} rg`,
    `/${font} ${size} Tf`,
    `${x} ${y} Td`,
    `(${escapePdfText(text)}) Tj`,
    "ET",
  ].join("\n");
}

function pdfRect(x: number, y: number, width: number, height: number, color: [number, number, number]) {
  return [
    "q",
    `${(color[0] / 255).toFixed(3)} ${(color[1] / 255).toFixed(3)} ${(color[2] / 255).toFixed(3)} rg`,
    `${x} ${y} ${width} ${height} re`,
    "f",
    "Q",
  ].join("\n");
}

function pdfLine(x1: number, y1: number, x2: number, y2: number, color: [number, number, number]) {
  return [
    "q",
    `${(color[0] / 255).toFixed(3)} ${(color[1] / 255).toFixed(3)} ${(color[2] / 255).toFixed(3)} RG`,
    "0.75 w",
    `${x1} ${y1} m`,
    `${x2} ${y2} l`,
    "S",
    "Q",
  ].join("\n");
}

function buildPdf(filename: string, pageStreams: string[]) {
  const pageWidth = 612;
  const pageHeight = 792;
  const objects: string[] = ["<< /Type /Catalog /Pages 2 0 R >>"];
  const pageRefs: string[] = [];
  const fontRegularObject = 3 + pageStreams.length * 2;
  const fontBoldObject = fontRegularObject + 1;

  pageStreams.forEach((stream, index) => {
    const pageObj = 3 + index * 2;
    const contentObj = pageObj + 1;
    pageRefs.push(`${pageObj} 0 R`);
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontRegularObject} 0 R /F2 ${fontBoldObject} 0 R >> >> /Contents ${contentObj} 0 R >>`);
    objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  });

  objects.splice(1, 0, `<< /Type /Pages /Kids [${pageRefs.join(" ")}] /Count ${pageStreams.length} >>`);
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");

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
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadTranscriptPdf(data: TranscriptResponse) {
  const s = data.session;
  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 42;
  const contentWidth = pageWidth - margin * 2;
  const bubbleMaxWidth = 250;
  const advisorId = s.advisor?._id;
  const streams: string[] = [];
  let commands: string[] = [];
  let y = pageHeight - margin;

  const addPage = () => {
    if (commands.length) streams.push(commands.join("\n"));
    commands = [];
    y = pageHeight - margin;
  };

  const addHeader = () => {
    commands.push(pdfText("Prophetic Pathway", margin, y, { size: 16, font: "F2", color: [10, 122, 144] }));
    commands.push(pdfText("Chat Transcript", margin, y - 20, { size: 18, font: "F2" }));
    commands.push(pdfText(`Session ${s.sessionCode || s._id}`, margin, y - 38, { size: 10, color: [71, 85, 105] }));
    commands.push(pdfLine(margin, y - 54, pageWidth - margin, y - 54, [226, 232, 240]));
    y -= 78;

    commands.push(pdfRect(margin, y - 56, contentWidth, 56, [248, 250, 252]));
    commands.push(pdfText(`${s.user?.name || "Client"} -> ${s.advisor?.name || "Advisor"}`, margin + 14, y - 20, { size: 11, font: "F2" }));
    commands.push(pdfText(`${formatDate(s.endedAt || s.createdAt, true)} - ${data.messages.length} messages - ${s.status || "completed"}`, margin + 14, y - 38, { size: 9, color: [100, 116, 139] }));
    y -= 84;
  };

  const ensureSpace = (height: number) => {
    if (y - height < margin) {
      addPage();
      addHeader();
    }
  };

  addHeader();

  if (!data.messages.length) {
    commands.push(pdfText("No messages in this conversation.", margin, y, { size: 11, color: [100, 116, 139] }));
  }

  for (const message of data.messages) {
    const fromAdvisor = String(message.sender?._id) === String(advisorId);
    const sender = message.sender?.name || "User";
    const body = message.text || (message.attachments?.length ? "[attachment]" : "");
    const bodyLines = wrapText(body, 42);
    const metaLines = wrapText(`${sender} - ${formatDate(message.createdAt, true)}`, 40);
    const bubbleHeight = 18 + metaLines.length * 11 + bodyLines.length * 14 + 10;
    const bubbleWidth = bubbleMaxWidth;
    const x = fromAdvisor ? margin : pageWidth - margin - bubbleWidth;
    const bubbleColor: [number, number, number] = fromAdvisor ? [241, 245, 249] : [10, 122, 144];
    const metaColor: [number, number, number] = fromAdvisor ? [100, 116, 139] : [214, 240, 246];
    const textColor: [number, number, number] = fromAdvisor ? [15, 23, 42] : [255, 255, 255];

    ensureSpace(bubbleHeight + 16);
    commands.push(pdfRect(x, y - bubbleHeight, bubbleWidth, bubbleHeight, bubbleColor));
    let textY = y - 18;
    for (const line of metaLines) {
      commands.push(pdfText(line, x + 12, textY, { size: 8, font: "F2", color: metaColor }));
      textY -= 11;
    }
    textY -= 4;
    for (const line of bodyLines) {
      commands.push(pdfText(line, x + 12, textY, { size: 10, color: textColor }));
      textY -= 14;
    }
    y -= bubbleHeight + 16;
  }

  streams.push(commands.join("\n"));
  buildPdf(`transcript-${s.sessionCode || s._id}.pdf`, streams);
}

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
  const [playbackUrl, setPlaybackUrl] = useState("");
  const [playbackLoading, setPlaybackLoading] = useState(false);
  const [playbackError, setPlaybackError] = useState("");
  const [transcriptFor, setTranscriptFor] = useState<SessionItem | null>(null);

  const fetchRecordingBlob = useCallback(async (sessionId: string) => {
    const token = getAccessToken();
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/recording/download`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      let message = `Recording request failed (${res.status})`;
      try {
        const body = (await res.json()) as { message?: string };
        message = body.message || message;
      } catch {
        // keep default message
      }
      throw new ApiError(message, res.status, null);
    }
    return res.blob();
  }, []);

  const downloadRecording = useCallback(async (session: SessionItem) => {
    try {
      const blob = await fetchRecordingBlob(session._id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `session-recording-${session.sessionCode || session._id}.mp4`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to download recording");
    }
  }, [fetchRecordingBlob, toast]);

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

  useEffect(() => {
    if (!playing?.recordingUrl) {
      setPlaybackUrl("");
      setPlaybackError("");
      setPlaybackLoading(false);
      return;
    }

    let cancelled = false;
    let objectUrl = "";
    setPlaybackUrl("");
    setPlaybackError("");
    setPlaybackLoading(true);

    fetchRecordingBlob(playing._id)
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        if (!cancelled) setPlaybackUrl(objectUrl);
      })
      .catch((err) => {
        if (!cancelled) {
          setPlaybackError(err instanceof ApiError ? err.message : "Failed to load recording");
        }
      })
      .finally(() => {
        if (!cancelled) setPlaybackLoading(false);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [fetchRecordingBlob, playing]);

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

        <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white/50 p-3 shadow-sm sm:flex-row sm:items-center sm:flex-wrap">
          <Input
            placeholder="Search session, client, or advisor..."
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            className="sm:w-80 lg:w-96"
          />
          <Select
            value={type}
            onChange={(e) => {
              setType(e.target.value as TabValue);
              setPage(1);
            }}
            className="sm:w-52"
          >
            {TYPE_FILTERS.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </Select>
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
                                {s.recordingUrl ? (
                                  <button
                                    type="button"
                                    onClick={() => downloadRecording(s)}
                                    className="inline-flex items-center h-9 px-3 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50"
                                  >
                                    Download
                                  </button>
                                ) : s.recordingStatus === "failed" ? (
                                  <span
                                    title={s.recordingError || "Recording failed"}
                                    className="inline-flex items-center h-9 px-3 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-sm"
                                  >
                                    Failed
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center h-9 px-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 text-sm">
                                    Processing
                                  </span>
                                )}
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
            {playbackLoading ? (
              <div className="flex min-h-48 items-center justify-center rounded-lg bg-slate-950 text-sm text-white">
                Loading recording...
              </div>
            ) : playbackError ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                {playbackError}
              </div>
            ) : playbackUrl ? (
              /* eslint-disable-next-line jsx-a11y/media-has-caption */
              <video
                src={playbackUrl}
                controls
                autoPlay
                className="w-full rounded-lg bg-black max-h-[70vh]"
              />
            ) : null}
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>
                {playing.advisor?.name || "Advisor"} &amp;{" "}
                {playing.user?.name || "Client"} •{" "}
                {formatDuration(playing.actualDurationSec)}
              </span>
              {playbackUrl ? (
                <a
                  href={playbackUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#0a7a90] hover:underline"
                >
                  Open in new tab
                </a>
              ) : null}
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
    downloadTranscriptPdf(data);
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
                      className={`max-w-[85%] break-words rounded-2xl px-3 py-2 sm:max-w-[75%] sm:px-4 ${
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
