"use client";

import { PageHeader } from "../../../components/PageHeader";
import { FormSkeleton } from "../../../components/Skeleton";
import { Input, Textarea } from "../../../components/ui/Input";
import { SectionCard, FieldGrid } from "../../../components/website/SectionCard";
import { SaveBar } from "../../../components/website/SaveBar";
import { useSiteContentEditor } from "../../../lib/use-site-content-editor";

type AdvisorApplicationSections = {
  hero?: { title?: string; subtitle?: string };
  helper?: {
    lockedAccountText?: string;
    statusPrefix?: string;
    reviewedLockText?: string;
    approvedMessage?: string;
    rejectedMessage?: string;
  };
  sections?: {
    personalTitle?: string;
    addressTitle?: string;
    experienceTitle?: string;
    introVideoTitle?: string;
  };
  fields?: Record<string, string | undefined>;
  introVideo?: {
    requirementTitle?: string;
    description?: string;
    technicalTitle?: string;
    questions?: string[];
    technicalRequirements?: string[];
    finalNote?: string;
    uploadLabel?: string;
    uploadPlaceholder?: string;
    uploadHint?: string;
  };
  consent?: {
    ethicalAgreementPrefix?: string;
    ethicalStandardsLabel?: string;
    ethicalAgreementSuffix?: string;
    privacyNote?: string;
    submitLabel?: string;
    submittingLabel?: string;
    lockedLabel?: string;
  };
};

const DEFAULT: AdvisorApplicationSections = {
  hero: {
    title: "Become an Advisor",
    subtitle: "Complete the application below to begin your journey with Prophetic Pathway."
  },
  helper: {
    lockedAccountText: "Your account details are pre-filled and locked below. To change them, update your account profile.",
    statusPrefix: "Application status:",
    reviewedLockText: "Your submitted application is locked while it is being reviewed.",
    approvedMessage: "Your advisor application has been approved.",
    rejectedMessage: "Your advisor application was not selected."
  },
  sections: {
    personalTitle: "Personal Information",
    addressTitle: "Address Information",
    experienceTitle: "Experience & Availability",
    introVideoTitle: "Introduction Video"
  },
  fields: {
    fullNameLabel: "Enter Your Full Name *",
    emailLabel: "Enter Your Email *",
    phoneLabel: "Enter Your Phone Number *",
    dobLabel: "Date of Birth *",
    addressLabel: "Enter Your Address *",
    addressPlaceholder: "Enter address",
    countryLabel: "Country *",
    countryPlaceholder: "Select Country",
    stateLabel: "State *",
    statePlaceholder: "Enter your state / province",
    cityLabel: "City *",
    cityPlaceholder: "Enter your city",
    experienceLabel: "Years of Experience *",
    experiencePlaceholder: "e.g. 5",
    availabilityLabel: "Are you available to work at least 5 hours per day? *",
    baptizedLabel: "Have you been baptized with the Holy Spirit with the evidence of speaking in tongues? *"
  },
  introVideo: {
    requirementTitle: "Introduction Video Requirement",
    description: "As part of your application, please record a 1-2 minute video introducing yourself and answering the questions below. You can upload an audio message later from your advisor profile.",
    technicalTitle: "Technical Requirements",
    questions: [
      "Tell us your full name.",
      "What city, state/province, and country are you located in?",
      "How long have you been operating in the prophetic?"
    ],
    technicalRequirements: [
      "Record in a quiet environment.",
      "Ensure good lighting with your face clearly visible.",
      "Use clear audio with minimal background noise.",
      "Position your camera securely and keep it stable."
    ],
    finalNote: "Applications submitted without an introduction video, or with incomplete responses, will not be considered.",
    uploadLabel: "Upload an Intro Video *",
    uploadPlaceholder: "Upload an intro video",
    uploadHint: "MP4 / WebM / MOV up to 100 MB"
  },
  consent: {
    ethicalAgreementPrefix: "I have read and agree to follow the",
    ethicalStandardsLabel: "Advisors' Ethical Standards",
    ethicalAgreementSuffix: ". I understand that violating these standards may result in suspension or removal from the platform.",
    privacyNote: "By submitting this application, you consent to the use of your personal data for the purpose of evaluating your suitability for employment in our organization. Your password, profile photo, and detailed bio are collected later during onboarding.",
    submitLabel: "Submit",
    submittingLabel: "Submitting...",
    lockedLabel: "Application Locked"
  }
};

const csvToList = (value: string) => value.split("\n").map((v) => v.trim()).filter(Boolean);
const listToText = (items?: string[]) => (items || []).join("\n");

