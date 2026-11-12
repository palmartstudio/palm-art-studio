import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase";
import { notifyNewInquiry } from "../../../lib/notify";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Honeypot: real visitors never see or fill this field. Pretend success for bots.
    if ((body.website || "").toString().trim()) {
      return NextResponse.json({ ok: true });
    }

    const name = (body.name || "").toString().trim();
    const email = (body.email || "").toString().trim();
    const subject = (body.subject || "").toString().trim();
    const message = (body.message || "").toString().trim();
    const artwork = (body.artwork || "").toString().trim().slice(0, 200);

    if (!name || !message) {
      return NextResponse.json({ error: "Name and message are required." }, { status: 400 });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    if (name.length > 200 || email.length > 254 || subject.length > 300 || message.length > 5000) {
      return NextResponse.json({ error: "Message too long." }, { status: 400 });
    }

    const type = /commission/i.test(subject) ? "commission" : "general";
    const record = { name, email: email || null, subject: subject || null, message, type };

    const { error } = await supabaseAdmin.from("inquiries").insert({
      ...record,
      status: "new",
      source: "website-contact-form",
      artwork_ref: artwork || null,
    });

    // Email the studio either way — if the database is unavailable the message still gets through.
    const notified = await notifyNewInquiry({ ...record, artwork: artwork || null });

    if (error && !notified) {
      console.error("Inquiry lost — DB and email both failed:", error);
      return NextResponse.json(
        { error: "We couldn't send your message. Please email cj@palmartstudio.com or call (352) 217-9709." },
        { status: 500 },
      );
    }
    if (error) console.error("Inquiry DB insert failed (email sent):", error);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("Inquiry route error:", e);
    return NextResponse.json(
      { error: "We couldn't send your message. Please email cj@palmartstudio.com or call (352) 217-9709." },
      { status: 500 },
    );
  }
}
