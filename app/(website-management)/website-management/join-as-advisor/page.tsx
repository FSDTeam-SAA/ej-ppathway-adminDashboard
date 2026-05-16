"use client";

import { PageHeader } from "../../../components/PageHeader";
import { Spinner } from "../../../components/Spinner";
import { Input, Textarea } from "../../../components/ui/Input";
import { useSiteContentEditor } from "../../../lib/use-site-content-editor";
import { SectionCard, FieldGrid } from "../../../components/website/SectionCard";
import { ImageUploadField } from "../../../components/website/ImageUploadField";
import { VideoUploadField } from "../../../components/website/VideoUploadField";
import { RepeatableList } from "../../../components/website/RepeatableList";
import { LinkField, BulletList } from "../../../components/website/fields";
import { SaveBar } from "../../../components/website/SaveBar";

type Link = { label?: string; href?: string };
type Step = { icon?: string; title?: string; description?: string };
type Card = { icon?: string; title?: string; description?: string };
type StatItem = { value?: string; label?: string };

type JoinSections = {
  hero?: { title?: string; subtitle?: string; ctaPrimary?: Link };
  joiningProcess?: { sectionLabel?: string; title?: string; subtitle?: string; steps?: Step[] };
  application?: { stepLabel?: string; title?: string; description?: string; bullets?: string[]; image?: string; ctaPrimary?: Link };
  interview?: { stepLabel?: string; title?: string; description?: string; image?: string; ctaPrimary?: Link };
  contractOnboarding?: { stepLabel?: string; title?: string; description?: string; image?: string; ctaPrimary?: Link };
  reachStats?: { eyebrow?: string; title?: string; subtitle?: string; image?: string; items?: StatItem[] };
  whyJoin?: { sectionLabel?: string; title?: string; subtitle?: string; cards?: Card[] };
  requirements?: { title?: string; bullets?: string[]; image?: string };
  advisorTestimonials?: { sectionLabel?: string; title?: string; videos?: { name?: string; videoUrl?: string; thumbnail?: string }[] };
  beforeYouApply?: { title?: string; body?: string; ctaPrimary?: Link; footnote?: string };
};

const DEFAULT: JoinSections = {
  hero: {},
  joiningProcess: { steps: [] },
  application: { bullets: [] },
  interview: {},
  contractOnboarding: {},
  reachStats: { items: [] },
  whyJoin: { cards: [] },
  requirements: { bullets: [] },
  advisorTestimonials: { videos: [] },
  beforeYouApply: {}
};

