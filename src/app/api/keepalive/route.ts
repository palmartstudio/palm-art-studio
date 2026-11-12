import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase";

// Hit daily by Vercel Cron (see vercel.json). The free Supabase tier pauses a
// project after a week with no activity, which silently breaks the contact
// form, newsletter signup and admin inbox. One tiny query a day prevents that.
export const dynamic = "force-dynamic";

export async function GET() {
  const { error } = await supabaseAdmin
    .from("newsletter_subscribers")
    .select("id", { count: "exact", head: true });
  if (error) {
    console.error("keepalive: database not reachable:", error.message);
    return NextResponse.json({ ok: false }, { status: 503 });
  }
  return NextResponse.json({ ok: true, at: new Date().toISOString() });
}
