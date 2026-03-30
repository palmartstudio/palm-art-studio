import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { checkAdminAuth } from "@/lib/email";

export async function GET(req: NextRequest) {
  if (!checkAdminAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const search = new URL(req.url).searchParams.get("q");
  let query = supabaseAdmin.from("email_contacts").select("*").order("name");
  if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest) {
  if (!checkAdminAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { name, email, phone, company, category, notes } = await req.json();
  if (!name || !email) return NextResponse.json({ error: "name and email required" }, { status: 400 });
  const { data, error } = await supabaseAdmin.from("email_contacts").upsert({ name, email: email.toLowerCase(), phone, company, category: category || "other", notes }, { onConflict: "email" }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  if (!checkAdminAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await supabaseAdmin.from("email_contacts").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
