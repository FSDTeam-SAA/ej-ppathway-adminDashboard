"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { formatCurrency, formatDate } from "../../lib/format";
import type { Transaction, TipEarningsBreakdown } from "../../lib/types";
import { Pagination } from "../ui/Pagination";
import { TableSkeleton } from "../Skeleton";
import { StatusBadge } from "../ui/Badge";

type Tip = Transaction & { tipBreakdown: TipEarningsBreakdown & { platform: string } };
const platform = (value: string) => ({ ios: "App Store", app_store: "App Store", android: "Play Store", play_store: "Play Store", direct: "Direct credits" }[value] || "Store (unknown)");

export function TipHistory({ q }: { q: string }) {
  const [items, setItems] = useState<Tip[]>([]);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => setPage(1), [q, status]);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    api.get<Tip[]>("/admin/finance/transactions", { type: "advisor_tip,advisor_tip_fiat", q, status: status || undefined, page, limit: 10 })
      .then((r) => { if (!cancelled) { setItems(r.data || []); setTotal(r.meta?.total || 0); } })
      .catch(() => { if (!cancelled) setError("Could not load tip history. Refresh to retry."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [q, page, status]);
  return <div className="rounded-2xl border border-slate-100 bg-white p-5">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="font-semibold">Tip History</h2><p className="text-xs text-slate-500">One advisor receipt per tip. Amounts in USD; refunded tips are excluded from earnings totals.</p><p className="text-xs text-slate-500">Deductions use provider-reported proceeds; final store settlement may differ. Legacy credit tips have no store deduction.</p></div>
      <select aria-label="Tip status" value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-slate-200 p-2 text-sm">
        <option value="">All statuses</option>{["completed", "pending", "refunded", "failed", "cancelled"].map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
    </div>
    {error ? <p role="alert" className="text-red-600">{error}</p> : loading ? <TableSkeleton rows={5} cols={8} /> : <div className="overflow-x-auto">
      <table className="w-full min-w-[1000px] text-left text-sm">
        <thead><tr>{["User / Advisor", "Transaction / Session", "Platform", "Gross", "Fee / Tax", "Deducted", "Net", "Status / Date"].map((h) => <th key={h} className="border-b p-3 text-xs font-medium text-slate-500">{h}</th>)}</tr></thead>
        <tbody>{items.map((t) => { const b = t.tipBreakdown; return <tr key={t._id} className="border-b border-slate-100">
          <td className="p-3">{t.user?.name || "User"}<div className="text-xs text-slate-500">To {t.advisor?.name || "Advisor"}</div></td>
          <td className="p-3">{t.txCode || t._id}<div className="text-xs text-slate-500">{typeof t.session === "object" ? t.session?.sessionCode : t.session || "—"}</div></td>
          <td className="p-3">{platform(b.platform)}</td><td className="p-3">{formatCurrency(b.grossUsd)}</td>
          <td className="p-3">{formatCurrency(b.commissionUsd)} / {formatCurrency(b.taxUsd)}</td>
          <td className="p-3">{formatCurrency(b.deductionsUsd)} ({b.deductionPercent}%)</td>
          <td className="p-3 font-semibold text-emerald-700">{formatCurrency(b.netUsd)}</td>
          <td className="p-3"><StatusBadge status={t.status} /><div className="mt-1 text-xs text-slate-500">{formatDate(t.createdAt, true)}</div></td>
        </tr>; })}{!items.length && <tr><td colSpan={8} className="p-8 text-center text-slate-500">No tips found</td></tr>}</tbody>
      </table>
    </div>}
    <div className="mt-4"><Pagination page={page} limit={10} total={total} onPage={setPage} /></div>
  </div>;
}
