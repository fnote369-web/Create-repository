import { NextRequest, NextResponse } from "next/server";
import { unsubscribeByToken } from "@/lib/members";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(new URL("/unsubscribed?ok=0", req.url));
  }
  try {
    const found = await unsubscribeByToken(token);
    return NextResponse.redirect(new URL(`/unsubscribed?ok=${found ? "1" : "0"}`, req.url));
  } catch {
    return NextResponse.redirect(new URL("/unsubscribed?ok=0", req.url));
  }
}
