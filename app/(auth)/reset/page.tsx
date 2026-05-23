"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, ApiError } from "../../lib/api";
import { useToast } from "../../lib/toast";
import { Button } from "../../components/ui/Button";
import {
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  ShieldCheckIcon,
} from "../../components/Icons";

export default function ResetPage() {
  return (
    <Suspense fallback={null}>
      <ResetInner />
    </Suspense>
  );
}

function ResetInner() {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const resetToken = params?.get("token") || "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => router.push("/login"), 2500);
    return () => clearTimeout(t);
  }, [success, router]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!resetToken) {
      toast.error("Reset token missing — request a new code");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setSubmitting(true);
    try {
      await api.post(
        "/auth/reset-password",
        { resetToken, newPassword, confirmPassword },
        { skipAuth: true }
      );
      setSuccess(true);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Reset failed";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <h1 className="text-2xl md:text-[26px] font-bold text-slate-900 text-center mb-6">
        Reset Password
      </h1>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="relative">
          <LockIcon
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0a7a90] pointer-events-none"
          />
          <input
            type={showPwd ? "text" : "password"}
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="w-full h-13 pl-12 pr-12 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 focus:border-[#0a7a90] focus:outline-none focus:ring-2 focus:ring-[#0a7a90]/20 transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowPwd((s) => !s)}
            aria-label="toggle password"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
          >
            {showPwd ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
          </button>
        </div>

        <div className="relative">
          <LockIcon
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0a7a90] pointer-events-none"
          />
          <input
            type={showConfirm ? "text" : "password"}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirm(e.target.value)}
            required
            className="w-full h-13 pl-12 pr-12 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 focus:border-[#0a7a90] focus:outline-none focus:ring-2 focus:ring-[#0a7a90]/20 transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowConfirm((s) => !s)}
            aria-label="toggle confirm password"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
          >
            {showConfirm ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
          </button>
        </div>

        <Button
          type="submit"
          loading={submitting}
          className="w-full mt-2"
          size="lg"
        >
          Reset password
        </Button>
      </form>

      {success ? <ResetSuccessModal /> : null}
    </>
  );
}

function ResetSuccessModal() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-80 sm:w-90 p-8 flex flex-col items-center text-center">
        <div className="relative mb-5">
          <div className="absolute -top-1 -left-2 w-3 h-3 rounded-full bg-[#0a7a90]/80" />
          <div className="absolute top-2 -right-3 w-2 h-2 rounded-full bg-[#0a7a90]/60" />
          <div className="absolute -bottom-2 left-1 w-2 h-2 rounded-full bg-[#0a7a90]/40" />
          <div className="absolute bottom-1 -right-2 w-3 h-3 rounded-full bg-[#0a7a90]/70" />
          <div className="w-20 h-20 rounded-full bg-[#0a7a90] flex items-center justify-center text-white">
            <ShieldCheckIcon size={40} />
          </div>
        </div>

        <h2 className="text-xl font-bold text-[#0a7a90] mb-2">Successful!</h2>
        <p className="text-sm text-slate-600 mb-5">
          Your Password is successfully changed. You will be redirected to the
          Log in page within a few seconds..
        </p>
        <svg
          className="w-7 h-7 animate-spin text-[#0a7a90]"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
            opacity="0.25"
          />
          <path
            fill="currentColor"
            d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z"
          />
        </svg>
      </div>
    </div>
  );
}
