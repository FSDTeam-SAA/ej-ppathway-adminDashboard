"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Topbar } from "../../../components/Topbar";
import { PageHeader } from "../../../components/PageHeader";
import { api, ApiError } from "../../../lib/api";
import { useToast } from "../../../lib/toast";
import { Avatar } from "../../../components/ui/Avatar";
import { Badge } from "../../../components/ui/Badge";
import { Modal, ConfirmDialog } from "../../../components/ui/Modal";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Spinner } from "../../../components/Spinner";
import { formatCurrency, formatDate } from "../../../lib/format";
import type { UserDetailsResponse } from "../../../lib/types";
import { DollarIcon, CallIcon, ChatIcon, VideoIcon } from "../../../components/Icons";

export default function UserDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const toast = useToast();
  const [data, setData] = useState<UserDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [creditsAmount, setCreditsAmount] = useState("");
  const [creditsLoading, setCreditsLoading] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [newPwd, setNewPwd] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [confirmSuspend, setConfirmSuspend] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get<UserDetailsResponse>(`/admin/users/${id}`);
      setData(res.data || null);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to load user";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const giveCredits = async () => {
    const amount = Number(creditsAmount);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setCreditsLoading(true);
    try {
      await api.post(`/admin/users/${id}/credits`, { amount });
      toast.success(`Added $${amount} in credits`);
      setCreditsOpen(false);
      setCreditsAmount("");
      load();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to grant credits";
      toast.error(msg);
    } finally {
      setCreditsLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!newPwd || newPwd.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setResetLoading(true);
    try {
      await api.post(`/admin/users/${id}/reset-password`, { newPassword: newPwd });
      toast.success("Password reset");
      setResetOpen(false);
      setNewPwd("");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed";
      toast.error(msg);
    } finally {
      setResetLoading(false);
    }
  };

  const suspendToggle = async () => {
    if (!data) return;
    setActionLoading(true);
    try {
      const isSuspended = data.user.status === "suspended";
      const path = `/admin/users/${id}/${isSuspended ? "unsuspend" : "suspend"}`;
      await api.post(path, {});
      toast.success(isSuspended ? "User unsuspended" : "User suspended");
      setConfirmSuspend(false);
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
      <Topbar />
      <main className="px-6 md:px-8 pb-10">
        <PageHeader
          title="User Details"
          breadcrumb={[
            { label: "Dashboard", href: "/" },
            { label: "Users", href: "/users" },
            { label: data?.user.name || "Details" },
          ]}
          action={
            <Button variant="outline" onClick={() => router.back()}>
              Back
            </Button>
          }
        />

        {loading || !data ? (
          <div className="py-20 flex justify-center text-[#0a7a90]">
            <Spinner size={32} />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex flex-col items-center text-center mb-6">
              <Avatar src={data.user.profilePhoto} name={data.user.name} size={92} />
              <h2 className="text-2xl font-bold text-slate-900 mt-3">{data.user.name}</h2>
              <p className="text-slate-500">{data.user.email}</p>
              <div className="mt-2">
                <Badge tone={data.user.status === "active" ? "success" : "danger"}>
                  {data.user.status}
                </Badge>
              </div>
            </div>

            <div className="bg-[#e6f2f6]/40 rounded-xl p-5 mb-6">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center justify-between">
                <span>Basic Information</span>
                <button
                  type="button"
                  onClick={() => setResetOpen(true)}
                  className="text-sm font-medium text-[#0a7a90] hover:underline"
                >
                  Reset Password
                </button>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Name" value={data.user.name} />
                <Field label="Email" value={data.user.email} />
                <Field label="Phone" value={data.user.phone || "—"} />
                <Field label="Location" value={data.user.location || "—"} />
                <Field label="Joined" value={formatDate(data.user.createdAt)} />
                <Field label="Total Spent" value={formatCurrency(data.totalSpent)} />
                <Field label="Total Sessions" value={`${data.sessionsCount ?? 0}`} />
                <Field label="Plan" value={getPlanName(data.activeSubscription)} />
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-emerald-800 font-semibold">Free Credits Balance</h3>
                <p className="text-emerald-700/80 text-sm">
                  Credits can be used for sessions beyond plan limits
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-emerald-900">
                  {formatCurrency(data.wallet?.freeCredits)}
                </span>
                <Button variant="success" onClick={() => setCreditsOpen(true)}>
                  <DollarIcon size={16} /> Give Free Credits
                </Button>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-slate-900 mb-3">Session History</h3>
            {data.recentSessions && data.recentSessions.length > 0 ? (
              <div className="space-y-2">
                {data.recentSessions.map((s) => (
                  <div
                    key={s._id}
                    className="flex items-center justify-between p-4 rounded-xl border border-slate-100"
                  >
                    <div className="flex items-center gap-3">
                      {sessionIcon(s.type)}
                      <div>
                        <div className="font-semibold text-slate-900">
                          {sessionTypeLabel(s.type)} with {s.advisor?.name || "advisor"}
                        </div>
                        <div className="text-xs text-slate-500">
                          {s.duration ? `${Math.round(s.duration / 60)} min` : "—"}{" "}
                          • {s.status}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-slate-500">{formatDate(s.createdAt)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500">No session history</p>
            )}

            <div className="mt-6 flex justify-end">
              <Button
                variant={data.user.status === "suspended" ? "primary" : "danger"}
                onClick={() => setConfirmSuspend(true)}
              >
                {data.user.status === "suspended" ? "Unsuspend User" : "Suspend User"}
              </Button>
            </div>
          </div>
        )}
      </main>

      <Modal
        open={creditsOpen}
        onClose={() => setCreditsOpen(false)}
        title="Give Free Credits"
        size="sm"
      >
        <p className="text-sm text-slate-500 mb-4">
          Add free credits to {data?.user.name}&apos;s account
        </p>
        <p className="text-sm mb-3">
          <span className="text-slate-600">Current Balance: </span>
          <span className="text-emerald-700 font-semibold">
            {formatCurrency(data?.wallet?.freeCredits)}
          </span>
        </p>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
          <input
            type="number"
            min="1"
            step="1"
            placeholder="Enter credit amount"
            value={creditsAmount}
            onChange={(e) => setCreditsAmount(e.target.value)}
            className="w-full h-11 pl-8 pr-4 rounded-lg bg-[#e6f2f6]/60 border border-transparent focus:border-[#0a7a90] focus:bg-white"
          />
        </div>
        <div className="grid grid-cols-2 gap-3 mt-5">
          <Button variant="outline" onClick={() => setCreditsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={giveCredits} loading={creditsLoading}>
            Send Credits
          </Button>
        </div>
      </Modal>

      <Modal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Reset Password"
        size="sm"
      >
        <Input
          label="New password"
          type="password"
          value={newPwd}
          onChange={(e) => setNewPwd(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3 mt-5">
          <Button variant="outline" onClick={() => setResetOpen(false)}>
            Cancel
          </Button>
          <Button onClick={resetPassword} loading={resetLoading}>
            Reset
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmSuspend}
        onClose={() => setConfirmSuspend(false)}
        onConfirm={suspendToggle}
        title="Are you sure?"
        description={
          data?.user.status === "suspended"
            ? "Re-activate this user account?"
            : "You want to Suspend this User if you Suspend this User they can't use this account."
        }
        confirmText={data?.user.status === "suspended" ? "Unsuspend" : "Suspend"}
        danger={data?.user.status !== "suspended"}
        loading={actionLoading}
      />
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className="bg-[#e6f2f6]/60 rounded-lg px-3 py-2.5 text-sm text-slate-800">
        {value}
      </div>
    </div>
  );
}

function getPlanName(sub?: UserDetailsResponse["activeSubscription"]) {
  if (!sub) return "—";
  const planObj = sub.plan;
  if (planObj && typeof planObj === "object" && "name" in planObj) return planObj.name as string;
  if (sub.planName) return sub.planName;
  return "—";
}

function sessionIcon(type?: string) {
  if (type === "video") return <VideoIcon className="text-sky-600" />;
  if (type === "call") return <CallIcon className="text-emerald-600" />;
  return <ChatIcon className="text-slate-600" />;
}
function sessionTypeLabel(type?: string) {
  if (type === "video") return "Video Call";
  if (type === "call") return "Audio Call";
  if (type === "chat") return "Text Chat";
  return "Session";
}
