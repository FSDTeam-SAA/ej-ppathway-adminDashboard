"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "../../../components/PageHeader";
import { Spinner } from "../../../components/Spinner";
import { Button } from "../../../components/ui/Button";
import { Input, Textarea } from "../../../components/ui/Input";
import { Modal, ConfirmDialog } from "../../../components/ui/Modal";
import { Badge } from "../../../components/ui/Badge";
import { EditIcon, PlusIcon, TrashIcon, ChevronUpIcon, ChevronDownIcon } from "../../../components/Icons";
import { api, ApiError } from "../../../lib/api";
import { useToast } from "../../../lib/toast";
import type { Faq } from "../../../lib/types";

type FaqRow = Faq & { category?: string };

export default function FaqsPage() {
  const toast = useToast();
  const [items, setItems] = useState<FaqRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<FaqRow | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<FaqRow | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get<FaqRow[]>("/cms/admin/faqs");
      setItems(r.data || []);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Load failed");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const submitDelete = async () => {
    if (!deleteConfirm) return;
    setActionLoading(true);
    try {
      await api.delete(`/cms/faqs/${deleteConfirm._id}`);
      toast.success("FAQ removed");
      setDeleteConfirm(null);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Delete failed");
    } finally {
      setActionLoading(false);
    }
  };

  const move = async (faq: FaqRow, dir: -1 | 1) => {
    const sorted = [...items].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    const i = sorted.findIndex((x) => x._id === faq._id);
    const j = i + dir;
    if (j < 0 || j >= sorted.length) return;
    const aOrder = sorted[i].sortOrder ?? i;
    const bOrder = sorted[j].sortOrder ?? j;
    try {
      await Promise.all([
        api.patch(`/cms/faqs/${sorted[i]._id}`, { sortOrder: bOrder }),
        api.patch(`/cms/faqs/${sorted[j]._id}`, { sortOrder: aOrder })
      ]);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Reorder failed");
    }
  };

  const toggleActive = async (faq: FaqRow) => {
    try {
      await api.patch(`/cms/faqs/${faq._id}`, { isActive: !faq.isActive });
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Update failed");
    }
  };

  const sorted = [...items].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  return (
    <main className="px-6 md:px-10 py-8 max-w-5xl mx-auto pb-16">
      <PageHeader
        title="FAQs"
        description="Frequently asked questions shown on multiple public pages."
        breadcrumb={[{ label: "Website Management", href: "/website-management" }, { label: "FAQs" }]}
        action={
          <Button onClick={() => setCreating(true)}>
            <PlusIcon size={16} /> Add FAQ
          </Button>
        }
      />

      {loading ? <Spinner /> : (
        <div className="space-y-2">
          {sorted.map((faq, i) => (
            <div key={faq._id} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-start gap-3">
                <div className="flex flex-col gap-1">
                  <button onClick={() => move(faq, -1)} disabled={i === 0}
                    className="h-7 w-7 rounded inline-flex items-center justify-center text-slate-500 hover:bg-slate-100 disabled:opacity-30">
                    <ChevronUpIcon size={14} />
                  </button>
                  <button onClick={() => move(faq, 1)} disabled={i === sorted.length - 1}
                    className="h-7 w-7 rounded inline-flex items-center justify-center text-slate-500 hover:bg-slate-100 disabled:opacity-30">
                    <ChevronDownIcon size={14} />
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-slate-900">{faq.question}</span>
                    {faq.category && faq.category !== "general" ? (
                      <Badge tone="info">{faq.category}</Badge>
                    ) : null}
                    {!faq.isActive ? <Badge tone="warning">hidden</Badge> : null}
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2">{faq.answer}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <label className="inline-flex items-center gap-1 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!faq.isActive}
                      onChange={() => toggleActive(faq)}
                      className="h-4 w-4 accent-[#0a7a90]"
                    />
                    Visible
                  </label>
                  <button onClick={() => setEditing(faq)} className="h-8 w-8 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 inline-flex items-center justify-center">
                    <EditIcon size={14} />
                  </button>
                  <button onClick={() => setDeleteConfirm(faq)} className="h-8 w-8 rounded border border-red-200 text-red-500 hover:bg-red-50 inline-flex items-center justify-center">
                    <TrashIcon size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {sorted.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-500">No FAQs yet.</div>
          )}
        </div>
      )}

      <FaqModal open={creating} onClose={() => setCreating(false)}
        onSaved={() => { setCreating(false); load(); }} />
      <FaqModal open={!!editing} faq={editing} onClose={() => setEditing(null)}
        onSaved={() => { setEditing(null); load(); }} />
      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={submitDelete}
        title="Delete FAQ?"
        description={`"${deleteConfirm?.question}" will be permanently removed.`}
        danger
        loading={actionLoading}
      />
    </main>
  );
}

function FaqModal({
  open,
  faq,
  onClose,
  onSaved
}: {
  open: boolean;
  faq?: FaqRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [category, setCategory] = useState("general");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (faq) {
      setQuestion(faq.question || "");
      setAnswer(faq.answer || "");
      setCategory(faq.category || "general");
      setIsActive(!!faq.isActive);
    } else {
      setQuestion("");
      setAnswer("");
      setCategory("general");
      setIsActive(true);
    }
  }, [faq, open]);

  const submit = async () => {
    if (!question || !answer) {
      toast.error("Question and answer required");
      return;
    }
    setLoading(true);
    try {
      const body = { question, answer, category, isActive };
      if (faq) {
        await api.patch(`/cms/faqs/${faq._id}`, body);
        toast.success("FAQ updated");
      } else {
        await api.post("/cms/faqs", body);
        toast.success("FAQ added");
      }
      onSaved();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Save failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={faq ? "Edit FAQ" : "Add FAQ"} size="md">
      <div className="space-y-4">
        <Input label="Question *" value={question} onChange={(e) => setQuestion(e.target.value)} />
        <Textarea label="Answer *" rows={6} value={answer} onChange={(e) => setAnswer(e.target.value)} />
        <Input label="Category (default: general)" value={category} onChange={(e) => setCategory(e.target.value)} />
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 accent-[#0a7a90]" />
          Show on public pages
        </label>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={loading}>{faq ? "Save" : "Add"}</Button>
        </div>
      </div>
    </Modal>
  );
}
