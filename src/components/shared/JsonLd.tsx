/**
 * Renders a single JSON-LD <script> tag from a plain object (plan §8's
 * structured-data requirement). One <JsonLd> per schema object, placed
 * directly in the page/section it describes — see src/lib/seo.ts for the
 * builder functions that produce the objects this renders.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    // eslint-disable-next-line react/no-danger -- JSON.stringify output only, not user HTML
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}
