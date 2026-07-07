"use client";

import { useEffect, useMemo, useState } from "react";
import { Topbar } from "../../components/Topbar";
import { PageHeader } from "../../components/PageHeader";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog, Modal } from "../../components/ui/Modal";
import { Input, Select } from "../../components/ui/Input";
import { api, ApiError } from "../../lib/api";
import { useToast } from "../../lib/toast";

type PromotionPlan = {
  id: string;
  label: string;
  price: number;
  days: number;
  visibilityBoost: number;
  impressionsPerDay: number;
  features: string[];
  tone: "emerald" | "violet" | "amber" | "sky" | "slate";
  isActive: boolean;
  isPopular: boolean;
  sortOrder: number;
};

const EMPTY_PLAN: PromotionPlan = {
  id: "",
  label: "",
  price: 0,
  days: 7,
  visibilityBoost: 1,
  impressionsPerDay: 0,
  features: [],
  tone: "emerald",
  isActive: true,
  isPopular: false,
  sortOrder: 1,
};

export default function PromotionPlansPage() {
  const toast = useToast();
  const [plans, setPlans] = useState<PromotionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<PromotionPlan | null>(null);
  const [deleteRow, setDeleteRow] = useState<PromotionPlan | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get<PromotionPlan[]>("/admin/promotion-plans");
      setPlans((res.data || []).map(normalizePlan));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to load promotion plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    const active = plans.filter((plan) => plan.isActive).length;
    const revenue = plans.reduce((sum, plan) => sum + Number(plan.price || 0), 0);
    return { active, revenue };
  }, [plans]);

  const savePlan = async (plan: PromotionPlan) => {
    const error = validatePlan(plan, plans);
    if (error) {
      toast.error(error);
      return;
    }

    setSaving(true);
    try {
      if (plans.some((row) => row.id === plan.id)) {
        await api.patch(`/admin/promotion-plans/${plan.id}`, payload(plan));
        toast.success("Promotion plan updated");
      } else {
        await api.post("/admin/promotion-plans", payload(plan));
        toast.success("Promotion plan created");
      }
      setEditing(null);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to save promotion plan");
    } finally {
      setSaving(false);
    }
  };

  const deletePlan = async () => {
    if (!deleteRow) return;
    setSaving(true);
    try {
      await api.delete(`/admin/promotion-plans/${deleteRow.id}`);
      toast.success("Promotion plan deleted");
      setDeleteRow(null);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete promotion plan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Topbar />
      <main className="px-6 md:px-8 pb-10">
        <PageHeader
          title="Promotion Plans"
          breadcrumb={[{ label: "Dashboard", href: "/" }, { label: "Promotion Plans" }]}
          action={
            <Button
              onClick={() =>
                setEditing({
                  ...EMPTY_PLAN,
                  id: `plan_${Date.now()}`,
                  sortOrder: plans.length + 1,
                })
              }
            >
              Add Plan
            </Button>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Stat label="Total plans" value={plans.length.toLocaleString()} />
          <Stat label="Visible to advisors" value={stats.active.toLocaleString()} />
          <Stat label="Listed value" value={`$${stats.revenue.toLocaleString()}`} />
        </div>

        <section className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900">Advisor Promotion Tools</h2>
            <p className="text-sm text-slate-500">
              These plans appear in the advisor dashboard promotion tab. Inactive plans stay hidden from advisors.
            </p>
          </div>

          {loading ? (
            <div className="h-72 animate-pulse bg-slate-50" />
          ) : plans.length === 0 ? (
            <div className="p-10 text-center text-slate-500">No promotion plans yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Plan</th>
                    <th className="px-5 py-3 font-semibold">Price</th>
                    <th className="px-5 py-3 font-semibold">Duration</th>
                    <th className="px-5 py-3 font-semibold">Impressions</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((plan) => (
                    <tr key={plan.id} className="border-t border-slate-100">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900">{plan.label}</div>
                        <div className="text-xs text-slate-500">{plan.id}</div>
                        {plan.isPopular ? (
                          <span className="mt-2 inline-flex rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700">
                            Most Popular
                          </span>
                        ) : null}
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-900">${plan.price}</td>
                      <td className="px-5 py-4 text-slate-700">{plan.days} days</td>
                      <td className="px-5 py-4 text-slate-700">
                        {plan.impressionsPerDay > 0 ? `${plan.impressionsPerDay.toLocaleString()}/day` : "Unlimited"}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${plan.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                          {plan.isActive ? "Active" : "Hidden"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => setEditing(plan)}>
                            Edit
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => setDeleteRow(plan)}>
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {editing ? (
        <PlanModal
          plan={editing}
          existing={plans.some((row) => row.id === editing.id)}
          saving={saving}
          onClose={() => setEditing(null)}
          onSave={savePlan}
        />
      ) : null}

      <ConfirmDialog
        open={!!deleteRow}
        onClose={() => setDeleteRow(null)}
        onConfirm={deletePlan}
        title="Delete promotion plan?"
        description={`${deleteRow?.label || "This plan"} will no longer be available to advisors.`}
        confirmText="Delete"
        danger
        loading={saving}
      />
    </>
  );
}

function PlanModal({
  plan,
  existing,
  saving,
  onClose,
  onSave,
}: {
  plan: PromotionPlan;
  existing: boolean;
  saving: boolean;
  onClose: () => void;
  onSave: (plan: PromotionPlan) => void;
}) {
  const [form, setForm] = useState(plan);
  const [featureText, setFeatureText] = useState("");
  const set = <K extends keyof PromotionPlan>(key: K, value: PromotionPlan[K]) =>
    setForm((current) => ({ ...current, [key]: value }));
  const addFeature = () => {
    const value = featureText.trim();
    if (!value) return;
    setForm((current) => ({
      ...current,
      features: current.features.includes(value)
        ? current.features
        : [...current.features, value],
    }));
    setFeatureText("");
  };
  const removeFeature = (index: number) => {
    setForm((current) => ({
      ...current,
      features: current.features.filter((_, i) => i !== index),
    }));
  };

  return (
    <Modal open onClose={onClose} title={existing ? "Edit Promotion Plan" : "Create Promotion Plan"} size="lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Plan ID"
          value={form.id}
          onChange={(e) => set("id", slug(e.target.value))}
          disabled={existing}
          placeholder="premium_spotlight"
        />
        <Input label="Label" value={form.label} onChange={(e) => set("label", e.target.value)} />
        <Input label="Price (USD)" type="number" min={0} step={0.01} value={String(form.price)} onChange={(e) => set("price", Number(e.target.value))} />
        <Input label="Duration days" type="number" min={1} value={String(form.days)} onChange={(e) => set("days", Number(e.target.value))} />
        <Input label="Visibility boost" type="number" min={0} value={String(form.visibilityBoost)} onChange={(e) => set("visibilityBoost", Number(e.target.value))} />
        <Input label="Impressions per day" type="number" min={0} value={String(form.impressionsPerDay)} onChange={(e) => set("impressionsPerDay", Number(e.target.value))} />
        <Input label="Sort order" type="number" value={String(form.sortOrder)} onChange={(e) => set("sortOrder", Number(e.target.value))} />
        <Select label="Card tone" value={form.tone} onChange={(e) => set("tone", e.target.value as PromotionPlan["tone"])}>
          <option value="emerald">Emerald</option>
          <option value="violet">Violet</option>
          <option value="amber">Amber</option>
          <option value="sky">Sky</option>
          <option value="slate">Slate</option>
        </Select>
      </div>

      <div className="mt-4">
        <div className="mb-1.5 text-sm font-medium text-slate-700">Features</div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={featureText}
            onChange={(e) => setFeatureText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addFeature();
              }
            }}
            placeholder="Add a feature"
          />
          <Button type="button" className="sm:w-28" onClick={addFeature}>
            Add
          </Button>
        </div>
        <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
          {form.features.length ? (
            <div className="flex flex-wrap gap-2">
              {form.features.map((feature, index) => (
                <span
                  key={`${feature}-${index}`}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm"
                >
                  {feature}
                  <button
                    type="button"
                    onClick={() => removeFeature(index)}
                    className="text-slate-400 hover:text-red-600"
                    aria-label={`Remove ${feature}`}
                  >
                    x
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No features added.</p>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="flex items-center gap-2 rounded-lg bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
          <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} />
          Visible to advisors
        </label>
        <label className="flex items-center gap-2 rounded-lg bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
          <input type="checkbox" checked={form.isPopular} onChange={(e) => set("isPopular", e.target.checked)} />
          Mark as most popular
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-6">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={() => onSave(form)} loading={saving}>Save Plan</Button>
      </div>
    </Modal>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function normalizePlan(plan: PromotionPlan): PromotionPlan {
  return {
    ...EMPTY_PLAN,
    ...plan,
    price: Number(plan.price || 0),
    days: Number(plan.days || 1),
    visibilityBoost: Number(plan.visibilityBoost || 1),
    impressionsPerDay: Number(plan.impressionsPerDay || 0),
    features: Array.isArray(plan.features) ? plan.features : [],
    isActive: plan.isActive !== false,
    isPopular: plan.isPopular === true,
    sortOrder: Number(plan.sortOrder || 0),
  };
}

function payload(plan: PromotionPlan) {
  return {
    ...plan,
    id: slug(plan.id),
    features: plan.features.map((item) => item.trim()).filter(Boolean),
  };
}

function validatePlan(plan: PromotionPlan, plans: PromotionPlan[]) {
  if (!slug(plan.id)) return "Plan ID is required";
  if (!/^[a-z0-9_-]+$/.test(plan.id)) return "Plan ID can use lowercase letters, numbers, underscores, and hyphens only";
  if (!plan.label.trim()) return "Plan label is required";
  if (!Number.isFinite(plan.price) || plan.price < 0) return "Price must be zero or greater";
  if (!Number.isFinite(plan.days) || plan.days <= 0) return "Duration must be greater than zero";
  if (!Number.isFinite(plan.impressionsPerDay) || plan.impressionsPerDay < 0) return "Impressions must be zero or greater";
  const sameId = plans.filter((row) => row.id === plan.id).length;
  if (sameId > 1) return "Plan ID must be unique";
  return "";
}

function slug(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "_").replace(/^_+|_+$/g, "");
}
