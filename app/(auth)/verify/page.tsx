"use client";

import { FormEvent, Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, ApiError } from "../../lib/api";
import { useToast } from "../../lib/toast";
import { Button } from "../../components/ui/Button";

const OTP_LENGTH = 6;

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyInner />
    </Suspense>
  );
}

function VerifyInner() {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const email = params?.get("email") || "";
  const purpose = params?.get("purpose") || "reset";

  const [code, setCode] = useState<string[]>(() => Array(OTP_LENGTH).fill(""));
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [seconds, setSeconds] = useState(60);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const setDigit = (i: number, v: string) => {
    const cleaned = v.replace(/\D/g, "").slice(0, 1);
    setCode((prev) => {
      const next = [...prev];
      next[i] = cleaned;
      return next;
    });
    if (cleaned && i < OTP_LENGTH - 1) refs.current[i + 1]?.focus();
  };

  const onKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
  };

  const onPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    if (text.length === OTP_LENGTH) {
      e.preventDefault();
      setCode(text.split(""));
      refs.current[OTP_LENGTH - 1]?.focus();
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const otp = code.join("");
    if (otp.length !== OTP_LENGTH) {
      toast.error(`Enter the ${OTP_LENGTH}-digit code`);
      return;
    }
    setSubmitting(true);
    try {
      const r = await api.post<{ resetToken?: string }>(
        "/auth/verify-otp",
        { email, otp },
        { skipAuth: true }
      );
      toast.success("Code verified — set a new password");
      router.push(
        `/reset?token=${encodeURIComponent(r.data?.resetToken || "")}`
      );
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Verification failed";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const onResend = async () => {
    if (seconds > 0 || resending) return;
    setResending(true);
    try {
      await api.post(
        "/auth/resend-otp",
        { email, purpose },
        { skipAuth: true }
      );
      toast.success("New OTP sent");
      setSeconds(60);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Could not resend";
      toast.error(msg);
    } finally {
      setResending(false);
    }
  };

  return (
    <>
      <h1 className="text-2xl md:text-[26px] font-bold text-slate-900 text-center mb-6">
        Enter OTP
      </h1>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="flex justify-between gap-2 sm:gap-3">
          {Array.from({ length: OTP_LENGTH }).map((_, i) => (
            <input
              key={i}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={code[i]}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => onKeyDown(i, e)}
              onPaste={onPaste}
              className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold rounded-lg bg-white border border-slate-300 text-slate-900 focus:border-[#0a7a90] focus:outline-none focus:ring-2 focus:ring-[#0a7a90]/20"
            />
          ))}
        </div>

        <div className="text-sm text-center text-slate-700">
          Didn&apos;t Receive OTP?{" "}
          {seconds > 0 ? (
            <span className="text-slate-400">RESEND OTP in {seconds}s</span>
          ) : (
            <button
              type="button"
              onClick={onResend}
              disabled={resending}
              className="text-[#0a7a90] hover:underline font-semibold tracking-wide disabled:opacity-50"
            >
              {resending ? "SENDING..." : "RESEND OTP"}
            </button>
          )}
        </div>

        <Button
          type="submit"
          loading={submitting}
          className="w-full"
          size="lg"
        >
          Verify
        </Button>
      </form>
    </>
  );
}
