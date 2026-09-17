import sharp from "sharp";
import { randomUUID } from "crypto";
import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * Server-only image pipeline: runs `sharp` once on upload — caps the
 * longest side to ~2000–2400px, converts to WebP at ~80–85% quality, and
 * strips EXIF metadata — before storing that single compressed master in
 * the bucket.
 *
 * Only one master per image is ever stored — Vercel's next/image
 * generates and caches every display size on demand from that master at
 * request time, so this pipeline never produces multiple sizes itself.
 */

export const MEDIA_BUCKET = "media";
export const MAX_RAW_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB — matches the storage.buckets file_size_limit in migration 0002
export const MAX_LONGEST_SIDE = 2400;
export const WEBP_QUALITY = 82;

const ACCEPTED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export interface UploadImageParams {
  /** Raw file bytes as received from the browser (FormData). */
  buffer: Buffer;
  mimeType: string;
  /** Logical folder within the bucket — keeps uploads browsable/attributable, e.g. "team", "insights/cover", "insights/content". */
  context: string;
}

export interface UploadImageResult {
  success: true;
  url: string;
  path: string;
}

export interface UploadImageError {
  success: false;
  error: string;
}

export async function processAndUploadImage(
  params: UploadImageParams
): Promise<UploadImageResult | UploadImageError> {
  const { buffer, mimeType, context } = params;

  if (!ACCEPTED_MIME_TYPES.has(mimeType)) {
    return { success: false, error: `Unsupported image type: ${mimeType}. Use JPEG, PNG, WebP, or GIF.` };
  }
  if (buffer.byteLength > MAX_RAW_UPLOAD_BYTES) {
    return { success: false, error: "Image is too large — max 10MB before compression." };
  }

  let processed: Buffer;
  try {
    processed = await sharp(buffer)
      .rotate() // auto-orient from EXIF *before* stripping it, so rotated phone photos don't end up sideways
      .resize({ width: MAX_LONGEST_SIDE, height: MAX_LONGEST_SIDE, fit: "inside", withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();
      // No .withMetadata() call — sharp omits EXIF/ICC/etc. by default, which
      // is the "strip EXIF metadata" step.
  } catch (err) {
    console.error("sharp processing failed:", err);
    return { success: false, error: "Could not process this image. Try a different file." };
  }

  const path = `${context}/${randomUUID()}.webp`;
  const supabase = createServiceRoleClient();

  const { error: uploadError } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, processed, { contentType: "image/webp", cacheControl: "31536000", upsert: false });

  if (uploadError) {
    console.error("Supabase Storage upload failed:", uploadError);
    return { success: false, error: "Upload failed. Please try again." };
  }

  const { data: publicUrlData } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);

  return { success: true, url: publicUrlData.publicUrl, path };
}

/** Best-effort delete — used when a form replaces an existing image. Never blocks the save it's cleaning up after. */
export async function deleteImageByPath(path: string): Promise<void> {
  try {
    const supabase = createServiceRoleClient();
    await supabase.storage.from(MEDIA_BUCKET).remove([path]);
  } catch (err) {
    console.error("media cleanup delete failed (non-blocking):", err);
  }
}

/** Derives the storage path from a public URL, for cleanup calls. Returns null if the URL isn't one of ours (e.g. an ASSETS placeholder path). */
export function pathFromPublicUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const marker = `/${MEDIA_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}
