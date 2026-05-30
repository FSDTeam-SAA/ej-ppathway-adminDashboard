"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Topbar } from "../../../components/Topbar";
import { Avatar } from "../../../components/ui/Avatar";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Modal, ConfirmDialog } from "../../../components/ui/Modal";
import { Input, Textarea } from "../../../components/ui/Input";
import { Skeleton, CardSkeleton } from "../../../components/Skeleton";
import { ChevronLeftIcon, CallIcon, ChatIcon, VideoIcon } from "../../../components/Icons";
import { MapPin } from "lucide-react";
import { api, ApiError } from "../../../lib/api";
import { useToast } from "../../../lib/toast";
import { formatCurrency, formatDate } from "../../../lib/format";
import type { AdvisorApplication } from "../../../lib/types";

export default function ApplicationDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const toast = useToast();

  const [data, setData] = useState<AdvisorApplication | null>(null);
  const [loading, setLoading] = useState(true);

  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduleLoading, setScheduleLoading] = useState(false);

  const [contractOpen, setContractOpen] = useState(false);
  const [contractUrl, setContractUrl] = useState("");
  const [contractLoading, setContractLoading] = useState(false);

  const [confirmReject, setConfirmReject] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectLoading, setRejectLoading] = useState(false);

  const [confirmApprove, setConfirmApprove] = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get<AdvisorApplication>(`/admin/advisor-applications/${id}`);
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

  const submitSchedule = async () => {
    if (!scheduleDate || !scheduleTime) {
      toast.error("Pick a date and time");
      return;
    }
    setScheduleLoading(true);
    try {
      const datetime = `${scheduleDate}T${scheduleTime}:00`;
      await api.patch(`/admin/advisor-applications/${id}/schedule-interview`, { datetime });
      toast.success("Interview scheduled");
      setScheduleOpen(false);
      load();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed";
      toast.error(msg);
    } finally {
      setScheduleLoading(false);
    }
  };

  const submitContract = async () => {
    if (!contractUrl) {
      toast.error("Enter a contract URL");
      return;
    }
    setContractLoading(true);
    try {
      await api.patch(`/admin/advisor-applications/${id}/contract`, { contractUrl });
      toast.success("Contract sent");
      setContractOpen(false);
      load();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed";
      toast.error(msg);
    } finally {
      setContractLoading(false);
    }
  };

  const approve = async () => {
    setApproveLoading(true);
    try {
      await api.patch(`/admin/advisor-applications/${id}/approve`, {});
      toast.success("Advisor approved");
      setConfirmApprove(false);
      load();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed";
      toast.error(msg);
    } finally {
      setApproveLoading(false);
    }
  };

  const reject = async () => {
    setRejectLoading(true);
    try {
      await api.patch(`/admin/advisor-applications/${id}/reject`, { reason: rejectReason });
      toast.success("Application rejected");
      setConfirmReject(false);
      router.push("/advisor-approvals");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed";
      toast.error(msg);
    } finally {
      setRejectLoading(false);
    }
  };

  return (
    <>
      <Topbar />
      <main className="px-6 md:px-8 pb-10">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-slate-700 mb-4"
        >
          <span className="h-10 w-10 rounded-full border border-slate-200 inline-flex items-center justify-center bg-white">
            <ChevronLeftIcon />
          </span>
          <span className="font-medium">Go Back to Applications</span>
        </button>

        {loading || !data ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-start gap-4 mb-6">
                  <Skeleton className="h-22 w-22 rounded-full" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-5 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
                <CardSkeleton />
              </div>
              <CardSkeleton />
            </div>
            <div className="space-y-4">
              <CardSkeleton />
              <CardSkeleton />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left main content */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-start gap-4 mb-6">
                  <Avatar src={data.user?.profilePhoto} name={data.user?.name} size={88} />
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-slate-900">{data.user?.name}</h2>
                    <p className="text-slate-500">{data.professionalTitle || "I am a professional advisor"}</p>
                    <p className="text-slate-500 text-sm flex items-center gap-1"><MapPin size={14} className="shrink-0" />{data.user?.location || "—"}</p>
                    <div className="mt-2">
                      <Badge tone="warning">Under Review</Badge>
                    </div>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-slate-900 mb-3">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Name" value={data.user?.name || "—"} />
                  <Field label="Email" value={data.user?.email || "—"} />
                  <Field label="Experience" value={String(data.yearsOfExperience || "—")} />
                  <Field label="Submitted" value={formatDate(data.createdAt, true)} />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Expertise & Categories</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <ChipsField label="Skills/Expertise" items={data.expertise || []} />
                  <ChipsField label="Styles" items={data.styles || []} />
                  <ChipsField label="Languages" items={data.languages || []} />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">
                  Pre - Recorded Question&apos;s Answers
                </h3>
                {(data.preRecordedAnswers && data.preRecordedAnswers.length > 0) ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.preRecordedAnswers.map((qa, i) => (
                      <div key={i}>
                        <div className="text-xs text-slate-500 mb-1">{qa.question}</div>
                        <div className="bg-[#e6f2f6]/60 rounded-lg px-3 py-2.5 text-sm text-slate-800">
                          {qa.answer}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm">No pre-recorded answers submitted</p>
                )}
              </div>
            </div>

            {/* Right sidebar */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Intro video</h3>
                {data.introVideoUrl ? (
                  <video
                    src={data.introVideoUrl}
                    controls
                    className="w-full aspect-video rounded-xl bg-slate-200"
                  />
                ) : (
                  <div className="aspect-video rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 text-sm">
                    No intro video
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <span>💲</span> Pricing
                </h3>
                <div className="space-y-3">
                  <PricingRow icon={<ChatIcon />} label="Chat" value={data.pricing?.chat} />
                  <PricingRow icon={<CallIcon />} label="Call" value={data.pricing?.call} />
                  <PricingRow icon={<VideoIcon />} label="Video" value={data.pricing?.video} />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Admin Pipeline</h3>
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setScheduleOpen(true)}
                    className="w-full px-4 py-3 rounded-lg bg-amber-100 text-amber-800 font-medium text-left flex items-center justify-between hover:bg-amber-200"
                  >
                    Schedule Live Interview <span>›</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setContractOpen(true)}
                    className="w-full px-4 py-3 rounded-lg bg-indigo-900 text-white font-medium text-left flex items-center justify-between hover:bg-indigo-800"
                  >
                    Send Contract Via mail <span>›</span>
                  </button>
                  <Button
                    variant="success"
                    onClick={() => setConfirmApprove(true)}
                    className="w-full"
                  >
                    ✓ Approve this Advisor
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => setConfirmReject(true)}
                    className="w-full"
                  >
                    ✕ Reject Application
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Schedule Modal */}
      <Modal
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        title="Schedule a Live Interview"
        size="md"
      >
        <p className="text-sm text-slate-500 mb-4">
          Schedule a live interview by choosing a date and time
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Select a Date"
            type="date"
            value={scheduleDate}
            onChange={(e) => setScheduleDate(e.target.value)}
          />
          <Input
            label="Select a Time"
            type="time"
            value={scheduleTime}
            onChange={(e) => setScheduleTime(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3 mt-5">
          <Button variant="outline" onClick={() => setScheduleOpen(false)}>
            Not Now
          </Button>
          <Button onClick={submitSchedule} loading={scheduleLoading}>
            Send it Via Mail
          </Button>
        </div>
      </Modal>

      {/* Contract Modal */}
      <Modal
        open={contractOpen}
        onClose={() => setContractOpen(false)}
        title="Send Contract"
        size="md"
      >
        <Input
          label="Contract URL"
          value={contractUrl}
          onChange={(e) => setContractUrl(e.target.value)}
          placeholder="https://docs.example.com/contract.pdf"
        />
        <div className="grid grid-cols-2 gap-3 mt-5">
          <Button variant="outline" onClick={() => setContractOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submitContract} loading={contractLoading}>
            Send
          </Button>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        open={confirmReject}
        onClose={() => setConfirmReject(false)}
        size="sm"
        hideClose
      >
        <div className="text-center py-2">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Are you sure?</h2>
          <p className="text-slate-600 text-sm mb-4">
            You want to Reject this advisor if you Reject this Advisor he can&apos;t apply again.
          </p>
          <Textarea
            placeholder="Reason (optional)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3 mt-5">
            <Button variant="outline" onClick={() => setConfirmReject(false)}>
              Not Now
            </Button>
            <Button variant="danger" onClick={reject} loading={rejectLoading}>
              Reject
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmApprove}
        onClose={() => setConfirmApprove(false)}
        onConfirm={approve}
        title="Approve Advisor?"
        description="This will create the advisor profile and grant them advisor privileges."
        confirmText="Approve"
        loading={approveLoading}
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

function ChipsField({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <div className="text-xs text-slate-500 mb-2">{label}</div>
      <div className="space-y-2">
        {items.length ? (
          items.map((it, i) => (
            <div
              key={i}
              className="bg-[#e6f2f6]/60 rounded-lg px-3 py-2.5 text-sm text-slate-800 inline-block w-full"
            >
              {it}
            </div>
          ))
        ) : (
          <div className="text-slate-400 text-sm">—</div>
        )}
      </div>
    </div>
  );
}

function PricingRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: number;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="inline-flex items-center gap-2 text-slate-700">
        <span className="text-[#0a7a90]">{icon}</span>
        {label}
      </span>
      <span className="font-semibold text-slate-900">
        {value !== undefined ? `${formatCurrency(value)}/hr` : "—"}
      </span>
    </div>
  );
}
