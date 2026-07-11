"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Topbar } from "../../components/Topbar";
import { PageHeader } from "../../components/PageHeader";
import { Tabs } from "../../components/ui/Tabs";
import { Avatar } from "../../components/ui/Avatar";
import { Badge, StatusBadge } from "../../components/ui/Badge";
import { Pagination } from "../../components/ui/Pagination";
import { TableSkeleton } from "../../components/Skeleton";
import { Modal, ConfirmDialog } from "../../components/ui/Modal";
import { Input, Select, Textarea } from "../../components/ui/Input";
import { Combobox } from "../../components/ui/Combobox";
import { Button } from "../../components/ui/Button";
import { EyeIcon, PlusIcon, StarIcon, SuspendIcon } from "../../components/Icons";
import { BulkActionsBar, BulkCheckbox } from "../../components/BulkActionsBar";
import { useBulkSelection } from "../../lib/use-bulk-selection";
import { api, ApiError } from "../../lib/api";
import { useToast } from "../../lib/toast";
import { useCountries, useCities } from "../../lib/countries";
import {
  ADVISOR_EXPERTISE_OPTIONS,
  ADVISOR_STYLE_OPTIONS,
  TIER_OPTIONS,
  getTimezoneOptions,
} from "../../lib/advisor-options";
import type { AdvisorListItem } from "../../lib/types";

const TABS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "deactivated", label: "Deactivated" },
  { value: "online", label: "Online" },
  { value: "available_now", label: "Available Now" },
];

