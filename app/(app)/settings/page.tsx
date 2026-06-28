"use client";

import { useEffect, useState } from "react";
import { Topbar } from "../../components/Topbar";
import { PageHeader } from "../../components/PageHeader";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Avatar } from "../../components/ui/Avatar";
import { EditIcon } from "../../components/Icons";
import { api, ApiError } from "../../lib/api";
import { useToast } from "../../lib/toast";
import { useAuth } from "../../lib/auth-context";

type SettingsTab = "profile" | "password" | "credits";

export default function SettingsPage() {
  const [tab, setTab] = useState<SettingsTab>("profile");
  const tabClass = (key: SettingsTab) =>
    `h-12 rounded-lg font-medium border ${
      tab === key
        ? "bg-[#0a7a90] text-white border-[#0a7a90]"
        : "bg-white border-slate-200 text-slate-600"
    }`;
  return (
    <>
      <Topbar />
      <main className="px-6 md:px-8 pb-10">
        <PageHeader
          title="Setting"
          breadcrumb={[
            { label: "Dashboard", href: "/" },
            { label: "Setting" },
          ]}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <button
            type="button"
            onClick={() => setTab("profile")}
            className={tabClass("profile")}
          >
            Personal Information
          </button>
          <button
            type="button"
            onClick={() => setTab("password")}
            className={tabClass("password")}
          >
            Change Password
          </button>
          <button
            type="button"
            onClick={() => setTab("credits")}
            className={tabClass("credits")}
          >
            Customer Credits
          </button>
        </div>

        {tab === "profile" ? (
          <ProfileForm />
        ) : tab === "password" ? (
          <PasswordForm />
        ) : (
          <SignupCreditsForm />
        )}
      </main>
    </>
  );
}

function ProfileForm() {
  const toast = useToast();
  const { user, refreshMe } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setPhone(user.phone || "");
    }
  }, [user]);

  const save = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", name);
      fd.append("phone", phone);
      if (photo) fd.append("profilePhoto", photo);
      await api.patch("/users/profile", fd, { isFormData: true });
      toast.success("Profile updated");
      setEditing(false);
      setPhoto(null);
      refreshMe();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Personal Information</h3>
        {!editing && (
          <Button variant="outline" onClick={() => setEditing(true)}>
            <EditIcon size={16} /> Edit
          </Button>
        )}
      </div>
      <div className="flex items-center gap-4 mb-6">
        <Avatar src={user?.profilePhoto} name={user?.name} size={72} />
        <div>
          <div className="text-xl font-semibold text-slate-900">
            {user?.name}
          </div>
          <div className="text-sm text-slate-500 capitalize">
            {user?.role === "admin" ? "Super admin" : user?.role}
          </div>
        </div>
        {editing && (
          <label className="ml-auto cursor-pointer text-sm text-[#0a7a90] font-medium">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setPhoto(e.target.files?.[0] || null)}
            />
            {photo ? photo.name : "Change photo"}
          </label>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {editing ? (
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
        ) : (
          <Static label="Name" value={user?.name || "—"} />
        )}
        <Static label="Email" value={email} />
        {editing ? (
          <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        ) : (
          <Static label="Phone" value={user?.phone || "—"} />
        )}
        <Static
          label="Role"
          value={user?.role === "admin" ? "Super Admin" : user?.role || "—"}
        />
      </div>

      {editing && (
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setEditing(false)}>
            Cancel
          </Button>
          <Button onClick={save} loading={saving}>
            Save Changes
          </Button>
        </div>
      )}
    </div>
  );
}

function PasswordForm() {
  const toast = useToast();
  const { user } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!current || !next) {
      toast.error("Current and new password required");
      return;
    }
    if (next !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setSaving(true);
    try {
      await api.post("/auth/change-password", {
        currentPassword: current,
        newPassword: next,
        confirmPassword: confirm,
      });
      toast.success("Password updated");
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Change Password</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Current Password"
          type="password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          placeholder="••••••"
        />
        <span className="md:col-span-1" />
        <Input
          label="New Password"
          type="password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          placeholder="••••••"
        />
        <Input
          label="Confirm New Password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="••••••"
        />
        <Static label="Email Address" value={user?.email || "—"} />
        <Static label="Phone" value={user?.phone || "—"} />
      </div>
      <div className="mt-6 flex justify-end">
        <Button onClick={submit} loading={saving}>
          Save Changes
        </Button>
      </div>
    </div>
  );
}

