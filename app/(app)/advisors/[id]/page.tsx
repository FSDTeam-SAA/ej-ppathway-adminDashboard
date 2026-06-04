"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Topbar } from "../../../components/Topbar";
import { PageHeader } from "../../../components/PageHeader";
import { Avatar } from "../../../components/ui/Avatar";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { DetailSkeleton } from "../../../components/Skeleton";
import { ConfirmDialog } from "../../../components/ui/Modal";
import { api, ApiError } from "../../../lib/api";
import { useToast } from "../../../lib/toast";
import { formatCurrency } from "../../../lib/format";
import type { AdvisorProfile, AdminUser, Wallet } from "../../../lib/types";
import { StarIcon } from "../../../components/Icons";
import { MapPin } from "lucide-react";
import { useCountryName, formatLocation } from "../../../lib/countries";
import { useCurrencyCatalog, symbolFor } from "../../../lib/currency";

type AdvisorDetailsResponse = {
  user: AdminUser;
  profile: AdvisorProfile | null;
  wallet: Wallet | null;
  sessionsAgg: Array<{ _id: string; count: number }>;
};

export default function AdvisorDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const toast = useToast();
  const countryName = useCountryName();
  useCurrencyCatalog();
  const [data, setData] = useState<AdvisorDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmSuspend, setConfirmSuspend] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

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
      const isSuspended = data.user.status === "suspended";
      const path = `/admin/advisors/${id}/${isSuspended ? "unsuspend" : "suspend"}`;
      await api.post(path, {});
      toast.success(isSuspended ? "Advisor reactivated" : "Advisor suspended");
      setConfirmSuspend(false);
      load();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Action failed";
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const totalSessions = (data?.sessionsAgg || []).reduce((s, x) => s + x.count, 0);

  return (
    <>
      <Topbar />
      <main className="px-6 md:px-8 pb-10">
        <PageHeader
          title="Advisor Details"
          breadcrumb={[
            { label: "Dashboard", href: "/" },
            { label: "Advisors", href: "/advisors" },
            { label: data?.user.name || "Details" },
          ]}
          action={
            <Button variant="outline" onClick={() => router.back()}>
              Back
            </Button>
          }
        />

        {loading || !data ? (
          <DetailSkeleton />
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex flex-col items-center text-center mb-6">
              <Avatar src={data.user.profilePhoto} name={data.user.name} size={92} />
              <h2 className="text-2xl font-bold text-slate-900 mt-3">{data.user.name}</h2>
              <p className="text-slate-500">{data.profile?.professionalTitle || "Professional advisor"}</p>
              <p className="text-slate-500 text-sm flex items-center justify-center gap-1">
                <MapPin size={14} className="shrink-0" />
                {formatLocation(data.user.city, countryName(data.user.country)) || "—"}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Stat label="Ratings" value={
                <span className="inline-flex items-center gap-1">
                  <StarIcon size={16} filled />
                  {data.profile?.avgRating?.toFixed(1) ?? "0.0"}
                </span>
              } />
              <Stat
                label="Rate per minute"
                value={`${symbolFor(data.user?.currency)}${
                  data.profile?.pricing?.videoPerMin ||
                  data.profile?.pricing?.callPerMin ||
                  data.profile?.pricing?.chatPerMin ||
                  0
                }`}
              />
              <Stat label="Tier Rank" value={
                <span className="capitalize">{data.profile?.tier || "bronze"}</span>
              } />
              <Stat label="Gross Earnings" value={formatCurrency(data.wallet?.totalWithdrawn || 0)} />
              <Stat label="Retention" value={data.profile?.retentionRate ? `${data.profile.retentionRate}%` : "—"} />
              <Stat label="Refund Index" value={data.profile?.refundIndex !== undefined ? `${data.profile.refundIndex}%` : "—"} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <div className="text-sm font-medium text-slate-500 mb-2">Skills/Expertise</div>
                <div className="flex flex-wrap gap-2">
                  {(data.profile?.expertise || []).map((s) => (
                    <Badge key={s} tone="info">{s}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-slate-500 mb-2">Styles</div>
                <div className="flex flex-wrap gap-2">
                  {(data.profile?.styles || []).map((s) => (
                    <Badge key={s} tone="info">{s}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-slate-500 mb-2">Languages</div>
                <div className="flex flex-wrap gap-2">
                  {(data.profile?.languages || []).map((s) => (
                    <Badge key={s} tone="neutral">{s}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-slate-500 mb-2">Total Sessions</div>
                <div className="text-2xl font-bold">{totalSessions}</div>
              </div>
            </div>

            {data.profile?.introVideoUrl && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Intro Video</h3>
                <video
                  src={data.profile.introVideoUrl}
                  controls
                  className="w-full max-w-2xl rounded-xl"
                />
              </div>
            )}

            <div className="bg-[#e6f2f6]/40 rounded-xl p-5 mb-6">
              <h3 className="font-semibold text-slate-900 mb-2">Basic Information</h3>
              <p className="text-sm text-slate-600 whitespace-pre-line">
                {data.profile?.detailedDescription || data.profile?.bio || "No bio provided."}
              </p>
            </div>

            {data.profile?.weeklySchedule && (
              <div className="mb-6">
                <h3 className="font-semibold text-slate-900 mb-3">Weekly Schedule</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(data.profile.weeklySchedule).map(([day, slot]) => (
                    <div
                      key={day}
                      className="flex items-center justify-between border border-slate-100 rounded-xl px-4 py-3"
                    >
                      <span className="capitalize">{day}</span>
                      <span className="text-[#0a7a90] font-medium">
                        {slot?.start || "—"} - {slot?.end || "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                variant={data.user.status === "suspended" ? "primary" : "danger"}
                onClick={() => setConfirmSuspend(true)}
              >
                {data.user.status === "suspended" ? "Unsuspend this User" : "Suspend this User"}
              </Button>
            </div>
          </div>
        )}
      </main>

      <ConfirmDialog
        open={confirmSuspend}
        onClose={() => setConfirmSuspend(false)}
        onConfirm={suspendToggle}
        title="Are you sure?"
        description={
          data?.user.status === "suspended"
            ? "Re-activate this advisor?"
            : "You want to Suspend this advisor. They will lose access until you re-activate them."
        }
        confirmText={data?.user.status === "suspended" ? "Unsuspend" : "Suspend"}
        danger={data?.user.status !== "suspended"}
        loading={actionLoading}
      />
    </>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-100 rounded-xl p-4 text-center shadow-sm">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 font-semibold text-slate-900">{value}</div>
    </div>
  );
}
