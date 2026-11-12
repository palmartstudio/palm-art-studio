import type { MetadataRoute } from "next";
import { client } from "../../sanity/lib/client";

const SITE_URL = "https://palmartstudio.com";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${SITE_URL}/gallery`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/process`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  ];

  // One entry per artwork page.
  try {
    const arts: Array<{ _id: string; _updatedAt?: string; slug?: string }> = await client.fetch(
      `*[_type == "artwork" && defined(image.asset)]{ _id, _updatedAt, "slug": slug.current }`
    );
    return [
      ...staticRoutes,
      ...arts.map((a) => ({
        url: `${SITE_URL}/gallery/${a.slug || a._id}`,
        lastModified: a._updatedAt ? new Date(a._updatedAt) : now,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })),
    ];
  } catch {
    // Sanity unreachable — static routes still ship.
  }

  return staticRoutes;
}
