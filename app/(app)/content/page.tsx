"use client";

import { useEffect, useState } from "react";
import { Topbar } from "../../components/Topbar";
import { PageHeader } from "../../components/PageHeader";
import { Tabs } from "../../components/ui/Tabs";
import { Spinner } from "../../components/Spinner";
import { Modal, ConfirmDialog } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Select } from "../../components/ui/Input";
import { Avatar } from "../../components/ui/Avatar";
import { Badge } from "../../components/ui/Badge";
import {
  EditIcon,
  PlusIcon,
  TrashIcon,
  UploadIcon,
} from "../../components/Icons";
import { api, ApiError } from "../../lib/api";
import { useToast } from "../../lib/toast";
import { formatDate } from "../../lib/format";
import type { Blog, CmsPage } from "../../lib/types";

const TABS = [
  { value: "blog", label: "Blog & Article Management" },
  { value: "privacy", label: "Privacy and policy Management" },
  { value: "terms", label: "Terms and Service Management" },
];

export default function ContentPage() {
  const [tab, setTab] = useState("blog");
  return (
    <>
      <Topbar />
      <main className="px-6 md:px-8 pb-10">
        <PageHeader
          title="Content (CMS)"
          breadcrumb={[
            { label: "Dashboard", href: "/" },
            { label: "Content (CMS)" },
          ]}
        />
        <div className="mb-6">
          <Tabs tabs={TABS} active={tab} onChange={setTab} />
        </div>
        {tab === "blog" && <BlogTab />}
        {tab === "privacy" && <PageEditor slug="privacy_policy" title="Privacy and policy Management" />}
        {tab === "terms" && <PageEditor slug="terms_of_service" title="Terms and Service Management" />}
      </main>
    </>
  );
}

