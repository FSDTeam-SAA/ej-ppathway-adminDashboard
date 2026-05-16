"use client";

import { useEffect, useRef, useCallback } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageExt from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { uploadSiteContentMedia, type SiteContentSlug } from "../../lib/site-content";
import { useToast } from "../../lib/toast";
import { ApiError } from "../../lib/api";

/**
 * Rich text editor used for long-form CMS fields (blog posts, privacy, terms).
 *
 * Image handling:
 *  - Toolbar button opens a file picker → uploads to Cloudinary → inserts the
 *    public URL.
 *  - Pasting / dropping a base64 or File image also uploads to Cloudinary
 *    before inserting (we never persist data: URLs to Mongo).
 *  - All uploads are tagged with `pageSlug` + `sectionKey` so Cloudinary keeps
 *    a sensible folder structure.
 */

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
  minHeight = 280
}: Props) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  // Convert a base64 data URL to a File for upload
  const dataUrlToFile = useCallback(async (dataUrl: string): Promise<File | null> => {
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const ext = blob.type.split("/")[1] || "png";
      return new File([blob], `pasted-${Date.now()}.${ext}`, { type: blob.type });
    } catch {
      return null;
    }
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] }
      }),
      ImageExt.configure({ inline: false, allowBase64: true }),
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" } }),
      Placeholder.configure({ placeholder })
    ],
    content: value || "",
    immediatelyRender: false, // important for Next.js SSR
    editorProps: {
      attributes: {
        class:
          "prose prose-slate max-w-none focus:outline-none px-4 py-3 min-h-[var(--rte-min-h)] [&_img]:rounded-lg [&_img]:max-w-full"
      },
      handlePaste(_view, event) {
        const item = Array.from(event.clipboardData?.items || []).find((i) =>
          i.type.startsWith("image/")
        );
        if (!item) return false;
        const file = item.getAsFile();
        if (!file) return false;
        event.preventDefault();
        uploadToCloudinary(file).then((url) => {
          if (url && editor) editor.chain().focus().setImage({ src: url }).run();
        });
        return true;
      },
      handleDrop(_view, event) {
        const file = Array.from(event.dataTransfer?.files || []).find((f) =>
          f.type.startsWith("image/")
        );
        if (!file) return false;
        event.preventDefault();
        uploadToCloudinary(file).then((url) => {
          if (url && editor) editor.chain().focus().setImage({ src: url }).run();
        });
        return true;
      }
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    }
  });

  // Sync external value changes (e.g. when an item loads after mount) into the
  // editor without retriggering onChange.
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value && value !== current) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  // Sweep through the document for any base64 images that slipped past handlePaste
  // (e.g. images injected via setContent) and replace them with Cloudinary URLs.
  useEffect(() => {
    if (!editor) return;
    const checkAndReplace = async () => {
      const html = editor.getHTML();
      const matches = [...html.matchAll(/<img[^>]+src="(data:image\/[^"]+)"/g)];
      if (matches.length === 0) return;
      for (const m of matches) {
        const dataUrl = m[1];
        const file = await dataUrlToFile(dataUrl);
        if (!file) continue;
        const url = await uploadToCloudinary(file);
        if (!url) continue;
        const next = editor.getHTML().replace(dataUrl, url);
        editor.commands.setContent(next, { emitUpdate: true });
      }
    };
    const id = setTimeout(checkAndReplace, 600);
    return () => clearTimeout(id);
  }, [editor, value, dataUrlToFile, uploadToCloudinary]);

  const onPickImage = () => fileInputRef.current?.click();

  const onFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !editor) return;
    const url = await uploadToCloudinary(file);
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };

  const onAddLink = () => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const href = window.prompt("Link URL", prev || "https://");
    if (href === null) return;
    if (href === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
  };

  return (
    <div>
      {label && <div className="block mb-1.5 text-sm font-medium text-slate-700">{label}</div>}
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        <Toolbar editor={editor} onPickImage={onPickImage} onAddLink={onAddLink} />
        <div
          style={{ ["--rte-min-h" as string]: `${minHeight}px` }}
          className="bg-white"
        >
          <EditorContent editor={editor} />
        </div>
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChosen} />
      <p className="mt-1 text-xs text-slate-500">Tip: paste or drag-drop an image and it&apos;ll upload to Cloudinary automatically.</p>
    </div>
  );
}

function Toolbar({
  editor,
  onPickImage,
  onAddLink
}: {
  editor: Editor | null;
  onPickImage: () => void;
  onAddLink: () => void;
}) {
  if (!editor) return null;
  const btn = (active: boolean) =>
    `h-8 min-w-8 px-2 inline-flex items-center justify-center rounded text-sm font-medium transition ${
      active ? "bg-[#0a7a90] text-white" : "text-slate-700 hover:bg-slate-100"
    }`;

  return (
    <div className="flex flex-wrap items-center gap-1 px-2 py-1.5 border-b border-slate-200 bg-slate-50">
      <button type="button" className={btn(editor.isActive("bold"))} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold (⌘B)">
        <b>B</b>
      </button>
      <button type="button" className={btn(editor.isActive("italic"))} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic (⌘I)">
        <i>I</i>
      </button>
      <button type="button" className={btn(editor.isActive("strike"))} onClick={() => editor.chain().focus().toggleStrike().run()} title="Strike">
        <s>S</s>
      </button>
      <span className="w-px h-5 bg-slate-200 mx-1" />
      <button type="button" className={btn(editor.isActive("heading", { level: 1 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Heading 1">H1</button>
      <button type="button" className={btn(editor.isActive("heading", { level: 2 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading 2">H2</button>
      <button type="button" className={btn(editor.isActive("heading", { level: 3 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Heading 3">H3</button>
      <span className="w-px h-5 bg-slate-200 mx-1" />
      <button type="button" className={btn(editor.isActive("bulletList"))} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet list">• List</button>
      <button type="button" className={btn(editor.isActive("orderedList"))} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered list">1. List</button>
      <button type="button" className={btn(editor.isActive("blockquote"))} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Quote">"</button>
      <button type="button" className={btn(editor.isActive("codeBlock"))} onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="Code block">{"</>"}</button>
      <span className="w-px h-5 bg-slate-200 mx-1" />
      <button type="button" className={btn(editor.isActive("link"))} onClick={onAddLink} title="Add link">🔗</button>
      <button type="button" className={btn(false)} onClick={onPickImage} title="Insert image">🖼</button>
      <span className="w-px h-5 bg-slate-200 mx-1" />
      <button type="button" className={btn(false)} onClick={() => editor.chain().focus().undo().run()} title="Undo">↶</button>
      <button type="button" className={btn(false)} onClick={() => editor.chain().focus().redo().run()} title="Redo">↷</button>
    </div>
  );
}
