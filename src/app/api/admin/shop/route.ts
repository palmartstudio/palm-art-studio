import { NextRequest, NextResponse } from "next/server";
import { createClient } from "next-sanity";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "mwzx64sx",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
});

export async function GET() {
  try {
    const items = await client.fetch(`*[_type == "shopItem"] | order(order asc) {
      _id, title, slug, medium, price, comparePrice, badge, type, inStock, stripeLink, order,
      "imageUrl": image.asset->url
    }`);
    return NextResponse.json(items);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageAssetId, ...rest } = body;
    const doc: Record<string, unknown> = {
      _type: "shopItem",
      title: rest.title,
      medium: rest.medium || undefined,
      price: parseFloat(rest.price),
      comparePrice: rest.comparePrice ? parseFloat(rest.comparePrice) : undefined,
      badge: rest.badge || undefined,
      type: rest.type || undefined,
      inStock: rest.inStock !== false,
      stripeLink: rest.stripeLink || undefined,
      order: 0,
    };
    if (rest.title) {
      doc.slug = { _type: "slug", current: rest.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") };
    }
    if (imageAssetId) {
      doc.image = { _type: "image", asset: { _type: "reference", _ref: imageAssetId } };
    }
    const result = await client.create(doc as any);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { _id, imageAssetId, imageUrl, ...rest } = body;
    if (!_id) return NextResponse.json({ error: "Missing _id" }, { status: 400 });
    const patch: Record<string, unknown> = { ...rest };
    if (imageAssetId) {
      patch.image = { _type: "image", asset: { _type: "reference", _ref: imageAssetId } };
    }
    delete patch._id; delete patch.imageUrl;
    const result = await client.patch(_id).set(patch).commit();
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await client.delete(id);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
