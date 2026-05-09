"use client";

import { useEffect, useState } from "react";
import { Topbar } from "../../components/Topbar";
import { PageHeader } from "../../components/PageHeader";
import { Avatar } from "../../components/ui/Avatar";
import { Badge } from "../../components/ui/Badge";
import { Pagination } from "../../components/ui/Pagination";
import { ConfirmDialog } from "../../components/ui/Modal";
import { Spinner } from "../../components/Spinner";
import { EyeIcon, SuspendIcon, UsersIcon, DollarIcon, CrownIcon } from "../../components/Icons";
import { api, ApiError } from "../../lib/api";
import { useToast } from "../../lib/toast";
import { formatCompact, formatCurrency, formatDate } from "../../lib/format";
import type { UserListItem } from "../../lib/types";
import Link from "next/link";
import { MiniArea } from "../../components/charts";

type ListResponse = {
  data: UserListItem[];
  meta: { page: number; limit: number; total: number; totalPages?: number; pendingBookings?: number };
};

export default function UsersListPage() {
  const toast = useToast();
  const [items, setItems] = useState<UserListItem[]>([]);
  const [meta, setMeta] = useState<{ total: number; page: number; limit: number; pendingBookings: number }>({
    total: 0,
    page: 1,
    limit: 10,
    pendingBookings: 0,
  });
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [confirm, setConfirm] = useState<UserListItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const totalRevenue = items.reduce((s, u) => s + (u.payments || 0), 0);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get<UserListItem[]>("/admin/users", {
        page,
        limit,
        q: q || undefined,
      });
      const r = res as unknown as ListResponse;
      setItems(r.data || []);
      setMeta({
        total: r.meta?.total || 0,
        page: r.meta?.page || page,
        limit: r.meta?.limit || limit,
        pendingBookings: r.meta?.pendingBookings || 0,
      });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to load users";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, q]);

  const handleSuspend = async () => {
    if (!confirm) return;
    setActionLoading(true);
    try {
      const isSuspended = confirm.status === "suspended";
      const path = `/admin/users/${confirm._id}/${isSuspended ? "unsuspend" : "suspend"}`;
      await api.post(path, {});
      toast.success(isSuspended ? "User unsuspended" : "User suspended");
      setConfirm(null);
      load();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Action failed";
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <Topbar onSearch={(v) => { setPage(1); setQ(v); }} />
      <main className="px-6 md:px-8 pb-10">
        <PageHeader
          title="Users Management"
          breadcrumb={[
            { label: "Dashboard", href: "/" },
            { label: "Users Management" },
          ]}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <SummaryCard
            label="Total Users"
            value={formatCompact(meta.total)}
            icon={<UsersIcon />}
            iconBg="bg-purple-100 text-purple-600"
            color="#a78bfa"
          />
          <SummaryCard
            label="Pending booking Session"
            value={formatCompact(meta.pendingBookings)}
            icon={<CrownIcon />}
            iconBg="bg-sky-100 text-sky-600"
            color="#60a5fa"
          />
          <SummaryCard
            label="Total Revenue"
            value={formatCurrency(totalRevenue)}
            icon={<DollarIcon />}
            iconBg="bg-rose-100 text-rose-600"
            color="#fb7185"
          />
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 flex justify-center text-[#0a7a90]">
              <Spinner size={32} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-slate-500">
                  <tr className="border-b border-slate-100">
                    <th className="px-5 py-4 font-medium">User Name</th>
                    <th className="px-5 py-4 font-medium">User Mail</th>
                    <th className="px-5 py-4 font-medium">Joined</th>
                    <th className="px-5 py-4 font-medium">Sessions</th>
                    <th className="px-5 py-4 font-medium">Payments</th>
                    <th className="px-5 py-4 font-medium">Plan</th>
                    <th className="px-5 py-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-500">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    items.map((u) => (
                      <tr key={u._id} className="border-b border-slate-50 last:border-0">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar src={u.profilePhoto} name={u.name} size={32} />
                            <span className="font-medium text-slate-900">{u.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-slate-600">{u.email}</td>
                        <td className="px-5 py-3 text-slate-600">{formatDate(u.createdAt)}</td>
                        <td className="px-5 py-3 text-slate-700">{u.sessionsCount || 0}</td>
                        <td className="px-5 py-3 text-slate-700">{formatCurrency(u.payments)}</td>
                        <td className="px-5 py-3">
                          <PlanBadge plan={u.activeSubscription?.planName} />
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="inline-flex items-center gap-2">
                            <Link
                              href={`/users/${u._id}`}
                              className="inline-flex items-center gap-1.5 text-[#0a7a90] hover:underline text-sm"
                            >
                              <EyeIcon size={16} />
                              <span className="font-medium">View Details</span>
                            </Link>
                            <button
                              type="button"
                              onClick={() => setConfirm(u)}
                              aria-label="Suspend"
                              className="h-9 w-9 rounded-full border border-red-200 text-red-500 inline-flex items-center justify-center hover:bg-red-50"
                            >
                              <SuspendIcon size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
          <div className="px-5 py-3">
            <Pagination
              page={meta.page}
              limit={meta.limit}
              total={meta.total}
              onPage={setPage}
              onLimit={(l) => {
                setLimit(l);
                setPage(1);
              }}
            />
          </div>
        </div>

        <ConfirmDialog
          open={!!confirm}
          onClose={() => setConfirm(null)}
          onConfirm={handleSuspend}
          title="Are you sure?"
          description={
            confirm?.status === "suspended"
              ? "Re-activate this user account?"
              : "You want to Suspend this User if you Suspend this User they can't use this account."
          }
          confirmText={confirm?.status === "suspended" ? "Unsuspend" : "Suspend"}
          danger={confirm?.status !== "suspended"}
          loading={actionLoading}
        />
      </main>
    </>
  );
}

function PlanBadge({ plan }: { plan?: string }) {
  if (!plan) return <Badge tone="free">Free</Badge>;
  const p = plan.toLowerCase();
  if (p.includes("premium")) return <Badge tone="premium">Premium</Badge>;
  if (p.includes("basic")) return <Badge tone="basic">Basic</Badge>;
  if (p.includes("free")) return <Badge tone="free">Free</Badge>;
  return <Badge>{plan}</Badge>;
}

function SummaryCard({
  label,
  value,
  icon,
  iconBg,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative overflow-hidden">
      <div className={`h-12 w-12 rounded-xl inline-flex items-center justify-center ${iconBg}`}>
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