function BlogTab() {
  const toast = useToast();
  const [items, setItems] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Blog | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Blog | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get<Blog[]>("/cms/blogs");
      setItems(r.data || []);
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
      await api.delete(`/cms/blogs/${deleteConfirm._id}`);
      toast.success("Blog deleted");
      setDeleteConfirm(null);
      load();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed";
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-slate-900">
          Blog & Article Management
        </h2>
        <Button onClick={() => setCreating(true)}>
          <PlusIcon size={16} /> Add New Blog
        </Button>
      </div>
      {loading ? (
        <div className="py-20 flex justify-center text-[#0a7a90]">
          <Spinner size={32} />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center text-slate-500">
          No blogs yet
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {items.map((b) => (
            <div
              key={b._id}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col"
            >
              <div className="aspect-video bg-slate-100 relative">
                {b.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={b.thumbnail}
                    alt={b.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : null}
                <Badge tone="info" className="absolute top-3 left-3">
                  {b.type || "Blog"}
                </Badge>
              </div>
              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-bold text-lg text-slate-900 mb-2">{b.title}</h3>
                <p className="text-sm text-slate-600 line-clamp-3 mb-3">
                  {b.content?.replace(/<[^>]*>/g, "").slice(0, 140)}
                </p>
                <div className="flex items-center gap-3 mt-auto pt-3 border-t border-slate-100">
                  <Avatar src={b.profilePicture} name={b.authorName} size={36} />
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-slate-900">
                      {b.authorName}
                    </div>
                    <div className="text-xs text-slate-500">
                      {b.authorTitle || formatDate(b.publishedAt || b.createdAt)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setEditing(b)}
                  >
                    <EditIcon size={14} /> Edit Details
                  </Button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm(b)}
                    className="h-9 w-9 rounded-lg border border-red-200 text-red-500 inline-flex items-center justify-center hover:bg-red-50"
                    aria-label="Delete"
                  >
                    <TrashIcon size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <BlogModal
        open={creating}
        onClose={() => setCreating(false)}
        onSaved={() => {
          setCreating(false);
          load();
        }}
      />
      <BlogModal
        open={!!editing}
        blog={editing}
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
        title="Delete blog?"
        description={`"${deleteConfirm?.title}" will be permanently removed.`}
        danger
        loading={actionLoading}
      />
    </>
  );
}

function BlogModal({
  open,
  onClose,
  onSaved,
  blog,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  blog?: Blog | null;
}) {
  const toast = useToast();
  const [authorName, setAuthorName] = useState("");
  const [type, setType] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [profile, setProfile] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (blog) {
      setAuthorName(blog.authorName || "");
      setType(blog.type || "");
      setTitle(blog.title || "");
      setContent(blog.content || "");
    } else {
      setAuthorName("");
      setType("Meditation & Mindfulness");
      setTitle("");
      setContent("");
    }
    setProfile(null);
    setThumbnail(null);
  }, [blog, open]);

  const submit = async () => {
    if (!authorName || !title) {
      toast.error("Name and title required");
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("authorName", authorName);
      fd.append("type", type || "Blog");
      fd.append("title", title);
      fd.append("content", content);
      if (profile) fd.append("profile", profile);
      if (thumbnail) fd.append("thumbnail", thumbnail);

      if (blog) {
        await api.patch(`/cms/blogs/${blog._id}`, fd, { isFormData: true });
        toast.success("Blog updated");
      } else {
        await api.post(`/cms/blogs`, fd, { isFormData: true });
        toast.success("Blog created");
      }
      onSaved();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={blog ? "Edit Blog" : "Add New Blog"}
      size="lg"
    >
      <div className="space-y-4">
        <Input
          label="User Name"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          placeholder="Type your name..."
        />
        <Select
          label="Blog Type"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option>Meditation & Mindfulness</option>
          <option>Spiritual Growth</option>
          <option>Relationships</option>
          <option>Career</option>
          <option>Family</option>
        </Select>

        <FileField
          label="Upload Profile Picture"
          file={profile}
          onChange={setProfile}
          existing={blog?.profilePicture}
          placeholder="Upload Profile Photo"
        />
        <FileField
          label="Upload Thumbnail Picture"
          file={thumbnail}
          onChange={setThumbnail}
          existing={blog?.thumbnail}
          placeholder="Upload thumbnail Photo"
        />
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Blog title"
        />
        <Textarea
          label="Blog Details"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type blog details..."
          className="min-h-[180px]"
        />
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>
            Not Now
          </Button>
          <Button onClick={submit} loading={loading}>
            {blog ? "Save" : "Add"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function FileField({
  label,
  file,
  onChange,
  existing,
  placeholder,
}: {
  label: string;
  file: File | null;
  onChange: (f: File | null) => void;
  existing?: string;
  placeholder: string;
}) {
  return (
    <div>
      <div className="text-sm font-medium text-slate-700 mb-2">{label}</div>
      <label className="block bg-[#e6f2f6]/60 border border-dashed border-[#cbe4eb] rounded-lg px-4 py-8 text-center cursor-pointer hover:bg-[#e6f2f6]">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onChange(e.target.files?.[0] || null)}
        />
        <div className="inline-flex flex-col items-center text-[#0a7a90]">
          <UploadIcon size={28} />
          <div className="font-semibold text-slate-700 mt-2">
            {file ? file.name : placeholder}
          </div>
          <div className="text-xs text-slate-500">png, jpeg, jpg</div>
          {existing && !file && (
            <div className="mt-2 text-xs text-slate-500 truncate max-w-xs">
              Current: {existing.split("/").pop()}
            </div>
          )}
        </div>
      </label>
    </div>
  );
}

function PageEditor({ slug, title }: { slug: string; title: string }) {
  const toast = useToast();
  const [content, setContent] = useState("");
  const [pageTitle, setPageTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get<CmsPage | null>(`/cms/pages/${slug}`);
      if (r.data) {
        setContent(r.data.content || "");
        setPageTitle(r.data.title || title);
      } else {
        setContent("");
        setPageTitle(title);
      }
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
  }, [slug]);

  const save = async () => {
    setSaving(true);
    try {
      await api.put(`/cms/pages/${slug}`, { title: pageTitle, content });
      toast.success("Saved");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <h2 className="text-xl font-bold text-slate-900 mb-4">{title}</h2>
      {loading ? (
        <div className="py-12 flex justify-center text-[#0a7a90]">
          <Spinner size={28} />
        </div>
      ) : (
        <div className="space-y-4">
          <Input
            label="Page Title"
            value={pageTitle}
            onChange={(e) => setPageTitle(e.target.value)}
          />
          <Textarea
            label="Page Content (HTML or plain text)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[400px] font-mono text-sm"
          />
          <Button onClick={save} loading={saving}>
            Save Changes
          </Button>
        </div>
      )}
    </div>
  );
}
