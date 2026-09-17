import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// Disallows /admin/*, allows everything public.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/admin/",
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
