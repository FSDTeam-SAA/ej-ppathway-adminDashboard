"use client";

import { useRef, useState } from "react";
import { uploadSiteContentMedia, type SiteContentSlug } from "../../lib/site-content";
import { useToast } from "../../lib/toast";
import { ApiError } from "../../lib/api";
import { UploadIcon, TrashIcon, PlayIcon } from "../Icons";

type Props = {
  label?: string;
  value?: string;
  onChange: (url: string) => void;
  pageSlug: SiteContentSlug;
  sectionKey: string;
  hint?: string;
};

export function VideoUploadField({ label, value, onChange, pageSlug, sectionKey, hint }: Props) {
  const toast = useToast();
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handle = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      toast.error("Please choose a video file");
      return;
    }
    setUploading(true);
    try {
      const r = await uploadSiteContentMedia(pageSlug, sectionKey, file);
      onChange(r.url);
      toast.success("Video uploaded");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Upload failed";
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {label ? <div className="block mb-1.5 text-sm font-medium text-slate-700">{label}</div> : null}
      {value ? (
        <div className="space-y-2">
          <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-slate-200 bg-slate-900">
            <video src={value} controls className="w-full h-full" />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => ref.current?.click()}
              className="px-3 py-1.5 rounded-md bg-[#e6f2f6] text-[#0a7a90] text-xs font-medium inline-flex items-center gap-1"
            >
              <UploadIcon size={14} /> {uploading ? "Uploading…" : "Replace"}
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              className="px-3 py-1.5 rounded-md bg-red-50 text-red-600 text-xs font-medium inline-flex items-center gap-1"
            >
              <TrashIcon size={14} /> Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="w-full aspect-video rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-[#0a7a90] hover:border-[#0a7a90]"
        >
          <div className="h-12 w-12 rounded-full bg-white border border-slate-200 flex items-center justify-center">
            <PlayIcon size={20} />
          </div>
          <span className="text-xs font-medium">{uploading ? "Uploading…" : "Click to upload video"}</span>
          <span className="text-[10px] text-slate-400">MP4 / WebM up to 100 MB</span>
        </button>
      )}
      <input
        ref={ref}
        type="file"
        accept="video/*"
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
