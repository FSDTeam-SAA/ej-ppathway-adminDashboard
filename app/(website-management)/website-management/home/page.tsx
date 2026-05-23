"use client";

import { PageHeader } from "../../../components/PageHeader";
import { FormSkeleton } from "../../../components/Skeleton";
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

type HomeSections = {
  hero?: {
    badge?: string;
    title?: string;
    highlightedWord?: string;
    subtitle?: string;
    backgroundImage?: string;
    ctaPrimary?: Link;
    ctaSecondary?: Link;
  };
  howItWorks?: { sectionLabel?: string; title?: string; subtitle?: string; steps?: Step[] };
  watchInAction?: { sectionLabel?: string; title?: string; subtitle?: string; videoUrl?: string; posterImage?: string };
  featuredAdvisorsHeader?: { sectionLabel?: string; title?: string; subtitle?: string; viewAllLabel?: string };
  whyChoose?: { sectionLabel?: string; title?: string; subtitle?: string; cards?: Card[] };
  appPromo?: {
    eyebrow?: string;
    title?: string;
    subtitle?: string;
    features?: string[];
    appStoreLink?: string;
    playStoreLink?: string;
    screenshotImages?: string[];
  };
  testimonialsHeader?: { sectionLabel?: string; title?: string; subtitle?: string; trustpilotRating?: string; totalReviews?: string };
  cta?: { eyebrow?: string; title?: string; subtitle?: string; buttonPrimary?: Link; buttonSecondary?: Link; backgroundImage?: string };
  faqHeader?: { sectionLabel?: string; title?: string };
};

const DEFAULT: HomeSections = {
  hero: {},
  howItWorks: { steps: [] },
  watchInAction: {},
  featuredAdvisorsHeader: {},
  whyChoose: { cards: [] },
  appPromo: { features: [], screenshotImages: [] },
  testimonialsHeader: {},
  cta: {},
  faqHeader: {}
};

