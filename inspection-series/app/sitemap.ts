import type { MetadataRoute } from "next";
import { loadSeriesCatalog } from "@/src/lib/books";
import { loadStorefrontSettings } from "@/src/lib/settings";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [settings, catalog] = await Promise.all([
    loadStorefrontSettings(),
    loadSeriesCatalog()
  ]);
  const base = settings.seo.canonicalUrl.replace(/\/$/, "");
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    {
      url: `${base}/books`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9
    },
    {
      url: `${base}/read-chapter-one`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7
    },
    {
      url: `${base}/affiliates`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5
    },
    { url: `${base}/shipping-returns`, lastModified: now, priority: 0.3 },
    { url: `${base}/privacy`, lastModified: now, priority: 0.2 },
    { url: `${base}/terms`, lastModified: now, priority: 0.2 }
  ];

  const books: MetadataRoute.Sitemap = catalog.books
    .filter((book) => book.status !== "retired")
    .map((book) => ({
      url: `${base}/books/${book.slug}`,
      lastModified: now,
      changeFrequency:
        book.status === "available" || book.status === "preorder"
          ? "weekly"
          : "monthly",
      priority:
        book.slug === catalog.series.featuredBookSlug
          ? 0.9
          : book.status === "available"
            ? 0.8
            : 0.55
    }));

  return [...staticPages, ...books];
}
