import { client } from "../../../sanity/lib/client";
import { artworksWithTimelineQuery, pageContentQuery } from "../../../sanity/lib/queries";
import ProcessClient from "./ProcessClient";

export const revalidate = 60;

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
  return <ProcessClient artworks={artworks} pageContent={pageContent} />;
}
