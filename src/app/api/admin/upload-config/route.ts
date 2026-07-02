import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "../../../../lib/adminAuth";

export async function GET(req: NextRequest) {
  if (!checkAdminAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({
    token: process.env.SANITY_API_TOKEN || "",
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
    apiVersion: "2024-01-01",
  });
}
