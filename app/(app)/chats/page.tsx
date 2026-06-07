"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Topbar } from "../../components/Topbar";
import { PageHeader } from "../../components/PageHeader";
import { Avatar } from "../../components/ui/Avatar";
import { ListSkeleton } from "../../components/Skeleton";
import { api, ApiError } from "../../lib/api";
import { useToast } from "../../lib/toast";
import { formatRelative } from "../../lib/format";
import { useAuth } from "../../lib/auth-context";
import { getSocket } from "../../lib/socket";
import type { ChatItem } from "../../lib/types";

export default function ChatsPage() {
  const toast = useToast();
  const { user } = useAuth();
  const [items, setItems] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  // Keep the latest query in a ref so realtime/poll refetches use it without
  // re-subscribing the socket every keystroke.
  const qRef = useRef(q);
  qRef.current = q;

  const load = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const r = await api.get<ChatItem[]>("/chats/admin", {
        q: qRef.current || undefined,
      });
      setItems(r.data || []);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed";
      if (showSpinner) toast.error(msg);
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  // Realtime: refresh list ordering/unread badges when any conversation gets a
  // new message. Falls back to polling every 4s if the socket can't connect.
  useEffect(() => {
    const socket = getSocket();
    if (!socket) {
      const t = setInterval(() => load(false), 4000);
      return () => clearInterval(t);
    }
    const refresh = () => load(false);
    socket.on("chat:updated", refresh);
    socket.on("chat:new_message", refresh);
    // Safety-net poll in case the socket silently drops.
    const t = setInterval(() => load(false), 4000);
    return () => {
      socket.off("chat:updated", refresh);
      socket.off("chat:new_message", refresh);
      clearInterval(t);
    };
  }, [load]);

  return (
    <>
      <Topbar
        searchPlaceholder="Search support chats by name ..."
        onSearch={(v) => setQ(v)}
      />
      <main className="px-6 md:px-8 pb-10">
        <PageHeader
          title="Support Chat"
          breadcrumb={[
            { label: "Dashboard", href: "/" },
            { label: "Support Chat" },
          ]}
        />

        {loading ? (
          <ListSkeleton count={6} />
        ) : items.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center text-slate-500">
            No conversations yet
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((c) => {
              const other =
                c.participants.find((p) => p._id !== user?._id) || c.participants[0];
              const unread = (c.unreadCounts?.[user?._id || ""] || 0);
              return (
                <Link
                  key={c._id}
                  href={`/chats/${c._id}`}
                  className="bg-white rounded-2xl border border-slate-100 px-5 py-4 flex items-center gap-4 hover:bg-slate-50"
                >
                  <Avatar src={other?.profilePhoto} name={other?.name} size={44} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900 truncate">
                      {other?.name || "Unknown"}
                    </div>
                    <div className="text-sm text-slate-500 truncate">
                      {c.lastMessage || "No messages yet"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500">
                      {c.lastMessageAt ? formatRelative(c.lastMessageAt) : ""}
                    </div>
                    {unread > 0 && (
                      <span className="inline-block mt-1 h-5 min-w-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold leading-5 text-center">
                        {unread > 99 ? "99+" : String(unread).padStart(2, "0")}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
