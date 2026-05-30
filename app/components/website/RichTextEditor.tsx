"use client";

import "react-quill-new/dist/quill.snow.css";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef } from "react";
import type ReactQuillType from "react-quill-new";
import { uploadSiteContentMedia, type SiteContentSlug } from "../../lib/site-content";
import { useToast } from "../../lib/toast";
import { ApiError } from "../../lib/api";

/**
 * Rich text editor (React Quill) for long-form CMS fields — blog posts, privacy,
 * terms. Stores HTML.
 *
 * Image handling:
 *  - Toolbar image button → file picker → uploads to Cloudinary → inserts URL.
 *  - Pasted / dropped base64 images are swept and re-uploaded to Cloudinary so
 *    we never persist `data:` URLs to Mongo.
 */

// Quill touches `document`, so it must only load on the client. We wrap it so we
// can forward a ref (next/dynamic doesn't forward refs reliably on its own).
const ReactQuill = dynamic(
  async () => {
    const { default: RQ } = await import("react-quill-new");
    const Wrapped = ({
      forwardedRef,
      ...props
    }: React.ComponentProps<typeof RQ> & {
      forwardedRef?: React.Ref<ReactQuillType>;
    }) => <RQ ref={forwardedRef} {...props} />;
    Wrapped.displayName = "ReactQuillWrapped";
    return Wrapped;
  },
  {
    ssr: false,
    loading: () => (
      <div className="px-4 py-6 text-sm text-slate-400">Loading editor…</div>
    ),
  }
);

type Props = {
  label?: string;
  value: string;
  onChange: (html: string) => void;
  /** Folder hint — defaults to blog content. */
  pageSlug?: SiteContentSlug;
  /** Sub-folder used to group related uploads (e.g. blog ID, section name). */
  sectionKey?: string;
  placeholder?: string;
  minHeight?: number;
};

export function RichTextEditor({
  label,
  value,
  onChange,
  pageSlug = "blogs",
  sectionKey = "rte",
  placeholder = "Start typing…",
  minHeight = 280,
}: Props) {
  const toast = useToast();
  const quillRef = useRef<ReactQuillType | null>(null);

  const uploadToCloudinary = useCallback(
    async (file: File) => {
      try {
        const r = await uploadSiteContentMedia(pageSlug, sectionKey, file);
        return r.url;
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : "Image upload failed";
        toast.error(msg);
        return null;
      }
    },
    [pageSlug, sectionKey, toast]
  );

  const dataUrlToFile = useCallback(
    async (dataUrl: string): Promise<File | null> => {
      try {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const ext = blob.type.split("/")[1] || "png";
        return new File([blob], `pasted-${Date.now()}.${ext}`, { type: blob.type });
      } catch {
        return null;
      }
    },
    []
  );

  // Toolbar image button → upload → insert at cursor.
  const imageHandler = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const url = await uploadToCloudinary(file);
      if (!url) return;
      const editor = quillRef.current?.getEditor();
      if (!editor) return;
      const range = editor.getSelection(true);
      const index = range ? range.index : editor.getLength();
      editor.insertEmbed(index, "image", url, "user");
      editor.setSelection(index + 1, 0);
    };
    input.click();
  }, [uploadToCloudinary]);

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, 4, 5, 6, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ list: "ordered" }, { list: "bullet" }],
          ["blockquote", "code-block"],
          ["link", "image"],
          ["clean"],
        ],
        handlers: { image: imageHandler },
      },
      clipboard: { matchVisual: false },
    }),
    [imageHandler]
  );

  const formats = useMemo(
    () => [
      "header",
      "bold",
      "italic",
      "underline",
      "strike",
      "list",
      "blockquote",
      "code-block",
      "link",
      "image",
    ],
    []
  );

  // Sweep any base64 images that slipped in via paste/drop and re-upload them.
  useEffect(() => {
    if (!value || !value.includes("data:image")) return;
    let active = true;
    (async () => {
      const matches = [...value.matchAll(/<img[^>]+src="(data:image\/[^"]+)"/g)];
      if (matches.length === 0) return;
      let next = value;
      for (const m of matches) {
        const file = await dataUrlToFile(m[1]);
        if (!file) continue;
        const url = await uploadToCloudinary(file);
        if (!url) continue;
        next = next.replace(m[1], url);
      }
      if (active && next !== value) onChange(next);
    })();
    return () => {
      active = false;
    };
  }, [value, dataUrlToFile, uploadToCloudinary, onChange]);

  return (
    <div>
      {label && (
        <div className="block mb-1.5 text-sm font-medium text-slate-700">{label}</div>
      )}
      <div
        className="rte-quill rounded-lg border border-slate-200 bg-white overflow-hidden"
        style={{ ["--rte-min-h" as string]: `${minHeight}px` }}
      >
        <ReactQuill
          forwardedRef={quillRef}
          theme="snow"
          value={value || ""}
          onChange={(html: string) => onChange(html)}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
        />
      </div>
      <p className="mt-1 text-xs text-slate-500">
        Tip: use the image button or paste/drag-drop an image — it&apos;ll upload to
        Cloudinary automatically.
      </p>
    </div>
  );
}
