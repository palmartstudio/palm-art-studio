import { createClient } from "next-sanity";
import imageUrlBuilder from "@sanity/image-url";
import HomeClient from "./HomeClient";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "mwzx64sx",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  useCdn: true,
});

const builder = imageUrlBuilder(client);

async function getData() {
  const [settings, artist, artwork, shopItems, events] = await Promise.all([
    client.fetch(`*[_type == "siteSettings"][0]`).catch(() => null),
    client.fetch(`*[_type == "artistBio"][0]`).catch(() => null),
    client.fetch(`*[_type == "artwork"] | order(order asc)[0...6] { _id, title, medium, dimensions, price, status, "imageUrl": image.asset->url }`).catch(() => []),
    client.fetch(`*[_type == "shopItem"] | order(order asc)[0...4] { _id, title, medium, price, comparePrice, badge, "imageUrl": image.asset->url }`).catch(() => []),
    client.fetch(`*[_type == "event"] | order(date asc)[0...6] { _id, title, date, location, rsvpUrl }`).catch(() => []),
  ]);

  let portraitUrl: string | null = null;
  if (artist?.portrait?.asset) {
    try {
      portraitUrl = builder.image(artist.portrait).width(800).height(1000).fit("crop").url();
    } catch {}
  }

  return { settings, artist, artwork, shopItems, events, portraitUrl };
}

export default async function Home() {
  const data = await getData();
  return <HomeClient {...data} />;
}
