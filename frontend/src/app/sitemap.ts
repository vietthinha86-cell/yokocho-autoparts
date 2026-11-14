import type { MetadataRoute } from "next";
import { FALLBACK_PRODUCTS, fetchCatalogData } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";

  let products = FALLBACK_PRODUCTS;
  try {
    const data = await fetchCatalogData();
    if (data.products.length > 0) {
      products = data.products;
    }
  } catch {
    // Fallback cleanly to bundled catalog slugs
  }

  const now = new Date();
  const productEntries: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${siteUrl}/san-pham/${product.slug}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.85,
  }));

  return [
    {
      url: `${siteUrl}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    ...productEntries,
  ];
}

