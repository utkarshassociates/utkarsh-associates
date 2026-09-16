/**
 * Shared return shape for Server Actions in src/actions/. Was previously
 * redeclared identically (`{ success: boolean; error?: string }`) in every
 * action file — consolidated here so there's one definition to keep in
 * sync instead of eight-plus copies that happen to match.
 *
 * Some actions need more than this (insights.ts's create/update return an
 * `id`, media.ts's upload returns a `url`) — those extend this type locally
 * rather than redefining the base shape.
 */
export interface ActionResult {
  success: boolean;
  error?: string;
}
