"use client";

import { PageHeader } from "../../../components/PageHeader";
import { Spinner } from "../../../components/Spinner";
import { Input, Textarea } from "../../../components/ui/Input";
import { useSiteContentEditor } from "../../../lib/use-site-content-editor";
import { SectionCard, FieldGrid } from "../../../components/website/SectionCard";
import { LinkField, BulletList } from "../../../components/website/fields";
import { SaveBar } from "../../../components/website/SaveBar";

type Link = { label?: string; href?: string };

type ContactSections = {
  hero?: { title?: string; subtitle?: string };
  contactInfo?: {
    title?: string;
    email?: string;
    emailLabel?: string;
    phone?: string;
    phoneLabel?: string;
    office?: string;
    officeLabel?: string;
    businessHours?: string[];
  };
  quickHelp?: { title?: string; body?: string; ctaPrimary?: Link };
  formSettings?: { title?: string; subtitle?: string; categories?: string[]; successMessage?: string; footnote?: string };
};

const DEFAULT: ContactSections = { hero: {}, contactInfo: { businessHours: [] }, quickHelp: {}, formSettings: { categories: [] } };

export default function ContactEditorPage() {
  const ed = useSiteContentEditor<ContactSections>("contact", DEFAULT);
  if (ed.loading) return <main className="px-6 md:px-10 py-8"><Spinner /></main>;

  return (
    <main className="px-6 md:px-10 py-8 max-w-5xl pb-32">
      <PageHeader
        title="Contact page"
        description="Public contact page. Form submissions land in the Inbox tab."
        breadcrumb={[{ label: "Website Management", href: "/website-management" }, { label: "Contact" }]}
      />

      <SectionCard title="Hero">
        <Input label="Title" value={ed.sections.hero?.title || ""}
          onChange={(e) => ed.updateSection("hero", { title: e.target.value })} />
        <Textarea label="Subtitle" rows={2} value={ed.sections.hero?.subtitle || ""}
          onChange={(e) => ed.updateSection("hero", { subtitle: e.target.value })} />
      </SectionCard>

      <SectionCard title="Contact Information">
        <Input label="Section title" value={ed.sections.contactInfo?.title || ""}
          onChange={(e) => ed.updateSection("contactInfo", { title: e.target.value })} />
        <FieldGrid cols={2}>
          <Input label="Email address" value={ed.sections.contactInfo?.email || ""}
            onChange={(e) => ed.updateSection("contactInfo", { email: e.target.value })} />
          <Input label="Email caption" value={ed.sections.contactInfo?.emailLabel || ""}
            onChange={(e) => ed.updateSection("contactInfo", { emailLabel: e.target.value })} />
          <Input label="Phone" value={ed.sections.contactInfo?.phone || ""}
            onChange={(e) => ed.updateSection("contactInfo", { phone: e.target.value })} />
          <Input label="Phone caption" value={ed.sections.contactInfo?.phoneLabel || ""}
            onChange={(e) => ed.updateSection("contactInfo", { phoneLabel: e.target.value })} />
        </FieldGrid>
        <Textarea label="Office address (multi-line ok)" rows={2}
          value={ed.sections.contactInfo?.office || ""}
          onChange={(e) => ed.updateSection("contactInfo", { office: e.target.value })} />
        <Input label="Office caption" value={ed.sections.contactInfo?.officeLabel || ""}
          onChange={(e) => ed.updateSection("contactInfo", { officeLabel: e.target.value })} />
        <BulletList label="Business hours (one row per line)"
          items={ed.sections.contactInfo?.businessHours || []}
          onChange={(v) => ed.updateSection("contactInfo", { businessHours: v })}
          placeholder="e.g. Monday - Friday: 9AM - 6PM"
        />
      </SectionCard>

      <SectionCard title="Quick Help block">
        <Input label="Title" value={ed.sections.quickHelp?.title || ""}
          onChange={(e) => ed.updateSection("quickHelp", { title: e.target.value })} />
        <Textarea label="Body" rows={3} value={ed.sections.quickHelp?.body || ""}
          onChange={(e) => ed.updateSection("quickHelp", { body: e.target.value })} />
        <LinkField label="CTA button" value={ed.sections.quickHelp?.ctaPrimary}
          onChange={(v) => ed.updateSection("quickHelp", { ctaPrimary: v })} />
      </SectionCard>

      <SectionCard title="Form settings">
        <FieldGrid cols={2}>
          <Input label="Form title" value={ed.sections.formSettings?.title || ""}
            onChange={(e) => ed.updateSection("formSettings", { title: e.target.value })} />
          <Input label="Form subtitle" value={ed.sections.formSettings?.subtitle || ""}
            onChange={(e) => ed.updateSection("formSettings", { subtitle: e.target.value })} />
        </FieldGrid>
        <BulletList
          label="Category dropdown options"
          items={ed.sections.formSettings?.categories || []}
          onChange={(v) => ed.updateSection("formSettings", { categories: v })}
          placeholder="Category name"
        />
        <Textarea label="Success message" rows={2} value={ed.sections.formSettings?.successMessage || ""}
          onChange={(e) => ed.updateSection("formSettings", { successMessage: e.target.value })} />
        <Input label="Footnote (e.g. response time)" value={ed.sections.formSettings?.footnote || ""}
          onChange={(e) => ed.updateSection("formSettings", { footnote: e.target.value })} />
      </SectionCard>

      <SaveBar onSave={ed.save} onReset={ed.reset} saving={ed.saving} dirty={ed.dirty} lastSavedAt={ed.doc?.updatedAt} />
    </main>
  );
}
