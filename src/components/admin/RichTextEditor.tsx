"use client";

import { useCallback, useState } from "react";
import { useEditor, EditorContent, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import TiptapImage from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { uploadImageAction } from "@/actions/media";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: JSONContent | null;
  onChange: (json: JSONContent) => void;
  /** Which upload context to tag inline images with (see CONTEXT_PERMISSIONS in src/actions/media.ts). */
  uploadContext: "insights/content";
}

/**
 * Fixed, curated toolbar — deliberately NOT the full Tiptap extension
 * library, so every Insight looks consistent with the design system
 * regardless of who wrote it. Excluded on purpose: font-family/size
 * pickers, custom text color, tables, embeds.
 *
 * Groups:
 *   Text style   — Bold, Italic, Underline, Strikethrough
 *   Structure    — Heading 2, Heading 3, Blockquote
 *   Lists        — Bullet list, Numbered list
 *   Insert       — Link, Image, Horizontal rule
 *   Layout       — Text align (left / center only — right/justify omitted)
 *   History      — Undo, Redo, Clear formatting
 */
export function RichTextEditor({ value, onChange, uploadContext }: RichTextEditorProps) {
  const [imageError, setImageError] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] }, // only H2/H3 exposed — H1 is reserved for the page title itself
        // v3's StarterKit bundles Link and Underline itself now, which
        // duplicated the separate Link/Underline instances below (Tiptap
        // logged "Duplicate extension names found: ['link', 'underline']").
        // Disabling the bundled copies here and keeping our own explicit
        // instances (configured the way this toolbar needs — e.g.
        // openOnClick: false) resolves the warning without changing any
        // toolbar behavior.
        link: false,
        underline: false,
      }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
      TiptapImage,
      TextAlign.configure({ types: ["heading", "paragraph"], alignments: ["left", "center"] }),
    ],
    content: value ?? "",
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.getJSON()),
    editorProps: {
      attributes: {
        class:
          "prose-sm min-h-[240px] max-w-none rounded-b-md border border-t-0 border-gray-300 bg-white px-4 py-3 font-sans text-body text-ink-900 focus:outline-none",
      },
    },
  });

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL (leave blank to remove):", previousUrl ?? "");
    if (url === null) return; // cancelled
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const insertImage = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file || !editor) return;

      setImageError(null);
      setIsUploadingImage(true);
      try {
        const formData = new FormData();
        formData.set("file", file);
        formData.set("context", uploadContext);
        const result = await uploadImageAction(formData);
        if (!result.success || !result.url) {
          setImageError(result.error ?? "Image upload failed.");
          return;
        }
        editor.chain().focus().setImage({ src: result.url, alt: "" }).run();
      } finally {
        setIsUploadingImage(false);
      }
    },
    [editor, uploadContext]
  );

  if (!editor) return null;

  return (
    <div className="mb-4">
      <Toolbar editor={editor} onSetLink={setLink} onInsertImage={insertImage} isUploadingImage={isUploadingImage} />
      <EditorContent editor={editor} />
      {imageError && <p className="mt-1 text-[12px] text-error">{imageError}</p>}
    </div>
  );
}

function ToolbarButton({
  label,
  title,
  active,
  disabled,
  onClick,
}: {
  label: string;
  title: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(e) => {
        e.preventDefault(); // keep editor selection/focus while clicking toolbar
        if (!disabled) onClick();
      }}
      className={cn(
        "min-w-[32px] rounded-sm px-2 py-1.5 text-[13px] font-semibold transition-colors",
        disabled
          ? "cursor-not-allowed text-gray-300"
          : active
            ? "bg-navy-700 text-white"
            : "text-navy-700 hover:bg-navy-100"
      )}
    >
      {label}
    </button>
  );
}

function Toolbar({
  editor,
  onSetLink,
  onInsertImage,
  isUploadingImage,
}: {
  editor: NonNullable<ReturnType<typeof useEditor>>;
  onSetLink: () => void;
  onInsertImage: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploadingImage: boolean;
}) {
  const imageInputId = "rte-image-input";

  return (
    <div className="flex flex-wrap items-center gap-1 rounded-t-md border border-gray-300 bg-gray-100 p-1.5">
      {/* Text style */}
      <ToolbarButton label="B" title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} />
      <ToolbarButton label="I" title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} />
      <ToolbarButton label="U" title="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} />
      <ToolbarButton label="S" title="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} />

      <Divider />

      {/* Structure */}
      <ToolbarButton label="H2" title="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
      <ToolbarButton label="H3" title="Heading 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} />
      <ToolbarButton label="❝" title="Blockquote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} />

      <Divider />

      {/* Lists */}
      <ToolbarButton label="• List" title="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} />
      <ToolbarButton label="1. List" title="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} />

      <Divider />

      {/* Insert */}
      <ToolbarButton label="Link" title="Add / edit / remove link" active={editor.isActive("link")} onClick={onSetLink} />
      <label
        htmlFor={imageInputId}
        title="Insert image"
        className={cn(
          "min-w-[32px] cursor-pointer rounded-sm px-2 py-1.5 text-[13px] font-semibold text-navy-700 hover:bg-navy-100",
          isUploadingImage && "cursor-not-allowed text-gray-300"
        )}
      >
        {isUploadingImage ? "Uploading…" : "Image"}
      </label>
      <input
        id={imageInputId}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={onInsertImage}
        disabled={isUploadingImage}
        className="hidden"
      />
      <ToolbarButton label="―" title="Horizontal rule" onClick={() => editor.chain().focus().setHorizontalRule().run()} />

      <Divider />

      {/* Layout */}
      <ToolbarButton label="≡ Left" title="Align left" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()} />
      <ToolbarButton label="≡ Center" title="Align center" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()} />

      <Divider />

      {/* History / cleanup */}
      <ToolbarButton label="↺" title="Undo" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()} />
      <ToolbarButton label="↻" title="Redo" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()} />
      <ToolbarButton label="Clear" title="Clear formatting" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} />
    </div>
  );
}

function Divider() {
  return <div className="mx-0.5 h-5 w-px bg-gray-300" />;
}
