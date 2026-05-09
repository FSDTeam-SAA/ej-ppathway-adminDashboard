"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Topbar } from "../../components/Topbar";
import { PageHeader } from "../../components/PageHeader";
import { Avatar } from "../../components/ui/Avatar";
import { Spinner } from "../../components/Spinner";
import { api, ApiError } from "../../lib/api";
import { useToast } from "../../lib/toast";
import { formatRelative } from "../../lib/format";
import { useAuth } from "../../lib/auth-context";
import type { ChatItem } from "../../lib/types";

export default function ChatsPage() {
  const toast = useToast();
  const { user } = useAuth();
  const [items, setItems] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get<ChatItem[]>("/chats/admin", { q: q || undefined });
      setItems(r.data || []);
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
  }, [q]);

  return (
    <>
      <Topbar
        searchPlaceholder="Search Chats by name ..."
        onSearch={(v) => setQ(v)}
      />
      <main className="px-6 md:px-8 pb-10">
        <PageHeader
          title="Chats"
          breadcrumb={[
            { label: "Dashboard", href: "/" },
            { label: "Chats" },
          ]}
        />

        {loading ? (
          <div className="py-20 flex justify-center text-[#0a7a90]">
            <Spinner size={32} />
          </div>
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
