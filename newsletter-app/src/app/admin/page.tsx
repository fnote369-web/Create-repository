import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

async function getStats() {
  const supabase = supabaseAdmin();

  const [{ count: total }, { count: active }, { count: expiringSoon }, { count: expired }] =
    await Promise.all([
      supabase.from("member_view").select("id", { count: "exact", head: true }),
      supabase.from("member_view").select("id", { count: "exact", head: true }).eq("display_status", "有効"),
      supabase.from("member_view").select("id", { count: "exact", head: true }).eq("display_status", "期限間近"),
      supabase.from("member_view").select("id", { count: "exact", head: true }).eq("display_status", "期限切れ"),
    ]);

  const { data: recentNewsletters } = await supabase
    .from("newsletters")
    .select("id, title, status, sent_at, success_count, failure_count, scheduled_at")
    .order("created_at", { ascending: false })
    .limit(5);

  return {
    total: total ?? 0,
    active: active ?? 0,
    expiringSoon: expiringSoon ?? 0,
    expired: expired ?? 0,
    recentNewsletters: recentNewsletters ?? [],
  };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  const cards = [
    { label: "会員数（全体）", value: stats.total, href: "/admin/members" },
    { label: "有効", value: stats.active, href: "/admin/members?status=有効" },
    { label: "期限間近（30日以内）", value: stats.expiringSoon, href: "/admin/members?status=期限間近" },
    { label: "期限切れ", value: stats.expired, href: "/admin/members?status=期限切れ" },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="card p-5 hover:border-brand-500">
            <div className="text-sm text-gray-500">{c.label}</div>
            <div className="text-2xl font-semibold mt-1">{c.value}</div>
          </Link>
        ))}
      </div>

      <div className="flex gap-3">
        <Link href="/admin/newsletters/new" className="btn-primary">
          新しいニュースレターを書く
        </Link>
        <Link href="/admin/members/new" className="btn-secondary">
          会員を登録する
        </Link>
      </div>

      <div className="card p-6">
        <h2 className="font-semibold mb-4">最近のニュースレター</h2>
        {stats.recentNewsletters.length === 0 ? (
          <p className="text-sm text-gray-500">まだニュースレターがありません。</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {stats.recentNewsletters.map((n) => (
              <li key={n.id} className="py-3 flex items-center justify-between text-sm">
                <Link href={`/admin/newsletters/${n.id}`} className="text-brand-600 hover:underline">
                  {n.title}
                </Link>
                <span className="text-gray-500">
                  {n.status}
                  {n.status === "sent" ? `（成功${n.success_count}／失敗${n.failure_count}）` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
