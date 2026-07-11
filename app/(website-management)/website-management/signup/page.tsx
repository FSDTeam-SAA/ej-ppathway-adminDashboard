"use client";

import { PageHeader } from "../../../components/PageHeader";
import { FormSkeleton } from "../../../components/Skeleton";
import { Input } from "../../../components/ui/Input";
import { SectionCard, FieldGrid } from "../../../components/website/SectionCard";
import { SaveBar } from "../../../components/website/SaveBar";
import { useSiteContentEditor } from "../../../lib/use-site-content-editor";

type SignupSections = {
  form?: {
    title?: string;
    subtitle?: string;
    nameLabel?: string;
    namePlaceholder?: string;
    emailLabel?: string;
    emailPlaceholder?: string;
    phoneLabel?: string;
    phonePlaceholder?: string;
    dobLabel?: string;
    countryLabel?: string;
    countryPlaceholder?: string;
    cityLabel?: string;
    cityPlaceholder?: string;
    stateLabel?: string;
    statePlaceholder?: string;
    passwordLabel?: string;
    passwordPlaceholder?: string;
    termsLabel?: string;
    termsLinkLabel?: string;
    submitLabel?: string;
    submittingLabel?: string;
    loginPrompt?: string;
    loginLinkLabel?: string;
  };
};

const DEFAULT: SignupSections = {
  form: {
    title: "Create your account",
    subtitle: "Join Prophetic Pathway in a few quick steps.",
    nameLabel: "Full Name",
    namePlaceholder: "Enter your full name",
    emailLabel: "Email Address",
    emailPlaceholder: "Enter your email",
    phoneLabel: "Phone Number",
    phonePlaceholder: "+1 (000) 000-0000",
    dobLabel: "Date of Birth",
    countryLabel: "Country",
    countryPlaceholder: "Select Country",
    cityLabel: "City",
    cityPlaceholder: "Enter your city",
    stateLabel: "State",
    statePlaceholder: "Enter your state / province",
    passwordLabel: "Password",
    passwordPlaceholder: "Create a strong password",
    termsLabel: "I agree to the",
    termsLinkLabel: "Terms and Conditions",
    submitLabel: "Create An Account",
    submittingLabel: "Creating account...",
    loginPrompt: "Already have an account?",
    loginLinkLabel: "Log in"
  }
};

export default function SignupEditorPage() {
  const ed = useSiteContentEditor<SignupSections>("signup", DEFAULT);
  if (ed.loading) return <main className="px-6 md:px-10 py-8"><FormSkeleton rows={8} /></main>;

  return (
    <main className="px-6 md:px-10 py-8 w-full pb-32">
      <PageHeader
        title="Sign-up page"
        description="Edit the public /signup form copy, labels, placeholders, and links."
        breadcrumb={[{ label: "Website Management", href: "/website-management" }, { label: "Sign Up" }]}
      />

      <SectionCard title="Header copy">
        <FieldGrid cols={2}>
          <Input label="Title" value={ed.sections.form?.title || ""} onChange={(e) => ed.updateSection("form", { title: e.target.value })} />
          <Input label="Subtitle" value={ed.sections.form?.subtitle || ""} onChange={(e) => ed.updateSection("form", { subtitle: e.target.value })} />
        </FieldGrid>
      </SectionCard>

      <SectionCard title="Field labels and placeholders">
        <FieldGrid cols={2}>
          {([
            ["nameLabel", "Name label"], ["namePlaceholder", "Name placeholder"],
            ["emailLabel", "Email label"], ["emailPlaceholder", "Email placeholder"],
            ["phoneLabel", "Phone label"], ["phonePlaceholder", "Phone placeholder"],
            ["dobLabel", "Date of birth label"], ["countryLabel", "Country label"],
            ["countryPlaceholder", "Country placeholder"], ["cityLabel", "City label"],
            ["cityPlaceholder", "City placeholder"], ["stateLabel", "State label"],
            ["statePlaceholder", "State placeholder"], ["passwordLabel", "Password label"],
            ["passwordPlaceholder", "Password placeholder"]
          ] as const).map(([key, label]) => (
            <Input
              key={key}
              label={label}
              value={ed.sections.form?.[key] || ""}
              onChange={(e) => ed.updateSection("form", { [key]: e.target.value })}
            />
          ))}
        </FieldGrid>
      </SectionCard>

      <SectionCard title="Consent and actions">
        <FieldGrid cols={2}>
          {([
            ["termsLabel", "Terms prefix"], ["termsLinkLabel", "Terms link label"],
            ["submitLabel", "Submit button"], ["submittingLabel", "Submitting label"],
            ["loginPrompt", "Login prompt"], ["loginLinkLabel", "Login link label"]
          ] as const).map(([key, label]) => (
            <Input
              key={key}
              label={label}
              value={ed.sections.form?.[key] || ""}
              onChange={(e) => ed.updateSection("form", { [key]: e.target.value })}
            />
          ))}
        </FieldGrid>
      </SectionCard>

      <SaveBar onSave={ed.save} onReset={ed.reset} saving={ed.saving} dirty={ed.dirty} lastSavedAt={ed.doc?.updatedAt} />
    </main>
  );
}
