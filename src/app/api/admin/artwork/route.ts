import { NextRequest, NextResponse } from "next/server";
import { createClient } from "next-sanity";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "mwzx64sx",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
});

// GET — list all artwork
export async function GET() {
  try {
    const artworks = await client.fetch(`*[_type == "artwork"] | order(order asc) {
      _id, title, slug, medium, dimensions, year, description, status, price,
      printPrice, featured, category, order,
      "imageUrl": image.asset->url
    }`);
    return NextResponse.json(artworks);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST — create new artwork
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageAssetId, ...rest } = body;

    const doc: Record<string, unknown> = {
      _type: "artwork",
      title: rest.title,
      medium: rest.medium || undefined,
      dimensions: rest.dimensions || undefined,
      year: rest.year ? parseInt(rest.year) : undefined,
      price: rest.price ? parseFloat(rest.price) : undefined,
      status: rest.status || "available",
      category: rest.category || undefined,
      featured: !!rest.featured,
      description: rest.description || undefined,
      order: 0,
    };

    if (rest.title) {
      doc.slug = {
        _type: "slug",
        current: rest.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      };
    }

    if (imageAssetId) {
      doc.image = {
        _type: "image",
        asset: { _type: "reference", _ref: imageAssetId },
      };
    }

    const result = await client.create(doc as any);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PATCH — update existing artwork
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { _id, imageAssetId, imageUrl, ...rest } = body;
    if (!_id) return NextResponse.json({ error: "Missing _id" }, { status: 400 });

    const patch: Record<string, unknown> = {};
    if (rest.title !== undefined) patch.title = rest.title;
    if (rest.medium !== undefined) patch.medium = rest.medium;
    if (rest.dimensions !== undefined) patch.dimensions = rest.dimensions;
    if (rest.year !== undefined) patch.year = rest.year ? parseInt(rest.year) : null;
    if (rest.price !== undefined) patch.price = rest.price ? parseFloat(rest.price) : null;
    if (rest.status !== undefined) patch.status = rest.status;
    if (rest.category !== undefined) patch.category = rest.category;
    if (rest.featured !== undefined) patch.featured = !!rest.featured;
    if (rest.description !== undefined) patch.description = rest.description;

    if (imageAssetId) {
      patch.image = {
        _type: "image",
        asset: { _type: "reference", _ref: imageAssetId },
      };
    }

    const result = await client.patch(_id).set(patch).commit();
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE — remove artwork
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
