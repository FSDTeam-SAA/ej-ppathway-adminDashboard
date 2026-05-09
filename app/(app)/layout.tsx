"use client";

import { useAuth } from "../lib/auth-context";
import { Sidebar } from "../components/Sidebar";
import { FullPageLoader } from "../components/Spinner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading || !user) {
    return <FullPageLoader />;
  }

  return (
    <div className="flex min-h-screen bg-[#dff1f6]">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">{children}</div>
    </div>
  );
}
