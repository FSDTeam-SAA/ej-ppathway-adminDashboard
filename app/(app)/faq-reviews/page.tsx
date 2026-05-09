"use client";

import { useEffect, useState } from "react";
import { Topbar } from "../../components/Topbar";
import { PageHeader } from "../../components/PageHeader";
import { Spinner } from "../../components/Spinner";
import { Modal, ConfirmDialog } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { Avatar } from "../../components/ui/Avatar";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  EditIcon,
  PlusIcon,
  StarIcon,
  TrashIcon,
  UploadIcon,
} from "../../components/Icons";
import { api, ApiError } from "../../lib/api";
import { useToast } from "../../lib/toast";
import type { Faq, ShowcaseReview } from "../../lib/types";

export default function FaqReviewPage() {
  const [view, setView] = useState<"faqs" | "reviews">("faqs");
  return (
    <>
      <Topbar />
      <main className="px-6 md:px-8 pb-10">
        <PageHeader
          title="FAQ&apos;s & Review Management"
          breadcrumb={[
            { label: "Dashboard", href: "/" },
            { label: "FAQ & Review Management" },
          ]}
          action={
            <div className="inline-flex items-center gap-2 bg-white rounded-full p-1 border border-slate-200">
              <button
                type="button"
                onClick={() => setView("faqs")}
                className={`px-5 h-9 rounded-full text-sm font-medium ${
                  view === "faqs"
                    ? "bg-[#0a7a90] text-white"
                    : "text-slate-700"
                }`}
              >
                FAQ&apos;s
              </button>
              <button
                type="button"
                onClick={() => setView("reviews")}
                className={`px-5 h-9 rounded-full text-sm font-medium ${
                  view === "reviews"
                    ? "bg-[#0a7a90] text-white"
                    : "text-slate-700"
                }`}
              >
                Reviews
              </button>
            </div>
          }
        />

        {view === "faqs" ? <FaqSection /> : <ReviewsSection />}
      </main>
    </>
  );
}

