import { NextRequest, NextResponse } from "next/server";
import { createClient } from "next-sanity";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "mwzx64sx",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
});

const SETTINGS_ID = "siteSettings";

export async function GET() {
  try {
    const settings = await client.fetch(`*[_type == "siteSettings"][0]`);
    return NextResponse.json(settings || {});
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { field, value, assetRef } = body;

    // Check if document exists
    const existing = await client.fetch(`*[_type == "siteSettings"][0]{ _id }`);

    let patch: Record<string, unknown> = {};

    if (assetRef && field) {
      // Video/asset ref update
      patch[field] = { _type: "file", asset: { _type: "reference", _ref: assetRef } };
    } else if (field && value !== undefined) {
      patch[field] = value;
    } else {
      // Bulk update
      const { field: _f, value: _v, assetRef: _a, ...rest } = body;
      patch = rest;
    }

    let result;
    if (existing?._id) {
      result = await client.patch(existing._id).set(patch).commit();
    } else {
      result = await client.createOrReplace({
        _type: "siteSettings",
        _id: SETTINGS_ID,
        ...patch,
      });
    }

    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const existing = await client.fetch(`*[_type == "siteSettings"][0]{ _id }`);
    let result;
    if (existing?._id) {
      result = await client.patch(existing._id).set(body).commit();
    } else {
      result = await client.createOrReplace({ _type: "siteSettings", _id: SETTINGS_ID, ...body });
    }
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
