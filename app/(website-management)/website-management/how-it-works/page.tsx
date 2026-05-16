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

type HowItWorksSections = {
  hero?: { title?: string; subtitle?: string; ctaPrimary?: Link; ctaSecondary?: Link };
  bookingSteps?: { title?: string; subtitle?: string; steps?: { icon?: string; title?: string; description?: string }[] };
  sessionTypes?: {
    title?: string;
    subtitle?: string;
    types?: { name?: string; icon?: string; description?: string; bullets?: string[]; startingPrice?: string; accentColor?: string }[];
  };
  schedulingMadeSimple?: { title?: string; cards?: { icon?: string; title?: string; description?: string }[] };
  cancellationPolicy?: {
    title?: string;
    subtitle?: string;
    sectionTitle?: string;
    rules?: { title?: string; description?: string }[];
  };
  cta?: { title?: string; subtitle?: string; buttonPrimary?: Link };
};

const DEFAULT: HowItWorksSections = {
  hero: {},
  bookingSteps: { steps: [] },
  sessionTypes: { types: [] },
  schedulingMadeSimple: { cards: [] },
  cancellationPolicy: { rules: [] },
  cta: {}
};

export default function HowItWorksEditorPage() {
  const ed = useSiteContentEditor<HowItWorksSections>("how-it-works", DEFAULT);

  if (ed.loading) return <main className="px-6 md:px-10 py-8"><Spinner /></main>;

  return (
    <main className="px-6 md:px-10 py-8 max-w-5xl pb-32">
      <PageHeader
        title="How it Works (Booking)"
        description="Walks visitors through booking — session types, scheduling, and cancellation."
        breadcrumb={[{ label: "Website Management", href: "/website-management" }, { label: "How it Works" }]}
      />

      <SectionCard title="Hero">
        <Input
          label="Title"
          value={ed.sections.hero?.title || ""}
          onChange={(e) => ed.updateSection("hero", { title: e.target.value })}
        />
        <Textarea
          label="Subtitle" rows={2}
          value={ed.sections.hero?.subtitle || ""}
          onChange={(e) => ed.updateSection("hero", { subtitle: e.target.value })}
        />
        <FieldGrid cols={2}>
          <LinkField label="Primary button" value={ed.sections.hero?.ctaPrimary}
            onChange={(v) => ed.updateSection("hero", { ctaPrimary: v })} />
          <LinkField label="Secondary button" value={ed.sections.hero?.ctaSecondary}
            onChange={(v) => ed.updateSection("hero", { ctaSecondary: v })} />
        </FieldGrid>
      </SectionCard>

      <SectionCard title="Booking Steps" description="Five-step illustrated process bar.">
        <FieldGrid cols={2}>
          <Input label="Title" value={ed.sections.bookingSteps?.title || ""}
            onChange={(e) => ed.updateSection("bookingSteps", { title: e.target.value })} />
          <Input label="Subtitle" value={ed.sections.bookingSteps?.subtitle || ""}
            onChange={(e) => ed.updateSection("bookingSteps", { subtitle: e.target.value })} />
        </FieldGrid>
        <RepeatableList
          label="Steps"
          items={ed.sections.bookingSteps?.steps || []}
          onChange={(v) => ed.updateSection("bookingSteps", { steps: v })}
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

      <SectionCard title="Session Types" description="Chat / Voice / Video cards.">
        <FieldGrid cols={2}>
          <Input label="Title" value={ed.sections.sessionTypes?.title || ""}
            onChange={(e) => ed.updateSection("sessionTypes", { title: e.target.value })} />
          <Input label="Subtitle" value={ed.sections.sessionTypes?.subtitle || ""}
            onChange={(e) => ed.updateSection("sessionTypes", { subtitle: e.target.value })} />
        </FieldGrid>
        <RepeatableList
          label="Session types"
          items={ed.sections.sessionTypes?.types || []}
          onChange={(v) => ed.updateSection("sessionTypes", { types: v })}
          newItem={() => ({ bullets: [] })}
          addLabel="Add session type"
          itemTitle={(t, i) => t.name || `Type ${i + 1}`}
          renderItem={(t, _i, update) => (
            <div className="space-y-3">
              <FieldGrid cols={2}>
                <Input label="Name" value={t.name || ""} onChange={(e) => update({ ...t, name: e.target.value })} />
                <Input label="Icon key (chat | phone | video)" value={t.icon || ""}
                  onChange={(e) => update({ ...t, icon: e.target.value })} />
              </FieldGrid>
              <Textarea label="Description" rows={2} value={t.description || ""}
                onChange={(e) => update({ ...t, description: e.target.value })} />
              <BulletList label="Bullets" items={t.bullets || []}
                onChange={(v) => update({ ...t, bullets: v })} />
              <FieldGrid cols={2}>
                <Input label="Starting price label" value={t.startingPrice || ""}
                  onChange={(e) => update({ ...t, startingPrice: e.target.value })} />
                <Input label="Accent color (teal | amber | violet)" value={t.accentColor || ""}
                  onChange={(e) => update({ ...t, accentColor: e.target.value })} />
              </FieldGrid>
            </div>
          )}
        />
      </SectionCard>

      <SectionCard title="Scheduling Made Simple" description="Dark band with 4 small cards.">
        <Input label="Title" value={ed.sections.schedulingMadeSimple?.title || ""}
          onChange={(e) => ed.updateSection("schedulingMadeSimple", { title: e.target.value })} />
        <RepeatableList
          label="Cards"
          items={ed.sections.schedulingMadeSimple?.cards || []}
          onChange={(v) => ed.updateSection("schedulingMadeSimple", { cards: v })}
          newItem={() => ({})}
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
            </div>
          )}
        />
      </SectionCard>

      <SectionCard title="Cancellation & Reschedule Policy">
        <FieldGrid cols={2}>
          <Input label="Section title" value={ed.sections.cancellationPolicy?.title || ""}
            onChange={(e) => ed.updateSection("cancellationPolicy", { title: e.target.value })} />
          <Input label="Subtitle" value={ed.sections.cancellationPolicy?.subtitle || ""}
            onChange={(e) => ed.updateSection("cancellationPolicy", { subtitle: e.target.value })} />
        </FieldGrid>
        <Input label="Inner card title" value={ed.sections.cancellationPolicy?.sectionTitle || ""}
          onChange={(e) => ed.updateSection("cancellationPolicy", { sectionTitle: e.target.value })} />
        <RepeatableList
          label="Rules"
          items={ed.sections.cancellationPolicy?.rules || []}
          onChange={(v) => ed.updateSection("cancellationPolicy", { rules: v })}
          newItem={() => ({})}
          addLabel="Add rule"
          itemTitle={(r, i) => r.title || `Rule ${i + 1}`}
          renderItem={(r, _i, update) => (
            <div className="space-y-3">
              <Input label="Title" value={r.title || ""} onChange={(e) => update({ ...r, title: e.target.value })} />
              <Textarea label="Description" rows={3} value={r.description || ""}
                onChange={(e) => update({ ...r, description: e.target.value })} />
            </div>
          )}
        />
      </SectionCard>

      <SectionCard title="Bottom CTA">
        <Input label="Title" value={ed.sections.cta?.title || ""}
          onChange={(e) => ed.updateSection("cta", { title: e.target.value })} />
        <Textarea label="Subtitle" rows={2} value={ed.sections.cta?.subtitle || ""}
          onChange={(e) => ed.updateSection("cta", { subtitle: e.target.value })} />
        <LinkField label="Primary button" value={ed.sections.cta?.buttonPrimary}
          onChange={(v) => ed.updateSection("cta", { buttonPrimary: v })} />
      </SectionCard>

      <SaveBar onSave={ed.save} onReset={ed.reset} saving={ed.saving} dirty={ed.dirty} lastSavedAt={ed.doc?.updatedAt} />
    </main>
  );
}
