"use client";

import { useEffect, useState } from "react";
import { Topbar } from "../../components/Topbar";
import { PageHeader } from "../../components/PageHeader";
import { CardSkeleton } from "../../components/Skeleton";
import { Modal, ConfirmDialog } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { Avatar } from "../../components/ui/Avatar";
import { EditIcon, PlusIcon, StarIcon, TrashIcon, UploadIcon } from "../../components/Icons";
import { api, ApiError } from "../../lib/api";
import { useToast } from "../../lib/toast";
import type { ShowcaseReview } from "../../lib/types";

export default function TestimonialsPage() {
  const toast = useToast();
  const [items, setItems] = useState<ShowcaseReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ShowcaseReview | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<ShowcaseReview | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [featuringId, setFeaturingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get<ShowcaseReview[]>("/reviews/showcase");
      setItems(r.data || []);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to load testimonials");
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
      await api.delete(`/admin/reviews/showcase/${deleteConfirm._id}`);
      toast.success("Testimonial deleted");
      setDeleteConfirm(null);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Delete failed");
    } finally {
      setActionLoading(false);
    }
  };

  const toggleFeatured = async (t: ShowcaseReview) => {
    const next = !t.isFeaturedTestimonial;
    setFeaturingId(t._id);
    // Optimistic update
    setItems((prev) => prev.map((x) => (x._id === t._id ? { ...x, isFeaturedTestimonial: next } : x)));
    try {
      await api.patch(`/admin/reviews/${t._id}/featured`, { isFeaturedTestimonial: next });
      toast.success(next ? "Now featured on the website" : "Removed from website");
    } catch (err) {
      // Revert on failure
      setItems((prev) => prev.map((x) => (x._id === t._id ? { ...x, isFeaturedTestimonial: !next } : x)));
      toast.error(err instanceof ApiError ? err.message : "Update failed");
    } finally {
      setFeaturingId(null);
    }
  };

  const featuredCount = items.filter((i) => i.isFeaturedTestimonial).length;

  return (
    <>
      <Topbar />
      <main className="px-6 md:px-8 pb-10">
        <PageHeader
          title="Testimonials"
          breadcrumb={[{ label: "Dashboard", href: "/" }, { label: "Testimonials" }]}
          action={
            <Button onClick={() => setCreating(true)}>
              <PlusIcon size={16} /> Add Testimonial
            </Button>
          }
        />

        <div className="mb-5 rounded-2xl border border-[#bfe3ec] bg-[#e9f6f9] px-5 py-4 text-sm text-slate-700 flex items-start gap-3">
          <StarIcon size={18} filled className="mt-0.5 shrink-0 text-[#0a7a90]" />
          <p>
            Testimonials you add here can be created, edited and deleted below. Toggle{" "}
            <span className="font-semibold">Featured</span> to show a testimonial in the
            &ldquo;What Our Customers Say&rdquo; section on the website homepage.
            {featuredCount > 0 && (
              <span className="text-slate-500"> ({featuredCount} currently featured)</span>
            )}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <div className="mx-auto h-14 w-14 rounded-full bg-[#e6f2f6] text-[#0a7a90] inline-flex items-center justify-center mb-4">
              <StarIcon size={26} />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">No testimonials yet</h3>
            <p className="text-slate-500 text-sm mt-1 mb-5">
              Add your first customer testimonial to showcase on the website.
            </p>
            <Button onClick={() => setCreating(true)}>
              <PlusIcon size={16} /> Add Testimonial
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {items.map((t) => (
              <div
                key={t._id}
                className={`bg-white rounded-2xl border p-5 shadow-sm flex flex-col ${
                  t.isFeaturedTestimonial ? "border-[#0a7a90]/60 ring-2 ring-[#0a7a90]/15" : "border-slate-100"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <StarIcon key={i} size={16} filled={i < Math.round(t.rating)} />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditing(t)}
                      className="inline-flex items-center gap-1.5 text-emerald-600 text-sm font-medium hover:underline"
                    >
                      <EditIcon size={14} /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(t)}
                      className="h-8 w-8 rounded-full border border-red-200 text-red-500 inline-flex items-center justify-center hover:bg-red-50"
                      aria-label="Delete"
                    >
                      <TrashIcon size={14} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <Avatar src={t.showcasePhoto} name={t.showcaseName} size={42} />
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 truncate">{t.showcaseName || "—"}</div>
                    <div className="text-xs text-slate-500 truncate">{t.showcaseLocation || "—"}</div>
                  </div>
                </div>

                <p className="text-sm text-slate-600 line-clamp-4 flex-1">
                  {t.comment?.replace(/<[^>]*>/g, "") || "—"}
                </p>

                <button
                  type="button"
                  onClick={() => toggleFeatured(t)}
                  disabled={featuringId === t._id}
                  className={`mt-4 inline-flex items-center justify-center gap-2 h-9 rounded-full text-sm font-medium transition-colors disabled:opacity-60 ${
                    t.isFeaturedTestimonial
                      ? "bg-[#0a7a90] text-white hover:bg-[#086476]"
                      : "border border-[#0a7a90] text-[#0a7a90] hover:bg-[#e6f2f6]"
                  }`}
                >
                  <StarIcon size={15} filled={t.isFeaturedTestimonial} />
                  {t.isFeaturedTestimonial ? "Featured on website" : "Feature on website"}
                </button>
              </div>
            ))}
          </div>
        )}

        <TestimonialModal
          open={creating}
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            load();
          }}
        />
        <TestimonialModal
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
          title="Delete testimonial?"
          description="This testimonial will be permanently removed from the website."
          confirmText="Delete"
          danger
          loading={actionLoading}
        />
      </main>
    </>
  );
}

function TestimonialModal({
  open,
  onClose,
  onSaved,
  review,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  review?: ShowcaseReview | null;
}) {
  const toast = useToast();
  const [rating, setRating] = useState(5);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [comment, setComment] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (review) {
      setRating(review.rating || 5);
      setName(review.showcaseName || "");
      setLocation(review.showcaseLocation || "");
      setComment(review.comment || "");
    } else {
      setRating(5);
      setName("");
      setLocation("");
      setComment("");
    }
    setPhoto(null);
  }, [review, open]);

  const submit = async () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!comment.trim()) {
      toast.error("Testimonial text is required");
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("rating", String(rating));
      fd.append("name", name);
      fd.append("location", location);
      fd.append("comment", comment);
      if (photo) fd.append("photo", photo);
      if (review) {
        await api.patch(`/admin/reviews/showcase/${review._id}`, fd, { isFormData: true });
        toast.success("Testimonial updated");
      } else {
        await api.post(`/admin/reviews/showcase`, fd, { isFormData: true });
        toast.success("Testimonial created");
      }
      onSaved();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Save failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={review ? "Edit Testimonial" : "Add Testimonial"}
      size="md"
    >
      <div className="space-y-4">
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
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Customer name"
        />
        <Input
          label="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="City, Country"
        />
        <div>
          <div className="text-sm font-medium text-slate-700 mb-2">Profile Picture</div>
          <label className="block bg-[#e6f2f6]/60 border border-dashed border-[#cbe4eb] rounded-lg px-4 py-8 text-center cursor-pointer hover:bg-[#e6f2f6]">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setPhoto(e.target.files?.[0] || null)}
            />
            <div className="inline-flex flex-col items-center text-[#0a7a90]">
              <UploadIcon size={28} />
              <div className="font-semibold text-slate-700 mt-2">
                {photo ? photo.name : review?.showcasePhoto ? "Replace photo" : "Upload Profile Photo"}
              </div>
              <div className="text-xs text-slate-500">png, jpeg, jpg</div>
            </div>
          </label>
        </div>
        <Textarea
          label="Testimonial"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="What did the customer say?"
          className="min-h-[120px]"
        />
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={loading}>
            {review ? "Save" : "Add"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
