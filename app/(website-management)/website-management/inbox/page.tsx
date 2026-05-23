"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "../../../components/PageHeader";
import { Spinner } from "../../../components/Spinner";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { Textarea } from "../../../components/ui/Input";
import { TrashIcon } from "../../../components/Icons";
import { api, ApiError } from "../../../lib/api";
import { useToast } from "../../../lib/toast";
import { formatDate } from "../../../lib/format";

type ContactMessage = {
  _id: string;
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  subject?: string;
  category?: string;
  message: string;
  status: "new" | "in_progress" | "resolved" | "archived";
  adminNote?: string;
  handledAt?: string;
  createdAt: string;
};

const STATUSES: ContactMessage["status"][] = ["new", "in_progress", "resolved", "archived"];

const STATUS_TONE: Record<ContactMessage["status"], "warning" | "info" | "success" | "neutral"> = {
  new: "warning",
  in_progress: "info",
  resolved: "success",
  archived: "neutral"
};

export default function InboxPage() {
  const toast = useToast();
  const [items, setItems] = useState<ContactMessage[]>([]);
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get<ContactMessage[]>("/contact", filter ? { status: filter, limit: 100 } : { limit: 100 });
      setItems(r.data || []);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Load failed");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setNote(selected?.adminNote || "");
  }, [selected]);

  const updateStatus = async (m: ContactMessage, status: ContactMessage["status"]) => {
    setSaving(true);
    try {
      const r = await api.patch<ContactMessage>(`/contact/${m._id}`, { status });
      if (r.data) {
        setItems((prev) => prev.map((it) => (it._id === m._id ? r.data! : it)));
        if (selected?._id === m._id) setSelected(r.data);
        toast.success("Status updated");
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const saveNote = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const r = await api.patch<ContactMessage>(`/contact/${selected._id}`, { adminNote: note });
      if (r.data) {
        setItems((prev) => prev.map((it) => (it._id === selected._id ? r.data! : it)));
        setSelected(r.data);
        toast.success("Note saved");
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (m: ContactMessage) => {
    if (!confirm("Delete this message?")) return;
    try {
      await api.delete(`/contact/${m._id}`);
      setItems((prev) => prev.filter((it) => it._id !== m._id));
      if (selected?._id === m._id) setSelected(null);
      toast.success("Deleted");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Delete failed");
    }
  };

  return (
    <main className="px-6 md:px-10 py-8 w-full pb-16">
      <PageHeader
        title="Inbox"
        description="Messages submitted through the public contact form."
        breadcrumb={[{ label: "Website Management", href: "/website-management" }, { label: "Inbox" }]}
        action={
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-10 px-3 rounded-lg bg-white border border-slate-200 text-sm"
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
          </select>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-4">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden max-h-[70vh] overflow-y-auto">
          {loading ? <div className="p-8"><Spinner /></div> : items.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">No messages.</div>
          ) : (
            <ul>
              {items.map((m) => (
                <li key={m._id}>
                  <button
                    onClick={() => setSelected(m)}
                    className={`w-full text-left p-4 border-b border-slate-100 hover:bg-slate-50 transition ${selected?._id === m._id ? "bg-[#e6f2f6]" : ""}`}
                  >
                    <div className="flex items-center justify-between mb-1 gap-2">
                      <div className="font-medium text-slate-900 truncate">
                        {m.firstName} {m.lastName}
                      </div>
                      <Badge tone={STATUS_TONE[m.status]}>{m.status.replace("_", " ")}</Badge>
                    </div>
                    <div className="text-xs text-slate-500 mb-1">{m.email}</div>
                    <div className="text-sm text-slate-700 truncate font-medium">
                      {m.subject || <span className="italic">(no subject)</span>}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">{formatDate(m.createdAt)} · {m.category}</div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 min-h-[70vh]">
          {!selected ? (
            <div className="h-full flex items-center justify-center text-sm text-slate-500">
              Select a message to view details.
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {selected.subject || "(no subject)"}
                  </h2>
                  <div className="text-sm text-slate-500 mt-1">
                    From <span className="font-medium text-slate-700">{selected.firstName} {selected.lastName}</span>
                    {" · "} <a href={`mailto:${selected.email}`} className="text-[#0a7a90] hover:underline">{selected.email}</a>
                    {selected.phone ? ` · ${selected.phone}` : null}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {formatDate(selected.createdAt)} · {selected.category}
                  </div>
                </div>
                <button onClick={() => remove(selected)} className="h-9 w-9 rounded border border-red-200 text-red-500 hover:bg-red-50 inline-flex items-center justify-center">
                  <TrashIcon size={14} />
                </button>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 whitespace-pre-wrap text-sm text-slate-800">
                {selected.message}
              </div>

              <div>
                <div className="text-sm font-medium text-slate-700 mb-2">Status</div>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      disabled={saving || selected.status === s}
                      onClick={() => updateStatus(selected, s)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                        selected.status === s
                          ? "bg-[#0a7a90] text-white border-[#0a7a90]"
                          : "bg-white text-slate-700 border-slate-300 hover:border-[#0a7a90]"
                      }`}
                    >
                      {s.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Textarea label="Internal note (only visible to admins)" rows={4}
                  value={note} onChange={(e) => setNote(e.target.value)} />
                <div className="mt-2 flex gap-2">
                  <Button size="sm" onClick={saveNote} loading={saving}>Save note</Button>
                  <a href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject || "Your message")}`}>
                    <Button size="sm" variant="outline">Reply via email</Button>
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
