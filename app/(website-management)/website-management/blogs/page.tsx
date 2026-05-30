"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { PageHeader } from "../../../components/PageHeader";
import { FormSkeleton, CardSkeleton } from "../../../components/Skeleton";
import { Button } from "../../../components/ui/Button";
import { Input, Textarea, Select } from "../../../components/ui/Input";
import { Modal, ConfirmDialog } from "../../../components/ui/Modal";
import { Tabs } from "../../../components/ui/Tabs";
import { Avatar } from "../../../components/ui/Avatar";
import { Badge } from "../../../components/ui/Badge";
import { PlusIcon, EditIcon, TrashIcon, UploadIcon } from "../../../components/Icons";
import { BulkActionsBar, BulkCheckbox } from "../../../components/BulkActionsBar";
import { api, ApiError } from "../../../lib/api";
import { useToast } from "../../../lib/toast";
import { useBulkSelection } from "../../../lib/use-bulk-selection";
import { formatDate } from "../../../lib/format";
import { useSiteContentEditor } from "../../../lib/use-site-content-editor";
import { fetchSiteContent } from "../../../lib/site-content";
import { SectionCard, FieldGrid } from "../../../components/website/SectionCard";
import { ImageUploadField } from "../../../components/website/ImageUploadField";
import { BulletList } from "../../../components/website/fields";
import { SaveBar } from "../../../components/website/SaveBar";
import { RichTextEditor } from "../../../components/website/RichTextEditor";
import type { Blog } from "../../../lib/types";

const TABS = [
  { value: "page", label: "Page content" },
  { value: "posts", label: "Blog posts" }
];

export default function BlogsAdminPage() {
  const [tab, setTab] = useState("page");

  return (
    <main className="px-6 md:px-10 py-8 w-full pb-32">
      <PageHeader
        title="Blogs"
        description="Edit the public blogs page and manage individual articles."
        breadcrumb={[{ label: "Website Management", href: "/website-management" }, { label: "Blogs" }]}
      />
      <div className="mb-6">
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
      </div>
      {tab === "page" ? <PageContentTab /> : <BlogPostsTab />}
    </main>
  );
}

// ===================== Page content tab =====================

type BlogsSections = {
  hero?: { eyebrow?: string; title?: string; subtitle?: string; searchPlaceholder?: string; backgroundImage?: string };
  categories?: string[];
  newsletterCta?: { title?: string; subtitle?: string; placeholder?: string; buttonLabel?: string };
};

const DEFAULT: BlogsSections = { hero: {}, categories: [], newsletterCta: {} };

function PageContentTab() {
  const ed = useSiteContentEditor<BlogsSections>("blogs", DEFAULT);
  if (ed.loading) return <FormSkeleton rows={5} />;

  return (
    <>
      <SectionCard title="Hero">
        <FieldGrid cols={2}>
          <Input label="Eyebrow" value={ed.sections.hero?.eyebrow || ""}
            onChange={(e) => ed.updateSection("hero", { eyebrow: e.target.value })} />
          <Input label="Title" value={ed.sections.hero?.title || ""}
            onChange={(e) => ed.updateSection("hero", { title: e.target.value })} />
        </FieldGrid>
        <Textarea label="Subtitle" rows={2} value={ed.sections.hero?.subtitle || ""}
          onChange={(e) => ed.updateSection("hero", { subtitle: e.target.value })} />
        <FieldGrid cols={2}>
          <Input label="Search placeholder" value={ed.sections.hero?.searchPlaceholder || ""}
            onChange={(e) => ed.updateSection("hero", { searchPlaceholder: e.target.value })} />
          <div className="max-w-sm">
            <ImageUploadField
              pageSlug="blogs"
              sectionKey="hero"
              label="Hero background image"
              value={ed.sections.hero?.backgroundImage}
              onChange={(url) => ed.updateSection("hero", { backgroundImage: url })}
            />
          </div>
        </FieldGrid>
      </SectionCard>

      <SectionCard title="Category filter chips" description="Used for the filter row and the category dropdown when creating a post. Keep 'All' as the first item.">
        <BulletList items={ed.sections.categories || []} onChange={(v) => ed.setSection("categories", v)} placeholder="Category name" />
      </SectionCard>

      <SectionCard title="Newsletter CTA (bottom of page)">
        <Input label="Title" value={ed.sections.newsletterCta?.title || ""}
          onChange={(e) => ed.updateSection("newsletterCta", { title: e.target.value })} />
        <Textarea label="Subtitle" rows={2} value={ed.sections.newsletterCta?.subtitle || ""}
          onChange={(e) => ed.updateSection("newsletterCta", { subtitle: e.target.value })} />
        <FieldGrid cols={2}>
          <Input label="Input placeholder" value={ed.sections.newsletterCta?.placeholder || ""}
            onChange={(e) => ed.updateSection("newsletterCta", { placeholder: e.target.value })} />
          <Input label="Button label" value={ed.sections.newsletterCta?.buttonLabel || ""}
            onChange={(e) => ed.updateSection("newsletterCta", { buttonLabel: e.target.value })} />
        </FieldGrid>
      </SectionCard>

      <SaveBar onSave={ed.save} onReset={ed.reset} saving={ed.saving} dirty={ed.dirty} lastSavedAt={ed.doc?.updatedAt} />
    </>
  );
}

