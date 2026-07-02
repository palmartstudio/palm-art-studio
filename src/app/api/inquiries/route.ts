import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = (body.name || "").toString().trim();
    const email = (body.email || "").toString().trim();
    const subject = (body.subject || "").toString().trim();
    const message = (body.message || "").toString().trim();

    if (!name || !message) {
      return NextResponse.json({ error: "Name and message are required." }, { status: 400 });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    if (name.length > 200 || subject.length > 300 || message.length > 5000) {
      return NextResponse.json({ error: "Message too long." }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("inquiries").insert({
      name,
      email: email || null,
      subject: subject || null,
      message,
      type: /commission/i.test(subject) ? "commission" : "general",
      status: "new",
      source: "website-contact-form",
    });
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Something went wrong." }, { status: 500 });
  }
}
