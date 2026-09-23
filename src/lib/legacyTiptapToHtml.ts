/**
 * Converts legacy Tiptap JSON documents (the format every Insight/Practice
 * Area/Team bio was stored in before the switch to CKEditor 5) into an HTML
 * string, so old content keeps working — both editable in the new
 * RichTextEditor and visible via RichTextRenderer — without needing a
 * database migration.
 *
 * Why this exists instead of a migration script: this repo has no access to
 * the live Supabase project's actual data (confirmed empty in this repo's
 * own seed data — see supabase/seed.sql), so a script here couldn't touch
 * real content anyway. This is the safe alternative: detect the old format
 * at read time and convert on the fly. It's also self-healing in practice —
 * the next time a record with old-format content is saved through the new
 * editor (even untouched), CKEditor emits its own HTML, and the row is
 * naturally stored in the new format from then on. This converter stays
 * relevant for however many records haven't been re-saved yet, so it's not
 * a one-time stopgap to delete later — keep it indefinitely, or at least
 * until you're confident every real row has been touched at least once.
 *
 * Only handles the node/mark set the old editor could actually produce
 * (paragraph, heading 1–6, blockquote, bullet/ordered list, horizontal
 * rule, image, hard break; bold/italic/underline/strike/link) — matching
 * the same "exactly what the toolbar allowed" principle the old
 * RichTextRenderer.tsx used, just outputting an HTML string instead of
 * React elements now.
 */

interface TiptapNodeLike {
  type?: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNodeLike[];
  text?: string;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s);
}

function wrapMarks(inner: string, marks: TiptapNodeLike["marks"]): string {
  let html = inner;
  for (const mark of marks ?? []) {
    switch (mark.type) {
      case "bold":
        html = `<strong>${html}</strong>`;
        break;
      case "italic":
        html = `<em>${html}</em>`;
        break;
      case "underline":
        html = `<u>${html}</u>`;
        break;
      case "strike":
        html = `<s>${html}</s>`;
        break;
      case "link": {
        const href = typeof mark.attrs?.href === "string" ? mark.attrs.href : "#";
        html = `<a href="${escapeAttr(href)}">${html}</a>`;
        break;
      }
      default:
        break;
    }
  }
  return html;
}

function renderInline(nodes: TiptapNodeLike[] | undefined): string {
  if (!nodes) return "";
  return nodes
    .map((n) => {
      if (n.type === "text") return wrapMarks(escapeHtml(n.text ?? ""), n.marks);
      if (n.type === "hardBreak") return "<br>";
      return "";
    })
    .join("");
}

function renderBlock(node: TiptapNodeLike): string {
  switch (node.type) {
    case "paragraph":
      return `<p>${renderInline(node.content)}</p>`;
    case "heading": {
      const level = typeof node.attrs?.level === "number" ? node.attrs.level : 2;
      const tag = `h${Math.min(Math.max(level, 1), 6)}`;
      return `<${tag}>${renderInline(node.content)}</${tag}>`;
    }
    case "blockquote":
      return `<blockquote>${(node.content ?? []).map(renderBlock).join("")}</blockquote>`;
    case "bulletList":
      return `<ul>${(node.content ?? []).map(renderBlock).join("")}</ul>`;
    case "orderedList":
      return `<ol>${(node.content ?? []).map(renderBlock).join("")}</ol>`;
    case "listItem":
      return `<li>${(node.content ?? []).map(renderBlock).join("")}</li>`;
    case "horizontalRule":
      return "<hr>";
    case "image": {
      const src = typeof node.attrs?.src === "string" ? node.attrs.src : "";
      const alt = typeof node.attrs?.alt === "string" ? node.attrs.alt : "";
      if (!src) return "";
      return `<img src="${escapeAttr(src)}" alt="${escapeAttr(alt)}">`;
    }
    default:
      // Unknown/unexpected node type — skip rather than throw, so one odd
      // node doesn't blank out an entire otherwise-convertible document.
      return "";
  }
}

/** True if `value` looks like a Tiptap document (`{ type: "doc", content: [...] }`), not an HTML string. */
export function isLegacyTiptapDoc(value: unknown): value is TiptapNodeLike {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as TiptapNodeLike).type === "doc" &&
    Array.isArray((value as TiptapNodeLike).content)
  );
}

/**
 * Normalizes stored rich-text content to an HTML string regardless of which
 * format it's actually in — a plain HTML string (current format) passes
 * through unchanged, a legacy Tiptap JSON doc gets converted, anything else
 * (null, unrecognized shape) becomes an empty string.
 */
export function richTextToHtml(value: unknown): string {
  if (typeof value === "string") return value;
  if (isLegacyTiptapDoc(value)) return (value.content ?? []).map(renderBlock).join("");
  return "";
}
