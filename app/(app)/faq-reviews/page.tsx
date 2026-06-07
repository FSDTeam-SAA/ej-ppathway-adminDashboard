"use client";

import { useEffect, useState } from "react";
import { Topbar } from "../../components/Topbar";
import { PageHeader } from "../../components/PageHeader";
import { Skeleton } from "../../components/Skeleton";
import { Modal, ConfirmDialog } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { Textarea } from "../../components/ui/Input";
import { Avatar } from "../../components/ui/Avatar";
import { EditIcon, StarIcon, TrashIcon } from "../../components/Icons";
import { BulkActionsBar, BulkCheckbox } from "../../components/BulkActionsBar";
import { api, ApiError } from "../../lib/api";
import { useToast } from "../../lib/toast";
import { useBulkSelection } from "../../lib/use-bulk-selection";
import type { UserReview } from "../../lib/types";

export default function ReviewManagementPage() {
  const toast = useToast();
  const [items, setItems] = useState<UserReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<UserReview | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<UserReview | null>(null);
  const [bulkConfirm, setBulkConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const bulk = useBulkSelection(items);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get<UserReview[]>("/admin/reviews/user", { limit: 100 });
      setItems(r.data || []);
      bulk.clear();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitDelete = async () => {
    if (!deleteConfirm) return;
    setActionLoading(true);
    try {
      await api.delete(`/admin/reviews/user/${deleteConfirm._id}`);
      toast.success("Review deleted");
      setDeleteConfirm(null);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Delete failed");
    } finally {
      setActionLoading(false);
    }
  };

  const submitBulkDelete = async () => {
    if (bulk.selectedCount === 0) return;
    setActionLoading(true);
    const ids = bulk.selectedArray;
    const results = await Promise.allSettled(
      ids.map((id) => api.delete(`/admin/reviews/user/${id}`))
    );
    setActionLoading(false);
    const failed = results.filter((r) => r.status === "rejected").length;
    const ok = results.length - failed;
    if (ok > 0) toast.success(`Deleted ${ok} review${ok === 1 ? "" : "s"}`);
    if (failed > 0) toast.error(`${failed} delete${failed === 1 ? "" : "s"} failed`);
    setBulkConfirm(false);
    load();
  };

  return (
    <>
      <Topbar />
      <main className="px-6 md:px-8 pb-10">
        <PageHeader
          title="Review Management"
          breadcrumb={[{ label: "Dashboard", href: "/" }, { label: "Review Management" }]}
        />

        <div className="mb-5 rounded-2xl border border-[#bfe3ec] bg-[#e9f6f9] px-5 py-4 text-sm text-slate-700">
          Reviews submitted by users about advisors. Edit a review to moderate its content, or
          delete reviews that violate the guidelines. Marketing testimonials are managed separately
          under <span className="font-semibold">Testimonials</span>.
        </div>

        <BulkActionsBar
          selectedCount={bulk.selectedCount}
          onClear={bulk.clear}
          onDelete={() => setBulkConfirm(true)}
        />

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center text-slate-500">
            No user reviews yet.
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((r) => {
              const selected = bulk.isSelected(r._id);
              return (
                <div
                  key={r._id}
                  className={`bg-white rounded-2xl border p-5 ${
                    selected ? "border-[#0a7a90]/60 ring-2 ring-[#0a7a90]/20" : "border-slate-100"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <span className="pt-1">
                      <BulkCheckbox
                        ariaLabel={`Select review by ${r.user?.name || "user"}`}
                        checked={selected}
                        onChange={() => bulk.toggle(r._id)}
                      />
                    </span>

                    <Avatar src={r.user?.profilePhoto} name={r.user?.name} size={42} />

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-semibold text-slate-900">{r.user?.name || "Anonymous"}</span>
                        {r.advisor?.name && (
                          <span className="text-xs text-slate-500">
                            on <span className="font-medium text-slate-700">{r.advisor.name}</span>
                          </span>
                        )}
                        <span className="inline-flex items-center gap-0.5 ml-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <StarIcon key={i} size={14} filled={i < Math.round(r.rating)} />
                          ))}
                        </span>
                        {r.sessionType && (
                          <span className="text-[11px] uppercase tracking-wide text-slate-400">
                            {r.sessionType}
                          </span>
                        )}
                        <span className="text-xs text-slate-400 ml-auto">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-600 whitespace-pre-line break-words">
                        {r.comment?.replace(/<[^>]*>/g, "") || <span className="text-slate-400">No comment</span>}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setEditing(r)}
                        className="inline-flex items-center gap-1.5 text-emerald-600 text-sm font-medium hover:underline"
                      >
                        <EditIcon size={14} /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirm(r)}
                        className="h-9 w-9 rounded-full border border-red-200 text-red-500 inline-flex items-center justify-center hover:bg-red-50"
                        aria-label="Delete"
                      >
                        <TrashIcon size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <ReviewEditModal
          open={!!editing}
          review={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
        <ConfirmDialog
          open={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={submitDelete}
          title="Delete review?"
          description="This user review will be permanently removed and the advisor's rating recalculated."
          confirmText="Delete"
          danger
          loading={actionLoading}
        />
        <ConfirmDialog
          open={bulkConfirm}
          onClose={() => setBulkConfirm(false)}
          onConfirm={submitBulkDelete}
          title={`Delete ${bulk.selectedCount} review${bulk.selectedCount === 1 ? "" : "s"}?`}
          description="The selected reviews will be permanently removed."
          confirmText="Delete"
          danger
          loading={actionLoading}
        />
      </main>
    </>
  );
}

function ReviewEditModal({
  open,
  onClose,
  onSaved,
  review,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  review?: UserReview | null;
}) {
  const toast = useToast();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (review) {
      setRating(review.rating || 5);
      setComment(review.comment || "");
    }
  }, [review, open]);

  const submit = async () => {
    if (!review) return;
    setLoading(true);
    try {
      await api.patch(`/admin/reviews/user/${review._id}`, { rating, comment });
      toast.success("Review updated");
      onSaved();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Save failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Edit Review" size="md">
      <div className="space-y-4">
        {review && (
          <div className="flex items-center gap-3">
            <Avatar src={review.user?.profilePhoto} name={review.user?.name} size={40} />
            <div className="min-w-0">
              <div className="font-semibold text-slate-900 truncate">{review.user?.name || "Anonymous"}</div>
              {review.advisor?.name && (
                <div className="text-xs text-slate-500 truncate">on {review.advisor.name}</div>
              )}
            </div>
          </div>
        )}
        <div>
          <div className="text-sm font-medium text-slate-700 mb-2">Rating</div>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} star`}>
                <StarIcon size={30} filled={n <= rating} />
              </button>
            ))}
          </div>
        </div>
        <Textarea
          label="Review Comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Review text..."
          className="min-h-[120px]"
        />
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={loading}>
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}
