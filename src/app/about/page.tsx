import { client, urlFor } from "../../../sanity/lib/client";
import { pageContentQuery } from "../../../sanity/lib/queries";
import AboutClient from "./AboutClient";

// Metadata and JSON-LD live in layout.tsx. CMS edits show up within a minute.
export const revalidate = 60;

export default async function AboutPage() {
  let pageContent: any = {};
  let portraitUrl: string | null = null;
  let portraitSrcSet: string | undefined;
  try {
    const [pc, artist] = await Promise.all([
      client.fetch(pageContentQuery),
      client.fetch(`*[_type == "artistBio"][0]{ portrait }`),
    ]);
    pageContent = pc || {};
    if (artist?.portrait?.asset) {
      // urlFor respects the crop/hotspot Carolyn set on the portrait
      const at = (w: number) =>
        urlFor(artist.portrait).width(w).height(Math.round(w * 1.25)).fit("crop").auto("format").quality(75).url();
      portraitUrl = at(900);
      portraitSrcSet = [480, 900, 1400].map((w) => `${at(w)} ${w}w`).join(", ");
    }
  } catch {
    // CMS unreachable — AboutClient falls back to its built-in copy.
  }
  return <AboutClient pageContent={pageContent} portraitUrl={portraitUrl} portraitSrcSet={portraitSrcSet} />;
}
