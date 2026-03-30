// ═══ Palm Art Studio — Email Inbound (placeholder) ═══
// IMAP sync handles receiving. This route exists for future webhook use.
import { NextResponse } from "next/server";

export async function POST() {
  // With IMAP sync active, inbound emails are pulled directly from Spacemail.
  // This route can be configured later for real-time webhook notifications
  // from a forwarding service if needed.
  return NextResponse.json({ ok: true, note: "IMAP sync handles inbound" });
}
