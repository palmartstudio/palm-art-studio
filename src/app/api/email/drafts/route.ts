import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { checkAdminAuth, logEmail } from "../../../../lib/email";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  if (!checkAdminAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { to_email, subject, body_text, body_html, draft_id, from_email } = await req.json();
  if (draft_id) {
    const u: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (to_email !== undefined) u.to_email = to_email; if (subject !== undefined) u.subject = subject;
    if (body_text !== undefined) u.body_text = body_text; if (body_html !== undefined) u.body_html = body_html;
    const { data, error } = await supabaseAdmin.from("email_messages").update(u).eq("id", draft_id).eq("is_draft", true).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }
  const logged = await logEmail({ thread_id: randomUUID(), direction: "outbound", from_email: from_email || "cj@palmartstudio.com", to_email: to_email || "", subject: subject || "(no subject)", body_html, body_text, is_draft: true, folder: "drafts" });
  return NextResponse.json(logged);
}

export async function DELETE(req: NextRequest) {
  if (!checkAdminAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await supabaseAdmin.from("email_messages").delete().eq("id", id).eq("is_draft", true);
  return NextResponse.json({ ok: true });
}
