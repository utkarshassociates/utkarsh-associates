// Single source of truth for how rendered rich-text content looks —
// imported by both RichTextEditor.tsx (so the editing experience matches
// what actually publishes) and RichTextRenderer.tsx (the public-facing
// output). Applied as Tailwind arbitrary-descendant-selector utilities
// (`[&_h2]:...`) on each one's own content wrapper div, which works here in
// a way it couldn't with the old Tiptap-based renderer: that renderer built
// React elements node-by-node with per-element classNames, while the editor
// used descendant selectors on one wrapper — two different mechanisms that
// couldn't share one literal string. Now that published content is stored
// as a single HTML string (CKEditor 5's `editor.getData()` output) and
// rendered via one `dangerouslySetInnerHTML` wrapper (see
// RichTextRenderer.tsx), both sides use the exact same mechanism, so they
// can share this exact same exported string.
//
// Tailwind's class scanner needs literal, static class text somewhere in a
// scanned file to generate the corresponding CSS — it doesn't evaluate JS,
// it just regex-scans file text for utility-class-shaped substrings. Every
// individual utility here (`mb-4`, `text-h2`, etc.) appears as a literal
// substring in this file, so it's picked up correctly regardless of the
// string being built via `+` concatenation, and regardless of which other
// file imports and uses the resulting constant.
export const RICH_TEXT_PROSE_CLASSES =
  "[&_p]:mb-4 " +
  "[&_h2]:mb-4 [&_h2]:mt-6 [&_h2]:font-serif [&_h2]:text-h2 [&_h2]:text-navy-700 " +
  "[&_h3]:mb-3 [&_h3]:mt-6 [&_h3]:font-serif [&_h3]:text-h3 [&_h3]:text-navy-700 " +
  "[&_h4]:mb-3 [&_h4]:mt-5 [&_h4]:font-serif [&_h4]:text-h4 [&_h4]:text-navy-700 " +
  "[&_h5]:mb-2 [&_h5]:mt-5 [&_h5]:font-serif [&_h5]:text-body-l [&_h5]:font-semibold [&_h5]:text-navy-700 " +
  "[&_h6]:mb-2 [&_h6]:mt-4 [&_h6]:font-sans [&_h6]:text-small [&_h6]:font-bold [&_h6]:uppercase [&_h6]:tracking-wide [&_h6]:text-gray-700 " +
  "[&_blockquote]:mb-4 [&_blockquote]:border-l-[3px] [&_blockquote]:border-gold-500 [&_blockquote]:py-1 [&_blockquote]:pl-5 [&_blockquote]:font-serif [&_blockquote]:text-h4 [&_blockquote]:italic [&_blockquote]:text-navy-700 " +
  "[&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mb-1 " +
  "[&_a]:text-navy-700 [&_a]:underline [&_a:hover]:text-gold-700 " +
  "[&_hr]:my-8 [&_hr]:border-gray-300 " +
  "[&_img]:max-w-full [&_img]:rounded-lg";

// Allowlist for the sanitizer in RichTextRenderer.tsx — kept next to the
// style list since they describe the same "what this content can actually
// contain" boundary from two angles (what it can look like vs. what tags/
// attributes are allowed through at all).
export const RICH_TEXT_ALLOWED_TAGS = [
  "p",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "strike",
  "blockquote",
  "ul",
  "ol",
  "li",
  "a",
  "hr",
  "br",
  // Not reachable from the current editor toolbar (image support was
  // removed — see RichTextEditor.tsx's comment for why), kept in the
  // allowlist purely so any already-published content from before that
  // removal still renders instead of silently losing its images.
  "img",
] as const;

export const RICH_TEXT_ALLOWED_ATTR = ["href", "target", "rel", "src", "alt", "title"] as const;
