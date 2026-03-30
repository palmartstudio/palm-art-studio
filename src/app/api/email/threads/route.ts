import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { checkAdminAuth } from "../../../../lib/email";

// GET: list threads by folder
export async function GET(req: NextRequest) {
  if (!checkAdminAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const folder = new URL(req.url).searchParams.get("folder");

  let query = supabaseAdmin.from("email_messages").select("*").order("created_at", { ascending: false });
  if (folder === "trash") query = query.eq("folder", "trash");
  else if (folder === "drafts") query = query.eq("is_draft", true).neq("folder", "trash");
  else if (folder === "starred") query = query.eq("starred", true).neq("folder", "trash");
  else if (folder === "sent") query = query.eq("direction", "outbound").eq("is_draft", false).neq("folder", "trash");
  else if (folder === "spam") query = query.eq("folder", "spam");
  else query = query.eq("is_draft", false).not("folder", "in", '("trash","spam")');
  const isInbox = !folder || folder === "inbox";
  const { data: messages } = await query;

  // Folder counts
  const { data: allMsgs } = await supabaseAdmin.from("email_messages").select("folder,is_draft,starred,read,direction");
  const fc: Record<string, number> = { inbox: 0, sent: 0, starred: 0, drafts: 0, trash: 0, spam: 0 };
  if (allMsgs) { for (const m of allMsgs) {
    if (m.is_draft && m.folder !== "trash") fc.drafts++;
    if (m.starred && m.folder !== "trash") fc.starred++;
    if (m.folder === "trash") fc.trash++; if (m.folder === "spam") fc.spam++;
    if (!m.read && m.folder === "inbox" && !m.is_draft) fc.inbox++;
    if (m.direction === "outbound" && !m.is_draft && m.folder !== "trash") fc.sent++;
  }}

  // Group into threads
  const tm = new Map<string, any>();
  for (const msg of messages || []) {
    if (!tm.has(msg.thread_id)) {
      const plain = msg.body_text || (msg.body_html || "").replace(/<[^>]+>/g, "");
      tm.set(msg.thread_id, {
        thread_id: msg.thread_id, subject: msg.subject,
        to_email: msg.direction === "outbound" ? msg.to_email : msg.from_email,
        from_email: msg.direction === "outbound" ? msg.from_email : msg.to_email,
        latest_message: msg.created_at, latest_body_preview: plain.substring(0, 120),
        latest_direction: msg.direction, message_count: 0, unread_count: 0,
        starred: !!msg.starred, has_attachments: !!msg.has_attachments,
        created_at: msg.created_at, has_inbound: msg.direction === "inbound",
      });
    }
    const t = tm.get(msg.thread_id)!;
    t.message_count++; if (!msg.read) t.unread_count++;
    if (msg.starred) t.starred = true;
    if (msg.has_attachments) t.has_attachments = true;
    if (msg.direction === "inbound") t.has_inbound = true;
  }
  if (isInbox) { Array.from(tm.entries()).forEach(([id, t]) => { if (!t.has_inbound) tm.delete(id); }); }

  // Contact name resolution
  const emails = [...new Set([...tm.values()].map((t: any) => t.to_email))];
  if (emails.length) {
    const { data: contacts } = await supabaseAdmin.from("email_contacts").select("email,name").in("email", emails);
    if (contacts) { const m = new Map(contacts.map((c: any) => [c.email, c.name])); for (const t of tm.values()) { if (m.has(t.to_email)) t.customer_name = m.get(t.to_email); } }
  }
  const threads = [...tm.values()].sort((a: any, b: any) => new Date(b.latest_message).getTime() - new Date(a.latest_message).getTime());
  return NextResponse.json({ threads, folderCounts: fc });
}

// POST: open thread (mark read + return messages with attachments)
export async function POST(req: NextRequest) {
  if (!checkAdminAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { thread_id } = await req.json();
  if (!thread_id) return NextResponse.json({ error: "Missing thread_id" }, { status: 400 });
  await supabaseAdmin.from("email_messages").update({ read: true }).eq("thread_id", thread_id);
  const { data: msgs } = await supabaseAdmin.from("email_messages").select("*").eq("thread_id", thread_id).order("created_at", { ascending: true });
  const ids = (msgs || []).map((m: any) => m.id);
  let attMap = new Map<string, any[]>();
  if (ids.length) {
    const { data: atts } = await supabaseAdmin.from("email_attachments").select("*").in("message_id", ids);
    for (const a of atts || []) { if (!attMap.has(a.message_id)) attMap.set(a.message_id, []); attMap.get(a.message_id)!.push(a); }
  }
  return NextResponse.json({ messages: (msgs || []).map((m: any) => ({ ...m, attachments: attMap.get(m.id) || [] })) });
}

// PATCH: thread actions (star/trash/read)
export async function PATCH(req: NextRequest) {
  if (!checkAdminAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { thread_ids, action, value } = await req.json();
  if (!thread_ids?.length || !action) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  let u: Record<string, unknown> = {};
  switch (action) {
    case "star": u = { starred: true }; break; case "unstar": u = { starred: false }; break;
    case "trash": u = { folder: "trash" }; break; case "restore": u = { folder: "inbox" }; break;
    case "spam": u = { folder: "spam" }; break; case "mark_read": u = { read: true }; break;
    case "mark_unread": u = { read: false }; break; case "move": if (value) u = { folder: value }; break;
  }
  await supabaseAdmin.from("email_messages").update(u).in("thread_id", thread_ids);
  return NextResponse.json({ updated: thread_ids.length });
}

// DELETE: permanent delete
export async function DELETE(req: NextRequest) {
  if (!checkAdminAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { thread_ids, permanent } = await req.json();
  if (!thread_ids?.length) return NextResponse.json({ error: "No thread_ids" }, { status: 400 });
  if (permanent) await supabaseAdmin.from("email_messages").delete().in("thread_id", thread_ids);
  else await supabaseAdmin.from("email_messages").update({ folder: "trash" }).in("thread_id", thread_ids);
  return NextResponse.json({ deleted: thread_ids.length });
}
