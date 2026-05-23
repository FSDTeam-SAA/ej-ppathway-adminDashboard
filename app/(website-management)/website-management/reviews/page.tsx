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
type StatItem = { value?: string; label?: string };
type Step = { icon?: string; title?: string; description?: string };

type ReviewsSections = {
  hero?: { badge?: string; title?: string; subtitle?: string };
  commitment?: {
    title?: string;
    cards?: { icon?: string; title?: string; description?: string; bullets?: string[] }[];
  };
  trustedByThousands?: { title?: string; stats?: StatItem[] };
  fairResolution?: { title?: string; subtitle?: string; steps?: Step[]; importantNote?: string };
  testimonialsHeader?: { eyebrow?: string; title?: string; subtitle?: string; trustpilotRating?: string; totalReviews?: string };
  contactBlock?: { title?: string; subtitle?: string; ctaPrimary?: Link; contactEmail?: string; contactPhone?: string };
};

const DEFAULT: ReviewsSections = {
  hero: {},
  commitment: { cards: [] },
  trustedByThousands: { stats: [] },
  fairResolution: { steps: [] },
  testimonialsHeader: {},
  contactBlock: {}
};

export default function ReviewsEditorPage() {
  const ed = useSiteContentEditor<ReviewsSections>("reviews", DEFAULT);
  if (ed.loading) return <main className="px-6 md:px-10 py-8"><Spinner /></main>;

  return (
    <main className="px-6 md:px-10 py-8 w-full pb-32">
      <PageHeader
        title="Reviews / Satisfaction"
        description="Public satisfaction-guarantee page."
        breadcrumb={[{ label: "Website Management", href: "/website-management" }, { label: "Reviews" }]}
      />

      <SectionCard title="Hero">
        <FieldGrid cols={2}>
          <Input label="Badge / icon caption" value={ed.sections.hero?.badge || ""}
            onChange={(e) => ed.updateSection("hero", { badge: e.target.value })} />
          <Input label="Title" value={ed.sections.hero?.title || ""}
            onChange={(e) => ed.updateSection("hero", { title: e.target.value })} />
        </FieldGrid>
        <Textarea label="Subtitle" rows={3} value={ed.sections.hero?.subtitle || ""}
          onChange={(e) => ed.updateSection("hero", { subtitle: e.target.value })} />
      </SectionCard>

      <SectionCard title="Our Commitment to You" description="4 cards with check-marked bullets.">
        <Input label="Section title" value={ed.sections.commitment?.title || ""}
          onChange={(e) => ed.updateSection("commitment", { title: e.target.value })} />
        <RepeatableList
          label="Cards"
          items={ed.sections.commitment?.cards || []}
          onChange={(v) => ed.updateSection("commitment", { cards: v })}
          newItem={() => ({ bullets: [] })}
          addLabel="Add card"
          itemTitle={(c, i) => c.title || `Card ${i + 1}`}
          renderItem={(c, _i, update) => (
            <div className="space-y-3">
              <FieldGrid cols={2}>
                <Input label="Icon key" value={c.icon || ""} onChange={(e) => update({ ...c, icon: e.target.value })} />
                <Input label="Title" value={c.title || ""} onChange={(e) => update({ ...c, title: e.target.value })} />
              </FieldGrid>
              <Textarea label="Description" rows={2} value={c.description || ""}
                onChange={(e) => update({ ...c, description: e.target.value })} />
              <BulletList label="Bullets" items={c.bullets || []}
                onChange={(v) => update({ ...c, bullets: v })} />
            </div>
          )}
        />
      </SectionCard>

      <SectionCard title="Trusted by Thousands (stats)">
        <Input label="Title" value={ed.sections.trustedByThousands?.title || ""}
          onChange={(e) => ed.updateSection("trustedByThousands", { title: e.target.value })} />
        <RepeatableList
          label="Stats"
          items={ed.sections.trustedByThousands?.stats || []}
          onChange={(v) => ed.updateSection("trustedByThousands", { stats: v })}
          newItem={() => ({})}
          addLabel="Add stat"
          itemTitle={(s, i) => s.value || `Stat ${i + 1}`}
          renderItem={(s, _i, update) => (
            <FieldGrid cols={2}>
              <Input label="Value" value={s.value || ""}
                onChange={(e) => update({ ...s, value: e.target.value })} />
              <Input label="Label" value={s.label || ""}
                onChange={(e) => update({ ...s, label: e.target.value })} />
            </FieldGrid>
          )}
        />
      </SectionCard>

      <SectionCard title="Fair Resolution Process">
        <FieldGrid cols={2}>
          <Input label="Title" value={ed.sections.fairResolution?.title || ""}
            onChange={(e) => ed.updateSection("fairResolution", { title: e.target.value })} />
          <Input label="Subtitle" value={ed.sections.fairResolution?.subtitle || ""}
            onChange={(e) => ed.updateSection("fairResolution", { subtitle: e.target.value })} />
        </FieldGrid>
        <RepeatableList
          label="Steps"
          items={ed.sections.fairResolution?.steps || []}
          onChange={(v) => ed.updateSection("fairResolution", { steps: v })}
          newItem={() => ({})}
          addLabel="Add step"
          itemTitle={(s, i) => s.title || `Step ${i + 1}`}
          renderItem={(s, _i, update) => (
            <div className="space-y-3">
              <FieldGrid cols={2}>
                <Input label="Number / icon" value={s.icon || ""}
                  onChange={(e) => update({ ...s, icon: e.target.value })} />
                <Input label="Title" value={s.title || ""}
                  onChange={(e) => update({ ...s, title: e.target.value })} />
              </FieldGrid>
              <Textarea label="Description" rows={2} value={s.description || ""}
                onChange={(e) => update({ ...s, description: e.target.value })} />
            </div>
          )}
        />
        <Textarea label="Important note" rows={4} value={ed.sections.fairResolution?.importantNote || ""}
          onChange={(e) => ed.updateSection("fairResolution", { importantNote: e.target.value })} />
      </SectionCard>

      <SectionCard title="Testimonials header">
        <FieldGrid cols={2}>
          <Input label="Eyebrow" value={ed.sections.testimonialsHeader?.eyebrow || ""}
            onChange={(e) => ed.updateSection("testimonialsHeader", { eyebrow: e.target.value })} />
          <Input label="Title" value={ed.sections.testimonialsHeader?.title || ""}
            onChange={(e) => ed.updateSection("testimonialsHeader", { title: e.target.value })} />
        </FieldGrid>
        <Textarea label="Subtitle" rows={2} value={ed.sections.testimonialsHeader?.subtitle || ""}
          onChange={(e) => ed.updateSection("testimonialsHeader", { subtitle: e.target.value })} />
        <FieldGrid cols={2}>
          <Input label="Trustpilot rating" value={ed.sections.testimonialsHeader?.trustpilotRating || ""}
            onChange={(e) => ed.updateSection("testimonialsHeader", { trustpilotRating: e.target.value })} />
          <Input label="Total reviews label" value={ed.sections.testimonialsHeader?.totalReviews || ""}
            onChange={(e) => ed.updateSection("testimonialsHeader", { totalReviews: e.target.value })} />
        </FieldGrid>
      </SectionCard>

      <SectionCard title="Have Questions or Concerns? (bottom contact block)">
        <Input label="Title" value={ed.sections.contactBlock?.title || ""}
          onChange={(e) => ed.updateSection("contactBlock", { title: e.target.value })} />
        <Textarea label="Subtitle" rows={2} value={ed.sections.contactBlock?.subtitle || ""}
          onChange={(e) => ed.updateSection("contactBlock", { subtitle: e.target.value })} />
        <LinkField label="Primary button" value={ed.sections.contactBlock?.ctaPrimary}
          onChange={(v) => ed.updateSection("contactBlock", { ctaPrimary: v })} />
        <FieldGrid cols={2}>
          <Input label="Contact email" value={ed.sections.contactBlock?.contactEmail || ""}
            onChange={(e) => ed.updateSection("contactBlock", { contactEmail: e.target.value })} />
          <Input label="Contact phone" value={ed.sections.contactBlock?.contactPhone || ""}
            onChange={(e) => ed.updateSection("contactBlock", { contactPhone: e.target.value })} />
        </FieldGrid>
      </SectionCard>

      <SaveBar onSave={ed.save} onReset={ed.reset} saving={ed.saving} dirty={ed.dirty} lastSavedAt={ed.doc?.updatedAt} />
    </main>
  );
}
