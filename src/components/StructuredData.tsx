// Server component — renders JSON-LD scripts inline so Google sees them on first paint.

const SITE_URL = "https://palmartstudio.com";

type JsonLd = Record<string, unknown>;

export function JsonLdScript({ data, id }: { data: JsonLd | JsonLd[]; id?: string }) {
  return (
    <script
      type="application/ld+json"
      id={id}
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// Reusable schemas — export so callers can compose them.
export const artistPerson: JsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": `${SITE_URL}/#person`,
  name: "Carolyn Jenkins",
  alternateName: "Carolyn Jenkins, Palm Art Studio",
  description:
    "Florida-based watercolor, acrylic, and mixed-media artist. Over 40 years creating and 14+ years exhibiting in Florida art festivals.",
  url: SITE_URL,
  jobTitle: "Artist",
  knowsAbout: ["watercolor painting", "acrylic painting", "mixed media", "illustration", "commercial design"],
  address: {
    "@type": "PostalAddress",
    addressLocality: "Deltona",
    addressRegion: "FL",
    addressCountry: "US",
  },
};

export const studioOrganization: JsonLd = {
  "@context": "https://schema.org",
  "@type": ["ArtGallery", "LocalBusiness"],
  "@id": `${SITE_URL}/#studio`,
  name: "Palm Art Studio",
  description:
    "Studio of Florida artist Carolyn Jenkins. Original watercolors, acrylics, and mixed-media works; prints and commissions available.",
  url: SITE_URL,
  founder: { "@id": `${SITE_URL}/#person` },
  areaServed: { "@type": "State", name: "Florida" },
  address: {
    "@type": "PostalAddress",
    addressLocality: "Deltona",
    addressRegion: "FL",
    addressCountry: "US",
  },
  logo: `${SITE_URL}/icons/icon-512x512.png`,
  image: `${SITE_URL}/opengraph-image`,
};

export const websiteSchema: JsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: "Palm Art Studio",
  url: SITE_URL,
  publisher: { "@id": `${SITE_URL}/#studio` },
  inLanguage: "en-US",
};

export function breadcrumbList(items: { name: string; url: string }[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

export interface ArtworkLdInput {
  _id: string;
  slug?: { current?: string } | string;
  title: string;
  description?: string;
  imageUrl?: string;
  medium?: string;
  dimensions?: string;
  year?: number;
  status?: string;
  price?: number;
}

export function visualArtworkLd(a: ArtworkLdInput): JsonLd {
  const slug = typeof a.slug === "string" ? a.slug : a.slug?.current;
  const schema: JsonLd = {
    "@context": "https://schema.org",
    "@type": "VisualArtwork",
    "@id": `${SITE_URL}/gallery#${slug || a._id}`,
    name: a.title,
    artMedium: a.medium,
    artworkSurface: a.dimensions,
    creator: { "@id": `${SITE_URL}/#person` },
    image: a.imageUrl,
    ...(a.description ? { description: a.description } : {}),
    ...(a.year ? { dateCreated: String(a.year) } : {}),
  };
  if (a.price && a.status === "available") {
    (schema as JsonLd & { offers: JsonLd }).offers = {
      "@type": "Offer",
      price: a.price,
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    };
  }
  return schema;
}
