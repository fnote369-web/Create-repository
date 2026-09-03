import { NextRequest, NextResponse } from "next/server";
import { runDueScheduledSends } from "@/lib/newsletters";

// Vercel Cron（または他の定期実行サービス）から1分おきに呼び出す想定。
// CRON_SECRET を知らない相手からの呼び出しは拒否する。
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const results = await runDueScheduledSends();
  return NextResponse.json({ ok: true, processed: results.length, results });
}
