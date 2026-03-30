import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { supabaseAdmin } from "@/lib/supabase";
import { logEmail } from "@/lib/email";

const DEFAULT_TO = "cj@palmartstudio.com";

function parseEmail(raw: string): string {
  const m = raw.match(/<([^>]+)>/); return m ? m[1].toLowerCase() : raw.toLowerCase().trim();
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  // Verify webhook signature
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (secret) {
    const svixId = req.headers.get("svix-id");
    const svixTimestamp = req.headers.get("svix-timestamp");
    const svixSignature = req.headers.get("svix-signature");
    if (!svixId || !svixTimestamp || !svixSignature) return NextResponse.json({ error: "Missing headers" }, { status: 401 });
    try { new Webhook(secret).verify(rawBody, { "svix-id": svixId, "svix-timestamp": svixTimestamp, "svix-signature": svixSignature }); }
    catch { return NextResponse.json({ error: "Invalid signature" }, { status: 401 }); }
  }

  let event; try { event = JSON.parse(rawBody); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (event.type !== "email.received") return NextResponse.json({ success: true, skipped: true });

  const { email_id, from, to, subject } = event.data as { email_id: string; from: string; to: string | string[]; subject: string };
  let body_html: string | null = null, body_text: string | null = null, in_reply_to: string | null = null;
  try {
    const resp = await fetch(`https://api.resend.com/emails/receiving/${email_id}`, { headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` } });
    if (resp.ok) {
      const full = await resp.json();
      body_html = full.html || null; body_text = full.text || null;
      const hdrs = full.headers || {};
      in_reply_to = hdrs["in-reply-to"] || hdrs["In-Reply-To"] || null;
      if (in_reply_to) in_reply_to = in_reply_to.replace(/[<>]/g, "").trim();
    }
  } catch (err) { console.error("Failed to fetch full email:", err); }

  const from_email = parseEmail(typeof from === "string" ? from : String(from));
  const to_email = parseEmail(typeof to === "string" ? to : Array.isArray(to) ? to[0] : DEFAULT_TO);
  const subjectStr = subject || "(no subject)";

  // Thread matching
  let threadId: string | undefined;
  if (in_reply_to) {
    const uuid = in_reply_to.includes("@") ? in_reply_to.split("@")[0] : in_reply_to;
    const { data } = await supabaseAdmin.from("email_messages").select("thread_id").eq("resend_message_id", uuid).single();
    if (data) threadId = data.thread_id;
    else { const { data: fb } = await supabaseAdmin.from("email_messages").select("thread_id").eq("resend_message_id", in_reply_to).single(); if (fb) threadId = fb.thread_id; }
  }

  if (!threadId) {
    const clean = subjectStr.replace(/^(Re:|Fwd?:)\s*/gi, "").trim();
    const { data } = await supabaseAdmin.from("email_messages").select("thread_id").eq("to_email", from_email).ilike("subject", `%${clean}%`).order("created_at", { ascending: false }).limit(1).single();
    if (data) threadId = data.thread_id;
  }

  const logged = await logEmail({ thread_id: threadId, direction: "inbound", from_email, to_email, subject: subjectStr, body_html: body_html ?? undefined, body_text: body_text ?? undefined });
  return NextResponse.json({ success: true, message_id: logged?.id, thread_id: logged?.thread_id, matched: !!threadId });
}
