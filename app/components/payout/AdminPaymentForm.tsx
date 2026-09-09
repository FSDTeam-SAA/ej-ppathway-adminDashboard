"use client";
import { useEffect, useRef, useState } from "react";
import { api } from "../../lib/api";
import { formatCurrency, formatDate, formatDuration } from "../../lib/format";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Pagination } from "../ui/Pagination";

type WorkSession = { _id: string; sessionCode: string; actualDurationSec: number; type: string; endedAt?: string; user?: { name?: string } };
export function AdminPaymentForm({ advisorId, tipAvailableUsd, onChanged }: { advisorId: string; tipAvailableUsd: number; onChanged: () => void }) {
  const [sessions, setSessions] = useState<WorkSession[]>([]);
  const [selected, setSelected] = useState<Record<string, WorkSession>>({});
  const [page, setPage] = useState(1), [total, setTotal] = useState(0);
  const [service, setService] = useState(""), [tip, setTip] = useState(""), [note, setNote] = useState("");
  const [busy, setBusy] = useState(false), [loading, setLoading] = useState(true), [error, setError] = useState("");
  const requestId = useRef("");
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.get<WorkSession[]>(`/admin/payouts/accounts/${advisorId}/sessions`, { page, limit: 10 })
      .then((r) => { if (!cancelled) { setSessions(r.data || []); setTotal(r.meta?.total || 0); } })
      .catch(() => { if (!cancelled) setError("Could not load unpaid sessions"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [advisorId, page]);
  const changed = () => { requestId.current = ""; setError(""); };
  const queue = async () => {
    if (busy) return;
    setBusy(true); setError("");
    if (!requestId.current) requestId.current = crypto.randomUUID();
    try {
      await api.post("/admin/payouts", { advisorId, serviceAmountUsd: Number(service || 0), tipAmountUsd: Number(tip || 0),
        sessionIds: Object.keys(selected), requestId: requestId.current, note, process: false });
      onChanged();
    } catch (e) { setError(e instanceof Error ? e.message : "Payment could not be queued"); }
    finally { setBusy(false); }
  };
  return <fieldset disabled={busy} className="min-w-0 rounded-xl border border-slate-200 p-4">
    <legend className="px-1 font-semibold">Create session / tip payment</legend>
    <p className="mb-3 text-xs text-slate-500">Select completed work, set its USD payment, and optionally include net tips. Queue first; send or mark paid from Payout Queue.</p>
    {loading ? <p>Loading sessions…</p> : <div className="max-h-64 space-y-2 overflow-y-auto">
      {sessions.map((s) => <label key={s._id} className="flex items-center gap-2 rounded border border-slate-100 p-2 text-sm">
        <input type="checkbox" checked={!!selected[s._id]} onChange={(e) => { changed(); setSelected((old) => { const next = { ...old }; if (e.target.checked) next[s._id] = s; else delete next[s._id]; return next; }); }} />
        <span className="flex-1">{s.user?.name || "User"} · {s.sessionCode}<span className="block text-xs text-slate-500">{s.type} · {formatDate(s.endedAt)}</span></span>
        <span>{formatDuration(s.actualDurationSec)}</span>
      </label>)}
      {!sessions.length && <p className="text-sm text-slate-500">No unpaid sessions with recorded duration.</p>}
    </div>}
    <Pagination page={page} limit={10} total={total} onPage={setPage} />
    <p className="my-3 text-sm">Selected: {Object.keys(selected).length} sessions · {formatDuration(Object.values(selected).reduce((n, s) => n + s.actualDurationSec, 0))}</p>
    <div className="grid gap-3 sm:grid-cols-2">
      <Input label="Session payment (USD)" type="number" min={0} step="0.01" value={service} onChange={(e) => { changed(); setService(e.target.value); }} />
      <Input label={`Tip payment (up to ${formatCurrency(Math.max(0, tipAvailableUsd))})`} type="number" min={0} max={Math.max(0, tipAvailableUsd)} step="0.01" value={tip} onChange={(e) => { changed(); setTip(e.target.value); }} />
    </div>
    <div className="my-3"><Input label="Payment note" value={note} onChange={(e) => { changed(); setNote(e.target.value); }} /></div>
    <p className="mb-3 font-semibold">Total: {formatCurrency(Number(service || 0) + Number(tip || 0))}</p>
    {error && <p role="alert" className="mb-3 text-sm text-red-600">{error}</p>}
    <Button loading={busy} onClick={queue}>Queue payment</Button>
  </fieldset>;
}
