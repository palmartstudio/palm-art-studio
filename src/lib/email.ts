// ═══ Palm Art Studio — Email Utilities ═══
import { supabaseAdmin } from "./supabase";
import { NextRequest } from "next/server";

// ── Brand Config ──
const BRAND = {
  companyName: "Palm Art Studio",
  tagline: "Original Fine Art by Carolyn Jenkins",
  phone: "(352) 217-9709",
  email: "cj@palmartstudio.com",
  serviceArea: "Deltona, FL — Central Florida",
  gradientFrom: "#C47D5A",
  gradientTo: "#C4A86E",
  accentColor: "#C47D5A",
};

// ── Auth check (cookie-based) ──
export function checkAdminAuth(req: NextRequest): boolean {
  return req.cookies.get("pas_admin_session")?.value === "authenticated";
}

// ── Types ──
export type EmailFolder = "inbox" | "sent" | "drafts" | "trash" | "spam";

export interface EmailMessage {
  id: string; thread_id: string; direction: "outbound" | "inbound";
  from_email: string; to_email: string; subject: string;
  body_html: string | null; body_text: string | null;
  resend_message_id: string | null; read: boolean; starred: boolean;
  folder: EmailFolder; has_attachments: boolean; is_draft: boolean;
  cc_emails: string[]; bcc_emails: string[]; created_at: string;
  attachments?: { id: string; message_id: string; filename: string; content_type: string; size_bytes: number; s3_key: string; s3_url: string }[];
}

// ── Log email to Supabase ──
export async function logEmail(params: {
  thread_id?: string; direction: "outbound" | "inbound";
  from_email: string; to_email: string; subject: string;
  body_html?: string; body_text?: string; resend_message_id?: string;
  folder?: EmailFolder; is_draft?: boolean; has_attachments?: boolean;
  cc_emails?: string[]; bcc_emails?: string[]; read?: boolean;
}): Promise<EmailMessage | null> {
  const folder = params.folder || (params.is_draft ? "drafts" : params.direction === "outbound" ? "sent" : "inbox");
  const { data, error } = await supabaseAdmin
    .from("email_messages")
    .insert({
      thread_id: params.thread_id || undefined,
      direction: params.direction, from_email: params.from_email, to_email: params.to_email,
      subject: params.subject, body_html: params.body_html || null, body_text: params.body_text || null,
      resend_message_id: params.resend_message_id || null,
      read: params.read ?? (params.direction === "outbound"), folder,
      is_draft: params.is_draft || false, has_attachments: params.has_attachments || false,
      cc_emails: params.cc_emails || [], bcc_emails: params.bcc_emails || [],
    }).select().single();
  if (error) { console.error("Failed to log email:", error); return null; }
  return data as EmailMessage;
}

// ── Branded HTML template ──
export function buildReplyHtml(toName: string, body: string, subject: string): string {
  const formatted = body.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\n/g,"<br>");
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0e8;padding:24px 0;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
<tr><td style="background:linear-gradient(135deg,${BRAND.gradientFrom},${BRAND.gradientTo});padding:28px 32px;border-radius:12px 12px 0 0;">
<h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;font-family:'Georgia',serif;">${BRAND.companyName}</h1>
<p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">${BRAND.tagline}</p>
</td></tr>
<tr><td style="background:#fff;padding:32px;">
<p style="margin:0 0 16px;color:#3D3530;font-size:15px;line-height:1.6;">Hi ${toName},</p>
<div style="margin:0 0 24px;color:#3D3530;font-size:15px;line-height:1.7;">${formatted}</div>
<p style="margin:24px 0 0;color:#3D3530;font-size:15px;line-height:1.6;">Warm regards,<br><strong style="color:${BRAND.accentColor};">Carolyn Jenkins</strong><br><span style="font-size:13px;color:#8B7F72;">${BRAND.companyName}</span></p>
</td></tr>
<tr><td style="background:#FAF8F4;padding:20px 32px;border-radius:0 0 12px 12px;border-top:1px solid #EDE7DB;">
<p style="margin:0 0 4px;color:#8B7F72;font-size:12px;">
📞 <a href="tel:${BRAND.phone.replace(/\D/g,"")}" style="color:${BRAND.accentColor};text-decoration:none;">${BRAND.phone}</a>
&middot; ✉️ <a href="mailto:${BRAND.email}" style="color:${BRAND.accentColor};text-decoration:none;">${BRAND.email}</a></p>
<p style="margin:0;color:#B8AFA3;font-size:11px;">${BRAND.serviceArea}</p>
</td></tr></table></td></tr></table></body></html>`;
}

export function buildRichHtml(toName: string, richBody: string, subject: string): string {
  const template = buildReplyHtml(toName, "", subject);
  return template.replace(/<div style="[^"]*"><\/div>/, `<div>${richBody}</div>`) || buildReplyHtml(toName, stripHtml(richBody), subject);
}

export function stripHtml(html: string): string {
  return html.replace(/<br\s*\/?>/gi,"\n").replace(/<\/p>/gi,"\n\n").replace(/<[^>]+>/g,"").replace(/&nbsp;/gi," ").trim();
}
