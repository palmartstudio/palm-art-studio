import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase";
import { checkAdminAuth, logEmail, buildReplyHtml, buildRichHtml, stripHtml } from "@/lib/email";

const FROM_EMAIL = "cj@palmartstudio.com";
const FROM_NAME = "Palm Art Studio";
const getResend = () => new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  if (!checkAdminAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { thread_id, to_email, to_name, subject, reply_body, reply_html, attachments, from_email } = body;
  const sender = from_email || FROM_EMAIL;
  if (!thread_id || !to_email || (!reply_body && !reply_html)) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const name = to_name || to_email.split("@")[0];
  const replySubject = subject?.startsWith("Re:") ? subject : `Re: ${subject || "Your inquiry"}`;
  const plain = reply_body || stripHtml(reply_html || "");
  const html = reply_html ? buildRichHtml(name, reply_html, subject || "Your inquiry") : buildReplyHtml(name, reply_body, subject || "Your inquiry");

  // Threading headers
  let inReplyTo: string | undefined;
  const { data: last } = await supabaseAdmin.from("email_messages").select("resend_message_id").eq("thread_id", thread_id).not("resend_message_id", "is", null).order("created_at", { ascending: false }).limit(1).single();
  if (last?.resend_message_id) inReplyTo = `<${last.resend_message_id}@resend.dev>`;

  const resendAtts: Array<{ filename: string; path: string }> = [];
  if (attachments?.length) { for (const a of attachments) resendAtts.push({ filename: a.filename, path: a.s3_url }); }

  let resendId: string | undefined;
  try {
    const r = getResend();
    const p: Parameters<typeof r.emails.send>[0] = { from: `${FROM_NAME} <${sender}>`, to: [to_email], subject: replySubject, html };
    if (inReplyTo) p.headers = { "In-Reply-To": inReplyTo, References: inReplyTo };
    if (resendAtts.length) p.attachments = resendAtts;
    const { data, error } = await r.emails.send(p);
    if (error) return NextResponse.json({ error: "Failed to send" }, { status: 500 });
    resendId = data?.id;
  } catch { return NextResponse.json({ error: "Email service error" }, { status: 500 }); }

  const logged = await logEmail({
    thread_id, direction: "outbound", from_email: sender, to_email, subject: replySubject,
    body_html: html, body_text: plain, resend_message_id: resendId, folder: "sent",
    has_attachments: resendAtts.length > 0,
  });
  if (attachments?.length && logged) {
    for (const a of attachments) { await supabaseAdmin.from("email_attachments").insert({ message_id: logged.id, filename: a.filename, content_type: a.content_type || "application/octet-stream", size_bytes: a.size_bytes || 0, s3_key: a.s3_key || "", s3_url: a.s3_url || "" }); }
  }
  return NextResponse.json({ success: true, message_id: logged?.id, resend_id: resendId });
}