export default function AdvisorApplicationEditorPage() {
  const ed = useSiteContentEditor<AdvisorApplicationSections>("advisor-application", DEFAULT);
  if (ed.loading) return <main className="px-6 md:px-10 py-8"><FormSkeleton rows={10} /></main>;

  return (
    <main className="px-6 md:px-10 py-8 w-full pb-32">
      <PageHeader
        title="Advisor application form"
        description="Edit copy and labels for /join-as-advisor/apply."
        breadcrumb={[{ label: "Website Management", href: "/website-management" }, { label: "Advisor Application" }]}
      />

      <SectionCard title="Hero">
        <FieldGrid cols={2}>
          <Input label="Title" value={ed.sections.hero?.title || ""} onChange={(e) => ed.updateSection("hero", { title: e.target.value })} />
          <Input label="Subtitle" value={ed.sections.hero?.subtitle || ""} onChange={(e) => ed.updateSection("hero", { subtitle: e.target.value })} />
        </FieldGrid>
      </SectionCard>

      <SectionCard title="Helper and status text">
        <Textarea label="Locked account helper" rows={2} value={ed.sections.helper?.lockedAccountText || ""} onChange={(e) => ed.updateSection("helper", { lockedAccountText: e.target.value })} />
        <FieldGrid cols={2}>
          {([
            ["statusPrefix", "Status prefix"], ["reviewedLockText", "Review lock message"],
            ["approvedMessage", "Approved message"], ["rejectedMessage", "Rejected message"]
          ] as const).map(([key, label]) => (
            <Input key={key} label={label} value={ed.sections.helper?.[key] || ""} onChange={(e) => ed.updateSection("helper", { [key]: e.target.value })} />
          ))}
        </FieldGrid>
      </SectionCard>

      <SectionCard title="Section headings">
        <FieldGrid cols={2}>
          {([
            ["personalTitle", "Personal section"], ["addressTitle", "Address section"],
            ["experienceTitle", "Experience section"], ["introVideoTitle", "Intro video section"]
          ] as const).map(([key, label]) => (
            <Input key={key} label={label} value={ed.sections.sections?.[key] || ""} onChange={(e) => ed.updateSection("sections", { [key]: e.target.value })} />
          ))}
        </FieldGrid>
      </SectionCard>

      <SectionCard title="Field labels">
        <FieldGrid cols={2}>
          {([
            ["fullNameLabel", "Full name label"], ["emailLabel", "Email label"],
            ["phoneLabel", "Phone label"], ["dobLabel", "Date of birth label"],
            ["addressLabel", "Address label"], ["addressPlaceholder", "Address placeholder"],
            ["countryLabel", "Country label"], ["countryPlaceholder", "Country placeholder"],
            ["stateLabel", "State label"], ["statePlaceholder", "State placeholder"],
            ["cityLabel", "City label"], ["cityPlaceholder", "City placeholder"],
            ["experienceLabel", "Experience label"], ["experiencePlaceholder", "Experience placeholder"],
            ["availabilityLabel", "Availability label"], ["baptizedLabel", "Holy Spirit question label"]
          ] as const).map(([key, label]) => (
            <Input key={key} label={label} value={ed.sections.fields?.[key] || ""} onChange={(e) => ed.updateSection("fields", { [key]: e.target.value })} />
          ))}
        </FieldGrid>
      </SectionCard>

      <SectionCard title="Intro video instructions">
        <FieldGrid cols={2}>
          <Input label="Requirement title" value={ed.sections.introVideo?.requirementTitle || ""} onChange={(e) => ed.updateSection("introVideo", { requirementTitle: e.target.value })} />
          <Input label="Technical title" value={ed.sections.introVideo?.technicalTitle || ""} onChange={(e) => ed.updateSection("introVideo", { technicalTitle: e.target.value })} />
        </FieldGrid>
        <Textarea label="Description" rows={3} value={ed.sections.introVideo?.description || ""} onChange={(e) => ed.updateSection("introVideo", { description: e.target.value })} />
        <Textarea label="Questions, one per line" rows={7} value={listToText(ed.sections.introVideo?.questions)} onChange={(e) => ed.updateSection("introVideo", { questions: csvToList(e.target.value) })} />
        <Textarea label="Technical requirements, one per line" rows={5} value={listToText(ed.sections.introVideo?.technicalRequirements)} onChange={(e) => ed.updateSection("introVideo", { technicalRequirements: csvToList(e.target.value) })} />
        <Textarea label="Final note" rows={2} value={ed.sections.introVideo?.finalNote || ""} onChange={(e) => ed.updateSection("introVideo", { finalNote: e.target.value })} />
        <FieldGrid cols={3}>
          <Input label="Upload label" value={ed.sections.introVideo?.uploadLabel || ""} onChange={(e) => ed.updateSection("introVideo", { uploadLabel: e.target.value })} />
          <Input label="Upload placeholder" value={ed.sections.introVideo?.uploadPlaceholder || ""} onChange={(e) => ed.updateSection("introVideo", { uploadPlaceholder: e.target.value })} />
          <Input label="Upload hint" value={ed.sections.introVideo?.uploadHint || ""} onChange={(e) => ed.updateSection("introVideo", { uploadHint: e.target.value })} />
        </FieldGrid>
      </SectionCard>

      <SectionCard title="Consent and submit">
        <Textarea label="Ethical agreement prefix" rows={2} value={ed.sections.consent?.ethicalAgreementPrefix || ""} onChange={(e) => ed.updateSection("consent", { ethicalAgreementPrefix: e.target.value })} />
        <FieldGrid cols={2}>
          <Input label="Ethical standards link label" value={ed.sections.consent?.ethicalStandardsLabel || ""} onChange={(e) => ed.updateSection("consent", { ethicalStandardsLabel: e.target.value })} />
          <Input label="Ethical agreement suffix" value={ed.sections.consent?.ethicalAgreementSuffix || ""} onChange={(e) => ed.updateSection("consent", { ethicalAgreementSuffix: e.target.value })} />
          <Input label="Submit button" value={ed.sections.consent?.submitLabel || ""} onChange={(e) => ed.updateSection("consent", { submitLabel: e.target.value })} />
          <Input label="Submitting label" value={ed.sections.consent?.submittingLabel || ""} onChange={(e) => ed.updateSection("consent", { submittingLabel: e.target.value })} />
          <Input label="Locked button label" value={ed.sections.consent?.lockedLabel || ""} onChange={(e) => ed.updateSection("consent", { lockedLabel: e.target.value })} />
        </FieldGrid>
        <Textarea label="Privacy note" rows={3} value={ed.sections.consent?.privacyNote || ""} onChange={(e) => ed.updateSection("consent", { privacyNote: e.target.value })} />
      </SectionCard>

      <SaveBar onSave={ed.save} onReset={ed.reset} saving={ed.saving} dirty={ed.dirty} lastSavedAt={ed.doc?.updatedAt} />
    </main>
  );
}
