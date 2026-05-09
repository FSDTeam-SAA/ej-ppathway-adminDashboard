"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Topbar } from "../../components/Topbar";
import { PageHeader } from "../../components/PageHeader";
import { Tabs } from "../../components/ui/Tabs";
import { Avatar } from "../../components/ui/Avatar";
import { Badge, StatusBadge } from "../../components/ui/Badge";
import { Pagination } from "../../components/ui/Pagination";
import { Spinner } from "../../components/Spinner";
import { Modal, ConfirmDialog } from "../../components/ui/Modal";
import { Input, Textarea } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { EyeIcon, PlusIcon, StarIcon, SuspendIcon } from "../../components/Icons";
import { api, ApiError } from "../../lib/api";
import { useToast } from "../../lib/toast";
import { formatCurrency } from "../../lib/format";
import type { AdvisorListItem } from "../../lib/types";

const TABS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
];

export default function AdvisorsPage() {
  const toast = useToast();
  const [items, setItems] = useState<AdvisorListItem[]>([]);
  const [tab, setTab] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [confirm, setConfirm] = useState<AdvisorListItem | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [addOpen, setAddOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get<AdvisorListItem[]>("/admin/advisors", {
        page,
        limit,
        status: tab === "all" ? undefined : tab,
      });
      setItems(r.data || []);
      setTotal(r.meta?.total || 0);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to load advisors";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, page, limit]);

  const handleSuspend = async () => {
    if (!confirm) return;
    setConfirmLoading(true);
    try {
      const isSuspended = confirm.user.status === "suspended";
      const path = `/admin/advisors/${confirm.user._id}/${isSuspended ? "unsuspend" : "suspend"}`;
      await api.post(path, {});
      toast.success(isSuspended ? "Advisor reactivated" : "Advisor suspended");
      setConfirm(null);
      load();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Action failed";
      toast.error(msg);
    } finally {
      setConfirmLoading(false);
    }
  };

  return (
    <>
      <Topbar />
      <main className="px-6 md:px-8 pb-10">
        <PageHeader
          title="Advisors Management"
          breadcrumb={[
            { label: "Dashboard", href: "/" },
            { label: "Advisors Management" },
          ]}
          action={
            <Button onClick={() => setAddOpen(true)}>
              <PlusIcon size={16} /> Add Advisor Manually
            </Button>
          }
        />

        <div className="mb-6">
          <Tabs tabs={TABS} active={tab} onChange={(v) => { setTab(v); setPage(1); }} />
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 flex justify-center text-[#0a7a90]">
              <Spinner size={32} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-slate-500 uppercase text-xs tracking-wide">
                  <tr className="border-b border-slate-100">
                    <th className="px-5 py-4 font-semibold">Advisor</th>
                    <th className="px-5 py-4 font-semibold">Ratings</th>
                    <th className="px-5 py-4 font-semibold">Price</th>
                    <th className="px-5 py-4 font-semibold">Sessions</th>
                    <th className="px-5 py-4 font-semibold">Tier</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                    <th className="px-5 py-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-500">
                        No advisors
                      </td>
                    </tr>
                  ) : (
                    items.map((it) => {
                      const rating = it.profile?.avgRating;
                      const price = it.profile?.pricing?.video || it.profile?.pricing?.call || it.profile?.pricing?.chat;
                      const sessions = it.profile?.totalSessions || 0;
                      const tier = it.profile?.tier || "bronze";
                      return (
                        <tr key={it.user._id} className="border-b border-slate-50 last:border-0">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <Avatar src={it.user.profilePhoto} name={it.user.name} size={32} />
                              <span className="font-medium text-slate-900">{it.user.name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-slate-700">
                            <span className="inline-flex items-center gap-1.5">
                              <StarIcon size={16} filled />
                              {rating ? rating.toFixed(1) : "0.0"}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-slate-700">
                            {price ? `${formatCurrency(price)}/min` : "—"}
                          </td>
                          <td className="px-5 py-3 text-slate-700">{sessions}</td>
                          <td className="px-5 py-3">
                            <Badge tone={tier as "bronze" | "silver" | "gold"}>
                              {tier === "gold" ? "🏅 Gold" : tier === "silver" ? "🥈 Silver" : "🥉 Bronze"}
                            </Badge>
                          </td>
                          <td className="px-5 py-3">
                            <StatusBadge status={it.user.status} />
                          </td>
                          <td className="px-5 py-3 text-right">
                            <div className="inline-flex items-center gap-2">
                              <Link
                                href={`/advisors/${it.user._id}`}
                                className="inline-flex items-center gap-1.5 text-[#0a7a90] hover:underline text-sm font-medium"
                              >
                                <EyeIcon size={16} />
                                View Details
                              </Link>
                              <button
                                type="button"
                                onClick={() => setConfirm(it)}
                                aria-label="Suspend"
                                className="h-9 w-9 rounded-full border border-red-200 text-red-500 inline-flex items-center justify-center hover:bg-red-50"
                              >
                                <SuspendIcon size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
          <div className="px-5 py-3">
            <Pagination
              page={page}
              limit={limit}
              total={total}
              onPage={setPage}
              onLimit={(l) => { setLimit(l); setPage(1); }}
            />
          </div>
        </div>

        <ConfirmDialog
          open={!!confirm}
          onClose={() => setConfirm(null)}
          onConfirm={handleSuspend}
          title="Are you sure?"
          description={
            confirm?.user.status === "suspended"
              ? "Re-activate this advisor?"
              : "You want to Suspend this advisor from your application he can't use this account if you suspended this user."
          }
          confirmText={confirm?.user.status === "suspended" ? "Unsuspend" : "Suspend"}
          danger={confirm?.user.status !== "suspended"}
          loading={confirmLoading}
        />

        <AddAdvisorModal
          open={addOpen}
          onClose={() => setAddOpen(false)}
          onCreated={() => {
            setAddOpen(false);
            load();
          }}
        />
      </main>
    </>
  );
}

function AddAdvisorModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    location: "",
    language: "",
    password: "",
    experience: "",
    type: "",
    style: "",
    bio: "",
  });
  const [loading, setLoading] = useState(false);

  const onChange = (k: keyof typeof form, v: string) =>
    setForm((s) => ({ ...s, [k]: v }));

  const submit = async () => {
    if (!form.name || !form.email || !form.password) {
      toast.error("Name, email and password required");
      return;
    }
    setLoading(true);
    try {
      await api.post("/admin/advisors", form);
      toast.success("Advisor created");
      onCreated();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add an Advisor Manually" size="lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Enter Email"
          type="email"
          value={form.email}
          onChange={(e) => onChange("email", e.target.value)}
          placeholder="Type your email..."
        />
        <Input
          label="Enter Phone Number"
          value={form.phoneNumber}
          onChange={(e) => onChange("phoneNumber", e.target.value)}
          placeholder="Type your phone number..."
        />
        <Input
          label="Enter Name"
          value={form.name}
          onChange={(e) => onChange("name", e.target.value)}
          placeholder="Type your name..."
        />
        <Input
          label="Enter Location"
          value={form.location}
          onChange={(e) => onChange("location", e.target.value)}
          placeholder="Type your location..."
        />
        <Input
          label="Choose Language"
          value={form.language}
          onChange={(e) => onChange("language", e.target.value)}
          placeholder="e.g. English, Spanish"
        />
        <Input
          label="Enter an 8 digit password"
          type="text"
          value={form.password}
          onChange={(e) => onChange("password", e.target.value)}
          placeholder="e.g. 12345678"
        />
        <Input
          label="Enter Experience"
          value={form.experience}
          onChange={(e) => onChange("experience", e.target.value)}
          placeholder="e.g. 5 years"
        />
        <Input
          label="Choose Type"
          value={form.type}
          onChange={(e) => onChange("type", e.target.value)}
          placeholder="e.g. Love & Relationship"
        />
        <Input
          label="Choose Style"
          value={form.style}
          onChange={(e) => onChange("style", e.target.value)}
          placeholder="e.g. Compassionate"
        />
      </div>
      <div className="mt-4">
        <Textarea
          label="Enter Bio"
          value={form.bio}
          onChange={(e) => onChange("bio", e.target.value)}
          placeholder="Type your description..."
        />
      </div>
      <div className="grid grid-cols-2 gap-3 mt-5">
        <Button variant="outline" onClick={onClose}>
          Not Now
        </Button>
        <Button onClick={submit} loading={loading}>
          Add advisor manually
        </Button>
      </div>
    </Modal>
  );
}
