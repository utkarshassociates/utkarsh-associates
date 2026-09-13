/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Supabase Storage public bucket is the only remote image source.
    // sharp already compresses on upload (see src/lib/media); next/image
    // handles resize + AVIF/WebP at request time, free on Hobby (§2 of plan).
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  experimental: {
    serverActions: {
      // Next.js's own Server Action body-size cap defaults to 1MB —
      // separate from, and hit before, the 10MB ceiling
      // src/lib/media/upload.ts (MAX_RAW_UPLOAD_BYTES) validates against.
      // uploadImageAction (src/actions/media.ts) receives raw image bytes
      // as FormData directly in a Server Action call, so any real photo
      // over ~1MB (i.e. most of them) hit Next's limit before our own
      // validation or the sharp pipeline ever ran. Matched to
      // MAX_RAW_UPLOAD_BYTES so there's exactly one 10MB ceiling to reason
      // about, not two disagreeing ones — change both together if that
      // number ever moves.
      bodySizeLimit: "10mb",
    },
  },
};

module.exports = nextConfig;
