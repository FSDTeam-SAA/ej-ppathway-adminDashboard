"use client";

import { TrashIcon } from "./Icons";

type Props = {
  selectedCount: number;
  onClear: () => void;
  onDelete: () => void;
  noun?: string;
  className?: string;
};

export function BulkActionsBar({
  selectedCount,
  onClear,
  onDelete,
  className = "",
}: Props) {
  if (selectedCount === 0) return null;
  return (
    <div className={`flex items-center justify-between mb-3 ${className}`}>
      <div className="text-sm text-slate-700">
        <span className="font-semibold">{selectedCount} Selected</span>
        <span className="mx-2 text-slate-300">·</span>
        <button
          type="button"
          onClick={onClear}
          className="text-[#0a7a90] hover:underline font-medium"
        >
          Deselect all
        </button>
      </div>
      <button
        type="button"
        onClick={onDelete}
        aria-label="Delete selected"
        className="h-10 w-10 inline-flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 border border-red-100"
      >
        <TrashIcon size={18} />
      </button>
    </div>
  );
}

export function BulkCheckbox({
  checked,
  indeterminate = false,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  ariaLabel: string;
}) {
  return (
    <input
      type="checkbox"
      aria-label={ariaLabel}
      checked={checked}
      ref={(el) => {
        if (el) el.indeterminate = indeterminate && !checked;
      }}
      onChange={onChange}
      className="h-4 w-4 rounded border-slate-300 text-[#0a7a90] focus:ring-[#0a7a90]/30 cursor-pointer accent-[#0a7a90]"
    />
  );
}