function SignupCreditsForm() {
  const toast = useToast();
  const [settings, setSettings] = useState<CreditSettings | null>(null);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const r = await api.get<CreditSettings>("/admin/settings/credits");
        if (active) {
          setSettings(withDefaults(r.data));
          setLoadError("");
        }
      } catch (err) {
        if (active) {
          const msg = err instanceof ApiError ? err.message : "Failed to load";
          setSettings(withDefaults(null));
          setLoadError(msg);
          toast.error(msg);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async () => {
    if (!settings) return;
    if (!validateCreditSettings(settings, toast.error)) {
      return;
    }
    setSaving(true);
    try {
      const r = await api.patch<CreditSettings>("/admin/settings/credits", settings);
      setSettings(withDefaults(r.data));
      toast.success("Credit settings updated");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-1">
        Customer Credits
      </h3>
      <p className="text-sm text-slate-500 mb-4">
        Control credit packs, custom credit purchase rate, RevenueCat product ids, signup credits, and add-on credit costs.
      </p>
      {loadError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {loadError}. Restart the backend so the new credit settings route is active.
        </div>
      )}
      {loading || !settings ? (
        <div className="h-40 rounded-lg bg-[#e6f2f6]/60 animate-pulse" />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              label="Signup free credits"
              type="number"
              min={0}
              step={1}
              value={String(settings.signupFreeCredits)}
              onChange={(e) => setSettings({ ...settings, signupFreeCredits: Number(e.target.value) })}
            />
            <Input
              label="Recording unlock credits"
              type="number"
              min={0}
              step={1}
              value={String(settings.creditUsage.sessionRecording)}
              onChange={(e) => setSettings({
                ...settings,
                creditUsage: { ...settings.creditUsage, sessionRecording: Number(e.target.value) },
              })}
            />
            <Input
              label="Transcript unlock credits"
              type="number"
              min={0}
              step={1}
              value={String(settings.creditUsage.chatTranscript)}
              onChange={(e) => setSettings({
                ...settings,
                creditUsage: { ...settings.creditUsage, chatTranscript: Number(e.target.value) },
              })}
            />
            <Input
              label="USD per credit"
              type="number"
              min={0.01}
              step={0.01}
              value={String(settings.creditUsdRate)}
              onChange={(e) => setSettings({ ...settings, creditUsdRate: Number(e.target.value) })}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-slate-900">Credit Packs</h4>
              <Button
                variant="outline"
                onClick={() => setSettings({
                  ...settings,
                  creditPacks: [
                    ...settings.creditPacks,
                    {
                      id: `credits_${Date.now()}`,
                      label: "New Credit Pack",
                      credits: 25,
                      priceUsd: 19,
                      revenueCatProductId: "",
                      isActive: true,
                      sortOrder: settings.creditPacks.length + 1,
                    },
                  ],
                })}
              >
                Add Pack
              </Button>
            </div>
            <div className="space-y-3">
              {settings.creditPacks.map((pack, index) => (
                <div key={`${pack.id}-${index}`} className="grid grid-cols-1 md:grid-cols-6 gap-3 rounded-xl border border-slate-100 p-3">
                  <Input
                    label="ID"
                    value={pack.id}
                    onChange={(e) => updatePack(settings, setSettings, index, { id: e.target.value })}
                  />
                  <Input
                    label="Label"
                    value={pack.label}
                    onChange={(e) => updatePack(settings, setSettings, index, { label: e.target.value })}
                  />
                  <Input
                    label="Credits"
                    type="number"
                    min={1}
                    step={1}
                    value={String(pack.credits)}
                    onChange={(e) => updatePack(settings, setSettings, index, { credits: Number(e.target.value) })}
                  />
                  <Input
                    label="USD price"
                    type="number"
                    min={0}
                    step={0.01}
                    value={String(pack.priceUsd)}
                    onChange={(e) => updatePack(settings, setSettings, index, { priceUsd: Number(e.target.value) })}
                  />
                  <Input
                    label="RevenueCat product"
                    value={pack.revenueCatProductId || ""}
                    onChange={(e) => updatePack(settings, setSettings, index, { revenueCatProductId: e.target.value })}
                  />
                  <label className="flex items-end gap-2 text-sm text-slate-700 pb-2">
                    <input
                      type="checkbox"
                      checked={pack.isActive !== false}
                      onChange={(e) => updatePack(settings, setSettings, index, { isActive: e.target.checked })}
                    />
                    Active
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <div className="mt-6 flex justify-end">
        <Button onClick={save} loading={saving} disabled={loading}>
          Save Changes
        </Button>
      </div>
    </div>
  );
}

type CreditPack = {
  id: string;
  label: string;
  credits: number;
  priceUsd: number;
  revenueCatProductId?: string;
  isActive?: boolean;
  sortOrder?: number;
};

type CreditSettings = {
  signupFreeCredits: number;
  creditUsdRate: number;
  creditPacks: CreditPack[];
  creditUsage: {
    chatTranscript: number;
    sessionRecording: number;
  };
};

function withDefaults(data?: Partial<CreditSettings> | null): CreditSettings {
  return {
    signupFreeCredits: Number(data?.signupFreeCredits ?? 0),
    creditUsdRate: Number(data?.creditUsdRate ?? 1),
    creditPacks: (data?.creditPacks?.length ? data.creditPacks : DEFAULT_CREDIT_PACKS).map((p, index) => ({
      id: p.id || `credits_${index + 1}`,
      label: p.label || `${p.credits || 0} Credits`,
      credits: Number(p.credits || 0),
      priceUsd: Number(p.priceUsd || 0),
      revenueCatProductId: p.revenueCatProductId || p.id || "",
      isActive: p.isActive !== false,
      sortOrder: Number(p.sortOrder ?? index + 1),
    })),
    creditUsage: {
      chatTranscript: Number(data?.creditUsage?.chatTranscript ?? 5),
      sessionRecording: Number(data?.creditUsage?.sessionRecording ?? 5),
    },
  };
}

const DEFAULT_CREDIT_PACKS: CreditPack[] = [
  { id: "credits_25", label: "25 Credits", credits: 25, priceUsd: 19, revenueCatProductId: "credits_25", isActive: true, sortOrder: 1 },
  { id: "credits_50", label: "50 Credits", credits: 50, priceUsd: 35, revenueCatProductId: "credits_50", isActive: true, sortOrder: 2 },
  { id: "credits_100", label: "100 Credits", credits: 100, priceUsd: 59, revenueCatProductId: "credits_100", isActive: true, sortOrder: 3 },
  { id: "credits_200", label: "200 Credits", credits: 200, priceUsd: 99, revenueCatProductId: "credits_200", isActive: true, sortOrder: 4 },
];

function updatePack(
  settings: CreditSettings,
  setSettings: (next: CreditSettings) => void,
  index: number,
  patch: Partial<CreditPack>,
) {
  setSettings({
    ...settings,
    creditPacks: settings.creditPacks.map((pack, i) =>
      i === index ? { ...pack, ...patch } : pack,
    ),
  });
}

function validateCreditSettings(settings: CreditSettings, error: (message: string) => void) {
  if (!Number.isFinite(settings.creditUsdRate) || settings.creditUsdRate <= 0) {
    error("USD per credit must be greater than 0");
    return false;
  }
  if (!settings.creditPacks.length) {
    error("Add at least one credit pack");
    return false;
  }
  for (const pack of settings.creditPacks) {
    if (!pack.id.trim() || !pack.label.trim() || pack.credits <= 0 || pack.priceUsd < 0) {
      error("Each pack needs an ID, label, positive credits, and non-negative price");
      return false;
    }
  }
  return true;
}

function Static({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className="bg-[#e6f2f6]/60 rounded-lg px-3 py-2.5 text-sm text-slate-800">
        {value}
      </div>
    </div>
  );
}
