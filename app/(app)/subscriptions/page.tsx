"use client";

import { useEffect, useState } from "react";
import { Topbar } from "../../components/Topbar";
import { PageHeader } from "../../components/PageHeader";
import { Spinner } from "../../components/Spinner";
import { Modal, ConfirmDialog } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { CrownIcon, EditIcon, PlusIcon, TrashIcon, UsersIcon } from "../../components/Icons";
import { BulkActionsBar, BulkCheckbox } from "../../components/BulkActionsBar";
import { api, ApiError } from "../../lib/api";
import { useToast } from "../../lib/toast";
import { useBulkSelection } from "../../lib/use-bulk-selection";
import { formatCompact, formatCurrency } from "../../lib/format";
import { AreaChart, DonutChart, MiniArea } from "../../components/charts";
import type { Plan, SubscriptionStats } from "../../lib/types";

const monthLabels = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

export default function SubscriptionsPage() {
  const toast = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Plan | null>(null);
  const [bulkConfirm, setBulkConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const bulk = useBulkSelection(plans);

  const load = async () => {
    setLoading(true);
    try {
      const [p, s] = await Promise.all([
        api.get<Plan[]>("/admin/subscriptions/plans"),
        api.get<SubscriptionStats>("/admin/subscriptions/stats"),
      ]);
      setPlans(p.data || []);
      setStats(s.data || null);
      bulk.clear();
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
      await api.delete(`/admin/subscriptions/plans/${deleteConfirm._id}`);
      toast.success("Plan deactivated");
      setDeleteConfirm(null);
      load();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed";
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const submitBulkDelete = async () => {
    if (bulk.selectedCount === 0) return;
    setActionLoading(true);
    const ids = bulk.selectedArray;
    const results = await Promise.allSettled(
      ids.map((id) => api.delete(`/admin/subscriptions/plans/${id}`))
    );
    setActionLoading(false);
    const failed = results.filter((r) => r.status === "rejected").length;
    const ok = results.length - failed;
    if (ok > 0) toast.success(`Deleted ${ok} plan${ok === 1 ? "" : "s"}`);
    if (failed > 0)
      toast.error(`${failed} delete${failed === 1 ? "" : "s"} failed`);
    setBulkConfirm(false);
    load();
  };

  const planDistribution = stats?.planDistribution.map((p, i) => ({
    label: p._id || "Other",
    value: p.count,
    color: ["#fbbf24", "#60a5fa", "#0a7a90"][i % 3],
  })) || [];

  const revenueArea = (() => {
    const map = new Map<string, number>();
    (stats?.revenueByMonth || []).forEach((r) => {
      map.set(monthLabels[(r._id.m - 1) % 12], r.total);
    });
    return monthLabels.map((m) => ({ label: m, value: map.get(m) || 0 }));
  })();

  return (
    <>
      <Topbar />
      <main className="px-6 md:px-8 pb-10">
        <PageHeader
          title="Subscription Plans"
          breadcrumb={[
            { label: "Dashboard", href: "/" },
            { label: "Subscription Plans" },
          ]}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <SummaryCard
            label="Total Users"
            value={formatCompact(stats?.totalUsers)}
            icon={<UsersIcon />}
            color="#a78bfa"
          />
          <SummaryCard
            label="Total Revenue"
            value={formatCurrency(stats?.totalRevenue)}
            icon={<CrownIcon />}
            color="#fb7185"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-semibold">User Subscription Plans</h3>
              <select className="h-8 px-3 rounded-md border border-slate-200 text-xs">
                <option>Month</option>
              </select>
            </div>
            <p className="text-sm text-slate-500 mb-4">See User Subscription Plans</p>
            {planDistribution.length ? (
              <DonutChart data={planDistribution} />
            ) : (
              <p className="text-slate-500 text-sm">No data</p>
            )}
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-semibold">Subscription Revenue Overview</h3>
              <select className="h-8 px-3 rounded-md border border-slate-200 text-xs">
                <option>Month</option>
              </select>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Track total revenue, platform commission, and payouts over time.
            </p>
            <AreaChart data={revenueArea} color="#7c3aed" />
          </div>
        </div>

        <BulkActionsBar
          selectedCount={bulk.selectedCount}
          onClear={bulk.clear}
          onDelete={() => setBulkConfirm(true)}
        />

        <div className="flex items-center justify-between mb-3">
          {plans.length > 0 ? (
            <label className="inline-flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
              <BulkCheckbox
                ariaLabel="Select all plans"
                checked={bulk.allSelected}
                indeterminate={bulk.someSelected}
                onChange={bulk.toggleAll}
              />
              Select all
            </label>
          ) : (
            <span />
          )}
          <Button onClick={() => setCreating(true)}>
            <PlusIcon size={16} /> Add New
          </Button>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center text-[#0a7a90]">
            <Spinner size={32} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {plans.length === 0 ? (
              <div className="col-span-3 bg-white rounded-2xl p-8 text-center text-slate-500">
                No plans yet
              </div>
            ) : (
              plans.map((p) => (
                <div
                  key={p._id}
                  className={`relative bg-white rounded-2xl p-6 border shadow-sm flex flex-col transition-colors ${
                    bulk.isSelected(p._id)
                      ? "border-[#0a7a90]/60 ring-2 ring-[#0a7a90]/20"
                      : "border-slate-100"
                  }`}
                >
                  <div className="absolute top-4 left-4">
                    <BulkCheckbox
                      ariaLabel={`Select plan ${p.name}`}
                      checked={bulk.isSelected(p._id)}
                      onChange={() => bulk.toggle(p._id)}
                    />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 pl-8">{p.name}</h3>
                  <p className="text-slate-500 text-sm mb-4">
                    {p.audienceLimit || p.description || "—"}
                  </p>
                  <div className="text-3xl font-bold text-[#0a7a90] mb-4">
                    {formatCurrency(p.pricePerMonth)}
                    <span className="text-base text-slate-500 font-normal">/month</span>
                  </div>
                  <ul className="space-y-2 mb-6 flex-1">
                    {(p.benefits || []).map((b, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                        <span className="h-5 w-5 rounded-full bg-[#0a7a90] text-white inline-flex items-center justify-center text-xs">
                          ✓
                        </span>
                        {b}
                      </li>
                    ))}
                  </ul>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setEditing(p)}
                    >
                      <EditIcon size={14} /> Edit
                    </Button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(p)}
                      className="h-10 w-10 rounded-lg border border-red-200 text-red-500 inline-flex items-center justify-center hover:bg-red-50"
                      aria-label="Delete"
                    >
                      <TrashIcon size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <PlanModal
          open={creating}
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            load();
          }}
        />
        <PlanModal
          open={!!editing}
          plan={editing}
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
          title="Delete plan?"
          description={`Plan "${deleteConfirm?.name}" will be deactivated.`}
          danger
          loading={actionLoading}
        />

        <ConfirmDialog
          open={bulkConfirm}
          onClose={() => setBulkConfirm(false)}
          onConfirm={submitBulkDelete}
          title={`Delete ${bulk.selectedCount} plan${
            bulk.selectedCount === 1 ? "" : "s"
          }?`}
          description="The selected plans will be deactivated."
          confirmText="Delete"
          danger
          loading={actionLoading}
        />
      </main>
    </>
  );
}

function PlanModal({
  open,
  onClose,
  onSaved,
  plan,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  plan?: Plan | null;
}) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [audience, setAudience] = useState("");
  const [price, setPrice] = useState("");
  const [benefits, setBenefits] = useState<string[]>([]);
  const [newBenefit, setNewBenefit] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (plan) {
      setName(plan.name);
      setAudience(plan.audienceLimit || "");
      setPrice(String(plan.pricePerMonth));
      setBenefits(plan.benefits || []);
    } else {
      setName("");
      setAudience("");
      setPrice("");
      setBenefits([]);
    }
    setNewBenefit("");
  }, [plan, open]);

  const submit = async () => {
    if (!name) {
      toast.error("Name required");
      return;
    }
    setLoading(true);
    try {
      const body = {
        name,
        audienceLimit: audience,
        pricePerMonth: Number(price) || 0,
        benefits,
      };
      if (plan) {
        await api.patch(`/admin/subscriptions/plans/${plan._id}`, body);
        toast.success("Plan updated");
      } else {
        await api.post(`/admin/subscriptions/plans`, body);
        toast.success("Plan created");
      }
      onSaved();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const addBenefit = () => {
    if (!newBenefit.trim()) return;
    setBenefits((b) => [...b, newBenefit.trim()]);
    setNewBenefit("");
  };

  return (
    <Modal open={open} onClose={onClose} title={plan ? "Edit Plan" : "Add Plan"} size="md">
      <div className="space-y-4">
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Basic" />
        <Input
          label="Audience"
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          placeholder="Up to 50 employees"
        />
        <div className="relative">
          <span className="absolute left-3 top-9 text-slate-500">$</span>
          <Input
            label="Price / month"
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="pl-7"
          />
        </div>
        <div>
          <div className="text-sm font-medium text-slate-700 mb-2">Benefits</div>
          <div className="space-y-2 mb-3">
            {benefits.map((b, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-[#e6f2f6]/60 px-3 py-2 rounded-lg"
              >
                <span className="text-sm text-slate-800">{b}</span>
                <button
                  type="button"
                  onClick={() =>
                    setBenefits((arr) => arr.filter((_, idx) => idx !== i))
                  }
                  className="text-red-500 hover:text-red-700"
                  aria-label="Remove"
                >
                  <TrashIcon size={16} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={newBenefit}
              onChange={(e) => setNewBenefit(e.target.value)}
              placeholder="Add a benefit..."
              className="flex-1 h-10 px-3 rounded-lg bg-[#e6f2f6]/60 text-sm border border-transparent focus:border-[#0a7a90] focus:bg-white"
            />
            <Button variant="outline" onClick={addBenefit}>
              Add
            </Button>
          </div>
        </div>
        <Button onClick={submit} loading={loading} className="w-full">
          {plan ? "Save Changes" : "Create Plan"}
        </Button>
      </div>
    </Modal>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative overflow-hidden">
      <div
        className="h-12 w-12 rounded-xl inline-flex items-center justify-center text-white"
        style={{ background: color }}
      >
        {icon}
      </div>
      <div className="mt-3 text-sm text-slate-500">{label}</div>
      <div className="mt-1 text-3xl font-bold text-slate-900">{value}</div>
      <div className="absolute right-3 bottom-2 w-40 opacity-80">
        <MiniArea values={[2, 4, 3, 5, 7, 6, 8, 7, 9, 8]} color={color} height={48} />
      </div>
    </div>
  );
}