export default function JoinAsAdvisorEditorPage() {
  const ed = useSiteContentEditor<JoinSections>("join-as-advisor", DEFAULT);
  if (ed.loading) return <main className="px-6 md:px-10 py-8"><Spinner /></main>;

  return (
    <main className="px-6 md:px-10 py-8 max-w-5xl mx-auto pb-32">
      <PageHeader
        title="Join as Advisor"
        description="Recruitment landing for prospective advisors."
        breadcrumb={[{ label: "Website Management", href: "/website-management" }, { label: "Join as Advisor" }]}
      />

      <SectionCard title="Hero">
        <Input label="Title" value={ed.sections.hero?.title || ""}
          onChange={(e) => ed.updateSection("hero", { title: e.target.value })} />
        <Textarea label="Subtitle" rows={2} value={ed.sections.hero?.subtitle || ""}
          onChange={(e) => ed.updateSection("hero", { subtitle: e.target.value })} />
        <LinkField label="Apply button" value={ed.sections.hero?.ctaPrimary}
          onChange={(v) => ed.updateSection("hero", { ctaPrimary: v })} />
      </SectionCard>

      <SectionCard title="The Joining Process">
        <FieldGrid cols={2}>
          <Input label="Eyebrow" value={ed.sections.joiningProcess?.sectionLabel || ""}
            onChange={(e) => ed.updateSection("joiningProcess", { sectionLabel: e.target.value })} />
          <Input label="Title" value={ed.sections.joiningProcess?.title || ""}
            onChange={(e) => ed.updateSection("joiningProcess", { title: e.target.value })} />
        </FieldGrid>
        <Textarea label="Subtitle" rows={2} value={ed.sections.joiningProcess?.subtitle || ""}
          onChange={(e) => ed.updateSection("joiningProcess", { subtitle: e.target.value })} />
        <RepeatableList
          label="Steps"
          items={ed.sections.joiningProcess?.steps || []}
          onChange={(v) => ed.updateSection("joiningProcess", { steps: v })}
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

      {(["application", "interview", "contractOnboarding"] as const).map((key) => {
        const sec = ed.sections[key] as JoinSections["application"] | JoinSections["interview"] | JoinSections["contractOnboarding"];
        const labelMap = {
          application: "Step 1 — Submit Your Application",
          interview: "Steps 2 & 3 — Interview Process",
          contractOnboarding: "Steps 4 & 5 — Contract & Onboarding"
        } as const;
        return (
          <SectionCard key={key} title={labelMap[key]}>
            <FieldGrid cols={2}>
              <Input label="Step label (e.g. 'Step 1')" value={sec?.stepLabel || ""}
                onChange={(e) => ed.updateSection(key as keyof JoinSections, { stepLabel: e.target.value } as never)} />
              <Input label="Title" value={sec?.title || ""}
                onChange={(e) => ed.updateSection(key as keyof JoinSections, { title: e.target.value } as never)} />
            </FieldGrid>
            <Textarea label="Description" rows={5} value={sec?.description || ""}
              onChange={(e) => ed.updateSection(key as keyof JoinSections, { description: e.target.value } as never)} />
            {key === "application" && (
              <BulletList label="Bullets" items={(sec as JoinSections["application"])?.bullets || []}
                onChange={(v) => ed.updateSection("application", { bullets: v })} />
            )}
            <FieldGrid cols={2}>
              <div className="max-w-sm">
                <ImageUploadField
                  pageSlug="join-as-advisor"
                  sectionKey={key}
                  label="Image"
                  value={sec?.image}
                  onChange={(url) => ed.updateSection(key as keyof JoinSections, { image: url } as never)}
                />
              </div>
              <LinkField label="CTA button" value={sec?.ctaPrimary}
                onChange={(v) => ed.updateSection(key as keyof JoinSections, { ctaPrimary: v } as never)} />
            </FieldGrid>
          </SectionCard>
        );
      })}

      <SectionCard title="Your Guidance Can Reach the World (stats)">
        <FieldGrid cols={2}>
          <Input label="Eyebrow" value={ed.sections.reachStats?.eyebrow || ""}
            onChange={(e) => ed.updateSection("reachStats", { eyebrow: e.target.value })} />
          <Input label="Title" value={ed.sections.reachStats?.title || ""}
            onChange={(e) => ed.updateSection("reachStats", { title: e.target.value })} />
        </FieldGrid>
        <Textarea label="Subtitle" rows={3} value={ed.sections.reachStats?.subtitle || ""}
          onChange={(e) => ed.updateSection("reachStats", { subtitle: e.target.value })} />
        <div className="max-w-sm">
          <ImageUploadField
            pageSlug="join-as-advisor"
            sectionKey="reach-stats"
            label="Image"
            value={ed.sections.reachStats?.image}
            onChange={(url) => ed.updateSection("reachStats", { image: url })}
          />
        </div>
        <RepeatableList
          label="Stats"
          items={ed.sections.reachStats?.items || []}
          onChange={(v) => ed.updateSection("reachStats", { items: v })}
          newItem={() => ({})}
          addLabel="Add stat"
          itemTitle={(s, i) => s.value || `Stat ${i + 1}`}
          renderItem={(s, _i, update) => (
            <FieldGrid cols={2}>
              <Input label="Value (e.g. '50+')" value={s.value || ""}
                onChange={(e) => update({ ...s, value: e.target.value })} />
              <Input label="Label" value={s.label || ""}
                onChange={(e) => update({ ...s, label: e.target.value })} />
            </FieldGrid>
          )}
        />
      </SectionCard>

      <SectionCard title="Why Join Our Platform">
        <FieldGrid cols={2}>
          <Input label="Eyebrow" value={ed.sections.whyJoin?.sectionLabel || ""}
            onChange={(e) => ed.updateSection("whyJoin", { sectionLabel: e.target.value })} />
          <Input label="Title" value={ed.sections.whyJoin?.title || ""}
            onChange={(e) => ed.updateSection("whyJoin", { title: e.target.value })} />
        </FieldGrid>
        <Textarea label="Subtitle" rows={2} value={ed.sections.whyJoin?.subtitle || ""}
          onChange={(e) => ed.updateSection("whyJoin", { subtitle: e.target.value })} />
        <RepeatableList
          label="Cards"
          items={ed.sections.whyJoin?.cards || []}
          onChange={(v) => ed.updateSection("whyJoin", { cards: v })}
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

      <SectionCard title="Advisor Requirements">
        <Input label="Title" value={ed.sections.requirements?.title || ""}
          onChange={(e) => ed.updateSection("requirements", { title: e.target.value })} />
        <BulletList label="Requirements" items={ed.sections.requirements?.bullets || []}
          onChange={(v) => ed.updateSection("requirements", { bullets: v })} />
        <div className="max-w-sm">
          <ImageUploadField
            pageSlug="join-as-advisor"
            sectionKey="requirements"
            label="Image"
            value={ed.sections.requirements?.image}
            onChange={(url) => ed.updateSection("requirements", { image: url })}
          />
        </div>
      </SectionCard>

      <SectionCard title="Hear from Our Advisors (videos)">
        <FieldGrid cols={2}>
          <Input label="Eyebrow" value={ed.sections.advisorTestimonials?.sectionLabel || ""}
            onChange={(e) => ed.updateSection("advisorTestimonials", { sectionLabel: e.target.value })} />
          <Input label="Title" value={ed.sections.advisorTestimonials?.title || ""}
            onChange={(e) => ed.updateSection("advisorTestimonials", { title: e.target.value })} />
        </FieldGrid>
        <RepeatableList
          label="Videos"
          items={ed.sections.advisorTestimonials?.videos || []}
          onChange={(v) => ed.updateSection("advisorTestimonials", { videos: v })}
          newItem={() => ({})}
          addLabel="Add video"
          itemTitle={(v, i) => v.name || `Video ${i + 1}`}
          renderItem={(v, i, update) => (
            <div className="space-y-3">
              <Input label="Advisor name" value={v.name || ""}
                onChange={(e) => update({ ...v, name: e.target.value })} />
              <FieldGrid cols={2}>
                <VideoUploadField
                  pageSlug="join-as-advisor"
                  sectionKey={`advisor-testimonial-video-${i}`}
                  label="Video"
                  value={v.videoUrl}
                  onChange={(url) => update({ ...v, videoUrl: url })}
                />
                <ImageUploadField
                  pageSlug="join-as-advisor"
                  sectionKey={`advisor-testimonial-thumb-${i}`}
                  label="Thumbnail"
                  value={v.thumbnail}
                  onChange={(url) => update({ ...v, thumbnail: url })}
                />
              </FieldGrid>
            </div>
          )}
        />
      </SectionCard>

      <SectionCard title="Before You Apply">
        <Input label="Title" value={ed.sections.beforeYouApply?.title || ""}
          onChange={(e) => ed.updateSection("beforeYouApply", { title: e.target.value })} />
        <Textarea label="Body" rows={3} value={ed.sections.beforeYouApply?.body || ""}
          onChange={(e) => ed.updateSection("beforeYouApply", { body: e.target.value })} />
        <LinkField label="Primary button" value={ed.sections.beforeYouApply?.ctaPrimary}
          onChange={(v) => ed.updateSection("beforeYouApply", { ctaPrimary: v })} />
        <Input label="Footnote" value={ed.sections.beforeYouApply?.footnote || ""}
          onChange={(e) => ed.updateSection("beforeYouApply", { footnote: e.target.value })} />
      </SectionCard>

      <SaveBar onSave={ed.save} onReset={ed.reset} saving={ed.saving} dirty={ed.dirty} lastSavedAt={ed.doc?.updatedAt} />
    </main>
  );
}
