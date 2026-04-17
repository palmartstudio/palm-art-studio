import type { Metadata } from "next";
import { client } from "../../../sanity/lib/client";
import { artworksWithTimelineQuery, pageContentQuery } from "../../../sanity/lib/queries";
import ProcessClient from "./ProcessClient";
import {
  JsonLdScript,
  breadcrumbList,
} from "../../components/StructuredData";

export const revalidate = 60;

const SITE_URL = "https://palmartstudio.com";
const TITLE = "Behind the Canvas — How Each Palm Art Studio Painting Gets Made";
const DESC =
  "Step-by-step creation timelines for paintings by Carolyn Jenkins. From blank canvas to finished piece — process photos and short studio clips showing the hours behind each work.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: `${SITE_URL}/process` },
  openGraph: {
    title: TITLE,
    description: DESC,
    url: `${SITE_URL}/process`,
    type: "website",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESC,
    images: ["/opengraph-image"],
  },
};

export default async function ProcessPage() {
  let artworks: any[] = [];
  let pageContent: any = {};
  try {
    const [a, pc] = await Promise.all([
      client.fetch(artworksWithTimelineQuery),
      client.fetch(pageContentQuery),
    ]);
    artworks = Array.isArray(a) ? a : [];
    pageContent = pc || {};
  } catch {
    // Swallow — ProcessClient handles empty state
  }
  return (
    <>
      <JsonLdScript
        id="ld-breadcrumb-process"
        data={breadcrumbList([
          { name: "Home", url: `${SITE_URL}/` },
          { name: "Process", url: `${SITE_URL}/process` },
        ])}
      />
      <ProcessClient artworks={artworks} pageContent={pageContent} />
    </>
  );
}
