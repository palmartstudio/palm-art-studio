import { createClient } from "next-sanity";
import imageUrlBuilder from "@sanity/image-url";
import HomeClient from "./HomeClient";
import {
  JsonLdScript,
  artistPerson,
  studioOrganization,
  websiteSchema,
} from "../components/StructuredData";

export const dynamic = "force-dynamic";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "mwzx64sx",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  useCdn: false,
});

const builder = imageUrlBuilder(client);

async function getData() {
  const [settings, artist, artwork, shopItems, events, pageContent] = await Promise.all([
    client.fetch(`*[_type == "siteSettings"][0]`).catch(() => null),
    client.fetch(`*[_type == "artistBio"][0]`).catch(() => null),
    client.fetch(`*[_type == "artwork"] | order(order asc)[0...6] { _id, title, medium, dimensions, price, status, "imageUrl": image.asset->url }`).catch(() => []),
    client.fetch(`*[_type == "shopItem"] | order(order asc)[0...4] { _id, title, medium, price, comparePrice, badge, "imageUrl": image.asset->url }`).catch(() => []),
    client.fetch(`*[_type == "event"] | order(date asc)[0...6] { _id, title, date, location, rsvpUrl }`).catch(() => []),
    client.fetch(`*[_type == "pageContent"][0]`).catch(() => null),
  ]);

  let portraitUrl: string | null = null;
  if (artist?.portrait?.asset) {
    try {
      portraitUrl = builder.image(artist.portrait).width(800).height(1000).fit("crop").url();
    } catch {}
  }

  // Resolve hero frame images
  const heroImages: (string | null)[] = [null, null, null];
  ["heroImage1", "heroImage2", "heroImage3"].forEach((key, i) => {
    if (settings?.[key]?.asset) {
      try { heroImages[i] = builder.image(settings[key]).width(600).height(750).fit("crop").url(); } catch {}
    }
  });

  return { settings, artist, artwork, shopItems, events, portraitUrl, pageContent, heroImages };
}

export default async function Home() {
  const data = await getData();
  return (
    <>
      <JsonLdScript id="ld-website" data={websiteSchema} />
      <JsonLdScript id="ld-person" data={artistPerson} />
      <JsonLdScript id="ld-studio" data={studioOrganization} />
      <HomeClient {...data} />
    </>
  );
}
