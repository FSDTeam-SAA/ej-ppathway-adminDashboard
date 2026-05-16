"use client";

import { PageHeader } from "../../../components/PageHeader";
import { Spinner } from "../../../components/Spinner";
import { Input, Textarea } from "../../../components/ui/Input";
import { useSiteContentEditor } from "../../../lib/use-site-content-editor";
import { SectionCard, FieldGrid } from "../../../components/website/SectionCard";
import { ImageUploadField } from "../../../components/website/ImageUploadField";
import { BulletList } from "../../../components/website/fields";
import { SaveBar } from "../../../components/website/SaveBar";

type BlogsSections = {
  hero?: { eyebrow?: string; title?: string; subtitle?: string; searchPlaceholder?: string; backgroundImage?: string };
  categories?: string[];
  newsletterCta?: { title?: string; subtitle?: string; placeholder?: string; buttonLabel?: string };
};

const DEFAULT: BlogsSections = { hero: {}, categories: [], newsletterCta: {} };

export default function BlogsPageEditor() {
  const ed = useSiteContentEditor<BlogsSections>("blogs", DEFAULT);
  if (ed.loading) return <main className="px-6 md:px-10 py-8"><Spinner /></main>;

  return (
    <main className="px-6 md:px-10 py-8 max-w-5xl pb-32">
      <PageHeader
        title="Blogs page"
        description="Hero, filter chips, and newsletter CTA on the public /blogs listing page. Actual blog posts are managed under Blog Posts."
        breadcrumb={[{ label: "Website Management", href: "/website-management" }, { label: "Blogs Page" }]}
      />

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

      <SectionCard title="Category filter chips" description="Used in the filter row and also as the category dropdown for new blog posts. The first item should be 'All'.">
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
    </main>
  );
}
