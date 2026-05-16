"use client";

import Link from "next/link";
import { PageHeader } from "../../components/PageHeader";
import { SITE_CONTENT_PAGES } from "../../lib/site-content";

const CURATION = [
  {
    href: "/website-management/featured-items",
    title: "Featured Items",
    description: "Curate which advisors and reviews appear on the homepage."
  },
  {
    href: "/website-management/faqs",
    title: "FAQs",
    description: "Manage the FAQ list that appears across multiple pages."
  },
  {
    href: "/website-management/static-pages",
    title: "Privacy & Terms",
    description: "Edit the long-form Privacy Policy and Terms of Service copy."
  },
  {
    href: "/website-management/inbox",
    title: "Inbox",
    description: "Messages submitted through the public contact form."
  }
];

export default function WebsiteManagementOverviewPage() {
  return (
    <main className="px-6 md:px-10 py-8 max-w-6xl mx-auto">
      <PageHeader
        title="Website Management"
        description="Edit every piece of text, image, and video on the public Prophetic Pathway website."
      />

      <section className="mb-10">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Page-by-page content
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {SITE_CONTENT_PAGES.map((p) => (
            <Link
              key={p.slug}
              href={`/website-management/${p.slug}`}
              className="block bg-white border border-slate-200 rounded-xl p-4 hover:border-[#0a7a90] hover:shadow-sm transition"
            >
              <div className="font-medium text-slate-900">{p.label}</div>
              <div className="text-sm text-slate-500 mt-1">{p.description}</div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Curation & Submissions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {CURATION.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className="block bg-white border border-slate-200 rounded-xl p-4 hover:border-[#0a7a90] hover:shadow-sm transition"
            >
              <div className="font-medium text-slate-900">{p.title}</div>
              <div className="text-sm text-slate-500 mt-1">{p.description}</div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
