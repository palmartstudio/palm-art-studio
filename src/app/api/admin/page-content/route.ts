import { NextRequest, NextResponse } from "next/server";
import { createClient } from "next-sanity";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "mwzx64sx",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
});

const DOC_ID = "pageContent";

export async function GET() {
  try {
    const content = await client.fetch(`*[_type == "pageContent"][0]`);
    return NextResponse.json(content || {});
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { section, field, value } = body;

    const existing = await client.fetch(`*[_type == "pageContent"][0]{ _id }`);

    let patch: Record<string, unknown> = {};

    if (section && field !== undefined) {
      // Nested field update: e.g. section="homeGallery", field="title", value="New Title"
      // For arrays (like aboutStats), value is the full array
      if (field === "_full") {
        // Replace entire section object
        patch[section] = value;
      } else {
        // Dot-notation: update a single nested field
        patch[`${section}.${field}`] = value;
      }
    } else if (section && value !== undefined && field === undefined) {
      // Bulk section update: replace entire section
      patch[section] = value;
    } else {
      // Generic bulk update
      const { section: _s, field: _f, value: _v, ...rest } = body;
      patch = rest;
    }

    let result;
    if (existing?._id) {
      result = await client.patch(existing._id).set(patch).commit();
    } else {
      result = await client.createOrReplace({
        _type: "pageContent",
        _id: DOC_ID,
        ...patch,
      });
    }

    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
