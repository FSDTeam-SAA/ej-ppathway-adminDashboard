"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Topbar } from "../../../components/Topbar";
import { Avatar } from "../../../components/ui/Avatar";
import { StatusBadge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Modal, ConfirmDialog } from "../../../components/ui/Modal";
import { Input, Textarea } from "../../../components/ui/Input";
import { Skeleton, CardSkeleton } from "../../../components/Skeleton";
import { ChevronLeftIcon } from "../../../components/Icons";
import { MapPin } from "lucide-react";
import { api, ApiError, API_BASE, getAccessToken } from "../../../lib/api";
import { useToast } from "../../../lib/toast";
import { formatDate } from "../../../lib/format";
import { useCountryName, formatLocation } from "../../../lib/countries";
import { useCurrencyCatalog } from "../../../lib/currency";
import type { AdvisorApplication } from "../../../lib/types";

const APPLICATION_STATUS_OPTIONS = [
  { value: "new", label: "Application" },
  { value: "pending_review", label: "Pending Review" },
  { value: "scheduled", label: "Interview Scheduled" },
  { value: "live_interview", label: "Live Interview" },
  { value: "under_review", label: "Under Review" },
  { value: "awaiting_signature", label: "Awaiting Signature" },
  { value: "awaiting_approval", label: "Awaiting Approval" },
  { value: "awaiting_submission", label: "Awaiting Submission" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Not Selected" },
];

function isAudioMediaUrl(url: string) {
  return /\.(aac|aiff|flac|m4a|mp3|ogg|opus|wav)(\?|#|$)/i.test(url);
}

function isDirectBrowserUrl(url?: string) {
  return /^(https?:|data:|blob:)/i.test(String(url || ""));
}

async function fetchContractAssetBlob(
  applicationId: string,
  asset: "signature" | "signed-pdf",
) {
  const token = getAccessToken();
  const res = await fetch(
    `${API_BASE}/admin/advisor-applications/${applicationId}/contract/${asset}`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  );

  if (!res.ok) {
    let message = `Contract asset request failed (${res.status})`;
    try {
      const body = (await res.json()) as { message?: string };
      message = body.message || message;
    } catch {
      // keep default message
    }
    throw new ApiError(message, res.status, null);
  }

  return res.blob();
}

export default function ApplicationDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const countryName = useCountryName();
  useCurrencyCatalog();
  const router = useRouter();
  const toast = useToast();

  const [data, setData] = useState<AdvisorApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [signaturePreviewUrl, setSignaturePreviewUrl] = useState("");
  const [signaturePreviewError, setSignaturePreviewError] = useState("");
  const [signedCopyDownloading, setSignedCopyDownloading] = useState(false);

  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduleLoading, setScheduleLoading] = useState(false);

  const [contractOpen, setContractOpen] = useState(false);
  const [contractUrl, setContractUrl] = useState("");
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [contractLoading, setContractLoading] = useState(false);

  const closeContract = () => {
    setContractOpen(false);
    setContractFile(null);
    setContractUrl("");
  };

  const [confirmReject, setConfirmReject] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectLoading, setRejectLoading] = useState(false);

  const [confirmApprove, setConfirmApprove] = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [onboardingLoading, setOnboardingLoading] = useState(false);
  const [profileActionLoading, setProfileActionLoading] = useState(false);
  const [profileRejectOpen, setProfileRejectOpen] = useState(false);
  const [profileRejectReason, setProfileRejectReason] = useState("");

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

  useEffect(() => {
    const rawUrl = data?.contract?.signatureImageUrl || "";
    setSignaturePreviewError("");

    if (!rawUrl) {
      setSignaturePreviewUrl("");
      return;
    }

    if (isDirectBrowserUrl(rawUrl)) {
      setSignaturePreviewUrl(rawUrl);
      return;
    }

    let active = true;
    let objectUrl = "";

    fetchContractAssetBlob(id, "signature")
      .then((blob) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setSignaturePreviewUrl(objectUrl);
      })
      .catch((err) => {
        if (!active) return;
        setSignaturePreviewUrl("");
        setSignaturePreviewError(
          err instanceof ApiError ? err.message : "Failed to load signature",
        );
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [data?.contract?.signatureImageUrl, id]);

  const downloadSignedCopy = async () => {
    const rawUrl = data?.contract?.signedPdfUrl;
    if (!rawUrl) return;

    setSignedCopyDownloading(true);
    try {
      if (isDirectBrowserUrl(rawUrl)) {
        const a = document.createElement("a");
        a.href = rawUrl;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.download = `signed-advisor-contract-${id}.pdf`;
        a.click();
        return;
      }

      const blob = await fetchContractAssetBlob(id, "signed-pdf");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `signed-advisor-contract-${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to download signed copy";
      toast.error(msg);
    } finally {
      setSignedCopyDownloading(false);
    }
  };

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
    const url = contractUrl.trim();
    if (!contractFile && !url) {
      toast.error("Upload a contract PDF or enter a contract URL");
      return;
    }
    setContractLoading(true);
    try {
      if (contractFile) {
        const fd = new FormData();
        fd.append("contract", contractFile);
        if (url) fd.append("contractUrl", url);
        await api.patch(`/admin/advisor-applications/${id}/contract`, fd, {
          isFormData: true,
        });
      } else {
        await api.patch(`/admin/advisor-applications/${id}/contract`, {
          contractUrl: url,
        });
      }
      toast.success("Contract sent");
      closeContract();
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

  const updateStatus = async (nextStatus: string) => {
    if (nextStatus === data?.status) return;
    if (nextStatus === "approved") {
      setConfirmApprove(true);
      return;
    }
    if (nextStatus === "rejected") {
      setConfirmReject(true);
      return;
    }
    setStatusLoading(true);
    try {
      await api.patch(`/admin/advisor-applications/${id}/status`, { status: nextStatus });
      toast.success("Application status updated");
      load();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed";
      toast.error(msg);
    } finally {
      setStatusLoading(false);
    }
  };

  const sendOnboarding = async () => {
    setOnboardingLoading(true);
    try {
      await api.patch(`/admin/advisor-applications/${id}/onboarding`, {});
      toast.success("Onboarding email sent");
      load();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed";
      toast.error(msg);
    } finally {
      setOnboardingLoading(false);
    }
  };

  const approveProfile = async () => {
    setProfileActionLoading(true);
    try {
      await api.patch(`/admin/advisor-applications/${id}/profile/approve`, {});
      toast.success("Advisor profile approved");
      load();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed";
      toast.error(msg);
    } finally {
      setProfileActionLoading(false);
    }
  };

  const submitRejectProfile = async () => {
    const reason = profileRejectReason.trim();
    if (!reason) {
      toast.error("Rejection notes are required");
      return;
    }
    setProfileActionLoading(true);
    try {
      await api.patch(`/admin/advisor-applications/${id}/profile/reject`, { reason });
      toast.success("Advisor profile rejected");
      setProfileRejectOpen(false);
      setProfileRejectReason("");
      load();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed";
      toast.error(msg);
    } finally {
      setProfileActionLoading(false);
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
                    <p className="text-slate-500 text-sm flex items-center gap-1"><MapPin size={14} className="shrink-0" />{formatLocation(data.user?.city, countryName(data.user?.country)) || "—"}</p>
                    <div className="mt-3 flex flex-wrap items-end gap-3">
                      <StatusBadge status={data.status} />
                      <label className="block">
                        <span className="block mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                          Application Status
                        </span>
                        <select
                          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"
                          value={toApplicationStatusValue(data)}
                          onChange={(e) => updateStatus(e.target.value)}
                          disabled={statusLoading || approveLoading || rejectLoading}
                        >
                          {APPLICATION_STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-slate-900 mb-3">Application Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Name" value={data.user?.name || "—"} />
                  <Field label="Email" value={data.user?.email || "—"} />
                  <Field label="Experience" value={String(data.yearsOfExperience || "—")} />
                  <Field label="Availability" value={yesNoLabel(data.availableFiveHoursPerDay)} />
                  <Field
                    label="Baptized with Holy Spirit"
                    value={yesNoLabel(data.baptizedInHolySpirit)}
                  />
                  <Field label="Submitted" value={formatDate(data.createdAt, true)} />
                  <Field label="Date of Birth" value={data.applicantDetails?.dateOfBirth || "N/A"} />
                  <Field label="Address" value={data.applicantDetails?.address || "N/A"} />
                  <Field label="State" value={data.applicantDetails?.state || "N/A"} />
                  <Field label="City" value={data.applicantDetails?.city || "N/A"} />
                  <Field
                    label="Country"
                    value={countryName(data.applicantDetails?.country) || data.applicantDetails?.country || "N/A"}
                  />
                  <Field label="Chat Per Min" value={formatPrice(data.pricing?.chatPerMin)} />
                  <Field label="Call Per Min" value={formatPrice(data.pricing?.callPerMin)} />
                  <Field label="Video Per Min" value={formatPrice(data.pricing?.videoPerMin)} />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Expertise & Categories</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <ChipsField label="Skills/Expertise" items={profileItems(data, "expertise")} />
                  <ChipsField label="Styles" items={profileItems(data, "styles")} />
                  <ChipsField label="Languages" items={profileItems(data, "languages")} />
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
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Application media</h3>
                {applicationAudioUrl(data) || applicationIntroVideoUrl(data) ? (
                  <div className="space-y-3">
                    {applicationAudioUrl(data) ? (
                      <div>
                        <div className="mb-1 text-xs font-medium text-slate-500">Listen to Message</div>
                        <div className="rounded-xl bg-slate-100 px-4 py-5">
                          <audio src={applicationAudioUrl(data)} controls className="w-full" />
                        </div>
                      </div>
                    ) : null}
                    {applicationIntroVideoUrl(data) ? (
                      <div>
                        <div className="mb-1 text-xs font-medium text-slate-500">Intro Video</div>
                        <video
                          src={applicationIntroVideoUrl(data)}
                          controls
                          className="w-full aspect-video rounded-xl bg-slate-200"
                        />
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="aspect-video rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 text-sm">
                    No intro media
                  </div>
                )}
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
                    onClick={sendOnboarding}
                    loading={onboardingLoading}
                    className="w-full"
                  >
                    Onboarding
                  </Button>
                  <Button
                    variant="success"
                    onClick={approveProfile}
                    loading={profileActionLoading}
                    className="w-full"
                  >
                    Approve Advisor Profile
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => setProfileRejectOpen(true)}
                    loading={profileActionLoading}
                    className="w-full"
                  >
                    Reject Advisor Profile
                  </Button>
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
                    ✕ Not Selected
                  </Button>
                </div>
                {data.lastNotification?.sentAt && (
                  <div
                    className={`mt-4 rounded-lg border px-3 py-2.5 text-xs ${
                      data.lastNotification.success
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : data.lastNotification.skipped
                          ? "border-amber-200 bg-amber-50 text-amber-800"
                          : "border-red-200 bg-red-50 text-red-700"
                    }`}
                  >
                    <div className="font-semibold">
                      {data.lastNotification.success
                        ? "✓ Notification email sent"
                        : data.lastNotification.skipped
                          ? "Email skipped — SMTP not configured"
                          : "⚠ Notification email failed"}
                    </div>
                    <div className="mt-0.5 opacity-90">
                      {data.lastNotification.subject}
                      {data.lastNotification.sentAt
                        ? ` · ${formatDate(data.lastNotification.sentAt, true)}`
                        : ""}
                    </div>
                    {data.lastNotification.error ? (
                      <div className="mt-0.5 opacity-80">{data.lastNotification.error}</div>
                    ) : null}
                  </div>
                )}
              </div>

              {data.contract ? (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-slate-900">Contract</h3>
                    {data.status === "awaiting_approval" ? (
                      <StatusBadge status={data.status} />
                    ) : null}
                  </div>
                  <div className="space-y-3 text-sm">
                    {data.contract.sentAt ? (
                      <div className="text-slate-600">
                        Contract sent on{" "}
                        <span className="font-medium text-slate-900">
                          {formatDate(data.contract.sentAt, true)}
                        </span>
                      </div>
                    ) : null}

                    {data.contract.signedAt ? (
                      <div className="text-slate-600">
                        Signed on{" "}
                        <span className="font-medium text-slate-900">
                          {formatDate(data.contract.signedAt, true)}
                        </span>
                        {data.contract.signerName ? (
                          <>
                            {" "}by{" "}
                            <span className="font-medium text-slate-900">
                              {data.contract.signerName}
                            </span>
                          </>
                        ) : null}
                      </div>
                    ) : null}

                    {data.contract.signatureImageUrl ? (
                      <div>
                        <div className="text-xs text-slate-500 mb-1.5">Signature</div>
                        {signaturePreviewUrl ? (
                          <img
                            src={signaturePreviewUrl}
                            alt="Applicant signature"
                            className="max-h-24 rounded-lg border border-slate-100 bg-white p-2"
                          />
                        ) : (
                          <div className="rounded-lg border border-slate-100 bg-white p-3 text-xs text-slate-500">
                            {signaturePreviewError || "Loading signature..."}
                          </div>
                        )}
                      </div>
                    ) : null}

                    <div className="flex flex-wrap gap-2 pt-1">
                      {data.contract.signedPdfUrl ? (
                        <Button
                          size="sm"
                          onClick={downloadSignedCopy}
                          disabled={signedCopyDownloading}
                        >
                          {signedCopyDownloading ? "Downloading..." : "Download signed copy"}
                        </Button>
                      ) : null}
                      {data.contract.url ? (
                        <a
                          href={data.contract.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button size="sm" variant="outline">
                            View original contract
                          </Button>
                        </a>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}
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
        onClose={closeContract}
        title="Send Contract"
        size="md"
      >
        <p className="text-sm text-slate-500 mb-4">
          Upload a contract PDF to send to the applicant. You may optionally
          provide a URL instead of (or in addition to) the file.
        </p>
        <label className="block">
          <span className="block mb-1.5 text-sm font-medium text-slate-700">
            Contract PDF
          </span>
          <input
            type="file"
            accept="application/pdf,.pdf"
            onChange={(e) => setContractFile(e.target.files?.[0] ?? null)}
            className="w-full rounded-lg bg-[#e6f2f6]/60 text-sm text-slate-700 border border-transparent focus:border-[#0a7a90] focus:bg-white transition-colors file:mr-3 file:border-0 file:bg-[#0a7a90] file:text-white file:px-4 file:py-2.5 file:text-sm file:font-medium file:cursor-pointer hover:file:bg-[#076377]"
          />
          {contractFile ? (
            <span className="block mt-1 text-xs text-slate-500">
              Selected: {contractFile.name}
            </span>
          ) : null}
        </label>
        <div className="my-4 flex items-center gap-3 text-xs text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />
          OR
          <span className="h-px flex-1 bg-slate-200" />
        </div>
        <Input
          label="Contract URL (optional)"
          value={contractUrl}
          onChange={(e) => setContractUrl(e.target.value)}
          placeholder="https://docs.example.com/contract.pdf"
        />
        <div className="grid grid-cols-2 gap-3 mt-5">
          <Button variant="outline" onClick={closeContract}>
            Cancel
          </Button>
          <Button onClick={submitContract} loading={contractLoading}>
            Send
          </Button>
        </div>
      </Modal>

      <Modal
        open={profileRejectOpen}
        onClose={() => {
          if (!profileActionLoading) setProfileRejectOpen(false);
        }}
        title="Reject Advisor Profile"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            Rejection notes are required. Explain why the profile was rejected and what the advisor
            needs to correct or update. These notes will be emailed to the advisor.
          </p>
          <Textarea
            label="Rejection notes *"
            rows={6}
            value={profileRejectReason}
            onChange={(e) => setProfileRejectReason(e.target.value)}
            placeholder="Example: Your profile photo is unclear, the bio needs more detail, and your pricing/availability must be completed before approval."
          />
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => setProfileRejectOpen(false)}
              disabled={profileActionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={submitRejectProfile}
              loading={profileActionLoading}
              disabled={!profileRejectReason.trim()}
            >
              Reject & Email Advisor
            </Button>
          </div>
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

function toApplicationStatusValue(data: AdvisorApplication) {
  if (APPLICATION_STATUS_OPTIONS.some((option) => option.value === data.status)) return data.status;
  return "new";
}

function profileItems(
  data: AdvisorApplication,
  field: "expertise" | "styles" | "languages",
) {
  const profileValue = data.profile?.[field];
  if (Array.isArray(profileValue) && profileValue.length > 0) return profileValue;
  return data[field] || [];
}

function applicationAudioUrl(data: AdvisorApplication) {
  return data.profile?.audioMessageUrl || data.audioMessageUrl || (data.introVideoUrl && isAudioMediaUrl(data.introVideoUrl) ? data.introVideoUrl : "");
}

function applicationIntroVideoUrl(data: AdvisorApplication) {
  const url = data.profile?.introVideoUrl || data.introVideoUrl || "";
  return url && !isAudioMediaUrl(url) ? url : "";
}

function yesNoLabel(value?: string) {
  if (!value) return "-";
  if (value.toLowerCase() === "yes") return "Yes";
  if (value.toLowerCase() === "no") return "No";
  return value;
}

function formatPrice(value?: number) {
  return typeof value === "number" ? String(value) : "-";
}

