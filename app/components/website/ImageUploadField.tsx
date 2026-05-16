"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { uploadSiteContentMedia, type SiteContentSlug } from "../../lib/site-content";
import { useToast } from "../../lib/toast";
import { ApiError } from "../../lib/api";
import { UploadIcon, TrashIcon } from "../Icons";

type Props = {
  label?: string;
  value?: string;
  onChange: (url: string) => void;
  pageSlug: SiteContentSlug;
  sectionKey: string;
  /** Hint shown under the field, e.g. "1920x1080 recommended" */
  hint?: string;
  /** Aspect ratio for preview box, defaults to 16/9 */
  aspect?: "16/9" | "1/1" | "4/3" | "3/4";
};

const aspectClass = {
  "16/9": "aspect-[16/9]",
  "1/1": "aspect-square",
  "4/3": "aspect-[4/3]",
  "3/4": "aspect-[3/4]"
};

export function ImageUploadField({
  label,
  value,
  onChange,
  pageSlug,
  sectionKey,
  hint,
  aspect = "16/9"
}: Props) {
  const toast = useToast();
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handle = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    setUploading(true);
    try {
      const r = await uploadSiteContentMedia(pageSlug, sectionKey, file);
      onChange(r.url);
      toast.success("Image uploaded");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Upload failed";
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {label ? (
        <div className="block mb-1.5 text-sm font-medium text-slate-700">{label}</div>
      ) : null}
      <div className={`relative w-full ${aspectClass[aspect]} rounded-lg overflow-hidden border-2 border-dashed border-slate-300 bg-slate-50`}>
        {value ? (
          <>
            <Image src={value} alt={label || "uploaded"} fill className="object-cover" sizes="320px" unoptimized />
            <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 hover:opacity-100">
              <button
                type="button"
                onClick={() => ref.current?.click()}
                className="px-3 py-1.5 rounded-md bg-white text-slate-800 text-xs font-medium inline-flex items-center gap-1"
              >
                <UploadIcon size={14} /> Replace
              </button>
              <button
                type="button"
                onClick={() => onChange("")}
                className="px-3 py-1.5 rounded-md bg-red-600 text-white text-xs font-medium inline-flex items-center gap-1"
              >
                <TrashIcon size={14} /> Remove
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => ref.current?.click()}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-[#0a7a90]"
          >
            <UploadIcon size={28} />
            <span className="text-xs font-medium">{uploading ? "Uploading…" : "Click to upload image"}</span>
          </button>
        )}
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handle(e.target.files?.[0])}
      />
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
      {value ? (
        <p className="mt-1 text-[10px] text-slate-400 truncate" title={value}>
          {value}
        </p>
      ) : null}
    </div>
  );
}
