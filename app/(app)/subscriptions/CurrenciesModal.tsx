"use client";

import { useEffect, useState } from "react";
import { Modal, ConfirmDialog } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { PlusIcon, TrashIcon } from "../../components/Icons";
import { api, ApiError } from "../../lib/api";
import { useToast } from "../../lib/toast";
import { useCurrencyCatalog, symbolFor } from "../../lib/currency";
import type { Currency } from "../../lib/types";

type Draft = {
  country: string;
  countryName: string;
  currency: string;
  symbol: string;
  usdRate: string;
  roundTo: string;
};

const emptyDraft: Draft = {
  country: "",
  countryName: "",
  currency: "",
  symbol: "",
  usdRate: "1",
  roundTo: "0",
};

/**
 * Manage the supported country → currency catalog: FX rate (units per 1 USD) and
 * rounding used to auto-convert the base USD price when a plan has no manual
 * override for a country.
 */
export function CurrenciesModal({
  open,
  onClose,
  currencies,
  onChanged,
}: {
  open: boolean;
  onClose: () => void;
  currencies: Currency[];
  onChanged: () => void;
}) {
  const toast = useToast();
  const [rows, setRows] = useState<Currency[]>([]);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [deleteRow, setDeleteRow] = useState<Currency | null>(null);
  const [countryList, setCountryList] = useState<
    { name: string; iso2: string; currency: string }[]
  >([]);
  useCurrencyCatalog(); // preload symbol catalog

  useEffect(() => {
    setRows(currencies);
    setAdding(false);
    setDraft(emptyDraft);
  }, [currencies, open]);

  // Load the country → currency catalog once, to drive the "Add Country" picker.
  useEffect(() => {
    if (!open || countryList.length) return;
    let active = true;
    api
      .get<{ name: string; iso2: string; currency: string }[]>(
        "/locations/countries",
      )
      .then((res) => {
        if (active) setCountryList(res.data ?? []);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [open, countryList.length]);

  const patchRow = (id: string, patch: Partial<Currency>) =>
    setRows((arr) => arr.map((r) => (r._id === id ? { ...r, ...patch } : r)));

  const saveRow = async (row: Currency) => {
    setSaving(true);
    try {
      await api.patch(`/admin/currencies/${row._id}`, {
        countryName: row.countryName,
        currency: row.currency,
        symbol: row.symbol,
        usdRate: Number(row.usdRate) || 0,
        roundTo: Number(row.roundTo) || 0,
        isActive: row.isActive,
      });
      toast.success(`${row.country} saved`);
      onChanged();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  const createRow = async () => {
    if (!draft.country || !draft.countryName || !draft.currency) {
      toast.error("Country code, name and currency are required");
      return;
    }
    setSaving(true);
    try {
      await api.post(`/admin/currencies`, {
        country: draft.country.trim().toUpperCase(),
        countryName: draft.countryName.trim(),
        currency: draft.currency.trim().toUpperCase(),
        symbol: draft.symbol || "$",
        usdRate: Number(draft.usdRate) || 1,
        roundTo: Number(draft.roundTo) || 0,
      });
      toast.success("Currency added");
      setAdding(false);
      setDraft(emptyDraft);
      onChanged();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  const submitDelete = async () => {
    if (!deleteRow) return;
    setSaving(true);
    try {
      await api.delete(`/admin/currencies/${deleteRow._id}`);
      toast.success("Currency removed");
      setDeleteRow(null);
      onChanged();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  const cell =
    "h-9 px-2 rounded-md bg-[#e6f2f6]/60 text-sm border border-transparent focus:border-[#0a7a90] focus:bg-white w-full";

  return (
    <Modal open={open} onClose={onClose} title="Supported Currencies" size="xl">
      <p className="text-sm text-slate-500 mb-4">
        Each country maps to a currency shown to users from that region. The
        exchange rate (units per&nbsp;1&nbsp;USD) and rounding are used to
        auto-convert plan prices for countries without a manual override.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-100">
              <th className="py-2 pr-2 font-medium">Country</th>
              <th className="py-2 px-2 font-medium">Name</th>
              <th className="py-2 px-2 font-medium">Currency</th>
              <th className="py-2 px-2 font-medium">Symbol</th>
              <th className="py-2 px-2 font-medium">Rate / USD</th>
              <th className="py-2 px-2 font-medium">Round to</th>
              <th className="py-2 px-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r._id} className="border-b border-slate-50">
                <td className="py-2 pr-2 font-semibold text-slate-700">
                  {r.country}
                  {r.isBase && (
                    <span className="ml-1 text-[10px] text-slate-400">base</span>
                  )}
                </td>
                <td className="py-2 px-2">
                  <input
                    className={cell}
                    value={r.countryName}
                    onChange={(e) =>
                      patchRow(r._id, { countryName: e.target.value })
                    }
                  />
                </td>
                <td className="py-2 px-2">
                  <input
                    className={`${cell} w-16`}
                    value={r.currency}
                    onChange={(e) =>
                      patchRow(r._id, { currency: e.target.value.toUpperCase() })
                    }
                  />
                </td>
                <td className="py-2 px-2">
                  <input
                    className={`${cell} w-14`}
                    value={r.symbol}
                    onChange={(e) => patchRow(r._id, { symbol: e.target.value })}
                  />
                </td>
                <td className="py-2 px-2">
                  <input
                    type="number"
                    step="0.0001"
                    className={`${cell} w-24`}
                    value={r.usdRate}
                    disabled={r.isBase}
                    onChange={(e) =>
                      patchRow(r._id, { usdRate: Number(e.target.value) })
                    }
                  />
                </td>
                <td className="py-2 px-2">
                  <input
                    type="number"
                    step="1"
                    className={`${cell} w-20`}
                    value={r.roundTo}
                    onChange={(e) =>
                      patchRow(r._id, { roundTo: Number(e.target.value) })
                    }
                  />
                </td>
                <td className="py-2 px-2 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => saveRow(r)}
                    disabled={saving}
                    className="text-xs font-medium text-[#0a7a90] hover:underline mr-3"
                  >
                    Save
                  </button>
                  {!r.isBase && (
                    <button
                      type="button"
                      onClick={() => setDeleteRow(r)}
                      className="text-red-500 hover:text-red-700 align-middle"
                      aria-label="Remove"
                    >
                      <TrashIcon size={15} />
                    </button>
                  )}
                </td>
              </tr>
            ))}

            {adding && (
              <tr className="border-b border-slate-50 bg-[#e6f2f6]/30">
                <td className="py-2 pr-2" colSpan={2}>
                  <select
                    className={cell}
                    value={draft.country}
                    onChange={(e) => {
                      const iso2 = e.target.value;
                      const match = countryList.find((c) => c.iso2 === iso2);
                      setDraft((d) => ({
                        ...d,
                        country: iso2,
                        countryName: match?.name ?? "",
                        currency: match?.currency ?? d.currency,
                        symbol: match?.currency
                          ? symbolFor(match.currency)
                          : d.symbol,
                      }));
                    }}
                  >
                    <option value="">Select country…</option>
                    {countryList.map((c) => (
                      <option key={c.iso2} value={c.iso2}>
                        {c.name} ({c.iso2})
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-2 px-2">
                  <input
                    className={`${cell} w-16`}
                    placeholder="NGN"
                    value={draft.currency}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        currency: e.target.value.toUpperCase(),
                      }))
                    }
                  />
                </td>
                <td className="py-2 px-2">
                  <input
                    className={`${cell} w-14`}
                    placeholder="₦"
                    value={draft.symbol}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, symbol: e.target.value }))
                    }
                  />
                </td>
                <td className="py-2 px-2">
                  <input
                    type="number"
                    step="0.0001"
                    className={`${cell} w-24`}
                    value={draft.usdRate}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, usdRate: e.target.value }))
                    }
                  />
                </td>
                <td className="py-2 px-2">
                  <input
                    type="number"
                    step="1"
                    className={`${cell} w-20`}
                    value={draft.roundTo}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, roundTo: e.target.value }))
                    }
                  />
                </td>
                <td className="py-2 px-2 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={createRow}
                    disabled={saving}
                    className="text-xs font-medium text-[#0a7a90] hover:underline mr-2"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAdding(false);
                      setDraft(emptyDraft);
                    }}
                    className="text-xs text-slate-400 hover:underline"
                  >
                    Cancel
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!adding && (
        <div className="mt-4">
          <Button variant="outline" onClick={() => setAdding(true)}>
            <PlusIcon size={14} /> Add Country
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteRow}
        onClose={() => setDeleteRow(null)}
        onConfirm={submitDelete}
        title="Remove currency?"
        description={`${deleteRow?.countryName} (${deleteRow?.currency}) will no longer be offered. Existing prices in this currency are unaffected.`}
        danger
        loading={saving}
      />
    </Modal>
  );
}