// ===================== Blog posts tab =====================

type BlogWithCategory = Blog & { category?: string; excerpt?: string; authorPhoto?: string };

function BlogPostsTab() {
  const toast = useToast();
  const [items, setItems] = useState<BlogWithCategory[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<BlogWithCategory | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<BlogWithCategory | null>(null);
  const [bulkConfirm, setBulkConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const bulk = useBulkSelection(items);

  const load = async () => {
    setLoading(true);
    try {
      const [blogs, blogsContent] = await Promise.all([
        api.get<BlogWithCategory[]>("/cms/blogs", { limit: 100 }),
        fetchSiteContent<{ categories?: string[] }>("blogs")
      ]);
      setItems(blogs.data || []);
      const cats = (blogsContent.sections.categories || []).filter((c) => c && c !== "All");
      setCategories(cats);
      bulk.clear();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Load failed");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const submitDelete = async () => {
    if (!deleteConfirm) return;
    setActionLoading(true);
    try {
      await api.delete(`/cms/blogs/${deleteConfirm._id}`);
      toast.success("Blog deleted");
      setDeleteConfirm(null);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Delete failed");
    } finally {
      setActionLoading(false);
    }
  };

  const submitBulkDelete = async () => {
    if (bulk.selectedCount === 0) return;
    setActionLoading(true);
    const ids = bulk.selectedArray;
    const results = await Promise.allSettled(
      ids.map((id) => api.delete(`/cms/blogs/${id}`))
    );
    setActionLoading(false);
    const failed = results.filter((r) => r.status === "rejected").length;
    const ok = results.length - failed;
    if (ok > 0) toast.success(`Deleted ${ok} post${ok === 1 ? "" : "s"}`);
    if (failed > 0)
      toast.error(`${failed} delete${failed === 1 ? "" : "s"} failed`);
    setBulkConfirm(false);
    load();
  };

  return (
    <>
      <BulkActionsBar
        selectedCount={bulk.selectedCount}
        onClear={bulk.clear}
        onDelete={() => setBulkConfirm(true)}
      />

      <div className="flex justify-end mb-4">
        <Button onClick={() => setCreating(true)}>
          <PlusIcon size={16} /> Add new post
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-500">
          No blog posts yet. Click <span className="font-medium">Add new post</span> to create one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {items.map((b) => {
            const selected = bulk.isSelected(b._id);
            return (
            <article
              key={b._id}
              className={`bg-white rounded-xl border overflow-hidden flex flex-col ${
                selected
                  ? "border-[#0a7a90]/60 ring-2 ring-[#0a7a90]/20"
                  : "border-slate-200"
              }`}
            >
              <div className="aspect-video bg-slate-100 relative">
                {b.thumbnail ? (
                  <Image src={b.thumbnail} alt={b.title} fill className="object-cover" sizes="320px" unoptimized />
                ) : null}
                {b.category ? (
                  <Badge tone="info" className="absolute top-3 left-3">{b.category}</Badge>
                ) : null}
                <span className="absolute top-3 right-3 bg-white/90 rounded p-1 shadow">
                  <BulkCheckbox
                    ariaLabel={`Select blog ${b.title}`}
                    checked={selected}
                    onChange={() => bulk.toggle(b._id)}
                  />
                </span>
              </div>
              <div className="p-4 flex flex-col flex-1">
                <h3 className="font-semibold text-slate-900 line-clamp-2 mb-1">{b.title}</h3>
                {b.excerpt ? <p className="text-sm text-slate-600 line-clamp-2 mb-3">{b.excerpt}</p> : null}
                <div className="flex items-center gap-2 mt-auto pt-2 border-t border-slate-100">
                  <Avatar src={b.profilePicture || b.authorPhoto} name={b.authorName} size={28} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-slate-700 truncate">{b.authorName || "—"}</div>
                    <div className="text-[10px] text-slate-400">{formatDate(b.publishedAt || b.createdAt)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setEditing(b)}>
                    <EditIcon size={12} /> Edit
                  </Button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm(b)}
                    className="h-8 w-8 rounded-lg border border-red-200 text-red-500 inline-flex items-center justify-center hover:bg-red-50"
                  >
                    <TrashIcon size={14} />
                  </button>
                </div>
              </div>
            </article>
            );
          })}
        </div>
      )}

      <BlogModal
        open={creating}
        categories={categories}
        onClose={() => setCreating(false)}
        onSaved={() => { setCreating(false); load(); }}
      />
      <BlogModal
        open={!!editing}
        blog={editing}
        categories={categories}
        onClose={() => setEditing(null)}
        onSaved={() => { setEditing(null); load(); }}
      />
      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={submitDelete}
        title="Delete blog post?"
        description={`"${deleteConfirm?.title}" will be permanently removed.`}
        danger
        loading={actionLoading}
      />
      <ConfirmDialog
        open={bulkConfirm}
        onClose={() => setBulkConfirm(false)}
        onConfirm={submitBulkDelete}
        title={`Delete ${bulk.selectedCount} blog post${
          bulk.selectedCount === 1 ? "" : "s"
        }?`}
        description="The selected blog posts will be permanently removed."
        confirmText="Delete"
        danger
        loading={actionLoading}
      />
    </>
  );
}

