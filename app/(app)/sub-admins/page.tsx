"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Topbar } from "../../components/Topbar";
import { PageHeader } from "../../components/PageHeader";
import { Pagination } from "../../components/ui/Pagination";
import { TableSkeleton } from "../../components/Skeleton";
import { Spinner } from "../../components/Spinner";
import { Modal, ConfirmDialog } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Input";
import { Avatar } from "../../components/ui/Avatar";
import { StatusBadge } from "../../components/ui/Badge";
import { EyeIcon, PlusIcon, SuspendIcon } from "../../components/Icons";
import { BulkActionsBar, BulkCheckbox } from "../../components/BulkActionsBar";
import { api, ApiError } from "../../lib/api";
import { useToast } from "../../lib/toast";
import { useBulkSelection } from "../../lib/use-bulk-selection";
import { formatDate, formatRelative } from "../../lib/format";
import type { AdminUser, PermissionsCatalog, SubAdminDetails, AdminActivity } from "../../lib/types";

const empId = (id: string) => `EMP-${id.slice(-6).toUpperCase()}`;
const createdByName = (cb: AdminUser["createdBy"]) =>
  !cb ? "—" : typeof cb === "string" ? "—" : cb.name || "—";

export default function SubAdminsPage() {
  const toast = useToast();
  const [items, setItems] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [catalog, setCatalog] = useState<PermissionsCatalog | null>(null);
  const [adding, setAdding] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [bulkConfirm, setBulkConfirm] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const bulk = useBulkSelection(items);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get<AdminUser[]>("/admin/sub-admins", {
        page,
        limit,
        q: search || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
      });
      setItems(r.data || []);
      setTotal(r.meta?.total || 0);
      bulk.clear();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, search, roleFilter, statusFilter]);

  useEffect(() => {
    api
      .get<PermissionsCatalog>("/admin/sub-admins/permissions")
      .then((r) => setCatalog(r.data || null))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  const submitBulkDelete = async () => {
    if (bulk.selectedCount === 0) return;
    setBulkLoading(true);
    const ids = bulk.selectedArray;
    const results = await Promise.allSettled(ids.map((id) => api.delete(`/admin/sub-admins/${id}`)));
    setBulkLoading(false);
    const failed = results.filter((r) => r.status === "rejected").length;
    const ok = results.length - failed;
    if (ok > 0) toast.success(`Removed ${ok} sub-admin${ok === 1 ? "" : "s"}`);
    if (failed > 0) toast.error(`${failed} removal${failed === 1 ? "" : "s"} failed`);
    setBulkConfirm(false);
    load();
  };

  return (
    <>
      <Topbar />
      <main className="px-6 md:px-8 pb-10">
        <PageHeader
          title="Sub Admin Management"
          breadcrumb={[
            { label: "Dashboard", href: "/" },
            { label: "Sub Admin Management" },
          ]}
          action={
            <Button onClick={() => setAdding(true)}>
              <PlusIcon size={16} /> Add New Sub Admin
            </Button>
          }
        />

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
          <Input
            placeholder="Search name, email, phone…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <Select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Roles</option>
            {(catalog?.roles || []).map((r) => (
              <option key={r.key} value={r.key}>
                {r.label}
              </option>
            ))}
          </Select>
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="deactivated">Inactive</option>
          </Select>
        </div>

        <BulkActionsBar
          selectedCount={bulk.selectedCount}
          onClear={bulk.clear}
          onDelete={() => setBulkConfirm(true)}
        />

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {loading ? (
            <TableSkeleton rows={6} cols={8} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-slate-500">
                  <tr className="border-b border-slate-100">
                    <th className="pl-5 pr-2 py-4 font-medium w-10">
                      <BulkCheckbox
                        ariaLabel="Select all sub-admins on this page"
                        checked={bulk.allSelected}
                        indeterminate={bulk.someSelected}
                        onChange={bulk.toggleAll}
                      />
                    </th>
                    <th className="px-5 py-4 font-medium">Full Name</th>
                    <th className="px-5 py-4 font-medium">Employee ID</th>
                    <th className="px-5 py-4 font-medium">Email</th>
                    <th className="px-5 py-4 font-medium">Phone</th>
                    <th className="px-5 py-4 font-medium">Role</th>
                    <th className="px-5 py-4 font-medium">Status</th>
                    <th className="px-5 py-4 font-medium">Date Created</th>
                    <th className="px-5 py-4 font-medium">Last Login</th>
                    <th className="px-5 py-4 font-medium">Created By</th>
                    <th className="px-5 py-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="text-center py-10 text-slate-500">
                        No sub-admins
                      </td>
                    </tr>
                  ) : (
                    items.map((u) => {
                      const selected = bulk.isSelected(u._id);
                      return (
                        <tr
                          key={u._id}
                          className={`border-b border-slate-50 last:border-0 ${selected ? "bg-amber-50/60" : ""}`}
                        >
                          <td className="pl-5 pr-2 py-3 w-10">
                            <BulkCheckbox
                              ariaLabel={`Select ${u.name}`}
                              checked={selected}
                              onChange={() => bulk.toggle(u._id)}
                            />
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <span className="relative">
                                <Avatar src={u.profilePhoto} name={u.name} size={28} />
                                {u.isOnline && (
                                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                                )}
                              </span>
                              <span className="text-slate-900 font-medium">{u.name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3 font-mono text-xs text-slate-500">{empId(u._id)}</td>
                          <td className="px-5 py-3 text-slate-600">{u.email}</td>
                          <td className="px-5 py-3 text-slate-600">{u.phone || "—"}</td>
                          <td className="px-5 py-3 text-slate-700">{u.location || "—"}</td>
                          <td className="px-5 py-3">
                            <StatusBadge status={u.status} />
                          </td>
                          <td className="px-5 py-3 text-slate-600">{formatDate(u.createdAt)}</td>
                          <td className="px-5 py-3 text-slate-600">
                            {u.lastLoginAt ? formatRelative(u.lastLoginAt) : "—"}
                          </td>
                          <td className="px-5 py-3 text-slate-600">{createdByName(u.createdBy)}</td>
                          <td className="px-5 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => setViewingId(u._id)}
                              className="inline-flex items-center gap-1.5 text-[#0a7a90] hover:underline text-sm font-medium"
                            >
                              <EyeIcon size={16} />
                              View Details
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
          <div className="px-5 py-3">
            <Pagination
              page={page}
              limit={limit}
              total={total}
              onPage={setPage}
              onLimit={(l) => {
                setLimit(l);
                setPage(1);
              }}
            />
          </div>
        </div>

        <SubAdminFormModal
          open={adding}
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false);
            load();
          }}
          catalog={catalog}
        />

        <SubAdminDetailsModal
          subAdminId={viewingId}
          onClose={() => setViewingId(null)}
          onSaved={() => {
            setViewingId(null);
            load();
          }}
          catalog={catalog}
        />

        <ConfirmDialog
          open={bulkConfirm}
          onClose={() => setBulkConfirm(false)}
          onConfirm={submitBulkDelete}
          title={`Remove ${bulk.selectedCount} sub-admin${bulk.selectedCount === 1 ? "" : "s"}?`}
          description="The selected sub-admin accounts will be permanently removed."
          confirmText="Remove"
          danger
          loading={bulkLoading}
        />
      </main>
    </>
  );
}

// ---- Permission picker (grouped by section) ----
function PermissionPicker({
  catalog,
  roleKey,
  selected,
  onToggle,
}: {
  catalog: PermissionsCatalog | null;
  roleKey: string;
  selected: string[];
  onToggle: (key: string) => void;
}) {
  const allKeys = catalog?.permissions || [];
  const isSuper = roleKey === "super_admin";
  const isCustom = roleKey === "custom" || !roleKey;
  const presetPerms = useMemo(() => {
    if (isSuper) return new Set(allKeys);
    const preset = catalog?.roles.find((r) => r.key === roleKey);
    return new Set(preset?.permissions || []);
  }, [catalog, roleKey, isSuper, allKeys]);

  const isChecked = (key: string) => (isCustom ? selected.includes(key) : presetPerms.has(key));

  return (
    <div className="bg-[#e6f2f6]/40 rounded-lg max-h-72 overflow-y-auto p-2 space-y-3 border border-slate-100">
      {!isCustom && (
        <p className="text-xs text-slate-500 px-1">
          {isSuper
            ? "Super Admin automatically has full platform access."
            : "Permissions are set by this role. Choose “Custom Role” to pick individually."}
        </p>
      )}
      {(catalog?.groups || []).map((g) => (
        <div key={g.section}>
          <div className="text-xs font-semibold text-slate-700 px-1 mb-1">{g.section}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3">
            {g.permissions.map((p) => (
              <label
                key={p.key}
                className={`flex items-center gap-2 text-sm px-2 py-1 rounded ${
                  isCustom ? "text-slate-700 cursor-pointer hover:bg-white" : "text-slate-500"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked(p.key)}
                  disabled={!isCustom}
                  onChange={() => onToggle(p.key)}
                />
                {p.label}
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SubAdminFormModal({
  open,
  onClose,
  onSaved,
  catalog,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  catalog: PermissionsCatalog | null;
}) {
  const toast = useToast();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    jobTitle: "",
    role: "custom",
    password: "",
    permissions: [] as string[],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ name: "", email: "", phoneNumber: "", jobTitle: "", role: "custom", password: "", permissions: [] });
    }
  }, [open]);

  const togglePerm = (p: string) =>
    setForm((s) => ({
      ...s,
      permissions: s.permissions.includes(p) ? s.permissions.filter((x) => x !== p) : [...s.permissions, p],
    }));

  const submit = async () => {
    if (!form.name || !form.email || !form.password) {
      toast.error("Name, email, password required");
      return;
    }
    setLoading(true);
    try {
      await api.post("/admin/sub-admins", form);
      toast.success("Sub-admin created");
      onSaved();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add new Sub admin" size="lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
        <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email address" />
        <Input label="Phone Number" value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} placeholder="Phone number" />
        <Input label="Job Title" value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} placeholder="e.g. Finance Lead" />
        <Select label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
          {(catalog?.roles || []).map((r) => (
            <option key={r.key} value={r.key}>
              {r.label}
            </option>
          ))}
        </Select>
        <Input label="Password" type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Set a password" />
      </div>
      {form.role && (
        <p className="text-xs text-slate-500 mt-2">
          {catalog?.roles.find((r) => r.key === form.role)?.description}
        </p>
      )}
      <div className="mt-4">
        <div className="text-sm font-medium text-slate-700 mb-1.5">Permissions</div>
        <PermissionPicker catalog={catalog} roleKey={form.role} selected={form.permissions} onToggle={togglePerm} />
      </div>
      <div className="grid grid-cols-2 gap-3 mt-5">
        <Button variant="outline" onClick={onClose}>
          Not Now
        </Button>
        <Button onClick={submit} loading={loading}>
          Add Sub Admin
        </Button>
      </div>
    </Modal>
  );
}

function SubAdminDetailsModal({
  subAdminId,
  onClose,
  onSaved,
  catalog,
}: {
  subAdminId: string | null;
  onClose: () => void;
  onSaved: () => void;
  catalog: PermissionsCatalog | null;
}) {
  const toast = useToast();
  const [data, setData] = useState<SubAdminDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [removeConfirm, setRemoveConfirm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phoneNumber: "",
    jobTitle: "",
    role: "custom",
    permissions: [] as string[],
    password: "",
  });

  // Activity log
  const [activity, setActivity] = useState<AdminActivity[]>([]);
  const [actionFilter, setActionFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const loadDetails = useCallback(async () => {
    if (!subAdminId) return;
    setLoading(true);
    try {
      const r = await api.get<SubAdminDetails>(`/admin/sub-admins/${subAdminId}`);
      const d = r.data || null;
      setData(d);
      if (d) {
        setForm({
          name: d.name || "",
          phoneNumber: d.phone || "",
          jobTitle: d.jobTitle || "",
          role: d.roleKey || "custom",
          permissions: d.permissions || [],
          password: "",
        });
        setActivity(d.recentActivity || []);
      }
      setEditing(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, [subAdminId, toast]);

  useEffect(() => {
    if (subAdminId) loadDetails();
    else {
      setData(null);
      setActivity([]);
      setActionFilter("");
      setFromDate("");
      setToDate("");
    }
  }, [subAdminId, loadDetails]);

  const loadActivity = useCallback(async () => {
    if (!subAdminId) return;
    try {
      const r = await api.get<AdminActivity[]>(`/admin/sub-admins/${subAdminId}/activity`, {
        action: actionFilter || undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
        limit: 50,
      });
      setActivity(r.data || []);
    } catch {
      /* keep existing */
    }
  }, [subAdminId, actionFilter, fromDate, toDate]);

  useEffect(() => {
    if (subAdminId && (actionFilter || fromDate || toDate)) loadActivity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionFilter, fromDate, toDate]);

  const togglePerm = (p: string) =>
    setForm((s) => ({
      ...s,
      permissions: s.permissions.includes(p) ? s.permissions.filter((x) => x !== p) : [...s.permissions, p],
    }));

  const save = async () => {
    if (!data) return;
    setActionLoading(true);
    try {
      const body: Record<string, unknown> = {
        name: form.name,
        phoneNumber: form.phoneNumber,
        jobTitle: form.jobTitle,
        role: form.role,
        permissions: form.permissions,
      };
      if (form.password) body.password = form.password;
      await api.patch(`/admin/sub-admins/${data._id}`, body);
      toast.success("Saved");
      loadDetails();
      onSaved();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed");
    } finally {
      setActionLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!data) return;
    const pw = window.prompt("Enter a new password for this sub-admin");
    if (!pw) return;
    setActionLoading(true);
    try {
      await api.patch(`/admin/sub-admins/${data._id}`, { password: pw });
      toast.success("Password reset");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed");
    } finally {
      setActionLoading(false);
    }
  };

  const suspendToggle = async () => {
    if (!data) return;
    setActionLoading(true);
    try {
      const isSuspended = data.status === "suspended";
      await api.patch(`/admin/sub-admins/${data._id}/${isSuspended ? "unsuspend" : "suspend"}`, {});
      toast.success(isSuspended ? "Reactivated" : "Suspended");
      loadDetails();
      onSaved();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed");
    } finally {
      setActionLoading(false);
    }
  };

  const remove = async () => {
    if (!data) return;
    setActionLoading(true);
    try {
      await api.delete(`/admin/sub-admins/${data._id}`);
      toast.success("Removed");
      setRemoveConfirm(false);
      onSaved();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed");
    } finally {
      setActionLoading(false);
    }
  };

  const actionTypes = useMemo(() => {
    const set = new Set<string>();
    (data?.recentActivity || []).forEach((a) => set.add(a.action));
    activity.forEach((a) => set.add(a.action));
    return [...set];
  }, [data, activity]);

  return (
    <>
      <Modal open={!!subAdminId} onClose={onClose} title="Sub Admin Details" size="lg">
        {loading || !data ? (
          <div className="py-16 grid place-items-center">
            <Spinner />
          </div>
        ) : (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center gap-4">
              <span className="relative">
                <Avatar src={data.profilePhoto} name={data.name} size={64} />
                <span
                  className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white ${
                    data.isOnline ? "bg-emerald-500" : "bg-slate-300"
                  }`}
                />
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-slate-900">{data.name}</h3>
                  <StatusBadge status={data.status} />
                </div>
                <p className="text-slate-500 text-sm">{data.roleLabel || data.location || "Sub-admin"}</p>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{empId(data._id)}</p>
              </div>
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  data.isOnline ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                }`}
              >
                {data.isOnline ? "● Online" : "Offline"}
              </span>
            </div>

            {editing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <Input label="Phone Number" value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} />
                <Input label="Job Title" value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} />
                <Select label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  {(catalog?.roles || []).map((r) => (
                    <option key={r.key} value={r.key}>
                      {r.label}
                    </option>
                  ))}
                </Select>
                <Input label="New Password" type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="(leave blank to keep)" />
                <div className="md:col-span-2">
                  <div className="text-sm font-medium text-slate-700 mb-1.5">Permissions</div>
                  <PermissionPicker catalog={catalog} roleKey={form.role} selected={form.permissions} onToggle={togglePerm} />
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3 bg-slate-50 rounded-xl p-4">
                  <Field label="Admin ID" value={empId(data._id)} />
                  <Field label="Email" value={data.email} />
                  <Field label="Phone Number" value={data.phone || "—"} />
                  <Field label="Job Title" value={data.jobTitle || "—"} />
                  <Field label="Role" value={data.roleLabel || data.location || "—"} />
                  <Field label="Status" value={<StatusBadge status={data.status} />} />
                  <Field label="Date Created" value={formatDate(data.createdAt, true)} />
                  <Field label="Created By" value={createdByName(data.createdBy)} />
                  <Field label="Current Login" value={data.isOnline ? "Online" : "Offline"} />
                  <Field label="Last Login" value={data.lastLoginAt ? formatRelative(data.lastLoginAt) : "—"} />
                  <Field label="Last Activity" value={data.lastActiveAt ? formatRelative(data.lastActiveAt) : "—"} />
                </div>

                <div>
                  <div className="text-sm font-medium text-slate-500 mb-2">Permissions</div>
                  <div className="flex flex-wrap gap-1.5">
                    {data.permissions?.includes("*") ? (
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-[#e6f4f8] text-[#0a7a90]">
                        Full platform access
                      </span>
                    ) : data.permissions?.length ? (
                      data.permissions.map((p) => (
                        <span key={p} className="text-xs font-medium px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                          {p}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-slate-400">No permissions assigned</span>
                    )}
                  </div>
                </div>

                {/* Activity log */}
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="text-sm font-semibold text-slate-700">Activity Log</div>
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={actionFilter}
                        onChange={(e) => setActionFilter(e.target.value)}
                        className="h-8 px-2 rounded-lg border border-slate-200 text-xs bg-white"
                      >
                        <option value="">All Actions</option>
                        {actionTypes.map((a) => (
                          <option key={a} value={a}>
                            {a}
                          </option>
                        ))}
                      </select>
                      <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="h-8 px-2 rounded-lg border border-slate-200 text-xs"
                      />
                      <input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="h-8 px-2 rounded-lg border border-slate-200 text-xs"
                      />
                    </div>
                  </div>
                  <div className="border border-slate-100 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-left text-slate-500 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 font-medium">Date &amp; Time</th>
                          <th className="px-4 py-2 font-medium">Action</th>
                          <th className="px-4 py-2 font-medium">Affected</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {activity.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="text-center py-6 text-slate-400">
                              No activity recorded
                            </td>
                          </tr>
                        ) : (
                          activity.map((a) => (
                            <tr key={a._id}>
                              <td className="px-4 py-2 text-slate-600 whitespace-nowrap">{formatDate(a.createdAt, true)}</td>
                              <td className="px-4 py-2 text-slate-800">{a.description || a.action}</td>
                              <td className="px-4 py-2 text-slate-600">{a.targetUser?.name || "—"}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-100">
              {editing ? (
                <>
                  <Button variant="outline" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                  <Button onClick={save} loading={actionLoading}>
                    Save Changes
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="success" onClick={() => setEditing(true)}>
                    Edit Details
                  </Button>
                  <Button variant="outline" onClick={resetPassword} loading={actionLoading}>
                    Password Reset
                  </Button>
                  <Button
                    variant={data.status === "suspended" ? "primary" : "danger"}
                    onClick={suspendToggle}
                    loading={actionLoading}
                  >
                    <SuspendIcon size={16} />
                    {data.status === "suspended" ? "Reactivate" : "Suspend"}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setRemoveConfirm(true)}
                    disabled={actionLoading}
                    className="h-10 px-4 rounded-lg border border-red-200 text-red-500 text-sm font-medium inline-flex items-center hover:bg-red-50 disabled:opacity-50 ml-auto"
                  >
                    Remove
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={removeConfirm}
        onClose={() => setRemoveConfirm(false)}
        onConfirm={remove}
        title="Remove this sub-admin?"
        description="The account will be permanently removed from the system."
        confirmText="Remove"
        danger
        loading={actionLoading}
      />
    </>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-slate-500 mb-0.5">{label}</div>
      <div className="text-sm font-medium text-slate-900">{value}</div>
    </div>
  );
}
