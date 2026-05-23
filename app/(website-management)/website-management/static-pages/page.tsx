"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "../../../components/PageHeader";
import { FormSkeleton } from "../../../components/Skeleton";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Tabs } from "../../../components/ui/Tabs";
import { api, ApiError } from "../../../lib/api";
import { useToast } from "../../../lib/toast";
import { RichTextEditor } from "../../../components/website/RichTextEditor";
import type { CmsPage } from "../../../lib/types";

const TABS = [
  { value: "privacy_policy", label: "Privacy Policy" },
  { value: "terms_of_service", label: "Terms of Service" }
];

export default function StaticPagesEditor() {
  const [tab, setTab] = useState("privacy_policy");

  return (
    <main className="px-6 md:px-10 py-8 w-full pb-16">
      <PageHeader
        title="Privacy & Terms"
        description="Long-form legal pages shown at /privacy and /terms."
        breadcrumb={[{ label: "Website Management", href: "/website-management" }, { label: "Privacy & Terms" }]}
      />
      <div className="mb-6">
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
      </div>
      <PageEditor key={tab} slug={tab} title={tab === "privacy_policy" ? "Privacy Policy" : "Terms of Service"} />
    </main>
  );
}

function PageEditor({ slug, title }: { slug: string; title: string }) {
  const toast = useToast();
  const [pageTitle, setPageTitle] = useState(title);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const r = await api.get<CmsPage | null>(`/cms/pages/${slug}`);
        if (cancelled) return;
        if (r.data) {
          setPageTitle(r.data.title || title);
          setContent(r.data.content || "");
        } else {
          setPageTitle(title);
          setContent("");
        }
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Load failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [slug, title, toast]);

  const save = async () => {
    setSaving(true);
    try {
      await api.put(`/cms/pages/${slug}`, { title: pageTitle, content });
      toast.success("Saved");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <FormSkeleton rows={4} />;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
      <Input label="Page title" value={pageTitle} onChange={(e) => setPageTitle(e.target.value)} />
      <RichTextEditor
        label="Content"
        value={content}
        onChange={setContent}
        pageSlug="global"
        sectionKey={`page-${slug}`}
        placeholder="Write the page content…"
        minHeight={480}
      />
      <Button onClick={save} loading={saving}>Save</Button>
    </div>
  );
}
