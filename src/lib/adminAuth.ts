import { NextRequest } from "next/server";
import { createHmac, timingSafeEqual, createHash } from "crypto";

// ═══ Admin session ═══
// The cookie holds "<expiry-ms>.<hmac>" signed with a server-only secret, so it
// cannot be forged by typing a value into the browser. The secret is
// ADMIN_SESSION_SECRET when set, otherwise it is derived from two secrets that
// only the server has — changing the admin password signs everyone out.

export const SESSION_COOKIE = "pas_admin_session";
export const SESSION_MAX_AGE_S = 60 * 60 * 24 * 30; // 30 days

function secret(): string | null {
  if (process.env.ADMIN_SESSION_SECRET) return process.env.ADMIN_SESSION_SECRET;
  const pw = process.env.ADMIN_PASSWORD;
  const extra = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SANITY_API_TOKEN;
  if (!pw || !extra) return null;
  return createHash("sha256").update(`pas-session:${pw}:${extra}`).digest("hex");
}

function sign(payload: string, key: string): string {
  return createHmac("sha256", key).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/** Constant-time password check. False when no password is configured. */
export function checkPassword(candidate: unknown): boolean {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw || typeof candidate !== "string") return false;
  // hash both sides so length differences don't leak through timing
  const h = (s: string) => createHash("sha256").update(s).digest("hex");
  return safeEqual(h(candidate), h(pw));
}

export function isAuthConfigured(): boolean {
  return !!process.env.ADMIN_PASSWORD && !!secret();
}

/** New signed session token, or null if the server isn't configured. */
export function createSessionToken(): string | null {
  const key = secret();
  if (!key) return null;
  const exp = String(Date.now() + SESSION_MAX_AGE_S * 1000);
  return `${exp}.${sign(exp, key)}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
  const key = secret();
  if (!key || !token) return false;
  const dot = token.indexOf(".");
  if (dot < 1) return false;
  const exp = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!/^\d+$/.test(exp) || Number(exp) < Date.now()) return false;
  return safeEqual(sig, sign(exp, key));
}

// Shared admin session check for API routes.
export function checkAdminAuth(req: NextRequest): boolean {
  return verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
}
