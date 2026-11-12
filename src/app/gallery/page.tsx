import type { Metadata } from "next";
import { client } from "../../../sanity/lib/client";
import { allArtworkQuery, pageContentQuery } from "../../../sanity/lib/queries";
import { JsonLdScript, breadcrumbList } from "../../components/StructuredData";
import GalleryJsonLd from "./GalleryJsonLd";
import GalleryClient from "./GalleryClient";

// CMS edits show up within a minute.
export const revalidate = 60;

const SITE_URL = "https://palmartstudio.com";
const TITLE = "Gallery — Original Florida Watercolor & Acrylic Paintings";
const DESC =
  "Browse original watercolors, acrylics, and mixed-media works by Carolyn Jenkins. Florida landscapes, wildlife, and abstract pieces — each with medium, dimensions, and availability.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: `${SITE_URL}/gallery` },
  openGraph: { title: TITLE, description: DESC, url: `${SITE_URL}/gallery`, type: "website" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESC },
};

export default async function GalleryPage() {
  let artworks: any[] = [];
  let pageContent: any = {};
  try {
    const [a, pc] = await Promise.all([client.fetch(allArtworkQuery), client.fetch(pageContentQuery)]);
    artworks = Array.isArray(a) ? a : [];
    pageContent = pc || {};
  } catch {
    // CMS unreachable — the client shows an empty state rather than fake work.
  }
  return (
    <>
      <JsonLdScript
        id="ld-breadcrumb-gallery"
        data={breadcrumbList([
          { name: "Home", url: `${SITE_URL}/` },
          { name: "Gallery", url: `${SITE_URL}/gallery` },
        ])}
      />
      <GalleryJsonLd />
      <GalleryClient initialArtworks={artworks} pageContent={pageContent} />
    </>
  );
}
