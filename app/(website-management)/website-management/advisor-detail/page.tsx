"use client";

import { PageHeader } from "../../../components/PageHeader";
import { Spinner } from "../../../components/Spinner";
import { Input } from "../../../components/ui/Input";
import { useSiteContentEditor } from "../../../lib/use-site-content-editor";
import { SectionCard, FieldGrid } from "../../../components/website/SectionCard";
import { SaveBar } from "../../../components/website/SaveBar";

type AdvisorDetailSections = {
  labels?: {
    goBack?: string;
    aboutMe?: string;
    expertiseCategories?: string;
    skills?: string;
    styles?: string;
    languages?: string;
    weeklySchedule?: string;
    introVideo?: string;
    pricing?: string;
    bookSession?: string;
    sendMessage?: string;
    reviewsAndRatings?: string;
    averageRating?: string;
    performanceHighlights?: string;
  };
};

const DEFAULT: AdvisorDetailSections = { labels: {} };

export default function AdvisorDetailEditorPage() {
  const ed = useSiteContentEditor<AdvisorDetailSections>("advisor-detail", DEFAULT);
  if (ed.loading) return <main className="px-6 md:px-10 py-8"><Spinner /></main>;

  const L = ed.sections.labels || {};
  const set = (k: keyof NonNullable<AdvisorDetailSections["labels"]>, v: string) =>
    ed.updateSection("labels", { [k]: v });

  return (
    <main className="px-6 md:px-10 py-8 max-w-4xl mx-auto pb-32">
      <PageHeader
        title="Advisor detail page"
        description="Labels for the public advisor profile page. The advisor's own data (name, bio, schedule, pricing) is managed under Advisor Management."
        breadcrumb={[{ label: "Website Management", href: "/website-management" }, { label: "Advisor Detail" }]}
      />

      <SectionCard title="Section labels">
        <FieldGrid cols={2}>
          <Input label="Back link label" value={L.goBack || ""} onChange={(e) => set("goBack", e.target.value)} />
          <Input label="About me heading" value={L.aboutMe || ""} onChange={(e) => set("aboutMe", e.target.value)} />
          <Input label="Expertise & Categories heading" value={L.expertiseCategories || ""}
            onChange={(e) => set("expertiseCategories", e.target.value)} />
          <Input label="Skills / Expertise label" value={L.skills || ""} onChange={(e) => set("skills", e.target.value)} />
          <Input label="Styles label" value={L.styles || ""} onChange={(e) => set("styles", e.target.value)} />
          <Input label="Languages label" value={L.languages || ""} onChange={(e) => set("languages", e.target.value)} />
          <Input label="Weekly schedule heading" value={L.weeklySchedule || ""}
            onChange={(e) => set("weeklySchedule", e.target.value)} />
          <Input label="Intro video heading" value={L.introVideo || ""} onChange={(e) => set("introVideo", e.target.value)} />
          <Input label="Pricing heading" value={L.pricing || ""} onChange={(e) => set("pricing", e.target.value)} />
          <Input label="Book a session button" value={L.bookSession || ""}
            onChange={(e) => set("bookSession", e.target.value)} />
          <Input label="Send message button" value={L.sendMessage || ""}
            onChange={(e) => set("sendMessage", e.target.value)} />
          <Input label="Reviews & ratings heading" value={L.reviewsAndRatings || ""}
            onChange={(e) => set("reviewsAndRatings", e.target.value)} />
          <Input label="Average rating label" value={L.averageRating || ""}
            onChange={(e) => set("averageRating", e.target.value)} />
          <Input label="Performance highlights label" value={L.performanceHighlights || ""}
            onChange={(e) => set("performanceHighlights", e.target.value)} />
        </FieldGrid>
      </SectionCard>

      <SaveBar onSave={ed.save} onReset={ed.reset} saving={ed.saving} dirty={ed.dirty} lastSavedAt={ed.doc?.updatedAt} />
    </main>
  );
}
