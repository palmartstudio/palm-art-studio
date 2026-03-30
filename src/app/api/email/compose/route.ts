import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase";
import { checkAdminAuth, logEmail, buildReplyHtml, buildRichHtml, stripHtml } from "@/lib/email";
import { randomUUID } from "crypto";

const FROM_EMAIL = "cj@palmartstudio.com";
const FROM_NAME = "Palm Art Studio";
const getResend = () => new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  if (!checkAdminAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { to_email, to_name, subject, body: emailBody, body_html: richHtml, draft_id, cc_emails, bcc_emails, attachments, from_email } = body;
  const sender = from_email || FROM_EMAIL;
  if (!to_email || !subject || (!emailBody && !richHtml)) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const thread_id = randomUUID();
  const name = to_name || to_email.split("@")[0];
  const html = richHtml ? buildRichHtml(name, richHtml, subject) : buildReplyHtml(name, emailBody, subject);

  const resendAtts: Array<{ filename: string; path: string }> = [];
  if (attachments?.length) { for (const a of attachments) resendAtts.push({ filename: a.filename, path: a.s3_url }); }

  let resendId: string | undefined;
  try {
    const r = getResend();
    const p: Parameters<typeof r.emails.send>[0] = { from: `${FROM_NAME} <${sender}>`, to: [to_email], subject, html };
    if (cc_emails?.length) p.cc = cc_emails;
    if (bcc_emails?.length) p.bcc = bcc_emails;
    if (resendAtts.length) p.attachments = resendAtts;
    const { data, error } = await r.emails.send(p);
    if (error) return NextResponse.json({ error: "Failed to send" }, { status: 500 });
    resendId = data?.id;
  } catch { return NextResponse.json({ error: "Email service error" }, { status: 500 }); }

  if (draft_id) await supabaseAdmin.from("email_messages").delete().eq("id", draft_id).eq("is_draft", true);

  const logged = await logEmail({
    thread_id, direction: "outbound", from_email: sender, to_email, subject,
    body_html: html, body_text: emailBody || stripHtml(richHtml || ""),
    resend_message_id: resendId, folder: "sent",
    has_attachments: resendAtts.length > 0, cc_emails: cc_emails || [], bcc_emails: bcc_emails || [],
  });
  if (attachments?.length && logged) {
    for (const a of attachments) {
      await supabaseAdmin.from("email_attachments").insert({ message_id: logged.id, filename: a.filename, content_type: a.content_type || "application/octet-stream", size_bytes: a.size_bytes || 0, s3_key: a.s3_key || "", s3_url: a.s3_url || "" });
    }
  }
  return NextResponse.json({ success: true, thread_id, message_id: logged?.id, resend_id: resendId });
}
