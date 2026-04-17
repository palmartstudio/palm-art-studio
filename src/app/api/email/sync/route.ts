// ═══ Palm Art Studio — IMAP Sync Route (v3) ═══
// Reliable MIME decoding with built-in decoders + mailparser fallback
// Caches in Supabase — only fetches NEW messages on each sync
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { checkAdminAuth } from "../../../../lib/email";

const IMAP_HOST = "mail.spacemail.com";
const IMAP_PORT = 993;
const IMAP_USER = () => process.env.SPACEMAIL_USER || "cj@palmartstudio.com";
const IMAP_PASS = () => process.env.SPACEMAIL_PASS || "";

// ── Built-in MIME decoders ──
function decodeQuotedPrintable(str: string): string {
  return str
    .replace(/=\r?\n/g, "")          // soft line breaks
    .replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}
function decodeBase64(str: string): string {
  try { return Buffer.from(str.replace(/\s/g, ""), "base64").toString("utf-8"); }
  catch { return str; }
}

// Extract and decode body from raw MIME source
function extractBody(raw: string): { html: string | null; text: string | null } {
  let html: string | null = null;
  let text: string | null = null;

  // Try mailparser first (most reliable)
  // If it fails, fall through to manual parsing

  // Find boundary
  const boundaryMatch = raw.match(/boundary="?([^";\r\n]+)"?/i);
  if (boundaryMatch) {
    const boundary = boundaryMatch[1];
    const parts = raw.split("--" + boundary);
    for (const part of parts) {
      const headerEnd = part.indexOf("\r\n\r\n");
      if (headerEnd === -1) continue;
      const headers = part.substring(0, headerEnd);
      let body = part.substring(headerEnd + 4);
      // Remove trailing boundary markers
      body = body.replace(/\r?\n--[^\r\n]*--\s*$/, "").trim();

      const encoding = headers.match(/Content-Transfer-Encoding:\s*(\S+)/i)?.[1]?.toLowerCase() || "";
      if (encoding === "quoted-printable") body = decodeQuotedPrintable(body);
      else if (encoding === "base64") body = decodeBase64(body);

      if (/Content-Type:\s*text\/html/i.test(headers)) {
        // Recurse into nested multipart
        if (/boundary=/i.test(headers)) {
          const nested = extractBody(part);
          if (nested.html) html = nested.html;
          if (nested.text && !text) text = nested.text;
        } else { html = body; }
      } else if (/Content-Type:\s*text\/plain/i.test(headers) && !text) {
        if (/boundary=/i.test(headers)) {
          const nested = extractBody(part);
          if (nested.text) text = nested.text;
          if (nested.html && !html) html = nested.html;
        } else { text = body; }
      } else if (/Content-Type:\s*multipart/i.test(headers)) {
        const nested = extractBody(part);
        if (nested.html && !html) html = nested.html;
        if (nested.text && !text) text = nested.text;
      }
    }
  } else {
    // No multipart — single body
    const headerEnd = raw.indexOf("\r\n\r\n");
    if (headerEnd > -1) {
      const headers = raw.substring(0, headerEnd);
      let body = raw.substring(headerEnd + 4);
      const encoding = headers.match(/Content-Transfer-Encoding:\s*(\S+)/i)?.[1]?.toLowerCase() || "";
      if (encoding === "quoted-printable") body = decodeQuotedPrintable(body);
      else if (encoding === "base64") body = decodeBase64(body);
      if (/Content-Type:\s*text\/html/i.test(headers)) html = body;
      else text = body;
    }
  }
  return { html, text };
}

