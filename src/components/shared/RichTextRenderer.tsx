import Image from "next/image";
import { Fragment, type ReactNode } from "react";

/**
 * Read-only renderer for Tiptap's `editor.getJSON()` output, stored as-is in
 * `content`/`bio` jsonb columns (types/domain.ts types these as `unknown` —
 * intentionally, per that file's comment, since we don't validate Tiptap's
 * internal shape). This renders exactly the node/mark set the admin's
 * RichTextEditor.tsx toolbar can actually produce — no more, since nothing
 * else can ever be saved from that editor:
 *
 *   Nodes: doc, paragraph, heading (levels 2–6), blockquote,
 *          bulletList/orderedList/listItem, horizontalRule, hardBreak
 *   Marks: bold, italic, underline, strike, link
 *
 * `image` is also still handled below, even though the editor's toolbar no
 * longer offers a way to insert one — purely for backward compatibility
 * with any already-published content that has one from before that was
 * removed. New content can't produce this node anymore.
 *
 * Deliberately NOT a generic Tiptap-to-React library — a small hand-rolled
 * renderer matching exactly what the editor allows people to create, same
 * spirit as the editor itself being a curated subset rather than the full
 * extension library.
 *
 * The per-tag classes below are intentionally the same values as
 * RichTextEditor.tsx's own `[&_h2]:...` etc. wrapper classes, so the editor
 * preview matches what actually publishes. They're hand-kept-in-sync
 * between the two files rather than pulled from one shared source — a true
 * single source would mean either (a) Tailwind-unsafe runtime string
 * concatenation (its class scanner needs literal, static class strings, not
 * ones built via .map()/template-interpolation, so a naive "shared
 * constants" file wouldn't actually generate the right CSS), or (b)
 * overriding Tiptap's node `renderHTML` per heading level to inject a
 * shared class programmatically — a real option, just more surface area
 * than this pass's explicit low-risk scope. Flagged here rather than
 * silently deferred: if these two files drift out of sync later, the
 * proper fix is (b), not more manual re-syncing.
 */

interface TiptapNode {
  type?: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  text?: string;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
}

function renderMarks(text: string, marks: TiptapNode["marks"], key: number): ReactNode {
  let node: ReactNode = text;
  for (const mark of marks ?? []) {
    switch (mark.type) {
      case "bold":
        node = <strong>{node}</strong>;
        break;
      case "italic":
        node = <em>{node}</em>;
        break;
      case "underline":
        node = <u>{node}</u>;
        break;
      case "strike":
        node = <s>{node}</s>;
        break;
      case "link": {
        const href = typeof mark.attrs?.href === "string" ? mark.attrs.href : "#";
        node = (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-navy-700 underline hover:text-gold-700">
            {node}
          </a>
        );
        break;
      }
      default:
        break;
    }
  }
  return <Fragment key={key}>{node}</Fragment>;
}

function renderInline(nodes: TiptapNode[] | undefined): ReactNode {
  if (!nodes) return null;
  return nodes.map((n, i) => {
    if (n.type === "text") return renderMarks(n.text ?? "", n.marks, i);
    if (n.type === "hardBreak") return <br key={i} />;
    return null;
  });
}

// One place mapping a heading level to its tag + class, used below — keeps
// the level→tag mapping in one spot rather than repeated per-level branches.
const HEADING_STYLES: Record<number, string> = {
  2: "mb-4 mt-10 font-serif text-h2 text-navy-700",
  3: "mb-3 mt-8 font-serif text-h3 text-navy-700",
  4: "mb-3 mt-6 font-serif text-h4 text-navy-700",
  5: "mb-2 mt-6 font-serif text-body-l font-semibold text-navy-700",
  6: "mb-2 mt-5 font-sans text-small font-bold uppercase tracking-wide text-gray-700",
};

function renderBlock(node: TiptapNode, key: number): ReactNode {
  switch (node.type) {
    case "paragraph":
      return (
        <p key={key} className="mb-4 text-body text-ink-900">
          {renderInline(node.content)}
        </p>
      );
    case "heading": {
      const level = typeof node.attrs?.level === "number" ? node.attrs.level : 2;
      const className = HEADING_STYLES[level] ?? HEADING_STYLES[2];
      const Tag = `h${level}` as "h2" | "h3" | "h4" | "h5" | "h6";
      return (
        <Tag key={key} className={className}>
          {renderInline(node.content)}
        </Tag>
      );
    }
    case "blockquote":
      return (
        <blockquote key={key} className="mb-4 border-l-[3px] border-gold-500 py-1 pl-5 font-serif text-h4 italic text-navy-700">
          {node.content?.map((child, i) => renderBlock(child, i))}
        </blockquote>
      );
    case "bulletList":
      return (
        <ul key={key} className="mb-4 list-disc space-y-1 pl-6 text-body text-ink-900">
          {node.content?.map((child, i) => (
            <li key={i}>{renderInline(child.content?.[0]?.content)}</li>
          ))}
        </ul>
      );
    case "orderedList":
      return (
        <ol key={key} className="mb-4 list-decimal space-y-1 pl-6 text-body text-ink-900">
          {node.content?.map((child, i) => (
            <li key={i}>{renderInline(child.content?.[0]?.content)}</li>
          ))}
        </ol>
      );
    case "horizontalRule":
      return <hr key={key} className="my-8 border-gray-300" />;
    case "image": {
      const src = typeof node.attrs?.src === "string" ? node.attrs.src : null;
      const alt = typeof node.attrs?.alt === "string" ? node.attrs.alt : "";
      if (!src) return null;
      return (
        <span key={key} className="mb-6 block overflow-hidden rounded-lg">
          <Image src={src} alt={alt} width={1200} height={800} className="h-auto w-full object-cover" />
        </span>
      );
    }
    default:
      return null;
  }
}

export function RichTextRenderer({ content }: { content: unknown }) {
  const doc = content as TiptapNode | null;
  if (!doc || !Array.isArray(doc.content) || doc.content.length === 0) return null;

  return <div>{doc.content.map((node, i) => renderBlock(node, i))}</div>;
}
