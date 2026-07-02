import { NextRequest } from "next/server";

// Shared admin session check for API routes.
// Session cookie is set by /api/admin/auth on successful password login.
export function checkAdminAuth(req: NextRequest): boolean {
  return req.cookies.get("pas_admin_session")?.value === "authenticated";
}
