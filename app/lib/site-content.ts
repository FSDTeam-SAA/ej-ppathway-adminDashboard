"use client";

import { api, API_BASE, getAccessToken, ApiError } from "./api";

export const SITE_CONTENT_PAGES = [
  { slug: "global", label: "Global (Header & Footer)", description: "Logo, navigation, and footer that show on every page." },
  { slug: "home", label: "Home", description: "Hero, How it Works, Watch in Action, Why Choose, App Promo, Testimonials, CTA." },
  { slug: "how-it-works", label: "How it Works (Booking)", description: "Booking steps, session types, scheduling, cancellation policy." },
  { slug: "advisors", label: "Advisors List", description: "Page heading and copy for the advisors directory." },
  { slug: "advisor-detail", label: "Advisor Detail", description: "Section labels for the individual advisor profile page." },
  { slug: "join-as-advisor", label: "Join as Advisor", description: "Hero, joining process, requirements, advisor testimonials." },
  { slug: "ethical-standards", label: "Ethical Standards", description: "Standards cards and commitment block for advisor applicants." },
  { slug: "reviews", label: "Reviews / Satisfaction", description: "Commitment cards, trust stats, resolution process, testimonials header." },
  { slug: "blogs", label: "Blogs", description: "Page hero, category chips, newsletter CTA, and the blog post articles themselves." },
  { slug: "about", label: "About", description: "Hero, story, values, and CTA on the About page." },
  { slug: "contact", label: "Contact", description: "Hero, contact info, quick help, and form settings." }
] as const;

export type SiteContentSlug = (typeof SITE_CONTENT_PAGES)[number]["slug"];

export interface SiteContentDoc<TSections = Record<string, unknown>> {
  _id?: string;
  pageSlug: SiteContentSlug;
  pageName: string;
  sections: TSections;
  updatedAt?: string;
  updatedBy?: string;
}

export const fetchSiteContent = async <T = Record<string, unknown>>(
  slug: SiteContentSlug
): Promise<SiteContentDoc<T>> => {
  const r = await api.get<SiteContentDoc<T>>(`/cms/site-content/${slug}`);
  if (!r.data) throw new ApiError("Empty site content response", 500, null);
  return r.data;
};

export const saveSiteContent = async <T = Record<string, unknown>>(
  slug: SiteContentSlug,
  sections: T,
  pageName?: string
): Promise<SiteContentDoc<T>> => {
  const r = await api.put<SiteContentDoc<T>>(`/cms/site-content/${slug}`, {
    sections,
    pageName
  });
  if (!r.data) throw new ApiError("Empty save response", 500, null);
  return r.data;
};

/**
 * Upload a single file (image or video) under a section bucket.
 * Returns the public Cloudinary URL.
 */
export const uploadSiteContentMedia = async (
  slug: SiteContentSlug,
  sectionKey: string,
  file: File
): Promise<{ url: string; publicId: string; resourceType: string }> => {
  const form = new FormData();
  form.append("file", file);
  form.append("sectionKey", sectionKey);

  // Use fetch directly so we can attach FormData without the api wrapper's JSON header.
  const token = getAccessToken();
  const res = await fetch(`${API_BASE}/cms/site-content/${slug}/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.success === false) {
    throw new ApiError(json?.message || `Upload failed (${res.status})`, res.status, json);
  }
  return json.data;
};
