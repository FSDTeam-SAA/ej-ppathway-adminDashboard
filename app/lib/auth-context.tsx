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
      return (user.permissions || []).includes(perm);
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
