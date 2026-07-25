"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Banknote } from "lucide-react";
import { useAuth } from "../lib/auth-context";
import {
  AdvisorIcon,
  ApproveIcon,
  ChatIcon,
  CloseIcon,
  ContentIcon,
  CrownIcon,
  DashboardIcon,
  DollarIcon,
  FaqIcon,
  LogoutIcon,
  OnboardingIcon,
  SessionIcon,
  SettingIcon,
  ShieldIcon,
  StarIcon,
  SubAdminIcon,
  UsersIcon,
  VideoIcon,
} from "./Icons";

type Item = {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  permission?: string;
};

const ITEMS: Item[] = [
  { label: "Dashboard Overview", href: "/", icon: DashboardIcon },
  { label: "Users Management", href: "/users", icon: UsersIcon, permission: "users.manage" },
  { label: "Onboarding Analytics", href: "/onboarding-analytics", icon: OnboardingIcon, permission: "analytics.view" },
  { label: "Advisor Approvals", href: "/advisor-approvals", icon: ApproveIcon, permission: "advisors.approve" },
  { label: "Advisor Management", href: "/advisors", icon: AdvisorIcon, permission: "advisors.manage" },
  { label: "Session Management", href: "/sessions", icon: SessionIcon, permission: "sessions.manage" },
  { label: "Session Recordings", href: "/recordings", icon: VideoIcon, permission: "sessions.manage" },
  { label: "Compliance & Safety", href: "/compliance", icon: ShieldIcon, permission: "compliance.manage" },
  { label: "Revenue & Finance", href: "/finance", icon: DollarIcon, permission: "finance.manage" },
  { label: "Payout Management", href: "/payouts", icon: Banknote, permission: "finance.manage" },
  { label: "Credit Management", href: "/credits", icon: DollarIcon, permission: "finance.manage" },
  { label: "Promotion Plans", href: "/promotion-plans", icon: CrownIcon, permission: "finance.manage" },
  { label: "Content (CMS)", href: "/website-management", icon: ContentIcon, permission: "cms.manage" },
  { label: "Advisor Support Chat", href: "/advisor-support-chat", icon: ChatIcon, permission: "chats.manage" },
  { label: "User Support Chat", href: "/user-support-chat", icon: ChatIcon, permission: "chats.manage" },
  { label: "Sub Admins", href: "/sub-admins", icon: SubAdminIcon, permission: "sub_admins.manage" },
  { label: "Review Management", href: "/faq-reviews", icon: FaqIcon, permission: "faq.manage" },
  { label: "Testimonials", href: "/testimonials", icon: StarIcon, permission: "faq.manage" },
  { label: "Setting", href: "/settings", icon: SettingIcon },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout, hasPermission } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const visible = ITEMS.filter((it) => {
    if (!it.permission) return true;
    return hasPermission(it.permission);
  });

  useEffect(() => {
    const open = () => setDrawerOpen(true);
    window.addEventListener("admin-sidebar:open", open);
    return () => window.removeEventListener("admin-sidebar:open", open);
  }, []);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  const NavList = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="flex-1 overflow-y-auto px-3">
        <ul className="space-y-1">
          {visible.map((it) => {
            const isActive =
              it.href === "/"
                ? pathname === "/"
                : pathname?.startsWith(it.href);
            const Icon = it.icon;
            return (
              <li key={it.href}>
                <Link
                  href={it.href}
                  onClick={onNavigate}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    isActive
                      ? "bg-[#0a7a90] text-white font-medium shadow-sm"
                      : "text-slate-700 hover:bg-white/60"
                  }`}
                >
                  <Icon size={18} />
                  <span className="truncate">{it.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
  );

  const Footer = () => (
    <div className="p-4">
      <button
        type="button"
        onClick={logout}
        className="w-full flex items-center justify-center gap-2 h-11 rounded-lg border border-red-400 text-red-500 hover:bg-red-50 font-medium text-sm"
      >
        <LogoutIcon size={18} /> Log out
      </button>
    </div>
  );

  return (
    <>
      <aside className="hidden md:flex flex-col w-64 shrink-0 bg-[#dff1f6] h-screen sticky top-0">
        <div className="px-6 pt-6 pb-4 flex justify-center">
          <Image
            src="/logo.png"
            alt="Prophetic Pathway"
            width={180}
            height={64}
            priority
            className="h-auto w-40 object-contain"
          />
        </div>
        <NavList />
        <Footer />
      </aside>

      {drawerOpen ? (
        <div className="fixed inset-0 z-[700] md:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-slate-900/45"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="relative flex h-full w-[min(18rem,calc(100vw-3rem))] flex-col bg-[#dff1f6] shadow-2xl">
            <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
              <Link href="/" onClick={() => setDrawerOpen(false)} aria-label="Prophetic Pathway">
                <Image
                  src="/logo.png"
                  alt="Prophetic Pathway"
                  width={160}
                  height={56}
                  priority
                  className="h-10 w-auto max-w-40 object-contain"
                />
              </Link>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-white/60"
                aria-label="Close menu"
              >
                <CloseIcon size={20} />
              </button>
            </div>
            <NavList onNavigate={() => setDrawerOpen(false)} />
            <Footer />
          </aside>
        </div>
      ) : null}
    </>
  );
}
