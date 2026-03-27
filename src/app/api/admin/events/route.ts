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
    const events = await client.fetch(`*[_type == "event"] | order(date asc) { _id, title, date, endDate, location, description, rsvpUrl, type }`);
    return NextResponse.json(events);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await client.create({
      _type: "event",
      title: body.title,
      date: body.date,
      endDate: body.endDate || undefined,
      location: body.location || undefined,
      description: body.description || undefined,
      rsvpUrl: body.rsvpUrl || undefined,
      type: body.type || undefined,
    });
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { _id, ...rest } = body;
    if (!_id) return NextResponse.json({ error: "Missing _id" }, { status: 400 });
    const result = await client.patch(_id).set({
      title: rest.title,
      date: rest.date,
      location: rest.location || null,
      description: rest.description || null,
      rsvpUrl: rest.rsvpUrl || null,
      type: rest.type || null,
    }).commit();
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
