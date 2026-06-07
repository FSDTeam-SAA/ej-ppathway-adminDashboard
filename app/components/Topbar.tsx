"use client";

import { useState } from "react";
import { useAuth } from "../lib/auth-context";
import { Avatar } from "./ui/Avatar";
import { SearchIcon } from "./Icons";
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

  return (
    <div className="flex items-center justify-between gap-4 px-6 md:px-8 py-4 sticky top-0 bg-[#dff1f6]/80 backdrop-blur z-30">
      <div className="flex-1 max-w-xl">
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

      <div className="flex items-center gap-3">
        <NotificationBell />
        <div className="flex items-center gap-3">
          <Avatar src={user?.profilePhoto} name={user?.name} size={40} />
          <div className="leading-tight hidden sm:block">
            <div className="text-sm font-semibold text-slate-900">
              {user?.name || "Admin"}
            </div>
            <div className="text-xs text-slate-500">{user?.role}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
