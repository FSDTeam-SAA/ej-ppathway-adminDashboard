"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "../../../components/PageHeader";
import { Spinner } from "../../../components/Spinner";
import { Tabs } from "../../../components/ui/Tabs";
import { Avatar } from "../../../components/ui/Avatar";
import { StarIcon } from "../../../components/Icons";
import { api, ApiError } from "../../../lib/api";
import { useToast } from "../../../lib/toast";

type AdvisorRow = {
  profile: {
    _id: string;
    user: string;
    isFeaturedOnHome?: boolean;
    avgRating?: number;
    ratingsCount?: number;
    expertise?: string[];
    tier?: string;
  };
  user: { _id: string; name?: string; email?: string; profilePhoto?: string };
};

type ReviewRow = {
  _id: string;
  rating: number;
  comment?: string;
  isFeaturedTestimonial?: boolean;
  user?: { _id: string; name?: string; profilePhoto?: string };
  advisor?: { _id: string; name?: string };
  createdAt: string;
  isAdminShowcase?: boolean;
  showcaseName?: string;
};

const TABS = [
  { value: "advisors", label: "Featured Advisors (homepage)" },
  { value: "testimonials", label: "Featured Testimonials" }
];

export default function FeaturedItemsPage() {
  const [tab, setTab] = useState("advisors");

  return (
    <main className="px-6 md:px-10 py-8 max-w-6xl mx-auto pb-16">
      <PageHeader
        title="Featured Items"
        description="Curate which advisors and reviews appear on the homepage. These pull from real records — no duplicate copies."
        breadcrumb={[{ label: "Website Management", href: "/website-management" }, { label: "Featured Items" }]}
      />
      <div className="mb-6">
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
      </div>
      {tab === "advisors" ? <FeaturedAdvisorsTab /> : <FeaturedReviewsTab />}
    </main>
  );
}

function FeaturedAdvisorsTab() {
  const toast = useToast();
  const [items, setItems] = useState<AdvisorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get<AdvisorRow[]>("/admin/advisors", { limit: 100 });
      setItems(r.data || []);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to load advisors");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = async (row: AdvisorRow, next: boolean) => {
    setBusyId(row.user._id);
    try {
      await api.patch(`/admin/advisors/${row.user._id}/featured`, { isFeaturedOnHome: next });
      setItems((prev) =>
        prev.map((it) =>
          it.user._id === row.user._id
            ? { ...it, profile: { ...it.profile, isFeaturedOnHome: next } }
            : it
        )
      );
      toast.success(next ? "Marked as featured" : "Removed from featured");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            <th className="text-left px-4 py-3 font-medium">Advisor</th>
            <th className="text-left px-4 py-3 font-medium">Expertise</th>
            <th className="text-left px-4 py-3 font-medium">Rating</th>
            <th className="text-left px-4 py-3 font-medium">Tier</th>
            <th className="text-right px-4 py-3 font-medium">Featured on home</th>
          </tr>
        </thead>
        <tbody>
          {items.map((row) => (
            <tr key={row.user._id} className="border-t border-slate-100">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <Avatar src={row.user.profilePhoto} name={row.user.name} size={36} />
                  <div>
                    <div className="font-medium text-slate-900">{row.user.name || "Unnamed"}</div>
                    <div className="text-xs text-slate-500">{row.user.email}</div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-slate-700">
                {(row.profile?.expertise || []).slice(0, 3).join(", ") || "—"}
              </td>
              <td className="px-4 py-3 text-slate-700">
                {row.profile?.avgRating ? `${row.profile.avgRating} (${row.profile.ratingsCount || 0})` : "—"}
              </td>
              <td className="px-4 py-3 capitalize text-slate-700">{row.profile?.tier || "—"}</td>
              <td className="px-4 py-3 text-right">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!row.profile?.isFeaturedOnHome}
                    disabled={busyId === row.user._id}
                    onChange={(e) => toggle(row, e.target.checked)}
                    className="h-4 w-4 accent-[#0a7a90]"
                  />
                </label>
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr><td colSpan={5} className="text-center text-slate-500 py-8">No advisors yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function FeaturedReviewsTab() {
  const toast = useToast();
  const [items, setItems] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [minRating, setMinRating] = useState(4);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get<ReviewRow[]>("/admin/reviews/curation", { minRating, limit: 100 });
      setItems(r.data || []);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [minRating]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = async (row: ReviewRow, next: boolean) => {
    setBusyId(row._id);
    try {
      await api.patch(`/admin/reviews/${row._id}/featured`, { isFeaturedTestimonial: next });
      setItems((prev) => prev.map((it) => (it._id === row._id ? { ...it, isFeaturedTestimonial: next } : it)));
      toast.success(next ? "Marked as featured" : "Removed from featured");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <label className="text-sm text-slate-600">Min rating</label>
        <select
          value={minRating}
          onChange={(e) => setMinRating(Number(e.target.value))}
          className="h-9 px-3 rounded-lg bg-white border border-slate-200 text-sm"
        >
          {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}+</option>)}
        </select>
      </div>

      {loading ? <Spinner /> : (
        <div className="space-y-3">
          {items.map((r) => {
            const displayName = r.isAdminShowcase ? r.showcaseName : r.user?.name;
            return (
              <div key={r._id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-4">
                <Avatar src={r.user?.profilePhoto} name={displayName || "U"} size={40} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-slate-900">{displayName || "Anonymous"}</span>
                    <span className="inline-flex items-center text-amber-500">
                      {Array.from({ length: r.rating }).map((_, i) => <StarIcon key={i} size={14} />)}
                    </span>
                    <span className="text-xs text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                  {r.advisor?.name && (
                    <div className="text-xs text-slate-500 mb-1">about {r.advisor.name}</div>
                  )}
                  <p className="text-sm text-slate-700">{r.comment || <span className="italic text-slate-400">(no comment)</span>}</p>
                </div>
                <label className="inline-flex items-center gap-2 cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={!!r.isFeaturedTestimonial}
                    disabled={busyId === r._id}
                    onChange={(e) => toggle(r, e.target.checked)}
                    className="h-4 w-4 accent-[#0a7a90]"
                  />
                  <span className="text-xs font-medium text-slate-600">Show on homepage</span>
                </label>
              </div>
            );
          })}
          {items.length === 0 && (
            <div className="text-center text-slate-500 py-8 bg-white border border-slate-200 rounded-xl">
              No reviews match this filter.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
