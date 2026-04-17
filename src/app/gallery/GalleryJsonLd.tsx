import { client } from "../../../sanity/lib/client";
import { JsonLdScript, visualArtworkLd } from "../../components/StructuredData";

export const revalidate = 3600;

interface ArtRow {
  _id: string;
  title: string;
  slug?: { current?: string };
  description?: string;
  medium?: string;
  dimensions?: string;
  year?: number;
  status?: string;
  price?: number;
  imageUrl?: string;
}

export default async function GalleryJsonLd() {
  let arts: ArtRow[] = [];
  try {
    arts = await client.fetch(
      `*[_type == "artwork"] | order(order asc)[0...30]{
        _id, title, slug, description, medium, dimensions, year, status, price,
        "imageUrl": image.asset->url
      }`
    );
  } catch {
    return null;
  }
  if (!arts || arts.length === 0) return null;

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListOrder: "https://schema.org/ItemListOrderAscending",
    numberOfItems: arts.length,
    itemListElement: arts.map((a, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: visualArtworkLd(a),
    })),
  };

  return <JsonLdScript id="ld-gallery-items" data={itemList} />;
}
