import Image from "next/image";
import { Fragment, type ReactNode } from "react";

/**
 * Read-only renderer for Tiptap's `editor.getJSON()` output, stored as-is in
 * `content`/`bio` jsonb columns (types/domain.ts types these as `unknown` —
 * intentionally, per that file's comment, since we don't validate Tiptap's
 * internal shape). This renders exactly the node/mark set the admin's
 * RichTextEditor.tsx toolbar can actually produce (its 14-tool toolbar) —
 * no more, since nothing else can ever be saved from that editor:
 *
 *   Nodes: doc, paragraph, heading (levels 2/3 only), blockquote,
 *          bulletList/orderedList/listItem, horizontalRule, image, hardBreak
 *   Marks: bold, italic, underline, strike, link
 *
 * Deliberately NOT a generic Tiptap-to-React library — a small hand-rolled
 * renderer matching exactly what the editor allows people to create, same
 * spirit as the editor itself being a curated subset rather than the full
 * extension library.
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
      const className =
        level === 3
          ? "mb-3 mt-8 font-serif text-h3 text-navy-700"
          : "mb-4 mt-10 font-serif text-h2 text-navy-700";
      return level === 3 ? (
        <h3 key={key} className={className}>
          {renderInline(node.content)}
        </h3>
      ) : (
        <h2 key={key} className={className}>
          {renderInline(node.content)}
        </h2>
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
