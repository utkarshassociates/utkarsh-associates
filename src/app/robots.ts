import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// Plan §8 item 4: "robots.ts — disallow /admin/*, allow everything public."
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
