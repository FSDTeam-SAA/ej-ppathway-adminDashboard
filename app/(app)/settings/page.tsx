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
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const r = await api.get<{ signupFreeCredits: number }>(
          "/admin/settings/signup-credits",
        );
        if (active) setValue(String(r.data?.signupFreeCredits ?? 0));
      } catch (err) {
        if (active) {
          const msg = err instanceof ApiError ? err.message : "Failed to load";
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
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount < 0) {
      toast.error("Enter a valid non-negative number");
      return;
    }
    setSaving(true);
    try {
      const r = await api.patch<{ signupFreeCredits: number }>(
        "/admin/settings/signup-credits",
        { signupFreeCredits: amount },
      );
      if (typeof r.data?.signupFreeCredits === "number") {
        setValue(String(r.data.signupFreeCredits));
      }
      toast.success("Signup credits updated");
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
        Configure how many free minutes/credits are automatically granted to
        each new customer when they sign up.
      </p>
      <div className="max-w-sm">
        {loading ? (
          <div className="h-11 rounded-lg bg-[#e6f2f6]/60 animate-pulse" />
        ) : (
          <Input
            label="Free minutes/credits granted to each new customer on signup"
            type="number"
            min={0}
            step={1}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="0"
          />
        )}
      </div>
      <div className="mt-6 flex justify-end">
        <Button onClick={save} loading={saving} disabled={loading}>
          Save Changes
        </Button>
      </div>
    </div>
  );
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
