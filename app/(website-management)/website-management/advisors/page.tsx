"use client";

import { PageHeader } from "../../../components/PageHeader";
import { Spinner } from "../../../components/Spinner";
import { Input, Textarea } from "../../../components/ui/Input";
import { useSiteContentEditor } from "../../../lib/use-site-content-editor";
import { SectionCard, FieldGrid } from "../../../components/website/SectionCard";
import { SaveBar } from "../../../components/website/SaveBar";

type AdvisorsSections = {
  hero?: { eyebrow?: string; title?: string; subtitle?: string };
  listSettings?: { viewAllLabel?: string; emptyStateText?: string };
};

const DEFAULT: AdvisorsSections = { hero: {}, listSettings: {} };

export default function AdvisorsListEditorPage() {
  const ed = useSiteContentEditor<AdvisorsSections>("advisors", DEFAULT);
  if (ed.loading) return <main className="px-6 md:px-10 py-8"><Spinner /></main>;

  return (
    <main className="px-6 md:px-10 py-8 w-full pb-32">
      <PageHeader
        title="Advisors list page"
        description="Page heading copy for the public /advisors directory."
        breadcrumb={[{ label: "Website Management", href: "/website-management" }, { label: "Advisors List" }]}
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
      </SectionCard>

      <SectionCard title="List settings">
        <FieldGrid cols={2}>
          <Input label="View all button label" value={ed.sections.listSettings?.viewAllLabel || ""}
            onChange={(e) => ed.updateSection("listSettings", { viewAllLabel: e.target.value })} />
          <Input label="Empty state text" value={ed.sections.listSettings?.emptyStateText || ""}
            onChange={(e) => ed.updateSection("listSettings", { emptyStateText: e.target.value })} />
        </FieldGrid>
      </SectionCard>

      <SaveBar onSave={ed.save} onReset={ed.reset} saving={ed.saving} dirty={ed.dirty} lastSavedAt={ed.doc?.updatedAt} />
    </main>
  );
}