function FaqSection() {
  const toast = useToast();
  const [items, setItems] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<string | null>(null);
  const [editing, setEditing] = useState<Faq | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Faq | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get<Faq[]>("/cms/admin/faqs");
      setItems(r.data || []);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const submitDelete = async () => {
    if (!deleteConfirm) return;
    setActionLoading(true);
    try {
      await api.delete(`/cms/faqs/${deleteConfirm._id}`);
      toast.success("FAQ deleted");
      setDeleteConfirm(null);
      load();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed";
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-slate-900">FAQ&apos;s Management</h2>
        <Button onClick={() => setCreating(true)}>
          <PlusIcon size={16} /> Add New FAQ
        </Button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center text-[#0a7a90]">
          <Spinner size={32} />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center text-slate-500">
          No FAQs yet
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((f) => {
            const isOpen = open === f._id;
            return (
              <div
                key={f._id}
                className="bg-white rounded-2xl border border-slate-100 px-5 py-4"
              >
                <div className="flex items-start gap-4">
                  <button
                    type="button"
                    className="flex-1 text-left font-semibold text-lg text-slate-900"
                    onClick={() => setOpen(isOpen ? null : f._id)}
                  >
                    {f.question}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : f._id)}
                    className="text-slate-500"
                    aria-label="Toggle"
                  >
                    {isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(f)}
                    className="inline-flex items-center gap-1.5 text-emerald-600 text-sm font-medium hover:underline"
                  >
                    <EditIcon size={14} /> Edit Details
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm(f)}
                    className="h-9 w-9 rounded-full border border-red-200 text-red-500 inline-flex items-center justify-center hover:bg-red-50"
                    aria-label="Delete"
                  >
                    <TrashIcon size={16} />
                  </button>
                </div>
                {isOpen && (
                  <p className="mt-3 text-slate-600 text-sm whitespace-pre-line">
                    {f.answer}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <FaqModal
        open={creating}
        onClose={() => setCreating(false)}
        onSaved={() => {
          setCreating(false);
          load();
        }}
      />
      <FaqModal
        open={!!editing}
        faq={editing}
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
        title="Delete FAQ?"
        description="This FAQ will be permanently removed."
        danger
        loading={actionLoading}
      />
    </>
  );
}

function FaqModal({
  open,
  onClose,
  onSaved,
  faq,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  faq?: Faq | null;
}) {
  const toast = useToast();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (faq) {
      setQuestion(faq.question);
      setAnswer(faq.answer);
    } else {
      setQuestion("");
      setAnswer("");
    }
  }, [faq, open]);

  const submit = async () => {
    if (!question || !answer) {
      toast.error("Question and answer are required");
      return;
    }
    setLoading(true);
    try {
      if (faq) {
        await api.patch(`/cms/faqs/${faq._id}`, { question, answer });
        toast.success("FAQ updated");
      } else {
        await api.post(`/cms/faqs`, { question, answer });
        toast.success("FAQ created");
      }
      onSaved();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={faq ? "Edit FAQ" : "Add New FAQ"}>
      <div className="space-y-4">
        <Input
          label="Question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <Textarea
          label="Answer"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          className="min-h-[160px]"
        />
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={loading}>
            {faq ? "Save" : "Add"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function ReviewsSection() {
  const toast = useToast();
  const [items, setItems] = useState<ShowcaseReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ShowcaseReview | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<ShowcaseReview | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get<ShowcaseReview[]>("/reviews/showcase");
      setItems(r.data || []);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const submitDelete = async () => {
    if (!deleteConfirm) return;
    setActionLoading(true);
    try {
      await api.delete(`/admin/reviews/showcase/${deleteConfirm._id}`);
      toast.success("Review deleted");
      setDeleteConfirm(null);
      load();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed";
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-slate-900">Review Management</h2>
        <Button onClick={() => setCreating(true)}>
          <PlusIcon size={16} /> Create New Review
        </Button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center text-[#0a7a90]">
          <Spinner size={32} />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center text-slate-500">
          No reviews yet
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {items.map((r) => (
            <div
              key={r._id}
              className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <button
                  type="button"
                  onClick={() => setEditing(r)}
                  className="inline-flex items-center gap-1.5 text-emerald-600 text-sm font-medium hover:underline"
                >
                  <EditIcon size={14} /> Edit Details
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(r)}
                  className="h-8 w-8 rounded-full border border-red-200 text-red-500 inline-flex items-center justify-center hover:bg-red-50"
                  aria-label="Delete"
                >
                  <TrashIcon size={14} />
                </button>
              </div>

              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Avatar src={r.showcasePhoto} name={r.showcaseName} size={42} />
                  <div>
                    <div className="font-semibold text-slate-900">
                      {r.showcaseName || "—"}
                    </div>
                    <div className="text-xs text-slate-500">
                      {r.showcaseLocation || "—"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <StarIcon
                      key={i}
                      size={16}
                      filled={i < Math.round(r.rating)}
                    />
                  ))}
                </div>
              </div>
              <p className="text-sm text-slate-600 line-clamp-4">
                {r.comment?.replace(/<[^>]*>/g, "")}
              </p>
            </div>
          ))}
        </div>
      )}

      <ReviewModal
        open={creating}
        onClose={() => setCreating(false)}
        onSaved={() => {
          setCreating(false);
          load();
        }}
      />
      <ReviewModal
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
        description="This review will be permanently removed."
        danger
        loading={actionLoading}
      />
    </>
  );
}

function ReviewModal({
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
    if (!name) {
      toast.error("Name required");
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
        toast.success("Review updated");
      } else {
        await api.post(`/admin/reviews/showcase`, fd, { isFormData: true });
        toast.success("Review created");
      }
      onSaved();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={review ? "Edit Review" : "Create New Review"}
      size="md"
    >
      <div className="space-y-4">
        <div>
          <div className="text-sm font-medium text-slate-700 mb-2">Select Ratings</div>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                aria-label={`${n} star`}
              >
                <StarIcon size={32} filled={n <= rating} />
              </button>
            ))}
          </div>
        </div>
        <Input
          label="Enter Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Type your name..."
        />
        <Input
          label="Enter Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Type your location..."
        />
        <div>
          <div className="text-sm font-medium text-slate-700 mb-2">
            Upload Profile Picture
          </div>
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
                {photo ? photo.name : "Upload Profile Photo"}
              </div>
              <div className="text-xs text-slate-500">png, jpeg, jpg</div>
            </div>
          </label>
        </div>
        <Textarea
          label="Type review Description"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Type review description..."
          className="min-h-[120px]"
        />
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={onClose}>
            Not Now
          </Button>
          <Button onClick={submit} loading={loading}>
            {review ? "Save" : "Add"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