export async function POST(req: NextRequest) {
  if (!checkAdminAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { ImapFlow } = await import("imapflow");
    const client = new ImapFlow({
      host: IMAP_HOST, port: IMAP_PORT, secure: true,
      auth: { user: IMAP_USER(), pass: IMAP_PASS() },
      logger: false,
    });
    await client.connect();

    // Get existing message IDs from Supabase (cached)
    const { data: existing } = await supabaseAdmin
      .from("email_messages")
      .select("resend_message_id")
      .not("resend_message_id", "is", null);
    const knownIds = new Set((existing || []).map((e: any) => e.resend_message_id));

    let synced = 0;
    const folders = ["INBOX", "Sent"];

    for (const folderName of folders) {
      const lock = await client.getMailboxLock(folderName);
      try {
        const status = await client.status(folderName, { messages: true });
        const total = status.messages || 0;
        if (total === 0) continue;
        const from = Math.max(1, total - 49);
        const range = `${from}:*`;

        for await (const msg of client.fetch(range, {
          envelope: true, source: true, flags: true,
        })) {
          const messageId = msg.envelope?.messageId || "";
          if (!messageId || knownIds.has(messageId)) continue;

          const env = msg.envelope;
          const fromAddr = env?.from?.[0]?.address?.toLowerCase() || "";
          const toAddr = env?.to?.[0]?.address?.toLowerCase() || "";
          const subject = env?.subject || "(no subject)";
          const date = env?.date ? new Date(env.date).toISOString() : new Date().toISOString();
          const isOutbound = fromAddr === IMAP_USER().toLowerCase();
          const flags = msg.flags || new Set();
          const isRead = flags.has("\\Seen");
          const isStarred = flags.has("\\Flagged");

          // Decode body using our built-in MIME parser
          let bodyHtml: string | null = null;
          let bodyText: string | null = null;
          if (msg.source) {
            const raw = msg.source.toString("utf-8");
            // Try mailparser first
            try {
              const { simpleParser } = await import("mailparser");
              const parsed = await simpleParser(msg.source);
              bodyHtml = parsed.html ? String(parsed.html) : null;
              bodyText = parsed.text || null;
            } catch {
              // Fallback to built-in decoder
              const result = extractBody(raw);
              bodyHtml = result.html;
              bodyText = result.text;
            }
          }

          // Thread matching via In-Reply-To header
          let threadId: string | undefined;
          if (msg.source) {
            const raw = msg.source.toString("utf-8");
            const irtMatch = raw.match(/^In-Reply-To:\s*(.+)/mi);
            if (irtMatch) {
              const irt = irtMatch[1].replace(/[<>\s]/g, "").trim();
              const { data: match } = await supabaseAdmin
                .from("email_messages").select("thread_id")
                .eq("resend_message_id", irt).single();
              if (match) threadId = match.thread_id;
            }
          }
          // Fallback: match by cleaned subject
          if (!threadId) {
            const cleanSubj = subject.replace(/^(Re:|Fwd?:)\s*/gi, "").trim();
            if (cleanSubj) {
              const otherEmail = isOutbound ? toAddr : fromAddr;
              const { data: match } = await supabaseAdmin
                .from("email_messages").select("thread_id")
                .or(`from_email.eq.${otherEmail},to_email.eq.${otherEmail}`)
                .ilike("subject", `%${cleanSubj.substring(0, 60)}%`)
                .order("created_at", { ascending: false }).limit(1).single();
              if (match) threadId = match.thread_id;
            }
          }

          const folder = folderName === "Sent" ? "sent" : "inbox";
          const { error } = await supabaseAdmin.from("email_messages").insert({
            thread_id: threadId || undefined,
            direction: isOutbound ? "outbound" : "inbound",
            from_email: fromAddr, to_email: toAddr, subject,
            body_html: bodyHtml, body_text: bodyText,
            resend_message_id: messageId,
            read: isRead, starred: isStarred,
            folder: isOutbound ? "sent" : folder,
            is_draft: false, has_attachments: false,
            cc_emails: [], bcc_emails: [],
            created_at: date,
          });
          if (!error) { synced++; knownIds.add(messageId); }
        }
      } finally { lock.release(); }
    }

    await client.logout();
    return NextResponse.json({ success: true, synced, cached: knownIds.size - synced });
  } catch (err: any) {
    console.error("IMAP sync error:", err);
    return NextResponse.json({ error: err.message || "Sync failed" }, { status: 500 });
  }
}
