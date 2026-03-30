import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { supabaseAdmin } from "../../../../lib/supabase";
import { checkAdminAuth, logEmail, buildReplyHtml, buildRichHtml, stripHtml } from "../../../../lib/email";

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
  const { thread_id, to_email, to_name, subject, reply_body, reply_html, from_email } = body;
  const sender = from_email || FROM_EMAIL;
  if (!thread_id || !to_email || (!reply_body && !reply_html)) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const name = to_name || to_email.split("@")[0];
  const replySubject = subject?.startsWith("Re:") ? subject : `Re: ${subject || "Your inquiry"}`;
  const plain = reply_body || stripHtml(reply_html || "");
  const html = reply_html ? buildRichHtml(name, reply_html, subject || "Your inquiry") : buildReplyHtml(name, reply_body, subject || "Your inquiry");

  // Get In-Reply-To from previous message in thread
  let inReplyTo: string | undefined;
  const { data: last } = await supabaseAdmin.from("email_messages").select("resend_message_id").eq("thread_id", thread_id).not("resend_message_id", "is", null).order("created_at", { ascending: false }).limit(1).single();
  if (last?.resend_message_id) inReplyTo = last.resend_message_id;

  let messageId: string | undefined;
  try {
    const transport = getTransport();
    const mailOpts: nodemailer.SendMailOptions = {
      from: `${FROM_NAME} <${sender}>`, to: to_email, subject: replySubject, html, text: plain,
    };
    if (inReplyTo) { mailOpts.inReplyTo = inReplyTo; mailOpts.references = inReplyTo; }
    const info = await transport.sendMail(mailOpts);
    messageId = info.messageId;
  } catch (err: any) {
    console.error("SMTP reply error:", err);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }

  const logged = await logEmail({
    thread_id, direction: "outbound", from_email: sender, to_email, subject: replySubject,
    body_html: html, body_text: plain, resend_message_id: messageId, folder: "sent",
  });
  return NextResponse.json({ success: true, message_id: logged?.id });
}
