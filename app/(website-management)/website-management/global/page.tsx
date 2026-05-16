"use client";

import { PageHeader } from "../../../components/PageHeader";
import { Spinner } from "../../../components/Spinner";
import { Input, Textarea } from "../../../components/ui/Input";
import { useSiteContentEditor } from "../../../lib/use-site-content-editor";
import { SectionCard, FieldGrid } from "../../../components/website/SectionCard";
import { ImageUploadField } from "../../../components/website/ImageUploadField";
import { RepeatableList } from "../../../components/website/RepeatableList";
import { SaveBar } from "../../../components/website/SaveBar";

type GlobalSections = {
  siteName?: string;
  logo?: string;
  logoDark?: string;
  nav?: { label: string; href: string }[];
  auth?: { loginLabel?: string; signupLabel?: string };
  footer?: {
    tagline?: string;
    columns?: { title?: string; links?: { label: string; href: string }[] }[];
    socialLinks?: { platform?: string; href?: string }[];
    appStoreLink?: string;
    playStoreLink?: string;
    copyright?: string;
    contact?: { email?: string; phone?: string; address?: string };
  };
};

const DEFAULT: GlobalSections = {
  siteName: "",
  logo: "",
  logoDark: "",
  nav: [],
  auth: {},
  footer: { columns: [], socialLinks: [], contact: {} }
};

export default function GlobalEditorPage() {
  const ed = useSiteContentEditor<GlobalSections>("global", DEFAULT);

  if (ed.loading) {
    return (
      <main className="px-6 md:px-10 py-8">
        <Spinner />
      </main>
    );
  }

  return (
    <main className="px-6 md:px-10 py-8 max-w-5xl pb-32">
      <PageHeader
        title="Global (Header & Footer)"
        description="Branding, navigation, and footer shared across every page of the site."
        breadcrumb={[
          { label: "Website Management", href: "/website-management" },
          { label: "Global" }
        ]}
      />

      <SectionCard title="Branding">
        <FieldGrid cols={2}>
          <Input
            label="Site name"
            value={ed.sections.siteName || ""}
            onChange={(e) => ed.setSection("siteName", e.target.value)}
          />
          <div />
          <ImageUploadField
            pageSlug="global"
            sectionKey="logo"
            label="Logo (light background)"
            value={ed.sections.logo}
            onChange={(url) => ed.setSection("logo", url)}
            aspect="4/3"
          />
          <ImageUploadField
            pageSlug="global"
            sectionKey="logo-dark"
            label="Logo (dark background, optional)"
            value={ed.sections.logoDark}
            onChange={(url) => ed.setSection("logoDark", url)}
            aspect="4/3"
          />
        </FieldGrid>
      </SectionCard>

      <SectionCard title="Header navigation" description="Links shown in the top nav bar.">
        <RepeatableList
          items={ed.sections.nav || []}
          onChange={(v) => ed.setSection("nav", v)}
          newItem={() => ({ label: "", href: "" })}
          addLabel="Add nav item"
          itemTitle={(it, i) => it.label || `Item ${i + 1}`}
          renderItem={(item, _i, update) => (
            <FieldGrid cols={2}>
              <Input
                label="Label"
                value={item.label}
                onChange={(e) => update({ ...item, label: e.target.value })}
              />
              <Input
                label="Link"
                placeholder="/path or https://…"
                value={item.href}
                onChange={(e) => update({ ...item, href: e.target.value })}
              />
            </FieldGrid>
          )}
        />
        <FieldGrid cols={2}>
          <Input
            label="Login button label"
            value={ed.sections.auth?.loginLabel || ""}
            onChange={(e) => ed.updateSection("auth", { loginLabel: e.target.value })}
          />
          <Input
            label="Signup / Get Started button label"
            value={ed.sections.auth?.signupLabel || ""}
            onChange={(e) => ed.updateSection("auth", { signupLabel: e.target.value })}
          />
        </FieldGrid>
      </SectionCard>

      <SectionCard title="Footer">
        <Textarea
          label="Tagline"
          rows={3}
          value={ed.sections.footer?.tagline || ""}
          onChange={(e) => ed.updateSection("footer", { tagline: e.target.value })}
        />

        <RepeatableList
          label="Link columns"
          items={ed.sections.footer?.columns || []}
          onChange={(v) => ed.updateSection("footer", { columns: v })}
          newItem={() => ({ title: "", links: [] })}
          addLabel="Add column"
          itemTitle={(it, i) => it.title || `Column ${i + 1}`}
          renderItem={(item, _i, update) => (
            <div className="space-y-3">
              <Input
                label="Column title"
                value={item.title || ""}
                onChange={(e) => update({ ...item, title: e.target.value })}
              />
              <RepeatableList
                label="Links"
                items={item.links || []}
                onChange={(v) => update({ ...item, links: v })}
                newItem={() => ({ label: "", href: "" })}
                addLabel="Add link"
                itemTitle={(l, i) => l.label || `Link ${i + 1}`}
                renderItem={(link, _li, lupdate) => (
                  <FieldGrid cols={2}>
                    <Input
                      placeholder="Label"
                      value={link.label}
                      onChange={(e) => lupdate({ ...link, label: e.target.value })}
                    />
                    <Input
                      placeholder="Link"
                      value={link.href}
                      onChange={(e) => lupdate({ ...link, href: e.target.value })}
                    />
                  </FieldGrid>
                )}
              />
            </div>
          )}
        />

        <RepeatableList
          label="Social links"
          items={ed.sections.footer?.socialLinks || []}
          onChange={(v) => ed.updateSection("footer", { socialLinks: v })}
          newItem={() => ({ platform: "", href: "" })}
          addLabel="Add social link"
          itemTitle={(it, i) => it.platform || `Social ${i + 1}`}
          renderItem={(item, _i, update) => (
            <FieldGrid cols={2}>
              <Input
                placeholder="facebook / twitter / instagram / linkedin"
                value={item.platform || ""}
                onChange={(e) => update({ ...item, platform: e.target.value })}
              />
              <Input
                placeholder="URL"
                value={item.href || ""}
                onChange={(e) => update({ ...item, href: e.target.value })}
              />
            </FieldGrid>
          )}
        />

        <FieldGrid cols={2}>
          <Input
            label="App Store link"
            value={ed.sections.footer?.appStoreLink || ""}
            onChange={(e) => ed.updateSection("footer", { appStoreLink: e.target.value })}
          />
          <Input
            label="Google Play link"
            value={ed.sections.footer?.playStoreLink || ""}
            onChange={(e) => ed.updateSection("footer", { playStoreLink: e.target.value })}
          />
        </FieldGrid>

        <Input
          label="Copyright"
          value={ed.sections.footer?.copyright || ""}
          onChange={(e) => ed.updateSection("footer", { copyright: e.target.value })}
        />

        <FieldGrid cols={3}>
          <Input
            label="Contact email"
            value={ed.sections.footer?.contact?.email || ""}
            onChange={(e) =>
              ed.updateSection("footer", {
                contact: { ...(ed.sections.footer?.contact || {}), email: e.target.value }
              })
            }
          />
          <Input
            label="Contact phone"
            value={ed.sections.footer?.contact?.phone || ""}
            onChange={(e) =>
              ed.updateSection("footer", {
                contact: { ...(ed.sections.footer?.contact || {}), phone: e.target.value }
              })
            }
          />
          <Input
            label="Address"
            value={ed.sections.footer?.contact?.address || ""}
            onChange={(e) =>
              ed.updateSection("footer", {
                contact: { ...(ed.sections.footer?.contact || {}), address: e.target.value }
              })
            }
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
