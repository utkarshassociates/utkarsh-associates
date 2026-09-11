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
};

module.exports = nextConfig;
