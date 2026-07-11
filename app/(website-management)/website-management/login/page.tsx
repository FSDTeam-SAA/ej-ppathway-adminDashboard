"use client";

import { PageHeader } from "../../../components/PageHeader";
import { FormSkeleton } from "../../../components/Skeleton";
import { Input } from "../../../components/ui/Input";
import { SectionCard, FieldGrid } from "../../../components/website/SectionCard";
import { SaveBar } from "../../../components/website/SaveBar";
import { useSiteContentEditor } from "../../../lib/use-site-content-editor";

type LoginSections = {
  form?: {
    title?: string;
    subtitle?: string;
    emailPlaceholder?: string;
    passwordPlaceholder?: string;
    rememberLabel?: string;
    forgotPasswordLabel?: string;
    submitLabel?: string;
    submittingLabel?: string;
    signupPrompt?: string;
    signupLinkLabel?: string;
  };
};

const DEFAULT: LoginSections = {
  form: {
    title: "Welcome Back",
    subtitle: "Sign in to continue your spiritual journey.",
    emailPlaceholder: "Email",
    passwordPlaceholder: "Password",
    rememberLabel: "Remember me",
    forgotPasswordLabel: "Forgot Password?",
    submitLabel: "Login",
    submittingLabel: "Signing in...",
    signupPrompt: "Don't have an account?",
    signupLinkLabel: "Create An Account"
  }
};

export default function LoginEditorPage() {
  const ed = useSiteContentEditor<LoginSections>("login", DEFAULT);
  if (ed.loading) return <main className="px-6 md:px-10 py-8"><FormSkeleton rows={6} /></main>;

  return (
    <main className="px-6 md:px-10 py-8 w-full pb-32">
      <PageHeader
        title="Login page"
        description="Edit the public /login form copy and labels."
        breadcrumb={[{ label: "Website Management", href: "/website-management" }, { label: "Login" }]}
      />

      <SectionCard title="Form copy">
        <FieldGrid cols={2}>
          <Input label="Title" value={ed.sections.form?.title || ""} onChange={(e) => ed.updateSection("form", { title: e.target.value })} />
          <Input label="Subtitle" value={ed.sections.form?.subtitle || ""} onChange={(e) => ed.updateSection("form", { subtitle: e.target.value })} />
          <Input label="Email placeholder" value={ed.sections.form?.emailPlaceholder || ""} onChange={(e) => ed.updateSection("form", { emailPlaceholder: e.target.value })} />
          <Input label="Password placeholder" value={ed.sections.form?.passwordPlaceholder || ""} onChange={(e) => ed.updateSection("form", { passwordPlaceholder: e.target.value })} />
          <Input label="Remember checkbox" value={ed.sections.form?.rememberLabel || ""} onChange={(e) => ed.updateSection("form", { rememberLabel: e.target.value })} />
          <Input label="Forgot password link" value={ed.sections.form?.forgotPasswordLabel || ""} onChange={(e) => ed.updateSection("form", { forgotPasswordLabel: e.target.value })} />
          <Input label="Submit button" value={ed.sections.form?.submitLabel || ""} onChange={(e) => ed.updateSection("form", { submitLabel: e.target.value })} />
          <Input label="Submitting label" value={ed.sections.form?.submittingLabel || ""} onChange={(e) => ed.updateSection("form", { submittingLabel: e.target.value })} />
          <Input label="Sign-up prompt" value={ed.sections.form?.signupPrompt || ""} onChange={(e) => ed.updateSection("form", { signupPrompt: e.target.value })} />
          <Input label="Sign-up link label" value={ed.sections.form?.signupLinkLabel || ""} onChange={(e) => ed.updateSection("form", { signupLinkLabel: e.target.value })} />
        </FieldGrid>
      </SectionCard>

      <SaveBar onSave={ed.save} onReset={ed.reset} saving={ed.saving} dirty={ed.dirty} lastSavedAt={ed.doc?.updatedAt} />
    </main>
  );
}
