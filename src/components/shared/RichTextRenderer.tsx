import DOMPurify from "isomorphic-dompurify";
import { RICH_TEXT_PROSE_CLASSES, RICH_TEXT_ALLOWED_TAGS, RICH_TEXT_ALLOWED_ATTR } from "@/lib/richTextProse";

/**
 * Read-only renderer for rich-text content stored in `content`/`bio` jsonb
 * columns. Since the switch away from Tiptap (see RichTextEditor.tsx for
 * the full backstory), that content is a plain HTML string — CKEditor 5's
 * `editor.getData()` output — rather than a Tiptap JSON document tree, so
 * this is now a straightforward sanitize-then-render rather than a
 * hand-rolled node-by-node tree walker.
 *
 * Sanitization (via DOMPurify, server-safe through `isomorphic-dompurify`)
 * is real defense-in-depth, not decoration: content reaches this component
 * only after passing through the permission-gated admin write/review
 * workflow, but rendering raw HTML via `dangerouslySetInnerHTML` with no
 * allowlist at all would mean a compromised admin account (or a bug
 * upstream) could inject a working `<script>` tag straight into the public
 * site — the JSON-tree-walker this replaces couldn't do that by
 * construction (it only ever produced a fixed, known set of React
 * elements, whatever was in the JSON), so this sanitization step exists to
 * keep the same real-world guarantee under the new storage format, not to
 * add a new one. The tag/attribute allowlist is deliberately exactly what
 * the current editor toolbar can produce, plus `img` for backward
 * compatibility with any already-published content from before inline
 * images were removed from the toolbar (see RICH_TEXT_ALLOWED_TAGS's own
 * comment in src/lib/richTextProse.ts).
 */
export function RichTextRenderer({ content, className }: { content: unknown; className?: string }) {
  if (typeof content !== "string" || content.trim() === "") return null;

  const clean = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [...RICH_TEXT_ALLOWED_TAGS],
    ALLOWED_ATTR: [...RICH_TEXT_ALLOWED_ATTR],
  });

  return (
    <div
      className={className ? `${RICH_TEXT_PROSE_CLASSES} ${className}` : RICH_TEXT_PROSE_CLASSES}
      // eslint-disable-next-line react/no-danger -- sanitized just above via DOMPurify with an explicit allowlist
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
