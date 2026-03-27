import { NextRequest, NextResponse } from "next/server";
import { createClient } from "next-sanity";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "mwzx64sx",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
});

const ARTIST_ID = "artistBio";

export async function GET() {
  try {
    const artist = await client.fetch(`*[_type == "artistBio"][0]`);
    return NextResponse.json(artist || {});
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { field, value, imageAssetId } = body;

    const existing = await client.fetch(`*[_type == "artistBio"][0]{ _id }`);

    let patch: Record<string, unknown> = {};

    if (imageAssetId && field) {
      patch[field] = { _type: "image", asset: { _type: "reference", _ref: imageAssetId } };
    } else if (field && value !== undefined) {
      patch[field] = value;
    } else {
      const { field: _f, value: _v, imageAssetId: _i, ...rest } = body;
      patch = rest;
    }

    let result;
    if (existing?._id) {
      result = await client.patch(existing._id).set(patch).commit();
    } else {
      result = await client.createOrReplace({ _type: "artistBio", _id: ARTIST_ID, ...patch });
    }

    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
