"use client";

import { PageHeader } from "../../../components/PageHeader";
import { Spinner } from "../../../components/Spinner";
import { Input, Textarea } from "../../../components/ui/Input";
import { useSiteContentEditor } from "../../../lib/use-site-content-editor";
import { SectionCard, FieldGrid } from "../../../components/website/SectionCard";
import { RepeatableList } from "../../../components/website/RepeatableList";
import { LinkField } from "../../../components/website/fields";
import { SaveBar } from "../../../components/website/SaveBar";

type Link = { label?: string; href?: string };

type EthicalSections = {
  hero?: { badge?: string; title?: string; subtitle?: string; banner?: string };
  standards?: { icon?: string; title?: string; description?: string }[];
  commitment?: { title?: string; body?: string; ctaPrimary?: Link; ctaSecondary?: Link };
};

const DEFAULT: EthicalSections = { hero: {}, standards: [], commitment: {} };

export default function EthicalStandardsEditorPage() {
  const ed = useSiteContentEditor<EthicalSections>("ethical-standards", DEFAULT);
  if (ed.loading) return <main className="px-6 md:px-10 py-8"><Spinner /></main>;

  return (
    <main className="px-6 md:px-10 py-8 max-w-5xl mx-auto pb-32">
      <PageHeader
        title="Ethical Standards"
        description="Standards page that advisor applicants must read before applying."
        breadcrumb={[{ label: "Website Management", href: "/website-management" }, { label: "Ethical Standards" }]}
      />

      <SectionCard title="Hero">
        <FieldGrid cols={2}>
          <Input label="Badge / icon caption" value={ed.sections.hero?.badge || ""}
            onChange={(e) => ed.updateSection("hero", { badge: e.target.value })} />
          <Input label="Title" value={ed.sections.hero?.title || ""}
            onChange={(e) => ed.updateSection("hero", { title: e.target.value })} />
        </FieldGrid>
        <Textarea label="Subtitle" rows={2} value={ed.sections.hero?.subtitle || ""}
          onChange={(e) => ed.updateSection("hero", { subtitle: e.target.value })} />
        <Textarea label="Banner alert text" rows={2} value={ed.sections.hero?.banner || ""}
          onChange={(e) => ed.updateSection("hero", { banner: e.target.value })} />
      </SectionCard>

      <SectionCard title="Standards" description="Each card describes one standard.">
        <RepeatableList
          items={ed.sections.standards || []}
          onChange={(v) => ed.setSection("standards", v)}
          newItem={() => ({})}
          addLabel="Add standard"
          itemTitle={(s, i) => s.title || `Standard ${i + 1}`}
          renderItem={(s, _i, update) => (
            <div className="space-y-3">
              <FieldGrid cols={2}>
                <Input label="Icon key" value={s.icon || ""} onChange={(e) => update({ ...s, icon: e.target.value })} />
                <Input label="Title" value={s.title || ""} onChange={(e) => update({ ...s, title: e.target.value })} />
              </FieldGrid>
              <Textarea label="Description" rows={3} value={s.description || ""}
                onChange={(e) => update({ ...s, description: e.target.value })} />
            </div>
          )}
        />
      </SectionCard>

      <SectionCard title="Our Commitment to You">
        <Input label="Title" value={ed.sections.commitment?.title || ""}
          onChange={(e) => ed.updateSection("commitment", { title: e.target.value })} />
        <Textarea
          label="Body (use a blank line to separate paragraphs)"
          rows={6}
          value={ed.sections.commitment?.body || ""}
          onChange={(e) => ed.updateSection("commitment", { body: e.target.value })}
        />
        <FieldGrid cols={2}>
          <LinkField label="Primary button" value={ed.sections.commitment?.ctaPrimary}
            onChange={(v) => ed.updateSection("commitment", { ctaPrimary: v })} />
          <LinkField label="Secondary button" value={ed.sections.commitment?.ctaSecondary}
            onChange={(v) => ed.updateSection("commitment", { ctaSecondary: v })} />
        </FieldGrid>
      </SectionCard>

      <SaveBar onSave={ed.save} onReset={ed.reset} saving={ed.saving} dirty={ed.dirty} lastSavedAt={ed.doc?.updatedAt} />
    </main>
  );
}
