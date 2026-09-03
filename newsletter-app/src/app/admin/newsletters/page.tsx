import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import { formatUTCToTokyoDisplay } from "@/lib/contract";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  draft: "下書き",
  scheduled: "予約済み",
  sending: "送信中",
  sent: "送信済み",
  failed: "送信失敗",
};

async function getNewsletters() {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("newsletters")
    .select("id, title, subject, status, scheduled_at, sent_at, total_recipients, success_count, failure_count, created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export default async function NewslettersPage() {
  const newsletters = await getNewsletters();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">ニュースレター履歴</h1>
        <Link href="/admin/newsletters/new" className="btn-primary">
          新しいニュースレターを書く
        </Link>
      </div>

      <div className="card overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">タイトル</th>
              <th className="text-left px-4 py-3">件名</th>
              <th className="text-left px-4 py-3">状態</th>
              <th className="text-left px-4 py-3">送信日 / 予定日時</th>
              <th className="text-left px-4 py-3">送信人数</th>
              <th className="text-left px-4 py-3">成功</th>
              <th className="text-left px-4 py-3">失敗</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {newsletters.map((n) => (
              <tr key={n.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link href={`/admin/newsletters/${n.id}`} className="text-brand-600 hover:underline">
                    {n.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600">{n.subject}</td>
                <td className="px-4 py-3 text-gray-600">{STATUS_LABELS[n.status] ?? n.status}</td>
                <td className="px-4 py-3 text-gray-600">
                  {n.sent_at
                    ? formatUTCToTokyoDisplay(n.sent_at)
                    : n.scheduled_at
                      ? `${formatUTCToTokyoDisplay(n.scheduled_at)}（予定）`
                      : "-"}
                </td>
                <td className="px-4 py-3 text-gray-600">{n.total_recipients}</td>
                <td className="px-4 py-3 text-gray-600">{n.success_count}</td>
                <td className="px-4 py-3 text-gray-600">{n.failure_count}</td>
              </tr>
            ))}
            {newsletters.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  まだニュースレターがありません。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
