// ═══ Palm Art Studio — IMAP Sync Route ═══
// Polls Spacemail via IMAP, pulls new messages into Supabase
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { checkAdminAuth } from "../../../../lib/email";

const IMAP_HOST = "mail.spacemail.com";
const IMAP_PORT = 993;
const IMAP_USER = () => process.env.SPACEMAIL_USER || "cj@palmartstudio.com";
const IMAP_PASS = () => process.env.SPACEMAIL_PASS || "";

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

    // Get existing message IDs to avoid duplicates
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
        // Fetch last 50 messages (or all if fewer)
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

          // Parse envelope
          const env = msg.envelope;
          const fromAddr = env?.from?.[0]?.address?.toLowerCase() || "";
          const toAddr = env?.to?.[0]?.address?.toLowerCase() || "";
          const subject = env?.subject || "(no subject)";
          const date = env?.date ? new Date(env.date).toISOString() : new Date().toISOString();
          const isOutbound = fromAddr === IMAP_USER().toLowerCase();
          const flags = msg.flags || new Set();
          const isRead = flags.has("\\Seen");
          const isStarred = flags.has("\\Flagged");

          // Parse body from source
          let bodyHtml: string | null = null;
          let bodyText: string | null = null;
          if (msg.source) {
            const raw = msg.source.toString();
            // Simple body extraction
            const htmlMatch = raw.match(/<html[\s\S]*?<\/html>/i);
            if (htmlMatch) bodyHtml = htmlMatch[0];
            // Extract plain text (between boundaries or after headers)
            const textMatch = raw.match(/Content-Type:\s*text\/plain[\s\S]*?\r?\n\r?\n([\s\S]*?)(?:\r?\n--|\r?\n\.\r?\n|$)/i);
            if (textMatch) bodyText = textMatch[1].replace(/=\r?\n/g, "").trim();
            if (!bodyText && !bodyHtml) {
              // Fallback: everything after double newline
              const parts = raw.split(/\r?\n\r?\n/);
              if (parts.length > 1) bodyText = parts.slice(1).join("\n\n").substring(0, 5000);
            }
          }

          // Thread matching via In-Reply-To
          let threadId: string | undefined;
          let inReplyTo: string | undefined;
          if (msg.source) {
            const raw = msg.source.toString();
            const irtMatch = raw.match(/^In-Reply-To:\s*(.+)/mi);
            if (irtMatch) inReplyTo = irtMatch[1].replace(/[<>\s]/g, "").trim();
          }
          if (inReplyTo) {
            const { data: match } = await supabaseAdmin
              .from("email_messages").select("thread_id")
              .eq("resend_message_id", inReplyTo).single();
            if (match) threadId = match.thread_id;
          }
          // Fallback: match by subject
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

          // Insert into Supabase
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
    return NextResponse.json({ success: true, synced });
  } catch (err: any) {
    console.error("IMAP sync error:", err);
    return NextResponse.json({ error: err.message || "Sync failed" }, { status: 500 });
  }
}