export default function HomeEditorPage() {
  const ed = useSiteContentEditor<HomeSections>("home", DEFAULT);

  if (ed.loading) {
    return (
      <main className="px-6 md:px-10 py-8">
        <FormSkeleton rows={8} />
      </main>
    );
  }

  return (
    <main className="px-6 md:px-10 py-8 w-full pb-32">
      <PageHeader
        title="Home page"
        description="The first thing visitors see — hero, how-it-works, why-choose, testimonials, CTA."
        breadcrumb={[
          { label: "Website Management", href: "/website-management" },
          { label: "Home" }
        ]}
      />

      <SectionCard title="Hero" description="Top of the homepage.">
        <FieldGrid cols={2}>
          <Input
            label="Badge (e.g. '1,200+ Advisors Online Now')"
            value={ed.sections.hero?.badge || ""}
            onChange={(e) => ed.updateSection("hero", { badge: e.target.value })}
          />
          <Input
            label="Highlighted word inside the title (e.g. 'trusted')"
            value={ed.sections.hero?.highlightedWord || ""}
            onChange={(e) => ed.updateSection("hero", { highlightedWord: e.target.value })}
          />
        </FieldGrid>
        <Textarea
          label="Title"
          rows={2}
          value={ed.sections.hero?.title || ""}
          onChange={(e) => ed.updateSection("hero", { title: e.target.value })}
        />
        <Textarea
          label="Subtitle"
          rows={3}
          value={ed.sections.hero?.subtitle || ""}
          onChange={(e) => ed.updateSection("hero", { subtitle: e.target.value })}
        />
        <FieldGrid cols={2}>
          <LinkField
            label="Primary button"
            value={ed.sections.hero?.ctaPrimary}
            onChange={(v) => ed.updateSection("hero", { ctaPrimary: v })}
          />
          <LinkField
            label="Secondary button"
            value={ed.sections.hero?.ctaSecondary}
            onChange={(v) => ed.updateSection("hero", { ctaSecondary: v })}
          />
        </FieldGrid>
        <div className="max-w-sm">
          <ImageUploadField
            pageSlug="home"
            sectionKey="hero"
            label="Hero background image"
            value={ed.sections.hero?.backgroundImage}
            onChange={(url) => ed.updateSection("hero", { backgroundImage: url })}
          />
        </div>
      </SectionCard>

      <SectionCard title="How it Works" description="Four-step process strip below the hero.">
        <FieldGrid cols={2}>
          <Input
            label="Eyebrow / section label"
            value={ed.sections.howItWorks?.sectionLabel || ""}
            onChange={(e) => ed.updateSection("howItWorks", { sectionLabel: e.target.value })}
          />
          <Input
            label="Title"
            value={ed.sections.howItWorks?.title || ""}
            onChange={(e) => ed.updateSection("howItWorks", { title: e.target.value })}
          />
        </FieldGrid>
        <Textarea
          label="Subtitle"
          rows={2}
          value={ed.sections.howItWorks?.subtitle || ""}
          onChange={(e) => ed.updateSection("howItWorks", { subtitle: e.target.value })}
        />
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
                <Input
                  label="Icon key (e.g. user, video, card, star)"
                  value={s.icon || ""}
                  onChange={(e) => update({ ...s, icon: e.target.value })}
                />
                <Input
                  label="Title"
                  value={s.title || ""}
                  onChange={(e) => update({ ...s, title: e.target.value })}
                />
              </FieldGrid>
              <Textarea
                label="Description"
                rows={2}
                value={s.description || ""}
                onChange={(e) => update({ ...s, description: e.target.value })}
              />
            </div>
          )}
        />
      </SectionCard>

      <SectionCard title="Watch Our Platform in Action" description="Demo video block.">
        <FieldGrid cols={2}>
          <Input
            label="Eyebrow"
            value={ed.sections.watchInAction?.sectionLabel || ""}
            onChange={(e) => ed.updateSection("watchInAction", { sectionLabel: e.target.value })}
          />
          <Input
            label="Title"
            value={ed.sections.watchInAction?.title || ""}
            onChange={(e) => ed.updateSection("watchInAction", { title: e.target.value })}
          />
        </FieldGrid>
        <Textarea
          label="Subtitle"
          rows={2}
          value={ed.sections.watchInAction?.subtitle || ""}
          onChange={(e) => ed.updateSection("watchInAction", { subtitle: e.target.value })}
        />
        <FieldGrid cols={2}>
          <VideoUploadField
            pageSlug="home"
            sectionKey="watch-in-action"
            label="Demo video"
            value={ed.sections.watchInAction?.videoUrl}
            onChange={(url) => ed.updateSection("watchInAction", { videoUrl: url })}
          />
          <ImageUploadField
            pageSlug="home"
            sectionKey="watch-in-action-poster"
            label="Poster image (thumbnail before play)"
            value={ed.sections.watchInAction?.posterImage}
            onChange={(url) => ed.updateSection("watchInAction", { posterImage: url })}
          />
        </FieldGrid>
      </SectionCard>

      <SectionCard
        title="Featured Advisors header"
        description="The heading row above the verified-advisors carousel. Advisors themselves are picked under Featured Items."
      >
        <FieldGrid cols={2}>
          <Input
            label="Eyebrow"
            value={ed.sections.featuredAdvisorsHeader?.sectionLabel || ""}
            onChange={(e) => ed.updateSection("featuredAdvisorsHeader", { sectionLabel: e.target.value })}
          />
          <Input
            label="View-all link label"
            value={ed.sections.featuredAdvisorsHeader?.viewAllLabel || ""}
            onChange={(e) => ed.updateSection("featuredAdvisorsHeader", { viewAllLabel: e.target.value })}
          />
        </FieldGrid>
        <Input
          label="Title"
          value={ed.sections.featuredAdvisorsHeader?.title || ""}
          onChange={(e) => ed.updateSection("featuredAdvisorsHeader", { title: e.target.value })}
        />
        <Textarea
          label="Subtitle"
          rows={2}
          value={ed.sections.featuredAdvisorsHeader?.subtitle || ""}
          onChange={(e) => ed.updateSection("featuredAdvisorsHeader", { subtitle: e.target.value })}
        />
      </SectionCard>

      <SectionCard title="Why Choose Prophetic Pathway" description="6 benefit cards.">
        <FieldGrid cols={2}>
          <Input
            label="Eyebrow"
            value={ed.sections.whyChoose?.sectionLabel || ""}
            onChange={(e) => ed.updateSection("whyChoose", { sectionLabel: e.target.value })}
          />
          <Input
            label="Title"
            value={ed.sections.whyChoose?.title || ""}
            onChange={(e) => ed.updateSection("whyChoose", { title: e.target.value })}
          />
        </FieldGrid>
        <Textarea
          label="Subtitle"
          rows={3}
          value={ed.sections.whyChoose?.subtitle || ""}
          onChange={(e) => ed.updateSection("whyChoose", { subtitle: e.target.value })}
        />
        <RepeatableList
          label="Benefit cards"
          items={ed.sections.whyChoose?.cards || []}
          onChange={(v) => ed.updateSection("whyChoose", { cards: v })}
          newItem={() => ({})}
          addLabel="Add card"
          itemTitle={(c, i) => c.title || `Card ${i + 1}`}
          renderItem={(c, _i, update) => (
            <div className="space-y-3">
              <FieldGrid cols={2}>
                <Input
                  label="Icon key"
                  value={c.icon || ""}
                  onChange={(e) => update({ ...c, icon: e.target.value })}
                />
                <Input
                  label="Title"
                  value={c.title || ""}
                  onChange={(e) => update({ ...c, title: e.target.value })}
                />
              </FieldGrid>
              <Textarea
                label="Description"
                rows={3}
                value={c.description || ""}
                onChange={(e) => update({ ...c, description: e.target.value })}
              />
            </div>
          )}
        />
      </SectionCard>

      <SectionCard title="App Promo" description="Mobile-app promotion strip.">
        <FieldGrid cols={2}>
          <Input
            label="Eyebrow"
            value={ed.sections.appPromo?.eyebrow || ""}
            onChange={(e) => ed.updateSection("appPromo", { eyebrow: e.target.value })}
          />
          <Input
            label="Title"
            value={ed.sections.appPromo?.title || ""}
            onChange={(e) => ed.updateSection("appPromo", { title: e.target.value })}
          />
        </FieldGrid>
        <Textarea
          label="Subtitle"
          rows={3}
          value={ed.sections.appPromo?.subtitle || ""}
          onChange={(e) => ed.updateSection("appPromo", { subtitle: e.target.value })}
        />
        <BulletList
          label="Feature bullets (5 recommended)"
          items={ed.sections.appPromo?.features || []}
          onChange={(v) => ed.updateSection("appPromo", { features: v })}
        />
        <FieldGrid cols={2}>
          <Input
            label="App Store link"
            value={ed.sections.appPromo?.appStoreLink || ""}
            onChange={(e) => ed.updateSection("appPromo", { appStoreLink: e.target.value })}
          />
          <Input
            label="Google Play link"
            value={ed.sections.appPromo?.playStoreLink || ""}
            onChange={(e) => ed.updateSection("appPromo", { playStoreLink: e.target.value })}
          />
        </FieldGrid>
        <RepeatableList
          label="App screenshots"
          items={ed.sections.appPromo?.screenshotImages || []}
          onChange={(v) => ed.updateSection("appPromo", { screenshotImages: v })}
          newItem={() => ""}
          addLabel="Add screenshot"
          itemTitle={(_, i) => `Screenshot ${i + 1}`}
          renderItem={(img, i, update) => (
            <div className="max-w-[220px]">
              <ImageUploadField
                pageSlug="home"
                sectionKey={`app-promo-screenshot-${i}`}
                value={img}
                onChange={(url) => update(url)}
                aspect="3/4"
              />
            </div>
          )}
        />
      </SectionCard>

      <SectionCard
        title="Testimonials header"
        description="Heading above the homepage reviews carousel. Reviews themselves are curated under Featured Items."
      >
        <FieldGrid cols={2}>
          <Input
            label="Eyebrow"
            value={ed.sections.testimonialsHeader?.sectionLabel || ""}
            onChange={(e) => ed.updateSection("testimonialsHeader", { sectionLabel: e.target.value })}
          />
          <Input
            label="Title"
            value={ed.sections.testimonialsHeader?.title || ""}
            onChange={(e) => ed.updateSection("testimonialsHeader", { title: e.target.value })}
          />
        </FieldGrid>
        <Textarea
          label="Subtitle"
          rows={2}
          value={ed.sections.testimonialsHeader?.subtitle || ""}
          onChange={(e) => ed.updateSection("testimonialsHeader", { subtitle: e.target.value })}
        />
        <FieldGrid cols={2}>
          <Input
            label="Trustpilot rating (e.g. '4.8 Out of 5')"
            value={ed.sections.testimonialsHeader?.trustpilotRating || ""}
            onChange={(e) => ed.updateSection("testimonialsHeader", { trustpilotRating: e.target.value })}
          />
          <Input
            label="Total reviews label (e.g. '56,714 reviews')"
            value={ed.sections.testimonialsHeader?.totalReviews || ""}
            onChange={(e) => ed.updateSection("testimonialsHeader", { totalReviews: e.target.value })}
          />
        </FieldGrid>
      </SectionCard>

      <SectionCard title="Bottom CTA" description="Conversion strip near the bottom of the page.">
        <Input
          label="Title"
          value={ed.sections.cta?.title || ""}
          onChange={(e) => ed.updateSection("cta", { title: e.target.value })}
        />
        <Textarea
          label="Subtitle"
          rows={2}
          value={ed.sections.cta?.subtitle || ""}
          onChange={(e) => ed.updateSection("cta", { subtitle: e.target.value })}
        />
        <FieldGrid cols={2}>
          <LinkField
            label="Primary button"
            value={ed.sections.cta?.buttonPrimary}
            onChange={(v) => ed.updateSection("cta", { buttonPrimary: v })}
          />
          <LinkField
            label="Secondary button"
            value={ed.sections.cta?.buttonSecondary}
            onChange={(v) => ed.updateSection("cta", { buttonSecondary: v })}
          />
        </FieldGrid>
      </SectionCard>

      <SectionCard title="FAQ header" description="Heading above the FAQ accordion (FAQ items themselves are managed under FAQs).">
        <FieldGrid cols={2}>
          <Input
            label="Eyebrow"
            value={ed.sections.faqHeader?.sectionLabel || ""}
            onChange={(e) => ed.updateSection("faqHeader", { sectionLabel: e.target.value })}
          />
          <Input
            label="Title"
            value={ed.sections.faqHeader?.title || ""}
            onChange={(e) => ed.updateSection("faqHeader", { title: e.target.value })}
          />
        </FieldGrid>
      </SectionCard>

      <SaveBar
        onSave={ed.save}
        onReset={ed.reset}
        saving={ed.saving}
        dirty={ed.dirty}
        lastSavedAt={ed.doc?.updatedAt}
      />
    </main>
  );
}
