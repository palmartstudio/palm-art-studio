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

  // Pull artwork slugs so Google can discover individual works even before
  // /gallery/[slug] routes exist. They'll deep-link to /gallery#art-<id> today
  // and upgrade cleanly when per-artwork pages ship.
  try {
    const arts: Array<{ _updatedAt?: string; slug?: { current?: string } }> = await client.fetch(
      `*[_type == "artwork" && defined(slug.current)]{_updatedAt, slug}`
    );
    // No per-artwork route yet — skip dynamic entries to avoid 404s.
    // Keep as no-op; flipping this on is a one-line change once slugs have pages.
    void arts;
  } catch {
    // Sanity unreachable — static routes still ship.
  }

  return staticRoutes;
}
