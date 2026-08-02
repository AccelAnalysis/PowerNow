import type { MetadataRoute } from "next";
import { loadStorefrontSettings } from "@/src/lib/settings";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await loadStorefrontSettings();
  const base = settings.seo.canonicalUrl.replace(/\/$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/read-chapter-one", "/affiliates"],
        disallow: [
          "/admin",
          "/api",
          "/success",
          "/cancel",
          "/privacy",
          "/terms",
          "/shipping-returns"
        ]
      }
    ],
    sitemap: `${base}/sitemap.xml`
  };
}
