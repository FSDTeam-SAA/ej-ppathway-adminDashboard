"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../lib/api";
import { getSocket } from "../lib/socket";
import { BellIcon } from "./Icons";
import type { Notification } from "../lib/types";

function timeAgo(iso?: string): string {
  if (!iso) return "";
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "just now";
  const m = Math.floor(diff / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d < 7 ? `${d}d ago` : new Date(iso).toLocaleDateString();
}

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const openRef = useRef(open);
  openRef.current = open;

  const loadUnread = async () => {
    try {
      const r = await api.get<{ unread: number }>("/notifications/me", { unread: 1 });
      if (typeof r?.data?.unread === "number") setUnread(r.data.unread);
    } catch {
      /* ignore */
    }
  };

  const loadList = async () => {
    setLoading(true);
    try {
      const r = await api.get<{ items: Notification[] }>("/notifications", { limit: 20 });
      setItems(r.data?.items || []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  // Initial unread count + realtime push + a polling safety net (in case the
  // socket isn't available yet or drops).
  useEffect(() => {
    loadUnread();

    const socket = getSocket();
    const onNew = () => {
      loadUnread();
      if (openRef.current) loadList();
    };
    socket?.on("notification:new", onNew);

    const poll = window.setInterval(() => {
      loadUnread();
      if (openRef.current) loadList();
    }, 25000);

    return () => {
      socket?.off("notification:new", onNew);
      window.clearInterval(poll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) loadList();
  };

  const markRead = (n: Notification) => {
    if (n.read) return;
    setItems((prev) => prev.map((x) => (x._id === n._id ? { ...x, read: true } : x)));
    setUnread((u) => Math.max(0, u - 1));
    api.patch(`/notifications/${n._id}/read`, {}).catch(() => {});
  };

  const openNotification = (n: Notification) => {
    markRead(n);
    setOpen(false);
    const chatId = (n.data as { chatId?: string } | undefined)?.chatId;
    if (chatId) router.push(`/chats/${chatId}`);
    else if (n.type === "new_message") router.push("/chats");
  };

  const markAll = async () => {
    setItems((prev) => prev.map((x) => ({ ...x, read: true })));
    setUnread(0);
    try {
      await api.post("/notifications/read-all", {});
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={toggle}
        className="relative h-10 w-10 rounded-full bg-white border border-slate-200 inline-flex items-center justify-center text-slate-700 hover:bg-slate-50 transition-colors"
      >
        <BellIcon size={18} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold inline-flex items-center justify-center">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-100 bg-white shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div className="font-semibold text-slate-900">
              Notifications{unread > 0 && <span className="text-[#0a7a90]"> ({unread})</span>}
            </div>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAll}
                className="text-xs font-medium text-[#0a7a90] hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center text-sm text-slate-400">Loading…</div>
            ) : items.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">
                <BellIcon size={26} className="mx-auto mb-2 text-slate-300" />
                You&apos;re all caught up
              </div>
            ) : (
              items.map((n) => (
                <button
                  key={n._id}
                  type="button"
                  onClick={() => openNotification(n)}
                  className={`w-full text-left px-4 py-3 flex gap-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors ${
                    n.read ? "" : "bg-[#eaf6f9]/70"
                  }`}
                >
                  <span
                    className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${n.read ? "bg-transparent" : "bg-[#0a7a90]"}`}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-slate-900 truncate">{n.title}</span>
                    {n.body && (
                      <span className="block text-xs text-slate-600 line-clamp-2 mt-0.5">{n.body}</span>
                    )}
                    <span className="block text-[11px] text-slate-400 mt-1">{timeAgo(n.createdAt)}</span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
