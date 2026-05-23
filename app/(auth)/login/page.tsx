"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useAuth } from "../../lib/auth-context";
import { useToast } from "../../lib/toast";
import { Button } from "../../components/ui/Button";
import { ApiError } from "../../lib/api";
import {
  EyeIcon,
  EyeOffIcon,
  MailIcon,
  LockIcon,
} from "../../components/Icons";

export default function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Email and password are required");
      return;
    }
    setSubmitting(true);
    try {
      await login(email, password);
      toast.success("Welcome back");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Login failed";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <h1 className="text-2xl md:text-[26px] font-bold text-slate-900 text-center mb-6">
        Login To Your Account
      </h1>

      <form onSubmit={onSubmit} className="space-y-4">
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

        <div className="relative">
          <LockIcon
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0a7a90] pointer-events-none"
          />
          <input
            type={showPwd ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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

        <div className="flex justify-end">
          <Link
            href="/forgot"
            className="text-sm text-[#0a7a90] hover:underline font-medium"
          >
            Forgot Password?
          </Link>
        </div>

        <Button
          type="submit"
          loading={submitting}
          className="w-full"
          size="lg"
        >
          Login
        </Button>
      </form>
    </>
  );
}
