"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../lib/auth-context";
import {
  AdvisorIcon,
  ApproveIcon,
  ChatIcon,
  ContentIcon,
  CrownIcon,
  DashboardIcon,
  DollarIcon,
  FaqIcon,
  LogoutIcon,
  SessionIcon,
  SettingIcon,
  ShieldIcon,
  SubAdminIcon,
  UsersIcon,
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
  { label: "Advisor Approvals", href: "/advisor-approvals", icon: ApproveIcon, permission: "advisors.approve" },
  { label: "Advisor Management", href: "/advisors", icon: AdvisorIcon, permission: "advisors.manage" },
  { label: "Session Management", href: "/sessions", icon: SessionIcon, permission: "sessions.manage" },
  { label: "Compliance & Safety", href: "/compliance", icon: ShieldIcon, permission: "compliance.manage" },
  { label: "Revenue & Finance", href: "/finance", icon: DollarIcon, permission: "finance.manage" },
  { label: "Subscription Plans", href: "/subscriptions", icon: CrownIcon, permission: "subscriptions.manage" },
  { label: "Website Management", href: "/website-management", icon: ContentIcon, permission: "cms.manage" },
  { label: "Content (CMS)", href: "/content", icon: ContentIcon, permission: "cms.manage" },
  { label: "Chats", href: "/chats", icon: ChatIcon, permission: "chats.manage" },
  { label: "Sub Admins", href: "/sub-admins", icon: SubAdminIcon, permission: "sub_admins.manage" },
  { label: "FAQ & Review Management", href: "/faq-reviews", icon: FaqIcon, permission: "faq.manage" },
  { label: "Setting", href: "/settings", icon: SettingIcon },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout, hasPermission } = useAuth();

  const visible = ITEMS.filter((it) => {
    if (!it.permission) return true;
    return hasPermission(it.permission);
  });

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 bg-[#dff1f6] border-r border-[#cbe4eb] h-screen sticky top-0">
      <div className="px-6 py-5 border-b border-[#cbe4eb]">
        <div className="font-semibold text-lg leading-tight text-slate-900">
          Prophetic <br />
          <span className="text-[#0a7a90] font-normal text-base">PATHWAY</span>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-3 px-3">
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
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    isActive
                      ? "bg-[#0a7a90] text-white font-medium"
                      : "text-slate-700 hover:bg-white"
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
      <div className="p-3 border-t border-[#cbe4eb]">
        {user && (
          <div className="px-3 py-2 mb-2 text-xs text-slate-600 truncate">
            {user.role === "admin" ? "Super Admin" : user.role}
          </div>
        )}
        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 h-11 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 font-medium text-sm"
        >
          <LogoutIcon size={18} /> Log out
        </button>
      </div>
    </aside>
  );
}