function BlogModal({
  open,
  blog,
  categories,
  onClose,
  onSaved
}: {
  open: boolean;
  blog?: BlogWithCategory | null;
  categories: string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [authorName, setAuthorName] = useState("");
  const [authorTitle, setAuthorTitle] = useState("");
  const [category, setCategory] = useState(categories[0] || "Meditation & Mindfulness");
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [readMinutes, setReadMinutes] = useState(6);
  const [isPublished, setIsPublished] = useState(true);
  const [profile, setProfile] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (blog) {
      setAuthorName(blog.authorName || "");
      setAuthorTitle(blog.authorTitle || "");
      setCategory(blog.category || blog.type || categories[0] || "Meditation & Mindfulness");
      setTitle(blog.title || "");
      setExcerpt(blog.excerpt || "");
      setContent(blog.content || "");
      setReadMinutes(blog.readMinutes || 6);
      setIsPublished(blog.isPublished ?? true);
    } else {
      setAuthorName("");
      setAuthorTitle("");
      setCategory(categories[0] || "Meditation & Mindfulness");
      setTitle("");
      setExcerpt("");
      setContent("");
      setReadMinutes(6);
      setIsPublished(true);
    }
    setProfile(null);
    setThumbnail(null);
  }, [blog, open, categories]);

  const submit = async () => {
    if (!authorName || !title) {
      toast.error("Author name and title are required");
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("authorName", authorName);
      fd.append("authorTitle", authorTitle);
      fd.append("category", category);
      fd.append("type", category);
      fd.append("title", title);
      fd.append("excerpt", excerpt);
      fd.append("content", content);
      fd.append("readMinutes", String(readMinutes));
      fd.append("isPublished", String(isPublished));
      if (profile) fd.append("profile", profile);
      if (thumbnail) fd.append("thumbnail", thumbnail);

      if (blog) {
        await api.patch(`/cms/blogs/${blog._id}`, fd, { isFormData: true });
        toast.success("Updated");
      } else {
        await api.post("/cms/blogs", fd, { isFormData: true });
        toast.success("Created");
      }
      onSaved();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Save failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={blog ? "Edit blog post" : "New blog post"} size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input label="Author name *" value={authorName} onChange={(e) => setAuthorName(e.target.value)} />
          <Input label="Author title (e.g. 'Dream Interpretation Specialist')" value={authorTitle} onChange={(e) => setAuthorTitle(e.target.value)} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Select label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.length === 0 ? (
              <option value="Meditation & Mindfulness">Meditation & Mindfulness</option>
            ) : (
              categories.map((c) => <option key={c} value={c}>{c}</option>)
            )}
          </Select>
          <Input label="Read time (min)" type="number" min={1} value={readMinutes}
            onChange={(e) => setReadMinutes(Math.max(1, Number(e.target.value) || 1))} />
        </div>

        <Input label="Title *" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Textarea label="Excerpt (1-2 sentence preview)" rows={2} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />

        <FileFieldInline label="Author photo" file={profile} onChange={setProfile} existing={blog?.profilePicture} />
        <FileFieldInline label="Thumbnail" file={thumbnail} onChange={setThumbnail} existing={blog?.thumbnail} />

        <RichTextEditor
          label="Article content"
          value={content}
          onChange={setContent}
          pageSlug="blogs"
          sectionKey={blog ? `post-${blog._id}` : "post-new"}
          placeholder="Write the article…"
          minHeight={360}
        />

        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="h-4 w-4 accent-[#0a7a90]" />
          Published
        </label>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={loading}>{blog ? "Save" : "Publish"}</Button>
        </div>
      </div>
    </Modal>
  );
}

