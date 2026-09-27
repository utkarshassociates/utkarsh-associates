import sanitizeHtml from "sanitize-html";
import { RICH_TEXT_PROSE_CLASSES, RICH_TEXT_ALLOWED_TAGS, RICH_TEXT_ALLOWED_ATTR } from "@/lib/richTextProse";
import { richTextToHtml } from "@/lib/legacyTiptapToHtml";

/**
 * Read-only renderer for rich-text content stored in `content`/`bio` jsonb
 * columns. Since the switch away from Tiptap, that content is a plain HTML
 * string — CKEditor 5's `editor.getData()` output — rather than a Tiptap JSON 
 * document tree, so this is now a straightforward sanitize-then-render.
 */
export function RichTextRenderer({ content, className }: { content: unknown; className?: string }) {
  const html = richTextToHtml(content);
  if (html.trim() === "") return null;

  // Map the flat array of allowed attributes to a global or tag-agnostic setup,
  // or use sanitize-html's structure.
  const clean = sanitizeHtml(html, {
    allowedTags: [...RICH_TEXT_ALLOWED_TAGS],
    allowedAttributes: {
      // Allows specified attributes on any tag that supports them (e.g., href, class, src, etc.)
      '*': [...RICH_TEXT_ALLOWED_ATTR],
    },
  });

  return (
    <div
      className={className ? `${RICH_TEXT_PROSE_CLASSES} ${className}` : RICH_TEXT_PROSE_CLASSES}
      // eslint-disable-next-line react/no-danger -- sanitized just above via sanitize-html with an explicit allowlist
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}