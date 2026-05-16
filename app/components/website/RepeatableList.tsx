"use client";

import { ReactNode } from "react";
import { PlusIcon, TrashIcon, ChevronUpIcon, ChevronDownIcon } from "../Icons";

type Props<T> = {
  label?: string;
  description?: string;
  items: T[];
  onChange: (items: T[]) => void;
  /**
   * Factory for a new item. Loosely typed (unknown) on purpose: most editor
   * shapes have all-optional fields, so an empty `{}` is a valid item — but
   * TS bidirectional inference would otherwise pick T = {} and break renderItem.
   * The return value is cast to T at runtime when appended.
   */
  newItem: () => unknown;
  renderItem: (item: T, index: number, update: (next: T) => void) => ReactNode;
  itemTitle?: (item: T, index: number) => string;
  addLabel?: string;
  /** Hide reorder buttons (for fixed-length lists) */
  fixedOrder?: boolean;
  /** Disable add button when count reaches this */
  maxItems?: number;
};

export function RepeatableList<T>({
  label,
  description,
  items,
  onChange,
  newItem,
  renderItem,
  itemTitle,
  addLabel = "Add item",
  fixedOrder,
  maxItems
}: Props<T>) {
  const add = () => onChange([...items, newItem() as T]);
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) => {
    const next = [...items];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const updateAt = (i: number) => (next: T) =>
    onChange(items.map((it, idx) => (idx === i ? next : it)));

  const atLimit = typeof maxItems === "number" && items.length >= maxItems;

  return (
    <div>
      {label || description ? (
        <div className="mb-3">
          {label ? <div className="text-sm font-semibold text-slate-800">{label}</div> : null}
          {description ? <div className="text-xs text-slate-500">{description}</div> : null}
        </div>
      ) : null}

      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between mb-3 gap-2">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {itemTitle ? itemTitle(item, i) : `Item ${i + 1}`}
              </div>
              <div className="flex items-center gap-1">
                {!fixedOrder && (
                  <>
                    <button
                      type="button"
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      className="h-7 w-7 rounded inline-flex items-center justify-center text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                      title="Move up"
                    >
                      <ChevronUpIcon size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(i, 1)}
                      disabled={i === items.length - 1}
                      className="h-7 w-7 rounded inline-flex items-center justify-center text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                      title="Move down"
                    >
                      <ChevronDownIcon size={14} />
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="h-7 w-7 rounded inline-flex items-center justify-center text-red-500 hover:bg-red-50"
                  title="Remove"
                >
                  <TrashIcon size={14} />
                </button>
              </div>
            </div>
            {renderItem(item, i, updateAt(i))}
          </div>
        ))}

        {items.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
            No items yet.
          </div>
        ) : null}
      </div>

      <button
        type="button"
        onClick={add}
        disabled={atLimit}
        className="mt-3 inline-flex items-center gap-2 h-9 px-4 rounded-lg border border-dashed border-[#0a7a90] text-[#0a7a90] text-sm font-medium hover:bg-[#e6f2f6] disabled:opacity-50"
      >
        <PlusIcon size={14} /> {addLabel}
      </button>
    </div>
  );
}
