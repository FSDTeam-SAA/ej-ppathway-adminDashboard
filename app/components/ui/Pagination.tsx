"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "../Icons";

export function Pagination({
  page,
  total,
  limit,
  onPage,
  onLimit,
}: {
  page: number;
  total: number;
  limit: number;
  onPage: (p: number) => void;
  onLimit?: (l: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const showing = total === 0 ? 0 : (page - 1) * limit + 1;
  const showingTo = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between flex-wrap gap-3 pt-4">
      <div className="text-sm text-slate-600">
        Showing {showing} to {showingTo} of {total} results
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPage(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="h-9 w-9 rounded-lg border border-slate-200 inline-flex items-center justify-center disabled:opacity-40 hover:bg-slate-50"
        >
          <ChevronLeftIcon size={16} />
        </button>
        <span className="h-9 px-3 rounded-lg bg-[#0a7a90] text-white inline-flex items-center justify-center text-sm font-medium">
          {page}
        </span>
        {totalPages > 1 && (
          <span className="h-9 px-2 rounded-lg border border-slate-200 inline-flex items-center justify-center text-sm">
            of {totalPages}
          </span>
        )}
        {onLimit && (
          <select
            value={limit}
            onChange={(e) => onLimit(Number(e.target.value))}
            className="h-9 px-2 rounded-lg border border-slate-200 text-sm"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        )}
        <button
          type="button"
          onClick={() => onPage(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="h-9 w-9 rounded-lg border border-slate-200 inline-flex items-center justify-center disabled:opacity-40 hover:bg-slate-50"
        >
          <ChevronRightIcon size={16} />
        </button>
      </div>
    </div>
  );
}
