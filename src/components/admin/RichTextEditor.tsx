"use client";

import dynamic from "next/dynamic";

interface RichTextEditorProps {
  // Typed `unknown`, not `string`, to match `richTextSchema` in
  // src/lib/validations/shared.ts (`z.unknown().nullable().optional()`) —
  // so every existing <Controller render={({ field }) => <RichTextEditor
  // value={field.value} ... />}> call site (InsightForm, PracticeAreaForm,
  // TeamMemberForm) keeps working unchanged, with no cast needed at any of
  // those three call sites. Coerced to a real string just below.
  value: unknown;
  onChange: (html: string) => void;
}

// CKEditor 5 needs real browser APIs (it isn't SSR-safe), so the actual
// implementation is loaded client-only via next/dynamic with `ssr: false` —
// the officially recommended pattern for CKEditor 5 + Next.js App Router.
// Without this, the server-rendered pass would crash trying to construct
// the editor engine where there's no `document`.
const RichTextEditorInner = dynamic(
  () => import("./RichTextEditorInner").then((m) => m.RichTextEditorInner),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[300px] items-center justify-center rounded-md border border-gray-300 bg-gray-100 text-small text-gray-500">
        Loading editor…
      </div>
    ),
  }
);

/**
 * Public entry point — see RichTextEditorInner.tsx for the actual CKEditor 5
 * configuration and plugin list. Kept as a thin wrapper specifically for the
 * dynamic-import/SSR boundary above.
 *
 * Replaces the previous Tiptap-based editor (removed entirely: package.json
 * dropped every `@tiptap/*` dependency, and this file no longer produces or
 * consumes Tiptap's JSON document format — content is now stored as a
 * plain HTML string, CKEditor 5's `editor.getData()` output). Switched
 * because of two real, reported problems with the old editor:
 *
 *   1. Heading/list/alignment commands appeared to "spill" formatting into
 *      neighboring lines. Root cause was Enter vs. Shift+Enter — a soft
 *      line break keeps multiple visual lines as one ProseMirror block, so
 *      block-level commands correctly (if confusingly) applied to the
 *      whole thing. That distinction exists in any block-structured
 *      editor, this switch included — it wasn't fixable by changing
 *      libraries. What CKEditor 5 gives instead is a more forgiving,
 *      widely-battle-tested UI around that same underlying concept.
 *   2. A real permission-context bug in the old inline-image-upload code
 *      path (see git history / PHASE-3 notes) — resolved as a side effect
 *      of removing image support entirely, per explicit confirmation it's
 *      not used and not planned, on either editor.
 *
 * Uses the GPL license path (CKEditor 5.44+ requires a `licenseKey`) —
 * correct and uncomplicated here specifically because this repository is
 * open source.
 */
export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const html = typeof value === "string" ? value : "";
  return <RichTextEditorInner value={html} onChange={onChange} />;
}
