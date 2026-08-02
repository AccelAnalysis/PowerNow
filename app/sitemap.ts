import type { MetadataRoute } from "next";
import { loadStorefrontSettings } from "@/src/lib/settings";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const settings = await loadStorefrontSettings();
  const base = settings.seo.canonicalUrl.replace(/\/$/, "");

  return [
    {
      url: base,
      changeFrequency: "weekly",
      priority: 1
    },
    {
      url: `${base}/read-chapter-one`,
      changeFrequency: "monthly",
      priority: 0.8
    },
    {
      url: `${base}/affiliates`,
      changeFrequency: "monthly",
      priority: 0.5
    }
  ];
}
