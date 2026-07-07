"use client";

import { useEffect, useMemo, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Topbar } from "../../../components/Topbar";
import { PageHeader } from "../../../components/PageHeader";
import { Avatar } from "../../../components/ui/Avatar";
import { Badge, StatusBadge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { DetailSkeleton } from "../../../components/Skeleton";
import { ConfirmDialog, Modal } from "../../../components/ui/Modal";
import { Input, Textarea } from "../../../components/ui/Input";
import { Combobox } from "../../../components/ui/Combobox";
import { api, ApiError } from "../../../lib/api";
import { useToast } from "../../../lib/toast";
import { formatCurrency, formatDate, formatRelative } from "../../../lib/format";
import type { AdvisorProfile, AdminUser, Wallet, AdvisorMetrics } from "../../../lib/types";
import {
  ADVISOR_EXPERTISE_OPTIONS,
  ADVISOR_STYLE_OPTIONS,
  TIER_OPTIONS,
  getTimezoneOptions,
} from "../../../lib/advisor-options";
import { StarIcon } from "../../../components/Icons";
import {
  MapPin,
  Mail,
  Phone,
  Clock,
  Pencil,
  MessageSquare,
  KeyRound,
  Award,
} from "lucide-react";
import { useCountries, useCities, useCountryName, formatLocation } from "../../../lib/countries";

type AdvisorDetailsResponse = {
  user: AdminUser;
  profile: AdvisorProfile | null;
  wallet: Wallet | null;
  sessionsAgg: Array<{ _id: string; count: number }>;
  metrics?: AdvisorMetrics;
};

const DAY_ORDER = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

function isAudioMediaUrl(url: string) {
  return /\.(aac|aiff|flac|m4a|mp3|ogg|opus|wav)(\?|#|$)/i.test(url);
}

export default function AdvisorDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const toast = useToast();
  const countryName = useCountryName();
  const [data, setData] = useState<AdvisorDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmSuspend, setConfirmSuspend] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get<AdvisorDetailsResponse>(`/admin/advisors/${id}`);
      setData(r.data || null);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to load";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const suspendToggle = async () => {
    if (!data) return;
    setActionLoading(true);
    try {
      const isDeactivated = data.user.status === "deactivated" || data.user.status === "suspended";
      const path = `/admin/advisors/${id}/${isDeactivated ? "unsuspend" : "suspend"}`;
      await api.patch(path, {});
      toast.success(isDeactivated ? "Advisor reactivated" : "Advisor deactivated");
      setConfirmSuspend(false);
      load();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Action failed";
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const changeTier = async (tier: string) => {
    setActionLoading(true);
    try {
      await api.patch(`/admin/advisors/${id}`, { tier });
      toast.success(`Tier changed to ${tier}`);
      load();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to change tier";
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const openChat = async () => {
    if (!u?._id) return;
    setChatLoading(true);
    try {
      const r = await api.post<{ _id: string }>(`/chats/admin/with/${u._id}`, {});
      if (r.data?._id) router.push(`/chats/${r.data._id}`);
      else router.push(`/chats?user=${u._id}`);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Could not open conversation";
      toast.error(msg);
    } finally {
      setChatLoading(false);
    }
  };

  const u = data?.user;
  const p = data?.profile;
  const m = data?.metrics;
  const pricing = p?.pricing;
  const schedule = m?.availability.weeklySchedule || p?.weeklySchedule || null;

  return (
    <>
      <Topbar />
      <main className="px-6 md:px-8 pb-10">
        <PageHeader
          title="Advisor Profile"
          breadcrumb={[
            { label: "Dashboard", href: "/" },
            { label: "Advisors", href: "/advisors" },
            { label: data?.user.name || "Profile" },
          ]}
          action={
            <Button variant="outline" onClick={() => router.back()}>
              Back
            </Button>
          }
        />

        {loading || !data || !u ? (
          <DetailSkeleton />
        ) : (
          <div className="space-y-6">
            {/* ===== Header ===== */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex flex-col md:flex-row md:items-center gap-5">
                <div className="relative">
                  <Avatar src={u.profilePhoto} name={u.name} size={96} />
                  <span
                    className={`absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-white ${
                      m?.availability.isOnline ? "bg-emerald-500" : "bg-slate-300"
                    }`}
                    title={m?.availability.isOnline ? "Online" : "Offline"}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-bold text-slate-900">{u.name}</h2>
                    <StatusBadge status={u.status} />
                    <Badge tone={(["silver", "gold", "platinum"].includes(p?.tier ?? "") ? p!.tier : "silver") as "silver" | "gold" | "platinum"}>
                      {TIER_OPTIONS.find((t) => t.value === (["silver", "gold", "platinum"].includes(p?.tier ?? "") ? p!.tier : "silver"))?.label}
                    </Badge>
                    {m?.availability.availableNow && (
                      <Badge tone="success">Available Now</Badge>
                    )}
                  </div>
                  <p className="text-slate-500 mt-0.5">
                    {p?.professionalTitle || "Professional advisor"}
                  </p>
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={14} />
                      {formatLocation(u.city, countryName(u.country)) || "N/A"}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <StarIcon size={14} filled />
                      {p?.avgRating?.toFixed(1) ?? "0.0"} ({p?.ratingsCount ?? 0})
                    </span>
                    <span className="font-mono text-xs text-slate-400">ID: {u._id}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ===== Advisor Information ===== */}
            <Section title="Advisor Information">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                <Field label="Full Name" value={u.name} />
                <Field
                  label="Email"
                  value={
                    <span className="inline-flex items-center gap-1.5">
                      <Mail size={14} className="text-slate-400" />
                      {u.email}
                    </span>
                  }
                />
                <Field
                  label="Phone"
                  value={
                    u.phone ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Phone size={14} className="text-slate-400" />
                        {u.phone}
                      </span>
                    ) : (
                      "N/A"
                    )
                  }
                />
                <Field label="Country" value={countryName(u.country) || "N/A"} />
                <Field label="State / Region" value={u.state || "N/A"} />
                <Field label="City" value={u.city || "N/A"} />
                <Field label="Time Zone" value={u.timezone || "N/A"} />
                <Field label="Account Status" value={<StatusBadge status={u.status} />} />
                <Field label="Tier Rank" value={<span className="capitalize">{["silver", "gold", "platinum"].includes(p?.tier ?? "") ? p!.tier : "silver"}</span>} />
                <Field
                  label="Rating"
                  value={
                    <span className="inline-flex items-center gap-1">
                      <StarIcon size={14} filled />
                      {p?.avgRating?.toFixed(1) ?? "0.0"}
                    </span>
                  }
                />
                <Field
                  label="Price Per Min"
                  value={
                    <span className="text-slate-700">
                      {pricing?.chatPerMin ?? 0} chat credits/min | {pricing?.callPerMin ?? 0} call credits/min | {pricing?.videoPerMin ?? 0} video credits/min
                    </span>
                  }
                />
                <Field label="Date Joined" value={formatDate(u.createdAt)} />
                <Field label="Last Login" value={u.lastLoginAt ? formatRelative(u.lastLoginAt) : "N/A"} />
                <Field
                  label="Last Active"
                  value={p?.lastSeenAt ? formatRelative(p.lastSeenAt) : "N/A"}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <TagBlock label="Expertise Areas" items={p?.expertise} tone="info" />
                <TagBlock label="Styles" items={p?.styles} tone="info" />
                <TagBlock label="Languages" items={p?.languages} tone="neutral" />
              </div>

              <div className="mt-6">
                <div className="text-sm font-medium text-slate-500 mb-1.5">Bio / About the Advisor</div>
                <p className="text-sm text-slate-600 whitespace-pre-line bg-slate-50 rounded-xl p-4">
                  {p?.detailedDescription || p?.bio || "No bio provided."}
                </p>
              </div>

              {p?.introVideoUrl && (
                <div className="mt-6">
                  <div className="text-sm font-medium text-slate-500 mb-2">Intro Media</div>
                  {isAudioMediaUrl(p.introVideoUrl) ? (
                    <div className="w-full max-w-xl rounded-xl bg-slate-100 p-4">
                      <audio src={p.introVideoUrl} controls className="w-full" />
                    </div>
                  ) : (
                    <video src={p.introVideoUrl} controls className="w-full max-w-xl rounded-xl" />
                  )}
                </div>
              )}
            </Section>

            {/* ===== Session Performance ===== */}
            <Section title="Session Performance Metrics">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                <Stat label="Total Sessions" value={m?.sessions.total ?? 0} />
                <Stat label="Completed" value={m?.sessions.completed ?? 0} />
                <Stat label="Cancelled" value={m?.sessions.cancelled ?? 0} />
                <Stat label="Missed" value={m?.sessions.missed ?? 0} />
                <Stat label="Avg Length" value={`${m?.sessions.avgSessionMinutes ?? 0}m`} />
                <Stat label="Repeat Clients" value={`${m?.sessions.repeatClientRate ?? 0}%`} />
                <Stat label="Retention" value={`${m?.sessions.retentionRate ?? 0}%`} />
              </div>
            </Section>

            {/* ===== Financial Performance ===== */}
            <Section title="Financial Performance">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                <Stat label="Total Revenue" value={formatCurrency(m?.finance.totalRevenue)} />
                <Stat label="Advisor Earnings" value={formatCurrency(m?.finance.advisorEarnings)} />
                <Stat label="Platform Earnings" value={formatCurrency(m?.finance.platformEarnings)} />
                <Stat label="Pending Payouts" value={formatCurrency(m?.finance.pendingPayouts)} />
                <Stat label="Total Paid Out" value={formatCurrency(m?.finance.totalPaidOut)} />
                <Stat label="Refunds" value={formatCurrency(m?.finance.refundAmount)} />
                <Stat label="Chargebacks" value={formatCurrency(m?.finance.chargebackAmount)} />
              </div>
            </Section>

            {/* ===== Availability ===== */}
            <Section title="Availability">
              <div className="flex flex-wrap gap-3 mb-5">
                <span
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${
                    m?.availability.isOnline
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      m?.availability.isOnline ? "bg-emerald-500" : "bg-slate-400"
                    }`}
                  />
                  {m?.availability.isOnline ? "Online" : "Offline"}
                </span>
                <span
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${
                    m?.availability.availableNow
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <Clock size={15} />
                  {m?.availability.availableNow ? "Available Now" : "Not Available Now"}
                </span>
              </div>
              <div className="text-sm font-medium text-slate-500 mb-3">Weekly Availability Schedule</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {DAY_ORDER.map((day) => {
                  const slot = schedule?.[day];
                  const enabled = slot && slot.enabled !== false && (slot.from || slot.to);
                  return (
                    <div
                      key={day}
                      className="flex items-center justify-between border border-slate-100 rounded-xl px-4 py-3"
                    >
                      <span className="capitalize text-slate-700">{day}</span>
                      {enabled ? (
                        <span className="text-[#0a7a90] font-medium text-right">
                          {slot?.slots?.length
                            ? slot.slots.map((s) => `${s.from || "-"} - ${s.to || "-"}`).join(", ")
                            : `${slot?.from || "N/A"} - ${slot?.to || "N/A"}`}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-sm">Unavailable</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </Section>

            {/* ===== Action Center ===== */}
            <Section title="Action Center">
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => setEditOpen(true)}>
                  <Pencil size={16} /> Edit Profile
                </Button>
                <div className="inline-flex items-center gap-2">
                  <Award size={16} className="text-slate-500" />
                  <select
                    value={["silver", "gold", "platinum"].includes(p?.tier ?? "") ? p!.tier : "silver"}
                    onChange={(e) => changeTier(e.target.value)}
                    disabled={actionLoading}
                    className="h-10 rounded-xl border border-slate-200 px-3 text-sm bg-white"
                  >
                    {TIER_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value}>
                        Change Tier: {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <Button variant="outline" onClick={openChat} loading={chatLoading}>
                  <MessageSquare size={16} /> Send Message
                </Button>
                <Button variant="outline" onClick={() => setResetOpen(true)}>
                  <KeyRound size={16} /> Reset Password
                </Button>
                <Button
                  variant={u.status === "deactivated" || u.status === "suspended" ? "primary" : "danger"}
                  onClick={() => setConfirmSuspend(true)}
                >
                  {u.status === "deactivated" || u.status === "suspended" ? "Reactivate Advisor" : "Deactivate Advisor"}
                </Button>
              </div>
            </Section>
          </div>
        )}
      </main>

      <ConfirmDialog
        open={confirmSuspend}
        onClose={() => setConfirmSuspend(false)}
        onConfirm={suspendToggle}
        title="Are you sure?"
        description={
          data?.user.status === "deactivated" || data?.user.status === "suspended"
            ? "Re-activate this advisor?"
            : "Deactivate this advisor. They will lose access until you reactivate them."
        }
        confirmText={data?.user.status === "deactivated" || data?.user.status === "suspended" ? "Reactivate" : "Deactivate"}
        danger={data?.user.status !== "deactivated" && data?.user.status !== "suspended"}
        loading={actionLoading}
      />

      {data && u && (
        <EditAdvisorModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          advisorId={id}
          user={u}
          profile={p}
          onSaved={() => {
            setEditOpen(false);
            load();
          }}
        />
      )}

      <ResetPasswordModal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        userId={id}
      />
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-slate-500 mb-0.5">{label}</div>
      <div className="text-sm font-medium text-slate-900">{value}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 font-bold text-slate-900">{value}</div>
    </div>
  );
}

function TagBlock({
  label,
  items,
  tone,
}: {
  label: string;
  items?: string[];
  tone: "info" | "neutral";
}) {
  return (
    <div>
      <div className="text-sm font-medium text-slate-500 mb-2">{label}</div>
      <div className="flex flex-wrap gap-2">
        {items && items.length > 0 ? (
          items.map((s) => (
            <Badge key={s} tone={tone}>
              {s}
            </Badge>
          ))
        ) : (
          <span className="text-sm text-slate-400">N/A</span>
        )}
      </div>
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

function ResetPasswordModal({
  open,
  onClose,
  userId,
}: {
  open: boolean;
  onClose: () => void;
  userId: string;
}) {
  const toast = useToast();
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (pw.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await api.patch(`/admin/users/${userId}/reset-password`, { newPassword: pw });
      toast.success("Password reset. Advisor must set a new one on next login.");
      setPw("");
      onClose();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Reset Advisor Password" size="md">
      <div className="space-y-4">
        <Input
          label="New Password"
          type="text"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="Enter a new password"
        />
        <p className="text-xs text-slate-500">
          The advisor will be required to set their own password the next time they log in.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={loading}>
            Reset Password
          </Button>
        </div>
      </div>
    </Modal>
  );
}

type WeeklyScheduleForm = Record<
  string,
  { enabled: boolean; from: string; to: string; slots: Array<{ from: string; to: string }> }
>;

const defaultWeeklySchedule = (profile?: AdvisorProfile | null): WeeklyScheduleForm =>
  Object.fromEntries(
    DAY_ORDER.map((day) => {
      const current = profile?.weeklySchedule?.[day];
      const slots = current?.slots?.length
        ? current.slots.map((slot) => ({
            from: slot.from || "09:00",
            to: slot.to || "18:00",
          }))
        : [{ from: current?.from || "09:00", to: current?.to || "18:00" }];
      return [
        day,
        {
          enabled: current?.enabled === true,
          from: slots[0]?.from || "09:00",
          to: slots[0]?.to || "18:00",
          slots,
        },
      ];
    }),
  ) as WeeklyScheduleForm;

function EditAdvisorModal({
  open,
  onClose,
  advisorId,
  user,
  profile,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  advisorId: string;
  user: AdminUser;
  profile?: AdvisorProfile | null;
  onSaved: () => void;
}) {
  const toast = useToast();
  const countries = useCountries();
  const timezoneOptions = useMemo(() => getTimezoneOptions(), []);
  const buildInitialForm = () => ({
    name: user.name || "",
    phoneNumber: user.phone || "",
    country: user.country || "",
    state: user.state || "",
    city: user.city || "",
    timezone: user.timezone || "",
    professionalTitle: profile?.professionalTitle || "",
    tier: ["silver", "gold", "platinum"].includes(profile?.tier ?? "") ? (profile!.tier as string) : "silver",
    expertise: (profile?.expertise || []).join(", "),
    styles: (profile?.styles || []).join(", "),
    languages: (profile?.languages || []).join(", "),
    chatPerMin: profile?.pricing?.chatPerMin?.toString() || "",
    callPerMin: profile?.pricing?.callPerMin?.toString() || "",
    videoPerMin: profile?.pricing?.videoPerMin?.toString() || "",
    bio: profile?.bio || "",
    detailedDescription: profile?.detailedDescription || "",
    isOnline: !!profile?.isOnline,
    autoOnlineMode: !!profile?.autoOnlineMode,
    weeklySchedule: defaultWeeklySchedule(profile),
  });
  const [form, setForm] = useState(buildInitialForm);
  const cities = useCities(form.country);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) setForm(buildInitialForm());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user._id, profile?._id]);

  const onChange = (k: keyof typeof form, v: string | boolean | WeeklyScheduleForm) =>
    setForm((s) => ({ ...s, [k]: v }));
  const updateDay = (
    day: string,
    patch: Partial<WeeklyScheduleForm[string]>,
  ) => {
    setForm((s) => ({
      ...s,
      weeklySchedule: {
        ...s.weeklySchedule,
        [day]: {
          ...s.weeklySchedule[day],
          ...patch,
        },
      },
    }));
  };

  const submit = async () => {
    setLoading(true);
    try {
      await api.patch(`/admin/advisors/${advisorId}`, {
        name: form.name,
        phoneNumber: form.phoneNumber,
        country: form.country,
        state: form.state,
        city: form.city,
        timezone: form.timezone,
        professionalTitle: form.professionalTitle,
        tier: form.tier,
        expertise: form.expertise,
        styles: form.styles,
        languages: form.languages,
        bio: form.bio,
        detailedDescription: form.detailedDescription,
        pricing: {
          chatPerMin: form.chatPerMin,
          callPerMin: form.callPerMin,
          videoPerMin: form.videoPerMin,
        },
        isOnline: form.isOnline,
        autoOnlineMode: form.autoOnlineMode,
        weeklySchedule: form.weeklySchedule,
      });
      toast.success("Advisor updated");
      onSaved();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Edit Advisor Profile" size="lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Full Name" value={form.name} onChange={(e) => onChange("name", e.target.value)} />
        <Input
          label="Phone Number"
          value={form.phoneNumber}
          onChange={(e) => onChange("phoneNumber", e.target.value)}
        />
        <label className="block">
          <span className="block mb-1.5 text-sm font-medium text-slate-700">Country</span>
          <Combobox
            options={countries.map((c) => ({ value: c.iso2, label: c.name }))}
            value={form.country}
            onChange={(v) => setForm((s) => ({ ...s, country: v, city: "" }))}
            placeholder="Select country..."
            searchPlaceholder="Search countries..."
            emptyText="No country found."
          />
        </label>
        <Input
          label="State / Region"
          value={form.state}
          onChange={(e) => onChange("state", e.target.value)}
        />
        <label className="block">
          <span className="block mb-1.5 text-sm font-medium text-slate-700">City</span>
          <Combobox
            options={cities.map((c) => ({ value: c, label: c }))}
            value={form.city}
            onChange={(v) => onChange("city", v)}
            placeholder={form.country ? "Select city..." : "Select a country first"}
            searchPlaceholder="Search cities..."
            emptyText="No city found."
            disabled={!form.country}
            allowCustom
          />
        </label>
        <label className="block">
          <span className="block mb-1.5 text-sm font-medium text-slate-700">Time Zone</span>
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
        />
        <label className="block">
          <span className="block mb-1.5 text-sm font-medium text-slate-700">Tier Rank</span>
          <Combobox
            options={TIER_OPTIONS}
            value={form.tier}
            onChange={(v) => onChange("tier", v)}
            placeholder="Select tier..."
            searchPlaceholder="Search tiers..."
            emptyText="No tier found."
          />
        </label>
        <MultiSelectField
          label="Expertise Areas"
          options={ADVISOR_EXPERTISE_OPTIONS}
          value={form.expertise}
          onChange={(v) => onChange("expertise", v)}
        />
        <MultiSelectField
          label="Styles"
          options={ADVISOR_STYLE_OPTIONS}
          value={form.styles}
          onChange={(v) => onChange("styles", v)}
        />
        <Input
          label="Languages"
          value={form.languages}
          onChange={(e) => onChange("languages", e.target.value)}
          placeholder="Comma separated"
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
          />
          <Input
            label="Call (credits/min)"
            type="number"
            value={form.callPerMin}
            onChange={(e) => onChange("callPerMin", e.target.value)}
          />
          <Input
            label="Video (credits/min)"
            type="number"
            value={form.videoPerMin}
            onChange={(e) => onChange("videoPerMin", e.target.value)}
          />
        </div>
      </div>

      <div className="mt-5">
        <p className="text-sm font-semibold text-slate-700 mb-2">Availability</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <label className="block">
            <span className="block mb-1.5 text-sm font-medium text-slate-700">Current Online Status</span>
            <Combobox
              options={[
                { value: "online", label: "Online" },
                { value: "offline", label: "Offline" },
                { value: "busy", label: "Busy" },
                { value: "away", label: "Away" },
              ]}
              value={form.isOnline ? "online" : "offline"}
              onChange={(v) => onChange("isOnline", v === "online")}
              placeholder="Select status..."
            />
          </label>
          <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 mt-6 md:mt-0">
            <span>
              <span className="block text-sm font-medium text-slate-700">Auto Online Mode</span>
              <span className="block text-xs text-slate-500">Use weekly schedule to go online automatically</span>
            </span>
            <input
              type="checkbox"
              checked={form.autoOnlineMode}
              onChange={(e) => onChange("autoOnlineMode", e.target.checked)}
              className="h-5 w-5 accent-[#0a7a90]"
            />
          </label>
        </div>
        <div className="space-y-2">
          {DAY_ORDER.map((day) => {
            const current = form.weeklySchedule[day];
            return (
              <div
                key={day}
                className="grid grid-cols-1 md:grid-cols-[120px_1fr_1fr] gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-3"
              >
                <label className="flex items-center gap-2 text-sm font-medium capitalize text-slate-700">
                  <input
                    type="checkbox"
                    checked={current.enabled}
                    onChange={(e) => updateDay(day, { enabled: e.target.checked })}
                    className="h-4 w-4 accent-[#0a7a90]"
                  />
                  {day}
                </label>
                <Input
                  label="Start"
                  type="time"
                  value={current.from}
                  onChange={(e) =>
                    updateDay(day, {
                      from: e.target.value,
                      slots: [{ from: e.target.value, to: current.to }],
                    })
                  }
                />
                <Input
                  label="End"
                  type="time"
                  value={current.to}
                  onChange={(e) =>
                    updateDay(day, {
                      to: e.target.value,
                      slots: [{ from: current.from, to: e.target.value }],
                    })
                  }
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4">
        <Textarea
          label="Bio / About the Advisor"
          value={form.detailedDescription}
          onChange={(e) => onChange("detailedDescription", e.target.value)}
          placeholder="Detailed description..."
        />
      </div>

      <div className="grid grid-cols-2 gap-3 mt-5">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={submit} loading={loading}>
          Save Changes
        </Button>
      </div>
    </Modal>
  );
}
