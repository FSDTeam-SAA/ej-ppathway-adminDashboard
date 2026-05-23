"use client";

import { useEffect, useRef, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Topbar } from "../../../components/Topbar";
import { Avatar } from "../../../components/ui/Avatar";
import { Skeleton } from "../../../components/Skeleton";
import { api, ApiError } from "../../../lib/api";
import { useToast } from "../../../lib/toast";
import { useAuth } from "../../../lib/auth-context";
import { ChevronLeftIcon, PaperclipIcon, SendIcon } from "../../../components/Icons";
import type { ChatItem, ChatMessage } from "../../../lib/types";

export default function ChatDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();

  const [chat, setChat] = useState<ChatItem | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [c, m] = await Promise.all([
        api.get<ChatItem>(`/chats/${id}`),
        api.get<ChatMessage[]>(`/chats/${id}/messages`, { limit: 50 }),
      ]);
      setChat(c.data || null);
      setMessages(m.data || []);
      // Mark read
      api.post(`/chats/${id}/read`, {}).catch(() => {});
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
  }, [id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!text.trim() && !files.length) return;
    setSending(true);
    try {
      const fd = new FormData();
      if (text.trim()) fd.append("text", text.trim());
      files.forEach((f) => fd.append("attachments", f));
      const r = await api.post<ChatMessage>(`/chats/${id}/messages`, fd, {
        isFormData: true,
      });
      if (r.data) setMessages((m) => [...m, r.data!]);
      setText("");
      setFiles([]);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed";
      toast.error(msg);
    } finally {
      setSending(false);
    }
  };

  const other =
    chat?.participants.find((p) => p._id !== user?._id) || chat?.participants[0];

  return (
    <>
      <Topbar />
      <main className="px-6 md:px-8 pb-10">
        <div className="bg-[#0a7a90] text-white rounded-t-2xl px-5 py-4 flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="h-10 w-10 rounded-full bg-white/10 inline-flex items-center justify-center"
            aria-label="Back"
          >
            <ChevronLeftIcon />
          </button>
          <Avatar src={other?.profilePhoto} name={other?.name} size={48} />
          <div>
            <div className="font-semibold text-lg">{other?.name || "Conversation"}</div>
            <div className="text-xs opacity-80">{other?.role}</div>
          </div>
        </div>

        <div className="bg-white rounded-b-2xl border border-slate-100 shadow-sm flex flex-col h-[calc(100vh-220px)]">
          {loading ? (
            <div className="flex-1 p-5 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}
                >
                  <Skeleton
                    className={`h-12 rounded-2xl ${i % 2 === 0 ? "w-1/2" : "w-1/3"}`}
                  />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center text-slate-500 py-8">
                    No messages yet
                  </div>
                ) : (
                  messages.map((m) => {
                    const senderId =
                      typeof m.sender === "string" ? m.sender : m.sender?._id;
                    const isMe = senderId === user?._id;
                    const senderObj = typeof m.sender === "object" ? m.sender : null;
                    return (
                      <div
                        key={m._id}
                        className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                      >
                        <div className={`flex items-end gap-2 max-w-[70%] ${isMe ? "flex-row-reverse" : ""}`}>
                          {!isMe && (
                            <Avatar
                              src={senderObj?.profilePhoto}
                              name={senderObj?.name}
                              size={28}
                            />
                          )}
                          <div
                            className={`rounded-2xl px-4 py-3 ${
                              isMe ? "bg-[#0a7a90] text-white" : "bg-slate-100 text-slate-900"
                            }`}
                          >
                            {m.text && <div className="text-sm">{m.text}</div>}
                            {m.attachments && m.attachments.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {m.attachments.map((a, i) => (
                                  <a
                                    key={i}
                                    href={a}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`block text-xs ${isMe ? "text-white" : "text-[#0a7a90]"} underline`}
                                  >
                                    Attachment {i + 1}
                                  </a>
                                ))}
                              </div>
                            )}
                            <div className={`text-[10px] mt-1 ${isMe ? "text-white/80" : "text-slate-500"}`}>
                              {new Date(m.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={endRef} />
              </div>
              <form onSubmit={send} className="border-t border-slate-100 p-3 flex items-center gap-2">
                <label className="h-10 w-10 rounded-full bg-slate-100 inline-flex items-center justify-center cursor-pointer">
                  <PaperclipIcon size={18} className="text-slate-600" />
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) =>
                      setFiles(Array.from(e.target.files || []).slice(0, 5))
                    }
                  />
                </label>
                {files.length > 0 && (
                  <span className="text-xs text-slate-500">{files.length} file(s)</span>
                )}
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type a message"
                  className="flex-1 h-10 px-4 rounded-full bg-slate-100 border border-transparent focus:border-[#0a7a90] focus:bg-white"
                />
                <button
                  type="submit"
                  disabled={sending}
                  className="h-10 w-10 rounded-full bg-[#0a7a90] text-white inline-flex items-center justify-center disabled:opacity-50"
                  aria-label="Send"
                >
                  <SendIcon size={18} />
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    </>
  );
}
