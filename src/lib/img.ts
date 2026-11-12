// Sanity serves resized, modern-format images straight from its CDN when asked.
// Without these parameters the browser downloads the original camera file
// (often 2–3 MB and 4000px wide) to show it at a few hundred pixels.

const SANITY_IMAGES = "cdn.sanity.io/images/";

/** Resized image URL. Non-Sanity URLs are returned unchanged. */
export function sanityImg(
  url: string | undefined | null,
  w: number,
  opts: { h?: number; q?: number } = {},
): string {
  if (!url) return "";
  if (!url.includes(SANITY_IMAGES)) return url;
  const base = url.split("?")[0];
  const p = new URLSearchParams({ w: String(w), auto: "format", q: String(opts.q ?? 75) });
  if (opts.h) {
    p.set("h", String(opts.h));
    p.set("fit", "crop");
  } else {
    p.set("fit", "max");
  }
  return `${base}?${p.toString()}`;
}

/** srcset string for responsive images. */
export function sanitySrcSet(url: string | undefined | null, widths: number[]): string | undefined {
  if (!url || !url.includes(SANITY_IMAGES)) return undefined;
  return widths.map((w) => `${sanityImg(url, w)} ${w}w`).join(", ");
}

const MEDIUM_LABELS: Record<string, string> = {
  watercolor: "Watercolor",
  acrylic: "Acrylic",
  "mixed-media": "Mixed Media",
  oil: "Oil",
  digital: "Digital",
  other: "Original Work",
};

export function mediumLabel(medium?: string | null): string {
  if (!medium) return "Original Work";
  return MEDIUM_LABELS[medium] || medium;
}
