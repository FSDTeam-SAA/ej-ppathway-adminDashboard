"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchSiteContent,
  saveSiteContent,
  type SiteContentDoc,
  type SiteContentSlug
} from "./site-content";
import { ApiError } from "./api";
import { useToast } from "./toast";

/**
 * Generic editor state for a single SiteContent page.
 *
 * Loads the doc, tracks the working `sections` value with dirty/saving state,
 * and exposes `update(key, partial)` to patch individual sections immutably.
 */
export function useSiteContentEditor<T extends Record<string, unknown>>(slug: SiteContentSlug, fallback: T) {
  const toast = useToast();
  const [doc, setDoc] = useState<SiteContentDoc<T> | null>(null);
  const [sections, setSections] = useState<T>(fallback);
  const [original, setOriginal] = useState<T>(fallback);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetchSiteContent<T>(slug);
      setDoc(r);
      const merged = { ...fallback, ...(r.sections || ({} as T)) } as T;
      setSections(merged);
      setOriginal(merged);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to load content";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  const dirty = useMemo(
    () => JSON.stringify(sections) !== JSON.stringify(original),
    [sections, original]
  );

  /** Patch a top-level section (shallow merge). */
  const updateSection = useCallback(<K extends keyof T>(key: K, partial: Partial<T[K]>) => {
    setSections((prev) => ({
      ...prev,
      [key]: { ...(prev[key] as object), ...(partial as object) }
    } as T));
  }, []);

  /** Replace a top-level section entirely (use for arrays). */
  const setSection = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setSections((prev) => ({ ...prev, [key]: value } as T));
  }, []);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      const r = await saveSiteContent<T>(slug, sections, doc?.pageName);
      setDoc(r);
      setOriginal(sections);
      toast.success("Saved");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Save failed";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }, [slug, sections, doc, toast]);

  const reset = useCallback(() => setSections(original), [original]);

  return {
    doc,
    sections,
    loading,
    saving,
    dirty,
    updateSection,
    setSection,
    save,
    reset,
    reload: load
  };
}
