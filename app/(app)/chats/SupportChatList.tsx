"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Topbar } from "../../components/Topbar";
import { PageHeader } from "../../components/PageHeader";
import { Avatar } from "../../components/ui/Avatar";
import { ConfirmDialog } from "../../components/ui/Modal";
import { Input, Select } from "../../components/ui/Input";
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
  const [selected, setSelected] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<ChatItem | null>(null);
  const [bulkConfirm, setBulkConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const qRef = useRef(q);
  qRef.current = q;

  const load = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const r = await api.get<ChatItem[]>("/chats/admin", {
        q: qRef.current || undefined,
        role,
      });
      const nextItems = r.data || [];
      setItems(nextItems);
      const nextIds = new Set(nextItems.map((item) => item._id));
      setSelected((current) => current.filter((id) => nextIds.has(id)));
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

  const toggle = (id: string) => {
    setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  };
  const visibleIds = items.map((item) => item._id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.includes(id));
  const toggleAllVisible = () => {
    setSelected((current) => {
      const currentSet = new Set(current);
      if (allVisibleSelected) {
        visibleIds.forEach((id) => currentSet.delete(id));
      } else {
        visibleIds.forEach((id) => currentSet.add(id));
      }
      return Array.from(currentSet);
    });
  };

  const deleteOne = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/chats/admin/${deleteTarget._id}`);
      toast.success("Conversation deleted");
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const deleteBulk = async () => {
    if (!selected.length) return;
    setDeleting(true);
    try {
      await api.delete("/chats/admin/bulk", { body: { ids: selected } });
      toast.success(`Deleted ${selected.length} conversation${selected.length === 1 ? "" : "s"}`);
      setBulkConfirm(false);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Bulk delete failed");
    } finally {
      setDeleting(false);
    }
  };

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

        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
          <Input
            placeholder={`Search ${title.toLowerCase()} by name...`}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <Select value={role || ""} disabled>
            <option value="">All Support</option>
            <option value="advisor">Advisor Support</option>
            <option value="user">User Support</option>
          </Select>
        </div>

        <div className="mb-4 flex min-h-16 items-center justify-between rounded-2xl bg-white px-5 py-3 shadow-sm">
          <div className="flex items-center gap-4">
            <input
              type="checkbox"
              checked={allVisibleSelected}
              onChange={toggleAllVisible}
              disabled={items.length === 0}
              aria-label={allVisibleSelected ? "Deselect all conversations" : "Select all conversations"}
              className="h-4 w-4 rounded border-slate-300 accent-[#0a7a90] disabled:opacity-40"
            />
            {selected.length > 0 ? (
              <>
                <span className="font-semibold text-slate-800">
                  {selected.length} Selected
                </span>
                <button
                  type="button"
                  onClick={() => setSelected([])}
                  className="text-sm font-semibold text-[#0a7a90] hover:underline"
                >
                  Deselect all
                </button>
              </>
            ) : (
              <span className="text-sm font-semibold text-slate-600">
                Select all
              </span>
            )}
          </div>

          {selected.length > 0 ? (
            <button
              type="button"
              onClick={() => setBulkConfirm(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-600 hover:bg-red-100"
              aria-label={`Delete ${selected.length} selected conversations`}
              title="Bulk delete"
            >
              <Trash2 size={18} />
            </button>
          ) : null}
        </div>

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
                <div
                  key={c._id}
                  className="bg-white rounded-2xl border border-slate-100 px-5 py-4 flex items-center gap-4 hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(c._id)}
                    onChange={() => toggle(c._id)}
                    aria-label={`Select ${other?.name || "conversation"}`}
                    className="h-4 w-4 rounded border-slate-300 text-[#0a7a90] focus:ring-[#0a7a90]"
                  />
                  <Avatar src={other?.profilePhoto} name={other?.name} size={44} />
                  <Link href={`/chats/${c._id}`} className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900 truncate">
                      {other?.name || "Unknown"}
                    </div>
                    <div className="text-sm text-slate-500 truncate">
                      {c.lastMessage || "No messages yet"}
                    </div>
                  </Link>
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
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(c)}
                    className="h-9 rounded-lg border border-red-200 px-3 text-sm font-semibold text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={deleteOne}
        title="Delete conversation?"
        description="This deletes the support conversation and all messages in it."
        confirmText="Delete"
        danger
        loading={deleting}
      />
      <ConfirmDialog
        open={bulkConfirm}
        onClose={() => setBulkConfirm(false)}
        onConfirm={deleteBulk}
        title={`Delete ${selected.length} conversation${selected.length === 1 ? "" : "s"}?`}
        description="This deletes the selected support conversations and their messages."
        confirmText="Delete"
        danger
        loading={deleting}
      />
    </>
  );
}
