"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Topbar } from "../../components/Topbar";
import { PageHeader } from "../../components/PageHeader";
import { Tabs } from "../../components/ui/Tabs";
import { Avatar } from "../../components/ui/Avatar";
import { Badge, StatusBadge } from "../../components/ui/Badge";
import { Pagination } from "../../components/ui/Pagination";
import { Spinner } from "../../components/Spinner";
import { EyeIcon } from "../../components/Icons";
import { api, ApiError } from "../../lib/api";
import { useToast } from "../../lib/toast";
import { formatDate } from "../../lib/format";
import type { AdvisorApplication } from "../../lib/types";

const TABS = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "under_review", label: "Under Review" },
  { value: "interview_pending", label: "Interview Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export default function AdvisorApprovalsPage() {
  const toast = useToast();
  const [items, setItems] = useState<AdvisorApplication[]>([]);
  const [tab, setTab] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get<AdvisorApplication[]>("/admin/advisor-applications", {
        page,
        limit,
        status: tab === "all" ? undefined : tab,
      });
      setItems(r.data || []);
      setTotal(r.meta?.total || 0);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to load applications";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, page, limit]);

  return (
    <>
      <Topbar />
      <main className="px-6 md:px-8 pb-10">
        <PageHeader
          title="Advisor Approvals"
          breadcrumb={[
            { label: "Dashboard", href: "/" },
            { label: "Advisor Approvals" },
          ]}
        />

        <div className="mb-6">
          <Tabs tabs={TABS} active={tab} onChange={(v) => { setTab(v); setPage(1); }} />
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 flex justify-center text-[#0a7a90]">
              <Spinner size={32} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-slate-500">
                  <tr className="border-b border-slate-100">
                    <th className="px-5 py-4 font-medium">Advisor</th>
                    <th className="px-5 py-4 font-medium">Submitted</th>
                    <th className="px-5 py-4 font-medium">Type</th>
                    <th className="px-5 py-4 font-medium">Stage</th>
                    <th className="px-5 py-4 font-medium">Status</th>
                    <th className="px-5 py-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-500">
                        No applications
                      </td>
                    </tr>
                  ) : (
                    items.map((a) => (
                      <tr key={a._id} className="border-b border-slate-50 last:border-0">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar src={a.user?.profilePhoto} name={a.user?.name} size={32} />
                            <span className="font-medium text-slate-900">{a.user?.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-slate-600">
                          {formatDate(a.createdAt, true)}
                        </td>
                        <td className="px-5 py-3 text-slate-700">
                          {(a.expertise && a.expertise[0]) || "—"}
                        </td>
                        <td className="px-5 py-3">
                          <Badge tone="info">{stageLabel(a.stage)}</Badge>
                        </td>
                        <td className="px-5 py-3">
                          <StatusBadge status={a.status} />
                        </td>
                        <td className="px-5 py-3 text-right">
                          <Link
                            href={`/advisor-approvals/${a._id}`}
                            className="inline-flex items-center gap-1.5 text-emerald-600 hover:underline text-sm font-medium"
                          >
                            <EyeIcon size={16} />
                            Review Details
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
          <div className="px-5 py-3">
            <Pagination
              page={page}
              limit={limit}
              total={total}
              onPage={setPage}
              onLimit={(l) => { setLimit(l); setPage(1); }}
            />
          </div>
        </div>
      </main>
    </>
  );
}

function stageLabel(stage?: string) {
  switch (stage) {
    case "application":
      return "Stage 1 - Application";
    case "pre_recorded_interview":
      return "Stage 2 - Pre-rec.interview";
    case "live_interview":
      return "Stage 3 - Live interview";
    case "contract":
      return "Stage 4 - Contract";
    case "decision":
      return "Decision";
    default:
      return stage || "—";
  }
}