function FileFieldInline({
  label,
  file,
  onChange,
  existing
}: {
  label: string;
  file: File | null;
  onChange: (f: File | null) => void;
  existing?: string;
}) {
  // Build a preview URL: new File → object URL, else fall back to existing URL.
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!file) {
      setObjectUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const preview = objectUrl || existing || null;

  return (
    <div>
      <div className="text-sm font-medium text-slate-700 mb-2">{label}</div>
      {preview ? (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt={label}
            className="h-20 w-20 rounded-lg object-cover border border-[#cbe4eb] shrink-0"
          />
          <div className="flex flex-col gap-1.5">
            <label className="cursor-pointer inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium hover:bg-slate-50 w-fit">
              Replace
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onChange(e.target.files?.[0] || null)}
              />
            </label>
            {file && (
              <button
                type="button"
                onClick={() => onChange(null)}
                className="text-xs font-medium text-red-600 hover:underline w-fit text-left"
              >
                Remove selected
              </button>
            )}
            <span className="text-[10px] text-slate-400 truncate max-w-50">
              {file ? file.name : "Current image"}
            </span>
          </div>
        </div>
      ) : (
        <label className="block bg-[#e6f2f6]/60 border border-dashed border-[#cbe4eb] rounded-lg px-4 py-6 text-center cursor-pointer hover:bg-[#e6f2f6]">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onChange(e.target.files?.[0] || null)}
          />
          <div className="inline-flex flex-col items-center text-[#0a7a90]">
            <UploadIcon size={24} />
            <div className="text-sm font-medium text-slate-700 mt-1">
              Click to upload image
            </div>
          </div>
        </label>
      )}
    </div>
  );
}
