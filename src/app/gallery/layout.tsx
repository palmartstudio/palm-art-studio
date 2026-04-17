import type { Metadata } from "next";
import {
  JsonLdScript,
  breadcrumbList,
} from "../../components/StructuredData";
import GalleryJsonLd from "./GalleryJsonLd";

const SITE_URL = "https://palmartstudio.com";
const TITLE = "Gallery — Original Florida Watercolor & Acrylic Paintings";
const DESC =
  "Browse original watercolors, acrylics, and mixed-media works by Carolyn Jenkins. Florida landscapes, Victorian architecture, and abstract pieces — each with medium, dimensions, and availability.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: `${SITE_URL}/gallery` },
  openGraph: {
    title: TITLE,
    description: DESC,
    url: `${SITE_URL}/gallery`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESC,
  },
};

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
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
      {children}
    </>
  );
}
