import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_S,
  checkAdminAuth,
  checkPassword,
  createSessionToken,
  isAuthConfigured,
} from "../../../../lib/adminAuth";

export const dynamic = "force-dynamic";

// Best-effort brute-force brake (per server instance): 8 wrong tries per IP per 15 min.
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS = 8;
const fails = new Map<string, { n: number; first: number }>();

function clientIp(req: NextRequest): string {
  return (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
}

export async function GET(req: NextRequest) {
  if (checkAdminAuth(req)) return NextResponse.json({ ok: true });
  return NextResponse.json({ ok: false }, { status: 401 });
}

export async function POST(req: NextRequest) {
  if (!isAuthConfigured()) {
    return NextResponse.json({ error: "Admin login is not configured on the server." }, { status: 500 });
  }

  const ip = clientIp(req);
  const now = Date.now();
  const rec = fails.get(ip);
  if (rec && now - rec.first > WINDOW_MS) fails.delete(ip);
  if ((fails.get(ip)?.n || 0) >= MAX_FAILS) {
    return NextResponse.json({ error: "Too many attempts. Try again in a few minutes." }, { status: 429 });
  }

  let password: unknown;
  try { ({ password } = await req.json()); } catch { password = undefined; }

  if (!checkPassword(password)) {
    const cur = fails.get(ip) || { n: 0, first: now };
    cur.n += 1;
    fails.set(ip, cur);
    await new Promise((r) => setTimeout(r, 500));
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  fails.delete(ip);
  const token = createSessionToken();
  if (!token) return NextResponse.json({ error: "Admin login is not configured on the server." }, { status: 500 });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_S,
    path: "/",
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
