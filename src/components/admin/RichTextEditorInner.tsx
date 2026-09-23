"use client";

import { CKEditor } from "@ckeditor/ckeditor5-react";
import {
  ClassicEditor,
  Essentials,
  Paragraph,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading,
  BlockQuote,
  Link,
  List,
  Alignment,
  HorizontalLine,
  RemoveFormat,
} from "ckeditor5";
import "ckeditor5/ckeditor5.css";
import { RICH_TEXT_PROSE_CLASSES } from "@/lib/richTextProse";

interface RichTextEditorInnerProps {
  value: string;
  onChange: (html: string) => void;
}

/**
 * The fixed, curated plugin set — same scope as the previous Tiptap
 * toolbar, per explicit confirmation of what's actually needed:
 *
 *   Text style — Bold, Italic, Underline, Strikethrough
 *   Structure  — Heading 2–6 (as one dropdown, not six separate buttons —
 *                see the `heading.options` config below for why Heading 1
 *                isn't in the list), Blockquote
 *   Lists      — Bullet list, Numbered list
 *   Insert     — Link, Horizontal rule
 *   Layout     — Text align (left / center only — right/justify omitted,
 *                matching the original design-system spec's reasoning:
 *                protect readability/brand consistency)
 *   History    — Undo, Redo, Clear formatting (RemoveFormat)
 *
 * No image plugin — removed entirely per explicit confirmation it's not
 * used and not planned; see RichTextEditor.tsx's props for the backstory
 * (it also removed a real permission-context bug that only existed in the
 * old inline-image-upload code path).
 */
export function RichTextEditorInner({ value, onChange }: RichTextEditorInnerProps) {
  return (
    <div className={RICH_TEXT_PROSE_CLASSES}>
      <CKEditor
        editor={ClassicEditor}
        data={value}
        onChange={(_event, editor) => onChange(editor.getData())}
        config={{
          // CKEditor 5.44+ requires a licenseKey to run at all. This repo
          // is open source, so GPL is the correct, uncomplicated choice —
          // see the conversation this change came from for why a
          // commercial-license question was raised and resolved before
          // this integration was written.
          licenseKey: "GPL",
          plugins: [
            Essentials,
            Paragraph,
            Bold,
            Italic,
            Underline,
            Strikethrough,
            Heading,
            BlockQuote,
            Link,
            List,
            Alignment,
            HorizontalLine,
            RemoveFormat,
          ],
          toolbar: {
            items: [
              "undo",
              "redo",
              "|",
              "heading",
              "|",
              "bold",
              "italic",
              "underline",
              "strikethrough",
              "|",
              "bulletedList",
              "numberedList",
              "|",
              "blockQuote",
              "link",
              "horizontalLine",
              "|",
              "alignment",
              "|",
              "removeFormat",
            ],
          },
          heading: {
            // Deliberately starts at heading2 — no heading1 option. The
            // page's own title (Insight/Practice Area title, Team member
            // name) already IS that page's H1, rendered separately from
            // this body content. Letting editors add a second H1 inside
            // the body is a real semantic/SEO anti-pattern, not just a
            // style preference.
            options: [
              { model: "paragraph", title: "Paragraph", class: "ck-heading_paragraph" },
              { model: "heading2", view: "h2", title: "Heading 2", class: "ck-heading_heading2" },
              { model: "heading3", view: "h3", title: "Heading 3", class: "ck-heading_heading3" },
              { model: "heading4", view: "h4", title: "Heading 4", class: "ck-heading_heading4" },
              { model: "heading5", view: "h5", title: "Heading 5", class: "ck-heading_heading5" },
              { model: "heading6", view: "h6", title: "Heading 6", class: "ck-heading_heading6" },
            ],
          },
          alignment: {
            options: ["left", "center"],
          },
          link: {
            // Adds target="_blank" rel="noopener noreferrer" automatically
            // to links whose href points off-site, at the point of
            // insertion — rather than the previous approach (forcing every
            // link, including internal ones, into a new tab from the
            // renderer side). Internal links now correctly stay in-tab.
            addTargetToExternalLinks: true,
          },
        }}
      />
    </div>
  );
}
