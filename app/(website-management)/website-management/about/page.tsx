"use client";

import { PageHeader } from "../../../components/PageHeader";
import { Spinner } from "../../../components/Spinner";
import { Input, Textarea } from "../../../components/ui/Input";
import { useSiteContentEditor } from "../../../lib/use-site-content-editor";
import { SectionCard, FieldGrid } from "../../../components/website/SectionCard";
import { RepeatableList } from "../../../components/website/RepeatableList";
import { LinkField, BulletList } from "../../../components/website/fields";
import { SaveBar } from "../../../components/website/SaveBar";

type Link = { label?: string; href?: string };
type Step = { icon?: string; title?: string; description?: string };
type Card = { icon?: string; title?: string; description?: string };

type AboutSections = {
  hero?: { title?: string; subtitle?: string };
  story?: { title?: string; paragraphs?: string[] };
  values?: { title?: string; cards?: Card[] };
  howItWorks?: { sectionLabel?: string; title?: string; subtitle?: string; steps?: Step[] };
  whyChoose?: { sectionLabel?: string; title?: string; subtitle?: string; cards?: Card[] };
  cta?: { title?: string; subtitle?: string; buttonPrimary?: Link; buttonSecondary?: Link };
};

const DEFAULT: AboutSections = {
  hero: {}, story: { paragraphs: [] }, values: { cards: [] },
  howItWorks: { steps: [] }, whyChoose: { cards: [] }, cta: {}
};

