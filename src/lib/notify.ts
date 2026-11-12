// ═══ Palm Art Studio — Owner notifications ═══
// Emails the studio when someone uses a form on the public site, so a new
// inquiry never sits unseen in the database.
import nodemailer from "nodemailer";

const STUDIO_EMAIL = "cj@palmartstudio.com";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function transport() {
  return nodemailer.createTransport({
    host: process.env.SPACEMAIL_HOST || "mail.spacemail.com",
    port: 465,
    secure: true,
    auth: { user: process.env.SPACEMAIL_USER || STUDIO_EMAIL, pass: process.env.SPACEMAIL_PASS || "" },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 10000,
  });
}

function notifyTo(): string {
  return process.env.INQUIRY_NOTIFY_TO || STUDIO_EMAIL;
}

export async function notifyNewInquiry(i: {
  name: string; email?: string | null; subject?: string | null; message: string; type?: string; artwork?: string | null;
}): Promise<boolean> {
  if (!process.env.SPACEMAIL_PASS) {
    console.error("notifyNewInquiry: SPACEMAIL_PASS not set — notification skipped");
    return false;
  }
  const kind = i.type === "commission" ? "Commission inquiry" : "Website inquiry";
  const subject = `${kind} from ${i.name}${i.subject ? ` — ${i.subject}` : ""}`.slice(0, 180);
  const rows: [string, string][] = [
    ["Name", i.name],
    ["Email", i.email || "(not given)"],
    ...(i.subject ? [["Subject", i.subject] as [string, string]] : []),
    ...(i.artwork ? [["About", i.artwork] as [string, string]] : []),
  ];
  const text =
    `${kind} from palmartstudio.com\n\n` +
    rows.map(([k, v]) => `${k}: ${v}`).join("\n") +
    `\n\nMessage:\n${i.message}\n\n` +
    (i.email ? "Reply to this email to answer them directly." : "No email was given — check the message for a phone number.");
  const html = `<!DOCTYPE html><html><body style="margin:0;padding:24px 0;background:#f5f0e8;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:12px;overflow:hidden;">
<tr><td style="background:#2A2520;padding:22px 28px;"><div style="color:#C4A86E;font-size:12px;letter-spacing:2px;text-transform:uppercase;">palmartstudio.com</div>
<div style="color:#fff;font-size:22px;font-family:Georgia,serif;margin-top:4px;">${esc(kind)}</div></td></tr>
<tr><td style="padding:26px 28px;color:#3D3530;font-size:17px;line-height:1.6;">
${rows.map(([k, v]) => `<div style="margin-bottom:6px;"><strong>${esc(k)}:</strong> ${esc(v)}</div>`).join("")}
<div style="margin:18px 0 6px;"><strong>Message:</strong></div>
<div style="background:#FAF8F4;border-left:4px solid #C47D5A;padding:14px 18px;white-space:pre-wrap;">${esc(i.message)}</div>
<p style="margin:22px 0 0;font-size:15px;color:#6b6157;">${i.email ? "Just reply to this email to answer them directly." : "No email was given — check the message for a phone number."}</p>
</td></tr></table></td></tr></table></body></html>`;

  try {
    await transport().sendMail({
      from: `Palm Art Studio Website <${process.env.SPACEMAIL_USER || STUDIO_EMAIL}>`,
      to: notifyTo(),
      ...(i.email ? { replyTo: `${i.name.replace(/[<>"\r\n]/g, "")} <${i.email}>` } : {}),
      subject,
      text,
      html,
    });
    return true;
  } catch (err) {
    console.error("notifyNewInquiry failed:", err);
    return false;
  }
}
