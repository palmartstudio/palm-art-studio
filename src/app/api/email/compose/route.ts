import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { supabaseAdmin } from "../../../../lib/supabase";
import { checkAdminAuth, logEmail, buildReplyHtml, buildRichHtml, stripHtml } from "../../../../lib/email";
import { randomUUID } from "crypto";

const FROM_EMAIL = "cj@palmartstudio.com";
const FROM_NAME = "Palm Art Studio";

function getTransport() {
  return nodemailer.createTransport({
    host: process.env.SPACEMAIL_HOST || "mail.spacemail.com",
    port: 465, secure: true,
    auth: { user: process.env.SPACEMAIL_USER || FROM_EMAIL, pass: process.env.SPACEMAIL_PASS || "" },
  });
}

export async function POST(req: NextRequest) {
  if (!checkAdminAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { to_email, to_name, subject, body: emailBody, body_html: richHtml, draft_id, cc_emails, bcc_emails, from_email } = body;
  const sender = from_email || FROM_EMAIL;
  if (!to_email || !subject || (!emailBody && !richHtml)) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const thread_id = randomUUID();
  const name = to_name || to_email.split("@")[0];
  const html = richHtml ? buildRichHtml(name, richHtml, subject) : buildReplyHtml(name, emailBody, subject);
  const plain = emailBody || stripHtml(richHtml || "");

  let messageId: string | undefined;
  try {
    const transport = getTransport();
    const mailOpts: nodemailer.SendMailOptions = {
      from: `${FROM_NAME} <${sender}>`, to: to_email, subject, html, text: plain,
    };
    if (cc_emails?.length) mailOpts.cc = cc_emails;
    if (bcc_emails?.length) mailOpts.bcc = bcc_emails;
    const info = await transport.sendMail(mailOpts);
    messageId = info.messageId;
  } catch (err: any) {
    console.error("SMTP send error:", err);
    return NextResponse.json({ error: "Failed to send: " + (err.message || "SMTP error") }, { status: 500 });
  }

  if (draft_id) await supabaseAdmin.from("email_messages").delete().eq("id", draft_id).eq("is_draft", true);

  const logged = await logEmail({
    thread_id, direction: "outbound", from_email: sender, to_email, subject,
    body_html: html, body_text: plain, resend_message_id: messageId,
    folder: "sent", cc_emails: cc_emails || [], bcc_emails: bcc_emails || [],
  });
  return NextResponse.json({ success: true, thread_id, message_id: logged?.id });
}
