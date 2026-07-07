"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

type SupportChatRole = "advisor" | "user";

export function SupportChatList({
  role,
  title,
  breadcrumb,
}: {
  role?: SupportChatRole;
  title: string;
  breadcrumb: string;
}) {
  const toast = useToast();
  const { user } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const qRef = useRef(q);
  qRef.current = q;

  const load = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const r = await api.get<ChatItem[]>("/chats/admin", {
        q: qRef.current || undefined,
        role,
      });
      setItems(r.data || []);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed";
      if (showSpinner) toast.error(msg);
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, [role, toast]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, role]);

  useEffect(() => {
    const target = new URLSearchParams(window.location.search).get("user");
    if (!target) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await api.post<{ _id: string }>(`/chats/admin/with/${target}`);
        if (!cancelled && r.data?._id) router.replace(`/chats/${r.data._id}`);
      } catch (err) {
        if (!cancelled) {
          toast.error(err instanceof ApiError ? err.message : "Could not open conversation");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) {
      const t = setInterval(() => load(false), 4000);
      return () => clearInterval(t);
    }
    const refresh = () => load(false);
    socket.on("chat:updated", refresh);
    socket.on("chat:new_message", refresh);
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
        searchPlaceholder={`Search ${title.toLowerCase()} by name ...`}
        onSearch={(v) => setQ(v)}
      />
      <main className="px-6 md:px-8 pb-10">
        <PageHeader
          title={title}
          breadcrumb={[
            { label: "Dashboard", href: "/" },
            { label: breadcrumb },
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
                c.participants.find((p) => role && p.role === role) ||
                c.participants.find((p) => p.role !== "admin" && p.role !== "sub_admin") ||
                c.participants.find((p) => p._id !== user?._id) ||
                c.participants[0];
              const unread = c.unreadCounts?.[user?._id || ""] || 0;
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
