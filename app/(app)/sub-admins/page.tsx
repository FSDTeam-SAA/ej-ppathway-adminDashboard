"use client";

import { useEffect, useState } from "react";
import { Topbar } from "../../components/Topbar";
import { PageHeader } from "../../components/PageHeader";
import { Pagination } from "../../components/ui/Pagination";
import { TableSkeleton } from "../../components/Skeleton";
import { Modal, ConfirmDialog } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Input";
import { StatusBadge } from "../../components/ui/Badge";
import { EyeIcon, PlusIcon, SuspendIcon } from "../../components/Icons";
import { BulkActionsBar, BulkCheckbox } from "../../components/BulkActionsBar";
import { api, ApiError } from "../../lib/api";
import { useToast } from "../../lib/toast";
import { useBulkSelection } from "../../lib/use-bulk-selection";
import type { AdminUser } from "../../lib/types";

export default function SubAdminsPage() {
  const toast = useToast();
  const [items, setItems] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [viewing, setViewing] = useState<AdminUser | null>(null);
  const [bulkConfirm, setBulkConfirm] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  const bulk = useBulkSelection(items);

  const submitBulkDelete = async () => {
    if (bulk.selectedCount === 0) return;
    setBulkLoading(true);
    const ids = bulk.selectedArray;
    const results = await Promise.allSettled(
      ids.map((id) => api.delete(`/admin/sub-admins/${id}`))
    );
    setBulkLoading(false);
    const failed = results.filter((r) => r.status === "rejected").length;
    const ok = results.length - failed;
    if (ok > 0)
      toast.success(`Deactivated ${ok} sub-admin${ok === 1 ? "" : "s"}`);
    if (failed > 0)
      toast.error(`${failed} delete${failed === 1 ? "" : "s"} failed`);
    setBulkConfirm(false);
    load();
  };

  const load = async () => {
    setLoading(true);
    try {
      const [r, p] = await Promise.all([
        api.get<AdminUser[]>("/admin/sub-admins", { page, limit }),
        api.get<string[]>("/admin/sub-admins/permissions"),
      ]);
      setItems(r.data || []);
      setTotal(r.meta?.total || 0);
      setPermissions(p.data || []);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

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

        <BulkActionsBar
          selectedCount={bulk.selectedCount}
          onClear={bulk.clear}
          onDelete={() => setBulkConfirm(true)}
        />

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {loading ? (
            <TableSkeleton rows={6} cols={6} />
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
                    <th className="px-5 py-4 font-medium">Name</th>
                    <th className="px-5 py-4 font-medium">Email</th>
                    <th className="px-5 py-4 font-medium">Password</th>
                    <th className="px-5 py-4 font-medium">Role</th>
                    <th className="px-5 py-4 font-medium">Status</th>
                    <th className="px-5 py-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-500">
                        No sub-admins
                      </td>
                    </tr>
                  ) : (
                    items.map((u) => {
                      const selected = bulk.isSelected(u._id);
                      return (
                      <tr
                        key={u._id}
                        className={`border-b border-slate-50 last:border-0 ${
                          selected ? "bg-amber-50/60" : ""
                        }`}
                      >
                        <td className="pl-5 pr-2 py-3 w-10">
                          <BulkCheckbox
                            ariaLabel={`Select ${u.name}`}
                            checked={selected}
                            onChange={() => bulk.toggle(u._id)}
                          />
                        </td>
                        <td className="px-5 py-3 text-slate-900 font-medium">{u.name}</td>
                        <td className="px-5 py-3 text-slate-600">{u.email}</td>
                        <td className="px-5 py-3 text-slate-500">**********</td>
                        <td className="px-5 py-3 text-slate-700 capitalize">
                          {u.location || (u.permissions && u.permissions[0]) || "Sub-admin"}
                        </td>
                        <td className="px-5 py-3">
                          <StatusBadge status={u.status} />
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setViewing(u)}
                              className="inline-flex items-center gap-1.5 text-[#0a7a90] hover:underline text-sm font-medium"
                            >
                              <EyeIcon size={16} />
                              View Details
                            </button>
                          </div>
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
          permissionList={permissions}
        />

        <SubAdminDetailsModal
          subAdmin={viewing}
          onClose={() => setViewing(null)}
          onSaved={() => {
            setViewing(null);
            load();
          }}
          permissionList={permissions}
        />

        <ConfirmDialog
          open={bulkConfirm}
          onClose={() => setBulkConfirm(false)}
          onConfirm={submitBulkDelete}
          title={`Delete ${bulk.selectedCount} sub-admin${
            bulk.selectedCount === 1 ? "" : "s"
          }?`}
          description="The selected sub-admin accounts will be deactivated."
          confirmText="Delete"
          danger
          loading={bulkLoading}
        />
      </main>
    </>
  );
}

function SubAdminFormModal({
  open,
  onClose,
  onSaved,
  permissionList,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  permissionList: string[];
}) {
  const toast = useToast();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    role: "",
    password: "",
    permissions: [] as string[],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        name: "",
        email: "",
        phoneNumber: "",
        role: "",
        password: "",
        permissions: [],
      });
    }
  }, [open]);

  const togglePerm = (p: string) =>
    setForm((s) => ({
      ...s,
      permissions: s.permissions.includes(p)
        ? s.permissions.filter((x) => x !== p)
        : [...s.permissions, p],
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
      const msg = err instanceof ApiError ? err.message : "Failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add new Sub admin" size="md">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Type your Name..."
        />
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="Type your email..."
        />
        <Input
          label="Phone Number"
          value={form.phoneNumber}
          onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
          placeholder="Type your phone number..."
        />
        <Select
          label="Role"
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
        >
          <option value="">Select role</option>
          <option value="Finance Admin">Finance Admin</option>
          <option value="Support Admin">Support Admin</option>
          <option value="Session Admin">Session Admin</option>
          <option value="CMS Admin">CMS Admin</option>
        </Select>
        <Input
          label="Password"
          type="text"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          placeholder="Type a password"
        />
        <div>
          <div className="text-sm font-medium text-slate-700 mb-1.5">
            Choose Permission List
          </div>
          <div className="bg-[#e6f2f6]/60 rounded-lg max-h-40 overflow-y-auto p-2 space-y-1.5">
            {permissionList.map((p) => (
              <label
                key={p}
                className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer px-2 py-1 hover:bg-white rounded"
              >
                <input
                  type="checkbox"
                  checked={form.permissions.includes(p)}
                  onChange={() => togglePerm(p)}
                />
                {p}
              </label>
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mt-5">
        <Button variant="outline" onClick={onClose}>
          Not Now
        </Button>
        <Button onClick={submit} loading={loading}>
          Add
        </Button>
      </div>
    </Modal>
  );
}

function SubAdminDetailsModal({
  subAdmin,
  onClose,
  onSaved,
  permissionList,
}: {
  subAdmin: AdminUser | null;
  onClose: () => void;
  onSaved: () => void;
  permissionList: string[];
}) {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phoneNumber: "",
    permissions: [] as string[],
    password: "",
  });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (subAdmin) {
      setForm({
        name: subAdmin.name,
        phoneNumber: subAdmin.phone || "",
        permissions: subAdmin.permissions || [],
        password: "",
      });
      setEditing(false);
    }
  }, [subAdmin]);

  if (!subAdmin) return null;

  const togglePerm = (p: string) =>
    setForm((s) => ({
      ...s,
      permissions: s.permissions.includes(p)
        ? s.permissions.filter((x) => x !== p)
        : [...s.permissions, p],
    }));

  const save = async () => {
    setActionLoading(true);
    try {
      const body: Record<string, unknown> = {
        name: form.name,
        phoneNumber: form.phoneNumber,
        permissions: form.permissions,
      };
      if (form.password) body.password = form.password;
      await api.patch(`/admin/sub-admins/${subAdmin._id}`, body);
      toast.success("Saved");
      onSaved();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed";
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const suspendToggle = async () => {
    setActionLoading(true);
    try {
      const isSuspended = subAdmin.status === "suspended";
      await api.post(
        `/admin/sub-admins/${subAdmin._id}/${isSuspended ? "unsuspend" : "suspend"}`,
        {}
      );
      toast.success(isSuspended ? "Reactivated" : "Suspended");
      onSaved();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed";
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const remove = async () => {
    if (!window.confirm("Deactivate this sub-admin?")) return;
    setActionLoading(true);
    try {
      await api.delete(`/admin/sub-admins/${subAdmin._id}`);
      toast.success("Deactivated");
      onSaved();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed";
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Modal open={!!subAdmin} onClose={onClose} title="Sub admin Details" size="md">
      <div className="absolute top-6 right-14">
        <StatusBadge status={subAdmin.status} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
        <FieldRow label="Name">
          {editing ? (
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          ) : (
            <ReadOnly>{subAdmin.name}</ReadOnly>
          )}
        </FieldRow>
        <FieldRow label="Email">
          <ReadOnly>{subAdmin.email}</ReadOnly>
        </FieldRow>
        <FieldRow label="Role">
          <ReadOnly>{subAdmin.location || "—"}</ReadOnly>
        </FieldRow>
        <FieldRow label="Password">
          {editing ? (
            <Input
              type="text"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="(leave blank to keep current)"
            />
          ) : (
            <ReadOnly>********</ReadOnly>
          )}
        </FieldRow>
        <FieldRow label="Phone Number">
          {editing ? (
            <Input
              value={form.phoneNumber}
              onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
            />
          ) : (
            <ReadOnly>{subAdmin.phone || "—"}</ReadOnly>
          )}
        </FieldRow>
        <FieldRow label="Permission">
          {editing ? (
            <div className="bg-[#e6f2f6]/60 rounded-lg max-h-40 overflow-y-auto p-2 space-y-1.5">
              {permissionList.map((p) => (
                <label
                  key={p}
                  className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer px-2 py-1 hover:bg-white rounded"
                >
                  <input
                    type="checkbox"
                    checked={form.permissions.includes(p)}
                    onChange={() => togglePerm(p)}
                  />
                  {p}
                </label>
              ))}
            </div>
          ) : (
            <ReadOnly>
              {subAdmin.permissions?.length
                ? subAdmin.permissions.join(", ")
                : "All Admin"}
            </ReadOnly>
          )}
        </FieldRow>
      </div>

      <div className="mt-5 flex flex-col md:flex-row gap-3">
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
            <Button
              variant={subAdmin.status === "suspended" ? "primary" : "danger"}
              onClick={suspendToggle}
              loading={actionLoading}
              className="flex-1"
            >
              <SuspendIcon size={16} />
              {subAdmin.status === "suspended" ? "Unsuspend this user" : "Suspend this User"}
            </Button>
            <Button
              variant="success"
              onClick={() => setEditing(true)}
              className="px-6"
            >
              Edit Details
            </Button>
            <button
              type="button"
              onClick={remove}
              disabled={actionLoading}
              className="h-10 w-10 rounded-lg border border-red-200 text-red-500 inline-flex items-center justify-center hover:bg-red-50 disabled:opacity-50"
              aria-label="Delete"
            >
              ✕
            </button>
          </>
        )}
      </div>
    </Modal>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      {children}
    </div>
  );
}

function ReadOnly({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#e6f2f6]/60 rounded-lg px-3 py-2.5 text-sm text-slate-800">
      {children}
    </div>
  );
}