export default function AboutEditorPage() {
  const ed = useSiteContentEditor<AboutSections>("about", DEFAULT);
  if (ed.loading) return <main className="px-6 md:px-10 py-8"><Spinner /></main>;

  return (
    <main className="px-6 md:px-10 py-8 max-w-5xl pb-32">
      <PageHeader
        title="About page"
        description="Story, values, and reinforcement of how the platform works."
        breadcrumb={[{ label: "Website Management", href: "/website-management" }, { label: "About" }]}
      />

      <SectionCard title="Hero">
        <Input label="Title" value={ed.sections.hero?.title || ""}
          onChange={(e) => ed.updateSection("hero", { title: e.target.value })} />
        <Textarea label="Subtitle" rows={4} value={ed.sections.hero?.subtitle || ""}
          onChange={(e) => ed.updateSection("hero", { subtitle: e.target.value })} />
      </SectionCard>

      <SectionCard title="Our Story">
        <Input label="Title" value={ed.sections.story?.title || ""}
          onChange={(e) => ed.updateSection("story", { title: e.target.value })} />
        <BulletList label="Paragraphs" placeholder="Type a paragraph…"
          items={ed.sections.story?.paragraphs || []}
          onChange={(v) => ed.updateSection("story", { paragraphs: v })} />
      </SectionCard>

      <SectionCard title="Our Values">
        <Input label="Title" value={ed.sections.values?.title || ""}
          onChange={(e) => ed.updateSection("values", { title: e.target.value })} />
        <RepeatableList
          label="Value cards"
          items={ed.sections.values?.cards || []}
          onChange={(v) => ed.updateSection("values", { cards: v })}
          newItem={() => ({})}
          addLabel="Add card"
          itemTitle={(c, i) => c.title || `Card ${i + 1}`}
          renderItem={(c, _i, update) => (
            <div className="space-y-3">
              <FieldGrid cols={2}>
                <Input label="Icon key" value={c.icon || ""} onChange={(e) => update({ ...c, icon: e.target.value })} />
                <Input label="Title" value={c.title || ""} onChange={(e) => update({ ...c, title: e.target.value })} />
              </FieldGrid>
              <Textarea label="Description" rows={3} value={c.description || ""}
                onChange={(e) => update({ ...c, description: e.target.value })} />
            </div>
          )}
        />
      </SectionCard>

      <SectionCard title="How Prophetic Pathway Works (repeat)">
        <FieldGrid cols={2}>
          <Input label="Eyebrow" value={ed.sections.howItWorks?.sectionLabel || ""}
            onChange={(e) => ed.updateSection("howItWorks", { sectionLabel: e.target.value })} />
          <Input label="Title" value={ed.sections.howItWorks?.title || ""}
            onChange={(e) => ed.updateSection("howItWorks", { title: e.target.value })} />
        </FieldGrid>
        <Textarea label="Subtitle" rows={2} value={ed.sections.howItWorks?.subtitle || ""}
          onChange={(e) => ed.updateSection("howItWorks", { subtitle: e.target.value })} />
        <RepeatableList
          label="Steps"
          items={ed.sections.howItWorks?.steps || []}
          onChange={(v) => ed.updateSection("howItWorks", { steps: v })}
          newItem={() => ({})}
          addLabel="Add step"
          itemTitle={(s, i) => s.title || `Step ${i + 1}`}
          renderItem={(s, _i, update) => (
            <div className="space-y-3">
              <FieldGrid cols={2}>
                <Input label="Icon key" value={s.icon || ""} onChange={(e) => update({ ...s, icon: e.target.value })} />
                <Input label="Title" value={s.title || ""} onChange={(e) => update({ ...s, title: e.target.value })} />
              </FieldGrid>
              <Textarea label="Description" rows={2} value={s.description || ""}
                onChange={(e) => update({ ...s, description: e.target.value })} />
            </div>
          )}
        />
      </SectionCard>

      <SectionCard title="Why Choose (repeat)">
        <FieldGrid cols={2}>
          <Input label="Eyebrow" value={ed.sections.whyChoose?.sectionLabel || ""}
            onChange={(e) => ed.updateSection("whyChoose", { sectionLabel: e.target.value })} />
          <Input label="Title" value={ed.sections.whyChoose?.title || ""}
            onChange={(e) => ed.updateSection("whyChoose", { title: e.target.value })} />
        </FieldGrid>
        <Textarea label="Subtitle" rows={2} value={ed.sections.whyChoose?.subtitle || ""}
          onChange={(e) => ed.updateSection("whyChoose", { subtitle: e.target.value })} />
        <RepeatableList
          label="Cards"
          items={ed.sections.whyChoose?.cards || []}
          onChange={(v) => ed.updateSection("whyChoose", { cards: v })}
          newItem={() => ({})}
          addLabel="Add card"
          itemTitle={(c, i) => c.title || `Card ${i + 1}`}
          renderItem={(c, _i, update) => (
            <div className="space-y-3">
              <FieldGrid cols={2}>
                <Input label="Icon key" value={c.icon || ""} onChange={(e) => update({ ...c, icon: e.target.value })} />
                <Input label="Title" value={c.title || ""} onChange={(e) => update({ ...c, title: e.target.value })} />
              </FieldGrid>
              <Textarea label="Description" rows={3} value={c.description || ""}
                onChange={(e) => update({ ...c, description: e.target.value })} />
            </div>
          )}
        />
      </SectionCard>

      <SectionCard title="Bottom CTA">
        <Input label="Title" value={ed.sections.cta?.title || ""}
          onChange={(e) => ed.updateSection("cta", { title: e.target.value })} />
        <Textarea label="Subtitle" rows={2} value={ed.sections.cta?.subtitle || ""}
          onChange={(e) => ed.updateSection("cta", { subtitle: e.target.value })} />
        <FieldGrid cols={2}>
          <LinkField label="Primary button" value={ed.sections.cta?.buttonPrimary}
            onChange={(v) => ed.updateSection("cta", { buttonPrimary: v })} />
          <LinkField label="Secondary button" value={ed.sections.cta?.buttonSecondary}
            onChange={(v) => ed.updateSection("cta", { buttonSecondary: v })} />
        </FieldGrid>
      </SectionCard>

      <SaveBar onSave={ed.save} onReset={ed.reset} saving={ed.saving} dirty={ed.dirty} lastSavedAt={ed.doc?.updatedAt} />
    </main>
  );
}
