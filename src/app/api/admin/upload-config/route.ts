import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    token: process.env.SANITY_API_TOKEN || "",
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
    apiVersion: "2024-01-01",
  });
}
