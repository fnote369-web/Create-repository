import { createClient } from "@supabase/supabase-js";

// このクライアントは「サーバー側のコード」からのみ呼び出すこと。
// SUPABASE_SERVICE_ROLE_KEY は絶対にブラウザへ送らない（NEXT_PUBLIC_を付けない）。
function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `環境変数 ${name} が設定されていません。.env.local または Vercel の環境変数設定を確認してください。`
    );
  }
  return value;
}

export function supabaseAdmin() {
  const url = getEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
