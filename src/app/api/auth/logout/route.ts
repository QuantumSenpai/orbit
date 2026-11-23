import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie, isSecureRequest } from "@/lib/auth";

export async function POST(request: NextRequest) {
  await clearSessionCookie(isSecureRequest(request));
  return NextResponse.json(
    { success: true },
    { headers: { "Cache-Control": "no-store" } }
  );
}
