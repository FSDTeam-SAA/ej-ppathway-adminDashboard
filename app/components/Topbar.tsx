"use client";

import { useState } from "react";
import { useAuth } from "../lib/auth-context";
import { Avatar } from "./ui/Avatar";
import { MenuIcon, SearchIcon } from "./Icons";
import { NotificationBell } from "./NotificationBell";

export function Topbar({
  onSearch,
  searchPlaceholder = "Search ...",
}: {
  onSearch?: (q: string) => void;
  searchPlaceholder?: string;
}) {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const displayRole = user?.role === "sub_admin"
    ? user.roleLabel || user.location || user.roleKey || "Sub Admin"
    : user?.role || "admin";

  return (
    <div className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 bg-[#dff1f6]/90 px-4 py-3 backdrop-blur sm:px-6 md:px-8 md:py-4">
      <button
        type="button"
        onClick={() => window.dispatchEvent(new Event("admin-sidebar:open"))}
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 md:hidden"
        aria-label="Open menu"
      >
        <MenuIcon size={22} />
      </button>

      <div className="order-3 w-full min-w-0 sm:order-none sm:flex-1 sm:max-w-xl">
        {onSearch ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSearch(q);
            }}
            className="relative"
          >
            <SearchIcon
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full h-11 pl-11 pr-4 rounded-full bg-white border border-slate-200 placeholder:text-slate-400 text-sm focus:border-[#0a7a90]"
            />
          </form>
        ) : (
          <span />
        )}
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <NotificationBell />
        <div className="flex items-center gap-3">
          <Avatar src={user?.profilePhoto} name={user?.name} size={40} />
          <div className="leading-tight hidden sm:block">
            <div className="text-sm font-semibold text-slate-900">
              {user?.name || "Admin"}
            </div>
            <div className="text-xs text-slate-500">{displayRole}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
