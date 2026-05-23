"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "../../lib/api";
import { useToast } from "../../lib/toast";
import { Button } from "../../components/ui/Button";
import { MailIcon } from "../../components/Icons";

export default function ForgotPage() {
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Email is required");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/auth/forgot-password", { email }, { skipAuth: true });
      toast.success("If the email exists, an OTP has been sent.");
      router.push(`/verify?email=${encodeURIComponent(email)}&purpose=reset`);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Request failed";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <h1 className="text-2xl md:text-[26px] font-bold text-slate-900 text-center mb-6">
        Forgot Password
      </h1>

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="relative">
          <MailIcon
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0a7a90] pointer-events-none"
          />
          <input
            type="email"
            autoComplete="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full h-13 pl-12 pr-4 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 focus:border-[#0a7a90] focus:outline-none focus:ring-2 focus:ring-[#0a7a90]/20 transition-colors"
          />
        </div>

        <Button
          type="submit"
          loading={submitting}
          className="w-full"
          size="lg"
        >
          Send OTP
        </Button>
      </form>
    </>
  );
}
