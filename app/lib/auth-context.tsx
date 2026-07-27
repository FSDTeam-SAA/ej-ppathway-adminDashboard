"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  api,
  clearAuth,
  getStoredUser,
  setAuth,
  ApiError,
} from "./api";
import type { AdminUser } from "./types";

type AuthContextValue = {
  user: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AdminUser>;
  logout: () => void;
  refreshMe: () => Promise<void>;
  hasPermission: (perm: string) => boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const PERMISSION_ALIASES: Record<string, string[]> = {
  "users.manage": ["users.view", "users.edit", "users.suspend", "users.delete"],
  "advisors.manage": ["advisors.view", "advisors.edit", "advisors.suspend", "advisors.reactivate", "advisors.reset_password"],
  "advisors.approve": ["approvals.view", "approvals.interview", "approvals.approve", "approvals.decline", "approvals.contract"],
  "sessions.manage": ["sessions.view", "sessions.cancel", "sessions.modify", "recordings.view"],
  "compliance.manage": ["compliance.view", "compliance.investigate", "compliance.warn", "compliance.suspend_accounts"],
  "finance.manage": ["finance.view", "finance.transactions", "finance.refunds", "finance.chargebacks", "finance.approve_payouts", "finance.release_payouts"],
  "subscriptions.manage": ["plans.view", "plans.create", "plans.edit", "plans.delete"],
  "cms.manage": ["cms.pages", "cms.faqs", "cms.blogs", "cms.legal"],
  "chats.manage": ["chat.view", "chat.reply", "chat.escalate"],
  "faq.manage": ["cms.faqs", "reviews.view", "reviews.remove", "reviews.feature", "testimonials.view", "testimonials.approve", "testimonials.remove"],
  "reviews.manage": ["reviews.view", "reviews.remove", "reviews.feature"],
  "sub_admins.manage": ["subadmins.view", "subadmins.add", "subadmins.edit_permissions", "subadmins.remove"],
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = useCallback(async () => {
    try {
      const r = await api.get<AdminUser>("/auth/me");
      if (r.data) setUser(r.data);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const stored = getStoredUser<AdminUser>();
    if (stored) setUser(stored);
    setLoading(false);
    if (stored) {
      refreshMe();
    }
  }, [refreshMe]);

  // Route guard: redirect logged-out away from protected routes,
  // and logged-in away from auth routes.
  useEffect(() => {
    if (loading) return;
    const isAuthRoute =
      pathname === "/login" ||
      pathname === "/forgot" ||
      pathname === "/verify" ||
      pathname === "/reset";
    if (!user && !isAuthRoute) {
      router.replace("/login");
    } else if (user && isAuthRoute) {
      router.replace("/");
    }
  }, [loading, user, pathname, router]);

  const login = useCallback(
    async (email: string, password: string) => {
      const r = await api.post<{
        accessToken: string;
        refreshToken: string;
        user: AdminUser;
      }>("/auth/login", { email, password }, { skipAuth: true });
      const data = r.data;
      if (!data) throw new ApiError("Login failed", 500, null);
      if (data.user.role !== "admin" && data.user.role !== "sub_admin") {
        throw new ApiError("This account is not an admin user", 403, null);
      }
      setAuth(data.accessToken, data.refreshToken, data.user);
      setUser(data.user);
      router.replace("/");
      return data.user;
    },
    [router]
  );

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
    router.replace("/login");
  }, [router]);

  const hasPermission = useCallback(
    (perm: string) => {
      if (!user) return false;
      if (user.role === "admin") return true;
      const permissions = user.permissions || [];
      if (permissions.includes("*") || permissions.includes(perm)) return true;
      return (PERMISSION_ALIASES[perm] || []).some((alias) => permissions.includes(alias));
    },
    [user]
  );

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, login, logout, refreshMe, hasPermission }),
    [user, loading, login, logout, refreshMe, hasPermission]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
