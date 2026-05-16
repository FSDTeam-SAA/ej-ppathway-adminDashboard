"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../lib/auth-context";
import { FullPageLoader } from "../components/Spinner";
import {
  ChevronLeftIcon,
  DashboardIcon,
  ContentIcon,
  ChatIcon,
  AdvisorIcon,
  FaqIcon,
  StarIcon,
  ApproveIcon,
  ShieldIcon,
  LogoutIcon
} from "../components/Icons";

type Item = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  group?: string;
};

// Sub-sidebar — only shown inside Website Management. Ordered top-to-bottom
// in the same sequence as a visitor traverses the site.
const ITEMS: Item[] = [
  { href: "/website-management", label: "Overview", icon: DashboardIcon, group: "General" },
  { href: "/website-management/global", label: "Global (Header & Footer)", icon: ContentIcon, group: "General" },

  { href: "/website-management/home", label: "Home", icon: ContentIcon, group: "Pages" },
  { href: "/website-management/how-it-works", label: "How it Works", icon: ContentIcon, group: "Pages" },
  { href: "/website-management/advisors", label: "Advisors List", icon: AdvisorIcon, group: "Pages" },
  { href: "/website-management/advisor-detail", label: "Advisor Detail", icon: AdvisorIcon, group: "Pages" },
  { href: "/website-management/join-as-advisor", label: "Join as Advisor", icon: ApproveIcon, group: "Pages" },
  { href: "/website-management/ethical-standards", label: "Ethical Standards", icon: ShieldIcon, group: "Pages" },
  { href: "/website-management/reviews", label: "Reviews / Satisfaction", icon: StarIcon, group: "Pages" },
  { href: "/website-management/blogs", label: "Blogs", icon: ContentIcon, group: "Pages" },
  { href: "/website-management/about", label: "About", icon: ContentIcon, group: "Pages" },
  { href: "/website-management/contact", label: "Contact", icon: ChatIcon, group: "Pages" },

  { href: "/website-management/featured-items", label: "Featured Items", icon: StarIcon, group: "Curation" },
  { href: "/website-management/faqs", label: "FAQs", icon: FaqIcon, group: "Curation" },
  { href: "/website-management/static-pages", label: "Privacy & Terms", icon: ContentIcon, group: "Curation" },

  { href: "/website-management/inbox", label: "Inbox (Contact)", icon: ChatIcon, group: "Submissions" }
];

const GROUPS = ["General", "Pages", "Curation", "Submissions"] as const;

export default function WebsiteManagementLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading, logout, hasPermission } = useAuth();

  if (loading || !user) return <FullPageLoader />;

  // Gate by cms.manage permission for sub-admins (admins always pass)
  if (user.role !== "admin" && !hasPermission("cms.manage")) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#dff1f6]">
        <div className="bg-white border border-slate-200 rounded-xl p-8 max-w-md text-center">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Access denied</h2>
          <p className="text-sm text-slate-600 mb-4">You need the <code className="px-1 py-0.5 bg-slate-100 rounded">cms.manage</code> permission to manage website content.</p>
          <Link href="/" className="text-[#0a7a90] text-sm font-medium hover:underline">← Back to dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden md:flex flex-col w-72 shrink-0 bg-white border-r border-slate-200 h-screen sticky top-0">
        <div className="px-5 py-5 border-b border-slate-200">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-[#0a7a90] mb-2"
          >
            <ChevronLeftIcon size={14} /> Back to Admin
          </Link>
          <div className="font-semibold text-slate-900">Website Management</div>
          <div className="text-xs text-slate-500 mt-0.5">Manage every page of the public site</div>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-3">
          {GROUPS.map((group) => {
            const items = ITEMS.filter((it) => it.group === group);
            if (!items.length) return null;
            return (
              <div key={group} className="mb-4">
                <div className="px-3 mb-1 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                  {group}
                </div>
                <ul className="space-y-0.5">
                  {items.map((it) => {
                    const isActive =
                      it.href === "/website-management"
                        ? pathname === "/website-management"
                        : pathname?.startsWith(it.href);
                    const Icon = it.icon;
                    return (
                      <li key={it.href}>
                        <Link
                          href={it.href}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                            isActive
                              ? "bg-[#0a7a90] text-white font-medium"
                              : "text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <Icon size={16} />
                          <span className="truncate">{it.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-200">
          <div className="px-3 py-2 mb-2 text-xs text-slate-500 truncate">
            Signed in as <span className="font-medium text-slate-800">{user.name}</span>
          </div>
          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 h-10 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 font-medium text-sm"
          >
            <LogoutIcon size={16} /> Log out
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">{children}</div>
    </div>
  );
}