export default function AdvisorsPage() {
  const toast = useToast();
  const [items, setItems] = useState<AdvisorListItem[]>([]);
  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");
  const [tierFilter, setTierFilter] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [confirm, setConfirm] = useState<AdvisorListItem | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [bulkConfirm, setBulkConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [addOpen, setAddOpen] = useState(false);

  const bulk = useBulkSelection(items.map((it) => it.user));

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get<AdvisorListItem[]>("/admin/advisors", {
        page,
        limit,
        status: tab === "all" ? undefined : tab,
        q: q || undefined,
        tier: tierFilter || undefined,
      });
      setItems(r.data || []);
      setTotal(r.meta?.total || 0);
      bulk.clear();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to load advisors";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (bulk.selectedCount === 0) return;
    setActionLoading(true);
    const ids = bulk.selectedArray;
    const results = await Promise.allSettled(
      ids.map((id) => api.delete(`/admin/advisors/${id}`))
    );
    setActionLoading(false);
    const failed = results.filter((r) => r.status === "rejected").length;
    const ok = results.length - failed;
    if (ok > 0) toast.success(`Deleted ${ok} advisor${ok === 1 ? "" : "s"}`);
    if (failed > 0)
      toast.error(`${failed} delete${failed === 1 ? "" : "s"} failed`);
    setBulkConfirm(false);
    load();
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, page, limit, q, tierFilter]);

  const handleSuspend = async () => {
    if (!confirm) return;
    setConfirmLoading(true);
    try {
      const isDeactivated = confirm.user.status === "deactivated" || confirm.user.status === "suspended";
      const path = `/admin/advisors/${confirm.user._id}/${isDeactivated ? "unsuspend" : "suspend"}`;
      await api.patch(path, {});
      toast.success(isDeactivated ? "Advisor reactivated" : "Advisor deactivated");
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
      <Topbar
        searchPlaceholder="Search advisors by name or email ..."
        onSearch={(value) => {
          setPage(1);
          setQ(value);
        }}
      />
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

        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
          <Input
            placeholder="Search name or email..."
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
          <Select
            value={tab}
            onChange={(e) => {
              setTab(e.target.value);
              setPage(1);
            }}
          >
            {TABS.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </Select>
          <Select
            value={tierFilter}
            onChange={(e) => {
              setTierFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Tiers</option>
            <option value="silver">Silver</option>
            <option value="gold">Gold</option>
            <option value="platinum">Platinum</option>
          </Select>
        </div>

        <BulkActionsBar
          selectedCount={bulk.selectedCount}
          onClear={bulk.clear}
          onDelete={() => setBulkConfirm(true)}
        />

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {loading ? (
            <TableSkeleton rows={8} cols={8} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-slate-500 uppercase text-xs tracking-wide">
                  <tr className="border-b border-slate-100">
                    <th className="pl-5 pr-2 py-4 font-semibold w-10">
                      <BulkCheckbox
                        ariaLabel="Select all on this page"
                        checked={bulk.allSelected}
                        indeterminate={bulk.someSelected}
                        onChange={bulk.toggleAll}
                      />
                    </th>
                    <th className="px-5 py-4 font-semibold">Advisor</th>
                    <th className="px-5 py-4 font-semibold">Ratings</th>
                    <th className="px-5 py-4 font-semibold">Credit Rate</th>
                    <th className="px-5 py-4 font-semibold">Sessions</th>
                    <th className="px-5 py-4 font-semibold">Tier</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                    <th className="px-5 py-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-10 text-slate-500">
                        No advisors
                      </td>
                    </tr>
                  ) : (
                    items.map((it) => {
                      const rating = it.profile?.avgRating;
                      const price = it.profile?.pricing?.videoPerMin || it.profile?.pricing?.callPerMin || it.profile?.pricing?.chatPerMin;
                      const sessions = it.profile?.totalSessions || 0;
                      const tier = ["silver", "gold", "platinum"].includes(it.profile?.tier ?? "") ? (it.profile!.tier as string) : "silver";
                      const selected = bulk.isSelected(it.user._id);
                      return (
                        <tr
                          key={it.user._id}
                          className={`border-b border-slate-50 last:border-0 ${
                            selected ? "bg-amber-50/60" : ""
                          }`}
                        >
                          <td className="pl-5 pr-2 py-3 w-10">
                            <BulkCheckbox
                              ariaLabel={`Select ${it.user.name}`}
                              checked={selected}
                              onChange={() => bulk.toggle(it.user._id)}
                            />
                          </td>
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
                            {price ? `${Number(price).toFixed(2)} credits/min` : "N/A"}
                          </td>
                          <td className="px-5 py-3 text-slate-700">{sessions}</td>
                          <td className="px-5 py-3">
                            <Badge tone={tier as "silver" | "gold" | "platinum"}>
                              {tier === "platinum" ? "Platinum" : tier === "gold" ? "Gold" : "Silver"}
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
                                aria-label="Deactivate"
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
            confirm?.user.status === "deactivated" || confirm?.user.status === "suspended"
              ? "Re-activate this advisor?"
              : "Deactivate this advisor account. They will lose access until you reactivate them."
          }
          confirmText={confirm?.user.status === "deactivated" || confirm?.user.status === "suspended" ? "Reactivate" : "Deactivate"}
          danger={confirm?.user.status !== "deactivated" && confirm?.user.status !== "suspended"}
          loading={confirmLoading}
        />

        <ConfirmDialog
          open={bulkConfirm}
          onClose={() => setBulkConfirm(false)}
          onConfirm={handleBulkDelete}
          title={`Delete ${bulk.selectedCount} advisor${
            bulk.selectedCount === 1 ? "" : "s"
          }?`}
          description="This permanently removes the selected advisor accounts from the system. This cannot be undone."
          confirmText="Delete"
          danger
          loading={actionLoading}
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

function CopyField({ label, value }: { label: string; value: string }) {
  const toast = useToast();
  const copy = () => {
    navigator.clipboard.writeText(value).then(() => toast.success(`${label} copied`));
  };
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div>
        <p className="text-xs text-slate-500 mb-0.5">{label}</p>
        <p className="text-sm font-medium text-slate-900 break-all">{value}</p>
      </div>
      <button
        type="button"
        onClick={copy}
        className="shrink-0 text-xs font-medium text-[#0a7a90] hover:underline"
      >
        Copy
      </button>
    </div>
  );
}

function MultiSelectField({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
}) {
  const selected = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const toggle = (next: string) => {
    const set = new Set(selected);
    if (set.has(next)) set.delete(next);
    else set.add(next);
    onChange(Array.from(set).join(", "));
  };

  return (
    <div>
      <div className="mb-1.5 text-sm font-medium text-slate-700">{label}</div>
      <div className="rounded-lg border border-transparent bg-[#e6f2f6]/60 p-2">
        <div className="mb-2 flex min-h-6 flex-wrap gap-1">
          {selected.length ? (
            selected.map((item) => (
              <span
                key={item}
                className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-700"
              >
                {item}
              </span>
            ))
          ) : (
            <span className="px-1 text-sm text-slate-500">Select {label.toLowerCase()}</span>
          )}
        </div>
        <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
          {options.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-white"
            >
              <input
                type="checkbox"
                checked={selected.includes(option.value)}
                onChange={() => toggle(option.value)}
                className="h-4 w-4 accent-[#0a7a90]"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
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
    country: "",
    state: "",
    city: "",
    timezone: "",
    professionalTitle: "",
    language: "",
    password: "",
    experience: "",
    tier: "silver",
    type: "",
    style: "",
    chatPerMin: "",
    callPerMin: "",
    videoPerMin: "",
    bio: "",
  });
  const countries = useCountries();
  const cities = useCities(form.country);
  const timezoneOptions = useMemo(() => getTimezoneOptions(), []);
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);

  const onChange = (k: keyof typeof form, v: string) =>
    setForm((s) => ({ ...s, [k]: v }));

  const submit = async () => {
    if (!form.name || !form.email || !form.password) {
      toast.error("Name, email and password required");
      return;
    }
    setLoading(true);
    try {
      await api.post("/admin/advisors", {
        name: form.name,
        email: form.email,
        phoneNumber: form.phoneNumber,
        password: form.password,
        country: form.country,
        state: form.state,
        city: form.city,
        timezone: form.timezone,
        professionalTitle: form.professionalTitle,
        languages: form.language,
        experience: form.experience,
        tier: form.tier,
        expertise: form.type,
        styles: form.style,
        bio: form.bio,
        pricing: {
          chatPerMin: form.chatPerMin,
          callPerMin: form.callPerMin,
          videoPerMin: form.videoPerMin,
        },
      });
      setCreated({ email: form.email, password: form.password });
      onCreated();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCreated(null);
    setForm({ name: "", email: "", phoneNumber: "", country: "", state: "", city: "", timezone: "", professionalTitle: "", language: "", password: "", experience: "", tier: "silver", type: "", style: "", chatPerMin: "", callPerMin: "", videoPerMin: "", bio: "" });
    onClose();
  };

  if (created) {
    return (
      <Modal open={open} onClose={handleClose} title="Advisor Account Created" size="md">
        <div className="space-y-4">
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
            Account created successfully. Share these login credentials with the advisor - they can login to the Advisor Dashboard immediately.
          </div>
          <CopyField label="Email" value={created.email} />
          <CopyField label="Password" value={created.password} />
          <p className="text-xs text-slate-500">
            A welcome email has also been sent to the advisor (if email is configured).
          </p>
          <Button className="w-full" onClick={handleClose}>
            Done
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={handleClose} title="Add an Advisor Manually" size="lg">
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
        <label className="block">
          <span className="block mb-1.5 text-sm font-medium text-slate-700">
            Choose Country
          </span>
          <Combobox
            options={countries.map((c) => ({ value: c.iso2, label: c.name }))}
            value={form.country}
            onChange={(v) => setForm((s) => ({ ...s, country: v, city: "" }))}
            placeholder="Select country"
            searchPlaceholder="Search countries..."
            emptyText="No country found."
          />
        </label>
        <Input
          label="Enter State / Region"
          value={form.state}
          onChange={(e) => onChange("state", e.target.value)}
          placeholder="e.g. California"
        />
        <label className="block">
          <span className="block mb-1.5 text-sm font-medium text-slate-700">
            Choose City
          </span>
          <Combobox
            options={cities.map((c) => ({ value: c, label: c }))}
            value={form.city}
            onChange={(v) => onChange("city", v)}
            placeholder={form.country ? "Select city" : "Select a country first"}
            searchPlaceholder="Search cities"
            emptyText="No city found."
            disabled={!form.country}
            allowCustom
          />
        </label>
        <label className="block">
          <span className="block mb-1.5 text-sm font-medium text-slate-700">
            Time Zone
          </span>
          <Combobox
            options={timezoneOptions}
            value={form.timezone}
            onChange={(v) => onChange("timezone", v)}
            placeholder="Select timezone..."
            searchPlaceholder="Search timezones..."
            emptyText="No timezone found."
          />
        </label>
        <Input
          label="Professional Title"
          value={form.professionalTitle}
          onChange={(e) => onChange("professionalTitle", e.target.value)}
          placeholder="e.g. Spiritual Guide & Tarot Reader"
        />
        <Input
          label="Languages"
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
        <label className="block">
          <span className="block mb-1.5 text-sm font-medium text-slate-700">
            Tier Rank
          </span>
          <Combobox
            options={TIER_OPTIONS}
            value={form.tier}
            onChange={(v) => onChange("tier", v)}
            placeholder="Select tier"
            searchPlaceholder="Search tiers"
            emptyText="No tier found."
          />
        </label>
        <MultiSelectField
          label="Expertise Areas"
          options={ADVISOR_EXPERTISE_OPTIONS}
          value={form.type}
          onChange={(v) => onChange("type", v)}
        />
        <MultiSelectField
          label="Styles"
          options={ADVISOR_STYLE_OPTIONS}
          value={form.style}
          onChange={(v) => onChange("style", v)}
        />
      </div>

      <div className="mt-5">
        <p className="text-sm font-semibold text-slate-700 mb-2">Credits Per Minute</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Chat (credits/min)"
            type="number"
            value={form.chatPerMin}
            onChange={(e) => onChange("chatPerMin", e.target.value)}
            placeholder="e.g. 0.33"
          />
          <Input
            label="Call (credits/min)"
            type="number"
            value={form.callPerMin}
            onChange={(e) => onChange("callPerMin", e.target.value)}
            placeholder="e.g. 1.00"
          />
          <Input
            label="Video (credits/min)"
            type="number"
            value={form.videoPerMin}
            onChange={(e) => onChange("videoPerMin", e.target.value)}
            placeholder="e.g. 1.33"
          />
        </div>
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
        <Button variant="outline" onClick={handleClose}>
          Not Now
        </Button>
        <Button onClick={submit} loading={loading}>
          Add advisor manually
        </Button>
      </div>
    </Modal>
  );
}

